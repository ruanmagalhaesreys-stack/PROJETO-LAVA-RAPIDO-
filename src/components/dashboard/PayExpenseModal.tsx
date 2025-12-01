import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, DollarSign, CheckCircle } from "lucide-react";

interface PayExpenseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense: {
    id: string;
    expense_name: string;
  } | null;
  onSuccess: () => void;
}

const PayExpenseModal = ({ open, onOpenChange, expense, onSuccess }: PayExpenseModalProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    amountPaid: "",
    paidAt: "",
    description: "",
  });

  useEffect(() => {
    if (open && expense) {
      setFormData({
        amountPaid: "",
        paidAt: new Date().toISOString().split("T")[0],
        description: "",
      });
    }
  }, [open, expense]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expense) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("expenses")
        .update({
          status: "pago",
          amount_paid: parseFloat(formData.amountPaid),
          paid_at: formData.paidAt,
          description: formData.description || null,
        })
        .eq("id", expense.id);

      if (error) throw error;

      toast.success("Despesa registrada como paga!");
      onSuccess();
    } catch (error: any) {
      console.error("Error updating expense:", error);
      toast.error(error.message || "Erro ao registrar pagamento");
    } finally {
      setLoading(false);
    }
  };

  const isProductExpense = expense?.expense_name.toLowerCase() === "produtos";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md glass-effect border-2 border-border/50">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <DollarSign className="h-6 w-6 text-accent" />
            Registrar Pagamento
          </DialogTitle>
          <p className="text-muted-foreground font-semibold">{expense?.expense_name}</p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <Label htmlFor="amountPaid" className="font-semibold text-base">💰 Valor Pago *</Label>
            <Input
              id="amountPaid"
              type="number"
              step="0.01"
              min="0"
              value={formData.amountPaid}
              onChange={(e) =>
                setFormData({ ...formData, amountPaid: e.target.value })
              }
              required
              placeholder="0.00"
              className="mt-2 h-12 bg-secondary/50 font-bold text-lg"
            />
          </div>

          <div>
            <Label htmlFor="paidAt" className="font-semibold text-base">📅 Data do Pagamento *</Label>
            <Input
              id="paidAt"
              type="date"
              value={formData.paidAt}
              onChange={(e) =>
                setFormData({ ...formData, paidAt: e.target.value })
              }
              required
              className="mt-2 h-12 bg-secondary/50 font-semibold"
            />
          </div>

          {isProductExpense && (
            <div>
              <Label htmlFor="description" className="font-semibold text-base">📝 Descrição do Produto</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Ex: Detergente 20L, Cera Líquida..."
                rows={3}
                className="mt-2 bg-secondary/50"
              />
            </div>
          )}

          <Button
            type="submit"
            className="w-full bg-gradient-accent hover:shadow-accent transition-all duration-300 hover:scale-105 font-bold h-12 text-lg"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-5 w-5" />
                CONFIRMAR PAGAMENTO
              </>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PayExpenseModal;
