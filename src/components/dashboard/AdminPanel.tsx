import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, Settings, Save, Users, Copy, Trash2, UserCheck, Key, LogOut, Building } from "lucide-react";

interface AdminPanelProps {
  userId: string;
  userRole: 'owner' | 'partner';
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

interface BusinessInfo {
  id: string;
  name: string;
  code: string;
  owner_name?: string;
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

const AdminPanel = ({ userId, userRole }: AdminPanelProps) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [prices, setPrices] = useState<ServicePrice[]>([]);
  const [expenseTypes, setExpenseTypes] = useState<ExpenseType[]>([]);
  const [selectedVehicleType, setSelectedVehicleType] = useState("SEDAN");
  
  // Business and partner state
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo | null>(null);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [disconnecting, setDisconnecting] = useState(false);

  useEffect(() => {
    fetchBusinessInfo();
    if (userRole === 'owner') {
      fetchPrices();
      fetchExpenseTypes();
    }
  }, [userId, userRole]);

  const fetchBusinessInfo = async () => {
    try {
      const { data: businessId } = await supabase.rpc("get_user_business_id");
      if (!businessId) return;

      // Get business details including code
      const { data: business, error: businessError } = await supabase
        .from("businesses")
        .select("id, name, code")
        .eq("id", businessId)
        .single();

      if (businessError) throw businessError;

      // Get all members
      const { data: members, error: membersError } = await supabase
        .from("business_members")
        .select("id, display_name, user_id, role")
        .eq("business_id", businessId);

      if (membersError) throw membersError;

      const owner = members?.find(m => m.role === 'owner');
      const partnerList = members?.filter(m => m.role === 'partner') || [];

      setBusinessInfo({
        ...business,
        owner_name: owner?.display_name,
      });
      setPartners(partnerList);
    } catch (error) {
      console.error("Error fetching business info:", error);
    }
  };

  const copyBusinessCode = () => {
    if (!businessInfo?.code) return;
    navigator.clipboard.writeText(businessInfo.code);
    toast.success("Código copiado!");
  };

  const removePartner = async (partner: Partner) => {
    if (!confirm(`Tem certeza que deseja remover ${partner.display_name} do negócio?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from("business_members")
        .delete()
        .eq("id", partner.id);

      if (error) throw error;

      setPartners(prev => prev.filter(p => p.id !== partner.id));
      toast.success("Sócio removido com sucesso!");
    } catch (error: any) {
      console.error("Error removing partner:", error);
      toast.error(error.message || "Erro ao remover sócio");
    }
  };

  const handleDisconnect = async () => {
    if (!confirm("Tem certeza que deseja desconectar deste lava rápido? Você perderá o acesso aos dados.")) {
      return;
    }

    setDisconnecting(true);
    try {
      const { data, error } = await supabase.rpc("disconnect_from_business");

      if (error) throw error;

      if (data) {
        toast.success("Desconectado com sucesso!");
        navigate("/setup");
      } else {
        toast.error("Não foi possível desconectar");
      }
    } catch (error: any) {
      console.error("Error disconnecting:", error);
      toast.error(error.message || "Erro ao desconectar");
    } finally {
      setDisconnecting(false);
    }
  };

  const fetchPrices = async () => {
    setLoading(true);
    try {
      // RLS will filter by business_id
      const { data, error } = await supabase
        .from("service_prices")
        .select("service_name, vehicle_type, price")
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
      // RLS will filter by business_id
      const { data, error } = await supabase
        .from("expense_types")
        .select("*")
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

  // Partner view - only show connection info
  if (userRole === 'partner') {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-3">
          <Settings className="h-8 w-8 text-accent" />
          <div>
            <h2 className="text-3xl font-bold">Conexão</h2>
            <p className="text-muted-foreground text-lg">
              Gerencie sua conexão com o lava rápido
            </p>
          </div>
        </div>

        <Card className="glass-effect overflow-hidden">
          <div className="bg-gradient-card p-6 border-b border-border/50">
            <h3 className="text-2xl font-bold flex items-center gap-2">
              <Building className="h-6 w-6" />
              Você está conectado
            </h3>
          </div>

          <div className="p-6 space-y-6">
            {businessInfo && (
              <div className="bg-status-success/10 border border-status-success/30 rounded-xl p-5">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-status-success/20 rounded-full">
                    <UserCheck className="h-6 w-6 text-status-success" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">Lava Rápido</p>
                    <p className="text-xl font-bold">{businessInfo.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Proprietário: {businessInfo.owner_name}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
              <p className="text-sm text-amber-200">
                ℹ️ Como sócio, você tem acesso às abas <strong>Entradas</strong> e <strong>Despesas</strong>. 
                Suas ações são registradas para auditoria.
              </p>
            </div>

            <Button
              onClick={handleDisconnect}
              disabled={disconnecting}
              variant="destructive"
              className="w-full h-12 font-bold"
            >
              {disconnecting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Desconectando...
                </>
              ) : (
                <>
                  <LogOut className="mr-2 h-5 w-5" />
                  Desconectar deste Lava Rápido
                </>
              )}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Owner view - full admin panel
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

      {/* Business Code Section */}
      <Card className="glass-effect overflow-hidden">
        <div className="bg-gradient-card p-6 border-b border-border/50">
          <h3 className="text-2xl font-bold flex items-center gap-2">
            <Key className="h-6 w-6" />
            Código do Lava Rápido
          </h3>
          <p className="text-muted-foreground mt-2">
            Compartilhe este código com seu sócio para ele se conectar
          </p>
        </div>

        <div className="p-6 space-y-6">
          {businessInfo?.code && (
            <div className="flex items-center gap-4">
              <div className="flex-1 bg-secondary/50 rounded-xl p-4 border-2 border-dashed border-primary/30">
                <p className="text-center font-mono text-3xl font-bold tracking-widest text-primary">
                  {businessInfo.code}
                </p>
              </div>
              <Button
                onClick={copyBusinessCode}
                className="h-16 px-6 bg-gradient-accent hover:shadow-accent"
              >
                <Copy className="h-6 w-6" />
              </Button>
            </div>
          )}

          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
            <p className="text-sm text-blue-100">
              ℹ️ Seu sócio deve fazer login e digitar este código para se conectar ao seu lava rápido. 
              Ele terá acesso apenas às abas <strong>Entradas</strong> e <strong>Despesas</strong>.
            </p>
          </div>

          {/* Connected Partners */}
          {partners.length > 0 && (
            <div className="space-y-3">
              <Label className="text-lg font-bold">Sócios Conectados</Label>
              {partners.map((partner) => (
                <div
                  key={partner.id}
                  className="flex items-center justify-between bg-status-success/10 border border-status-success/30 rounded-xl p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-status-success/20 rounded-full">
                      <UserCheck className="h-5 w-5 text-status-success" />
                    </div>
                    <span className="font-bold text-lg">{partner.display_name}</span>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => removePartner(partner)}
                    className="font-semibold"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remover
                  </Button>
                </div>
              ))}
            </div>
          )}

          {partners.length === 0 && (
            <div className="bg-secondary/30 rounded-xl p-5 text-center">
              <Users className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground font-medium">Nenhum sócio conectado</p>
            </div>
          )}
        </div>
      </Card>

      {/* Service Prices Section */}
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
            <TabsList className="flex flex-wrap gap-2 h-auto p-2 bg-secondary/30 w-full">
              {VEHICLE_TYPES.map((type) => (
                <TabsTrigger
                  key={type.value}
                  value={type.value}
                  className="data-[state=active]:bg-gradient-primary data-[state=active]:text-primary-foreground font-semibold py-2 px-3 text-xs sm:text-sm flex-shrink-0"
                >
                  <span className="mr-1">{type.icon}</span>
                  <span className="hidden sm:inline">{type.label.split("(")[0].trim()}</span>
                  <span className="sm:hidden">{type.value === "CAMINHONETE" ? "Caminhon." : type.label.split(" ")[0]}</span>
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

      {/* Expense Types Section */}
      <Card className="glass-effect overflow-hidden">
        <div className="bg-gradient-card p-6 border-b border-border/50">
          <h3 className="text-2xl font-bold flex items-center gap-2">
            📋 Configuração de Despesas Fixas
          </h3>
          <p className="text-muted-foreground mt-2">
            Configure valores padrão, dias de disponibilidade e vencimento
          </p>
        </div>

        <div className="p-6 space-y-4">
          {expenseTypes.map((expenseType) => (
            <div
              key={expenseType.id}
              className="p-5 bg-secondary/30 rounded-xl hover-lift"
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1">
                  <h4 className="font-bold text-lg">{expenseType.expense_name}</h4>
                  <p className="text-sm text-muted-foreground">
                    {expenseType.is_fixed ? "Valor fixo" : "Valor variável"}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  {expenseType.is_fixed && (
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-muted-foreground">
                        VALOR (R$)
                      </Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={expenseType.default_value || ""}
                        onChange={(e) =>
                          handleExpenseTypeChange(
                            expenseType.id,
                            "default_value",
                            parseFloat(e.target.value) || null
                          )
                        }
                        className="h-10 bg-background"
                        disabled={loading}
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground">
                      DISPONÍVEL DIA
                    </Label>
                    <Input
                      type="number"
                      min="1"
                      max="31"
                      value={expenseType.available_day}
                      onChange={(e) =>
                        handleExpenseTypeChange(
                          expenseType.id,
                          "available_day",
                          parseInt(e.target.value) || 1
                        )
                      }
                      className="h-10 bg-background"
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground">
                      VENCE DIA
                    </Label>
                    <Input
                      type="number"
                      min="1"
                      max="31"
                      value={expenseType.due_day}
                      onChange={(e) =>
                        handleExpenseTypeChange(
                          expenseType.id,
                          "due_day",
                          parseInt(e.target.value) || 1
                        )
                      }
                      className="h-10 bg-background"
                      disabled={loading}
                    />
                  </div>
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
                SALVAR CONFIGURAÇÕES DE DESPESAS
              </>
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default AdminPanel;
