import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, DollarSign } from "lucide-react";

interface AdminPanelProps {
  userId: string;
}

interface ServicePrice {
  service_name: string;
  price: number;
}

const AdminPanel = ({ userId }: AdminPanelProps) => {
  const [loading, setLoading] = useState(false);
  const [prices, setPrices] = useState<ServicePrice[]>([]);

  useEffect(() => {
    fetchPrices();
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

  const handlePriceChange = (serviceName: string, newPrice: string) => {
    setPrices((prev) =>
      prev.map((p) =>
        p.service_name === serviceName
          ? { ...p, price: parseFloat(newPrice) || 0 }
          : p
      )
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

  if (loading && prices.length === 0) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <DollarSign className="h-8 w-8 text-accent" />
        <div>
          <h2 className="text-2xl font-bold">Gerenciar Preços</h2>
          <p className="text-muted-foreground">
            Atualize os valores padrão dos serviços
          </p>
        </div>
      </div>

      <Card className="p-6">
        <div className="space-y-4">
          {prices.map((price) => (
            <div key={price.service_name} className="flex items-center gap-4">
              <div className="flex-1">
                <Label htmlFor={price.service_name}>{price.service_name}</Label>
              </div>
              <div className="w-40">
                <Input
                  id={price.service_name}
                  type="number"
                  step="0.01"
                  min="0"
                  value={price.price}
                  onChange={(e) =>
                    handlePriceChange(price.service_name, e.target.value)
                  }
                  className="text-right"
                  disabled={loading}
                />
              </div>
            </div>
          ))}

          <Button
            onClick={handleSave}
            className="w-full mt-6 bg-accent hover:bg-accent/90"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              "Salvar Novos Preços"
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default AdminPanel;