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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Plus, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { z } from "zod";

// Validation schema for expense form
const expenseFormSchema = z.object({
  value: z.string().refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num > 0 && num <= 1000000;
  }, "Valor deve ser entre R$0,01 e R$1.000.000"),
  category: z.string().min(1, "Selecione uma categoria"),
  description: z.string().trim().max(500, "Descrição muito longa").optional(),
  status: z.enum(["pago", "pendente"]),
  dueDate: z.string().optional(),
}).refine((data) => {
  if (data.status === "pendente" && !data.dueDate) {
    return false;
  }
  return true;
}, { message: "Data limite obrigatória para despesas pendentes", path: ["dueDate"] });

interface AddExpenseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  onSuccess: () => void;
}

const AddExpenseModal = ({ open, onOpenChange, userId, onSuccess }: AddExpenseModalProps) => {
  const [loading, setLoading] = useState(false);
  const [memberId, setMemberId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    value: "",
    category: "",
    description: "",
    status: "pendente",
    dueDate: "",
  });

  useEffect(() => {
    if (open && userId) {
      fetchMemberId();
    }
  }, [open, userId]);

  const fetchMemberId = async () => {
    try {
      const { data, error } = await supabase
        .from("business_members")
        .select("id")
        .eq("user_id", userId)
        .single();

      if (error) throw error;
      setMemberId(data.id);
    } catch (error) {
      console.error("Error fetching member ID:", error);
    }
  };

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

    // Validate form data with Zod schema
    const validation = expenseFormSchema.safeParse(formData);
    if (!validation.success) {
      const firstError = validation.error.errors[0];
      toast.error(firstError.message);
      return;
    }

    const validatedData = validation.data;

    setLoading(true);
    try {
      const currentMonthYear = format(new Date(), "yyyy-MM");
      
      const expenseData: any = {
        user_id: userId,
        expense_name: validatedData.category,
        category: validatedData.category,
        description: validatedData.description || null,
        status: validatedData.status,
        month_year: currentMonthYear,
        is_recurring: false,
        expense_type_id: null,
        created_by_member_id: memberId,
      };

      if (validatedData.status === "pago") {
        expenseData.amount_paid = parseFloat(validatedData.value);
        expenseData.paid_at = format(new Date(), "yyyy-MM-dd");
        expenseData.paid_by_member_id = memberId;
      } else {
        expenseData.due_date = validatedData.dueDate;
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
      <DialogContent className="sm:max-w-[550px] glass-effect border-2 border-border/50">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-accent" />
            Adicionar Despesa
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <Label htmlFor="value" className="font-semibold text-base">💰 Valor (R$)*</Label>
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
              className="mt-2 h-12 bg-secondary/50 font-bold text-lg"
            />
          </div>

          <div>
            <Label htmlFor="category" className="font-semibold text-base">📋 Categoria*</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData({ ...formData, category: value })}
              disabled={loading}
            >
              <SelectTrigger className="mt-2 h-12 bg-secondary/50 font-semibold">
                <SelectValue placeholder="Selecione a categoria" />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50">
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat} className="font-semibold">
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="description" className="font-semibold text-base">📝 Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Detalhes sobre o gasto..."
              disabled={loading}
              rows={3}
              className="mt-2 bg-secondary/50"
            />
          </div>

          <div>
            <Label className="font-semibold text-base mb-3 block">✅ Status*</Label>
            <RadioGroup
              value={formData.status}
              onValueChange={(value) => setFormData({ ...formData, status: value })}
              disabled={loading}
              className="space-y-3"
            >
              <div className="flex items-center space-x-3 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors">
                <RadioGroupItem value="pago" id="pago" />
                <Label htmlFor="pago" className="cursor-pointer font-semibold flex-1">
                  Já paguei
                </Label>
              </div>
              <div className="flex items-center space-x-3 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors">
                <RadioGroupItem value="pendente" id="pendente" />
                <Label htmlFor="pendente" className="cursor-pointer font-semibold flex-1">
                  Pendente
                </Label>
              </div>
            </RadioGroup>
          </div>

          {formData.status === "pendente" && (
            <div>
              <Label htmlFor="dueDate" className="font-semibold text-base">📅 Data Limite para Pagamento*</Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                disabled={loading}
                required
                className="mt-2 h-12 bg-secondary/50 font-semibold"
              />
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="flex-1 h-12 font-semibold"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 h-12 bg-gradient-accent hover:shadow-accent transition-all duration-300 hover:scale-105 font-bold"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-5 w-5" />
                  ADICIONAR
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddExpenseModal;
