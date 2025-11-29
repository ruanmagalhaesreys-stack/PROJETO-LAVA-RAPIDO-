import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { DollarSign, Lightbulb, Droplet, Home, User, ShoppingBag } from "lucide-react";
import { format } from "date-fns";
import PayExpenseModal from "./PayExpenseModal";

interface ExpensesPanelProps {
  userId: string;
}

interface ExpenseType {
  id: string;
  expense_name: string;
  default_value: number | null;
  is_fixed: boolean;
  available_day: number;
  due_day: number;
}

interface Expense {
  id: string;
  expense_type_id: string;
  expense_name: string;
  status: string;
  month_year: string;
  paid_at: string | null;
  amount_paid: number | null;
  description: string | null;
  requested_at: string;
}

const ExpensesPanel = ({ userId }: ExpensesPanelProps) => {
  const [loading, setLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(() => format(new Date(), "yyyy-MM"));
  const [expenseTypes, setExpenseTypes] = useState<ExpenseType[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [showPayModal, setShowPayModal] = useState(false);

  useEffect(() => {
    fetchExpenseTypes();
  }, [userId]);

  useEffect(() => {
    if (expenseTypes.length > 0) {
      fetchExpenses();
      checkAndGenerateExpenses();
    }
  }, [selectedMonth, expenseTypes]);

  const fetchExpenseTypes = async () => {
    try {
      const { data, error } = await supabase
        .from("expense_types")
        .select("*")
        .eq("user_id", userId);

      if (error) throw error;
      setExpenseTypes(data || []);
    } catch (error) {
      console.error("Error fetching expense types:", error);
      toast.error("Erro ao carregar tipos de despesa");
    }
  };

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("expenses")
        .select("*")
        .eq("user_id", userId)
        .eq("month_year", selectedMonth)
        .order("expense_name");

      if (error) throw error;
      setExpenses(data || []);
    } catch (error) {
      console.error("Error fetching expenses:", error);
      toast.error("Erro ao carregar despesas");
    } finally {
      setLoading(false);
    }
  };

  const checkAndGenerateExpenses = async () => {
    const today = new Date();
    const currentDay = today.getDate();
    const currentMonthYear = format(today, "yyyy-MM");

    if (selectedMonth !== currentMonthYear) return;

    for (const type of expenseTypes) {
      if (currentDay >= type.available_day) {
        const existingExpense = expenses.find(
          (e) => e.expense_type_id === type.id && e.month_year === selectedMonth
        );

        if (!existingExpense) {
          try {
            await supabase.from("expenses").insert({
              user_id: userId,
              expense_type_id: type.id,
              expense_name: type.expense_name,
              status: "pendente",
              month_year: selectedMonth,
            });
          } catch (error) {
            console.error(`Error creating expense for ${type.expense_name}:`, error);
          }
        }
      }
    }

    fetchExpenses();
  };

  const handlePayExpense = (expense: Expense) => {
    setSelectedExpense(expense);
    setShowPayModal(true);
  };

  const getExpenseIcon = (name: string) => {
    switch (name.toLowerCase()) {
      case "luz":
        return <Lightbulb className="h-6 w-6" />;
      case "água":
        return <Droplet className="h-6 w-6" />;
      case "aluguel":
        return <Home className="h-6 w-6" />;
      case "funcionário":
        return <User className="h-6 w-6" />;
      case "produtos":
        return <ShoppingBag className="h-6 w-6" />;
      default:
        return <DollarSign className="h-6 w-6" />;
    }
  };

  const getExpenseTypeInfo = (expenseTypeId: string) => {
    return expenseTypes.find((t) => t.id === expenseTypeId);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <DollarSign className="h-8 w-8 text-accent" />
          <div>
            <h2 className="text-2xl font-bold">Despesas do Mês</h2>
            <p className="text-muted-foreground">
              Gerencie as despesas mensais do lava rápido
            </p>
          </div>
        </div>

        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Array.from({ length: 12 }, (_, i) => {
              const date = new Date();
              date.setMonth(date.getMonth() - i);
              const value = format(date, "yyyy-MM");
              const label = format(date, "MMMM yyyy");
              return (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {expenses.map((expense) => {
            const typeInfo = getExpenseTypeInfo(expense.expense_type_id);
            return (
              <Card key={expense.id} className="p-6 shadow-card hover:shadow-hover transition-shadow">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg text-primary">
                        {getExpenseIcon(expense.expense_name)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{expense.expense_name}</h3>
                        {typeInfo && (
                          <p className="text-xs text-muted-foreground">
                            Vence: dia {typeInfo.due_day}
                          </p>
                        )}
                      </div>
                    </div>
                    <Badge
                      className={
                        expense.status === "pago"
                          ? "bg-status-ready text-white"
                          : "bg-status-pending text-white"
                      }
                    >
                      {expense.status === "pago" ? "PAGO" : "PENDENTE"}
                    </Badge>
                  </div>

                  {expense.status === "pago" ? (
                    <div className="space-y-1">
                      <p className="text-sm">
                        <span className="font-medium">Pago em:</span>{" "}
                        {expense.paid_at ? format(new Date(expense.paid_at), "dd/MM/yyyy") : "-"}
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">Valor:</span> R${" "}
                        {expense.amount_paid?.toFixed(2) || "0.00"}
                      </p>
                      {expense.description && (
                        <p className="text-sm">
                          <span className="font-medium">Descrição:</span> {expense.description}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {typeInfo?.is_fixed && typeInfo.default_value && (
                        <p className="text-sm">
                          <span className="font-medium">Valor:</span> R${" "}
                          {typeInfo.default_value.toFixed(2)}
                        </p>
                      )}
                      <Button
                        onClick={() => handlePayExpense(expense)}
                        className="w-full bg-accent hover:bg-accent/90"
                      >
                        Paguei
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {expenses.length === 0 && !loading && (
        <Card className="p-12 text-center">
          <DollarSign className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl font-semibold mb-2">Nenhuma despesa registrada</h3>
          <p className="text-muted-foreground">
            As despesas serão geradas automaticamente a partir do dia disponível
          </p>
        </Card>
      )}

      <PayExpenseModal
        open={showPayModal}
        onOpenChange={setShowPayModal}
        expense={selectedExpense}
        onSuccess={() => {
          fetchExpenses();
          setShowPayModal(false);
        }}
      />
    </div>
  );
};

export default ExpensesPanel;
