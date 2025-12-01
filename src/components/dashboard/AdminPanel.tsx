import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, DollarSign, Settings, Sparkles, Save } from "lucide-react";

interface AdminPanelProps {
  userId: string;
}

interface ServicePrice {
  service_name: string;
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

const AdminPanel = ({ userId }: AdminPanelProps) => {
  const [loading, setLoading] = useState(false);
  const [prices, setPrices] = useState<ServicePrice[]>([]);
  const [expenseTypes, setExpenseTypes] = useState<ExpenseType[]>([]);

  useEffect(() => {
    fetchPrices();
    fetchExpenseTypes();
  }, [userId]);

  const fetchPrices = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("service_prices")
        .select("service_name, price")
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

  const handlePriceChange = (serviceName: string, newPrice: string) => {
    setPrices((prev) =>
      prev.map((p) =>
        p.service_name === serviceName
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

  const handleSave = async () => {
    setLoading(true);
    try {
      for (const price of prices) {
        const { error } = await supabase
          .from("service_prices")
          .update({ price: price.price })
          .eq("user_id", userId)
          .eq("service_name", price.service_name);

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

  if (loading && prices.length === 0) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Settings className="h-8 w-8 text-accent" />
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-2">
            Configurações do Admin
            <Sparkles className="h-6 w-6 text-accent" />
          </h2>
          <p className="text-muted-foreground text-lg">
            Gerencie preços e configurações de despesas
          </p>
        </div>
      </div>

      <Card className="glass-effect overflow-hidden">
        <div className="bg-gradient-card p-6 border-b border-border/50">
          <h3 className="text-2xl font-bold flex items-center gap-2">
            💎 Preços dos Serviços
          </h3>
        </div>
        <div className="p-6 space-y-4">
          {prices.map((price) => (
            <div key={price.service_name} className="flex items-center gap-4 p-4 bg-secondary/30 rounded-xl hover-lift">
              <div className="flex-1">
                <Label htmlFor={price.service_name} className="font-bold text-lg">
                  {price.service_name}
                </Label>
              </div>
              <div className="w-48">
                <Input
                  id={price.service_name}
                  type="number"
                  step="0.01"
                  min="0"
                  value={price.price}
                  onChange={(e) =>
                    handlePriceChange(price.service_name, e.target.value)
                  }
                  className="text-right h-11 font-bold text-lg bg-background"
                  disabled={loading}
                />
              </div>
            </div>
          ))}

          <Button
            onClick={handleSave}
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
                SALVAR PREÇOS
              </>
            )}
          </Button>
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
            <div key={expenseType.id} className="p-6 border-2 border-border/50 rounded-xl space-y-4 hover-lift bg-secondary/20">
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
