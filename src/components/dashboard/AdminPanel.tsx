import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, Settings, Save, Users, Link2, Copy, Trash2, UserCheck } from "lucide-react";

interface AdminPanelProps {
  userId: string;
}

interface ServicePrice {
  service_name: string;
  vehicle_type: string;
  price: number;
}

interface ExpenseType {
  id: string;
  expense_name: string;
  default_value: number | null;
  is_fixed: boolean;
  available_day: number;
  due_day: number;
}

interface Partner {
  id: string;
  display_name: string;
  user_id: string;
}

interface Invite {
  id: string;
  token: string;
  expires_at: string;
  used_by: string | null;
}

const VEHICLE_TYPES = [
  { value: "MOTO", label: "Moto", icon: "🏍️" },
  { value: "RET", label: "Carro Curto (RET)", icon: "🚗" },
  { value: "SEDAN", label: "Carro Baixo (SEDAN)", icon: "🚙" },
  { value: "SUV", label: "Carro Alto (SUV)", icon: "🚙" },
  { value: "CAMINHONETE", label: "Caminhonete", icon: "🚚" },
  { value: "OUTRO", label: "Outro", icon: "🐶" },
];

const SERVICE_NAMES = [
  "Lavagem Completa",
  "Lavagem Interna",
  "Lavagem Externa",
  "Lavagem Completa + Cera",
  "Lavagem Motor",
  "Lavagem Externa + Cera",
  "Vitrificação",
  "Hidratação de Bancos",
];

const AdminPanel = ({ userId }: AdminPanelProps) => {
  const [loading, setLoading] = useState(false);
  const [prices, setPrices] = useState<ServicePrice[]>([]);
  const [expenseTypes, setExpenseTypes] = useState<ExpenseType[]>([]);
  const [selectedVehicleType, setSelectedVehicleType] = useState("SEDAN");
  
  // Partner management state
  const [partner, setPartner] = useState<Partner | null>(null);
  const [activeInvite, setActiveInvite] = useState<Invite | null>(null);
  const [generatingInvite, setGeneratingInvite] = useState(false);
  const [businessId, setBusinessId] = useState<string | null>(null);

  useEffect(() => {
    fetchPrices();
    fetchExpenseTypes();
    fetchBusinessAndPartner();
  }, [userId]);

  const fetchBusinessAndPartner = async () => {
    try {
      // Get user's business
      const { data: businessIdData } = await supabase.rpc("get_user_business_id");
      if (!businessIdData) return;
      
      setBusinessId(businessIdData);

      // Fetch partner (member with role 'partner')
      const { data: members, error: membersError } = await supabase
        .from("business_members")
        .select("id, display_name, user_id, role")
        .eq("business_id", businessIdData)
        .eq("role", "partner");

      if (membersError) throw membersError;
      
      if (members && members.length > 0) {
        setPartner(members[0]);
      }

      // Fetch active invite (not used, not expired)
      const { data: invites, error: invitesError } = await supabase
        .from("business_invites")
        .select("id, token, expires_at, used_by")
        .eq("business_id", businessIdData)
        .is("used_by", null)
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(1);

      if (invitesError) throw invitesError;
      
      if (invites && invites.length > 0) {
        setActiveInvite(invites[0]);
      }
    } catch (error) {
      console.error("Error fetching business info:", error);
    }
  };

  const generateInviteLink = async () => {
    if (!businessId) return;
    
    setGeneratingInvite(true);
    try {
      const token = crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const { data, error } = await supabase
        .from("business_invites")
        .insert({
          business_id: businessId,
          created_by: userId,
          token,
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      setActiveInvite(data);
      toast.success("Link de convite gerado com sucesso!");
    } catch (error: any) {
      console.error("Error generating invite:", error);
      toast.error(error.message || "Erro ao gerar convite");
    } finally {
      setGeneratingInvite(false);
    }
  };

  const copyInviteLink = () => {
    if (!activeInvite) return;
    const link = `${window.location.origin}/convite/${activeInvite.token}`;
    navigator.clipboard.writeText(link);
    toast.success("Link copiado!");
  };

  const removePartner = async () => {
    if (!partner) return;
    
    if (!confirm(`Tem certeza que deseja remover ${partner.display_name} do negócio?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from("business_members")
        .delete()
        .eq("id", partner.id);

      if (error) throw error;

      setPartner(null);
      toast.success("Sócio removido com sucesso!");
    } catch (error: any) {
      console.error("Error removing partner:", error);
      toast.error(error.message || "Erro ao remover sócio");
    }
  };

  const fetchPrices = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("service_prices")
        .select("service_name, vehicle_type, price")
        .eq("user_id", userId)
        .order("service_name");

      if (error) throw error;
      setPrices(data || []);
    } catch (error) {
      console.error("Error fetching prices:", error);
      toast.error("Erro ao carregar preços");
    } finally {
      setLoading(false);
    }
  };

  const fetchExpenseTypes = async () => {
    try {
      const { data, error } = await supabase
        .from("expense_types")
        .select("*")
        .eq("user_id", userId)
        .order("expense_name");

      if (error) throw error;
      setExpenseTypes(data || []);
    } catch (error) {
      console.error("Error fetching expense types:", error);
      toast.error("Erro ao carregar tipos de despesa");
    }
  };

  const handlePriceChange = (serviceName: string, vehicleType: string, newPrice: string) => {
    setPrices((prev) =>
      prev.map((p) =>
        p.service_name === serviceName && p.vehicle_type === vehicleType
          ? { ...p, price: parseFloat(newPrice) || 0 }
          : p
      )
    );
  };

  const handleExpenseTypeChange = (id: string, field: string, value: any) => {
    setExpenseTypes((prev) =>
      prev.map((et) => (et.id === id ? { ...et, [field]: value } : et))
    );
  };

  const handleSavePrices = async () => {
    setLoading(true);
    try {
      const pricesToUpdate = prices.filter(
        (p) => p.vehicle_type === selectedVehicleType
      );

      for (const price of pricesToUpdate) {
        const { error } = await supabase
          .from("service_prices")
          .update({ price: price.price })
          .eq("user_id", userId)
          .eq("service_name", price.service_name)
          .eq("vehicle_type", price.vehicle_type);

        if (error) throw error;
      }

      toast.success("Preços atualizados com sucesso!");
    } catch (error: any) {
      console.error("Error updating prices:", error);
      toast.error(error.message || "Erro ao atualizar preços");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveExpenseTypes = async () => {
    setLoading(true);
    try {
      for (const expenseType of expenseTypes) {
        const { error } = await supabase
          .from("expense_types")
          .update({
            default_value: expenseType.default_value,
            available_day: expenseType.available_day,
            due_day: expenseType.due_day,
          })
          .eq("id", expenseType.id);

        if (error) throw error;
      }

      toast.success("Configurações de despesas atualizadas!");
    } catch (error: any) {
      console.error("Error updating expense types:", error);
      toast.error(error.message || "Erro ao atualizar configurações");
    } finally {
      setLoading(false);
    }
  };

  const getPricesForVehicleType = (vehicleType: string) => {
    return SERVICE_NAMES.map((serviceName) => {
      const priceData = prices.find(
        (p) => p.service_name === serviceName && p.vehicle_type === vehicleType
      );
      return {
        service_name: serviceName,
        vehicle_type: vehicleType,
        price: priceData?.price || 0,
      };
    });
  };

  if (loading && prices.length === 0) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const currentPrices = getPricesForVehicleType(selectedVehicleType);

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Settings className="h-8 w-8 text-accent" />
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-2">
            Configurações do Admin
          </h2>
          <p className="text-muted-foreground text-lg">
            Gerencie preços, despesas e acesso ao sistema
          </p>
        </div>
      </div>

      {/* Partner Management Section */}
      <Card className="glass-effect overflow-hidden">
        <div className="bg-gradient-card p-6 border-b border-border/50">
          <h3 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6" />
            Gerenciar Acesso
          </h3>
          <p className="text-muted-foreground mt-2">
            Convide um sócio para ajudar a gerenciar o lava rápido
          </p>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
            <p className="text-sm text-blue-100">
              ℹ️ Seu sócio terá acesso apenas às abas <strong>Entradas</strong> e <strong>Despesas</strong>. 
              As abas de Histórico e Admin ficam disponíveis apenas para você.
            </p>
          </div>

          {partner ? (
            <div className="bg-status-success/10 border border-status-success/30 rounded-xl p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-status-success/20 rounded-full">
                    <UserCheck className="h-6 w-6 text-status-success" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">Sócio atual</p>
                    <p className="text-xl font-bold">{partner.display_name}</p>
                  </div>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={removePartner}
                  className="font-semibold"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remover
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-secondary/30 rounded-xl p-5 text-center">
                <Users className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground font-medium">Nenhum sócio cadastrado</p>
              </div>

              {activeInvite ? (
                <div className="space-y-3">
                  <Label className="font-semibold">Link de convite ativo</Label>
                  <div className="flex gap-2">
                    <Input
                      readOnly
                      value={`${window.location.origin}/convite/${activeInvite.token}`}
                      className="bg-secondary/50 font-mono text-sm"
                    />
                    <Button onClick={copyInviteLink} className="bg-gradient-accent hover:shadow-accent">
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-amber-400 font-medium">
                    ⚠️ Expira em {new Date(activeInvite.expires_at).toLocaleDateString("pt-BR")}
                  </p>
                </div>
              ) : (
                <Button
                  onClick={generateInviteLink}
                  disabled={generatingInvite}
                  className="w-full h-12 bg-gradient-primary hover:shadow-glow transition-all duration-300 hover:scale-105 font-bold text-lg"
                >
                  {generatingInvite ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Gerando...
                    </>
                  ) : (
                    <>
                      <Link2 className="mr-2 h-5 w-5" />
                      Gerar Link de Convite
                    </>
                  )}
                </Button>
              )}
            </div>
          )}
        </div>
      </Card>

      <Card className="glass-effect overflow-hidden">
        <div className="bg-gradient-card p-6 border-b border-border/50">
          <h3 className="text-2xl font-bold flex items-center gap-2">
            💎 Preços dos Serviços por Tipo de Veículo
          </h3>
          <p className="text-muted-foreground mt-2">
            Configure preços diferentes para cada tipo de veículo
          </p>
        </div>

        <div className="p-6 space-y-6">
          <Tabs value={selectedVehicleType} onValueChange={setSelectedVehicleType}>
            <TabsList className="grid w-full grid-cols-6 h-auto p-1 bg-secondary/30">
              {VEHICLE_TYPES.map((type) => (
                <TabsTrigger
                  key={type.value}
                  value={type.value}
                  className="data-[state=active]:bg-gradient-primary data-[state=active]:text-primary-foreground font-semibold py-3 px-2 text-xs sm:text-sm"
                >
                  <span className="hidden sm:inline">{type.icon} </span>
                  {type.label.split("(")[0].trim()}
                </TabsTrigger>
              ))}
            </TabsList>

            {VEHICLE_TYPES.map((type) => (
              <TabsContent key={type.value} value={type.value} className="space-y-4 mt-6">
                {currentPrices.map((price) => (
                  <div
                    key={`${price.service_name}-${price.vehicle_type}`}
                    className="flex items-center gap-4 p-4 bg-secondary/30 rounded-xl hover-lift"
                  >
                    <div className="flex-1">
                      <Label className="font-bold text-lg">{price.service_name}</Label>
                    </div>
                    <div className="w-48">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={price.price}
                        onChange={(e) =>
                          handlePriceChange(
                            price.service_name,
                            price.vehicle_type,
                            e.target.value
                          )
                        }
                        className="text-right h-11 font-bold text-lg bg-background"
                        disabled={loading}
                      />
                    </div>
                  </div>
                ))}

                <Button
                  onClick={handleSavePrices}
                  className="w-full mt-6 bg-gradient-accent hover:shadow-accent transition-all duration-300 hover:scale-105 font-bold h-12 text-lg"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-5 w-5" />
                      SALVAR PREÇOS PARA {type.label.toUpperCase()}
                    </>
                  )}
                </Button>

                <p className="text-sm text-muted-foreground text-center font-medium">
                  💡 Dica: Configure preços realistas para cada tipo de veículo. Geralmente SUVs e
                  Caminhonetes têm valores maiores.
                </p>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </Card>

      <Card className="glass-effect overflow-hidden">
        <div className="bg-gradient-card p-6 border-b border-border/50">
          <h3 className="text-2xl font-bold flex items-center gap-2">
            ⚙️ Configurações de Despesas
          </h3>
        </div>
        <div className="p-6 space-y-6">
          {expenseTypes.map((expenseType) => (
            <div
              key={expenseType.id}
              className="p-6 border-2 border-border/50 rounded-xl space-y-4 hover-lift bg-secondary/20"
            >
              <h4 className="font-bold text-xl">{expenseType.expense_name}</h4>

              {expenseType.is_fixed && (
                <div>
                  <Label className="font-semibold">Valor Fixo</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={expenseType.default_value || 0}
                    onChange={(e) =>
                      handleExpenseTypeChange(
                        expenseType.id,
                        "default_value",
                        parseFloat(e.target.value)
                      )
                    }
                    disabled={loading}
                    className="mt-2 h-11 font-bold text-lg"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-semibold">Disponível a partir do dia</Label>
                  <Input
                    type="number"
                    min="1"
                    max="31"
                    value={expenseType.available_day}
                    onChange={(e) =>
                      handleExpenseTypeChange(
                        expenseType.id,
                        "available_day",
                        parseInt(e.target.value)
                      )
                    }
                    disabled={loading}
                    className="mt-2 h-11 font-bold"
                  />
                </div>

                <div>
                  <Label className="font-semibold">Dia limite para pagamento</Label>
                  <Input
                    type="number"
                    min="1"
                    max="31"
                    value={expenseType.due_day}
                    onChange={(e) =>
                      handleExpenseTypeChange(
                        expenseType.id,
                        "due_day",
                        parseInt(e.target.value)
                      )
                    }
                    disabled={loading}
                    className="mt-2 h-11 font-bold"
                  />
                </div>
              </div>
            </div>
          ))}

          <Button
            onClick={handleSaveExpenseTypes}
            className="w-full mt-6 bg-gradient-primary hover:shadow-glow transition-all duration-300 hover:scale-105 font-bold h-12 text-lg"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-5 w-5" />
                SALVAR CONFIGURAÇÕES
              </>
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default AdminPanel;
