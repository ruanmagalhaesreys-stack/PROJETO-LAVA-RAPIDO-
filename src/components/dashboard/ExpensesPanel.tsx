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
import { 
  DollarSign, 
  Lightbulb, 
  Droplet, 
  Home, 
  User, 
  UtensilsCrossed, 
  ShoppingBag, 
  Wrench, 
  Building, 
  TrendingUp,
  Plus
} from "lucide-react";
import { format } from "date-fns";
import PayExpenseModal from "./PayExpenseModal";
import AddExpenseModal from "./AddExpenseModal";

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
  expense_type_id: string | null;
  expense_name: string;
  status: string;
  month_year: string;
  paid_at: string | null;
  amount_paid: number | null;
  description: string | null;
  requested_at: string;
  is_recurring: boolean;
  category: string | null;
  due_date: string | null;
}

const ExpensesPanel = ({ userId }: ExpensesPanelProps) => {
  const [loading, setLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(() => format(new Date(), "yyyy-MM"));
  const [expenseTypes, setExpenseTypes] = useState<ExpenseType[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [showPayModal, setShowPayModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

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
        .order("is_recurring", { ascending: false })
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
              is_recurring: true,
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

  const getExpenseIcon = (name: string, category?: string | null) => {
    const nameOrCat = (category || name).toLowerCase();
    
    switch (nameOrCat) {
      case "luz":
        return <Lightbulb className="h-6 w-6" />;
      case "água":
        return <Droplet className="h-6 w-6" />;
      case "aluguel":
        return <Home className="h-6 w-6" />;
      case "funcionário":
        return <User className="h-6 w-6" />;
      case "alimentação":
        return <UtensilsCrossed className="h-6 w-6" />;
      case "produtos":
        return <ShoppingBag className="h-6 w-6" />;
      case "manutenção":
        return <Wrench className="h-6 w-6" />;
      case "estrutura":
        return <Building className="h-6 w-6" />;
      case "investimento":
        return <TrendingUp className="h-6 w-6" />;
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
        <>
          {/* Recurring Expenses Section */}
          {expenses.some((e) => e.is_recurring) && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-px bg-border flex-1" />
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Contas Fixas
                </h3>
                <div className="h-px bg-border flex-1" />
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {expenses
                  .filter((expense) => expense.is_recurring)
                  .map((expense) => {
                    const typeInfo = expense.expense_type_id ? getExpenseTypeInfo(expense.expense_type_id) : null;
                    return (
                      <Card key={expense.id} className="p-6 shadow-card hover:shadow-hover transition-shadow">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                {getExpenseIcon(expense.expense_name, expense.category)}
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
            </div>
          )}

          {/* Additional Expenses Section */}
          <div className="space-y-4 mt-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 flex-1">
                <div className="h-px bg-border flex-1" />
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Despesas Adicionais
                </h3>
                <div className="h-px bg-border flex-1" />
              </div>
            </div>

            <Button
              onClick={() => setShowAddModal(true)}
              className="w-full bg-primary hover:bg-primary/90"
            >
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Despesa
            </Button>

            {expenses.some((e) => !e.is_recurring) && (
              <div className="grid gap-4 md:grid-cols-1">
                {expenses
                  .filter((expense) => !expense.is_recurring)
                  .map((expense) => (
                    <Card key={expense.id} className="p-4 shadow-card hover:shadow-hover transition-shadow">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="p-2 bg-primary/10 rounded-lg text-primary">
                            {getExpenseIcon(expense.expense_name, expense.category)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-base uppercase">{expense.category || expense.expense_name}</h3>
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
                            
                            {expense.description && (
                              <p className="text-sm text-muted-foreground mb-2">
                                {expense.description}
                              </p>
                            )}

                            <div className="flex flex-wrap gap-3 text-sm">
                              {expense.status === "pago" ? (
                                <>
                                  <span>
                                    Pago em: {expense.paid_at ? format(new Date(expense.paid_at), "dd/MM/yyyy") : "-"}
                                  </span>
                                </>
                              ) : (
                                expense.due_date && (
                                  <span className="text-destructive">
                                    Vence: {format(new Date(expense.due_date), "dd/MM/yyyy")}
                                  </span>
                                )
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          <p className="font-bold text-lg whitespace-nowrap">
                            R$ {expense.status === "pago" ? expense.amount_paid?.toFixed(2) : "0.00"}
                          </p>
                          {expense.status === "pendente" && (
                            <Button
                              onClick={() => handlePayExpense(expense)}
                              size="sm"
                              className="bg-accent hover:bg-accent/90"
                            >
                              Paguei
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
              </div>
            )}
          </div>
        </>
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

      <AddExpenseModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
        userId={userId}
        onSuccess={() => {
          fetchExpenses();
        }}
      />
    </div>
  );
};

export default ExpensesPanel;
