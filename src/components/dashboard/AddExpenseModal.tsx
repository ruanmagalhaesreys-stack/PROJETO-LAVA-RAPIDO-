import { useState } from "react";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";

interface AddExpenseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  onSuccess: () => void;
}

const AddExpenseModal = ({ open, onOpenChange, userId, onSuccess }: AddExpenseModalProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    value: "",
    category: "",
    description: "",
    status: "pendente",
    dueDate: "",
  });

  const categories = [
    "Funcionário",
    "Alimentação",
    "Produtos",
    "Manutenção",
    "Estrutura",
    "Investimento",
    "Outros",
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.value || !formData.category) {
      toast.error("Preencha o valor e a categoria");
      return;
    }

    if (formData.status === "pendente" && !formData.dueDate) {
      toast.error("Preencha a data limite para despesas pendentes");
      return;
    }

    setLoading(true);
    try {
      const currentMonthYear = format(new Date(), "yyyy-MM");
      
      const expenseData: any = {
        user_id: userId,
        expense_name: formData.category,
        category: formData.category,
        description: formData.description || null,
        status: formData.status,
        month_year: currentMonthYear,
        is_recurring: false,
        expense_type_id: null,
      };

      if (formData.status === "pago") {
        expenseData.amount_paid = parseFloat(formData.value);
        expenseData.paid_at = format(new Date(), "yyyy-MM-dd");
      } else {
        expenseData.due_date = formData.dueDate;
      }

      const { error } = await supabase.from("expenses").insert(expenseData);

      if (error) throw error;

      toast.success("Despesa adicionada com sucesso!");
      setFormData({
        value: "",
        category: "",
        description: "",
        status: "pendente",
        dueDate: "",
      });
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error adding expense:", error);
      toast.error(error.message || "Erro ao adicionar despesa");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Adicionar Despesa</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="value">Valor (R$)*</Label>
            <Input
              id="value"
              type="number"
              step="0.01"
              min="0"
              value={formData.value}
              onChange={(e) => setFormData({ ...formData, value: e.target.value })}
              placeholder="0.00"
              disabled={loading}
              required
            />
          </div>

          <div>
            <Label htmlFor="category">Categoria*</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData({ ...formData, category: value })}
              disabled={loading}
            >
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Selecione a categoria" />
              </SelectTrigger>
              <SelectContent className="bg-background z-50">
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Detalhes sobre o gasto..."
              disabled={loading}
              rows={3}
            />
          </div>

          <div>
            <Label>Status*</Label>
            <RadioGroup
              value={formData.status}
              onValueChange={(value) => setFormData({ ...formData, status: value })}
              disabled={loading}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pago" id="pago" />
                <Label htmlFor="pago" className="cursor-pointer font-normal">
                  Já paguei
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pendente" id="pendente" />
                <Label htmlFor="pendente" className="cursor-pointer font-normal">
                  Pendente
                </Label>
              </div>
            </RadioGroup>
          </div>

          {formData.status === "pendente" && (
            <div>
              <Label htmlFor="dueDate">Data Limite para Pagamento*</Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                disabled={loading}
                required
              />
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-accent hover:bg-accent/90"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Adicionar Despesa"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddExpenseModal;
