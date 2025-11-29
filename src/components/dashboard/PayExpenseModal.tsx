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
import { Loader2 } from "lucide-react";

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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar Pagamento - {expense?.expense_name}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="amountPaid">Valor Pago *</Label>
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
            />
          </div>

          <div>
            <Label htmlFor="paidAt">Data do Pagamento *</Label>
            <Input
              id="paidAt"
              type="date"
              value={formData.paidAt}
              onChange={(e) =>
                setFormData({ ...formData, paidAt: e.target.value })
              }
              required
            />
          </div>

          {isProductExpense && (
            <div>
              <Label htmlFor="description">Descrição do Produto</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Ex: Detergente 20L, Cera Líquida..."
                rows={3}
              />
            </div>
          )}

          <Button
            type="submit"
            className="w-full bg-accent hover:bg-accent/90"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              "Confirmar Pagamento"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PayExpenseModal;
