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
  Plus,
  Sparkles
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
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
  created_by_member_id: string | null;
  paid_by_member_id: string | null;
  created_by_name?: string;
  paid_by_name?: string;
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
      // RLS will filter by business_id automatically
      const { data, error } = await supabase
        .from("expense_types")
        .select("*");

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
      // RLS will filter by business_id automatically
      const { data, error } = await supabase
        .from("expenses")
        .select("*")
        .eq("month_year", selectedMonth)
        .order("is_recurring", { ascending: false })
        .order("expense_name");

      if (error) throw error;
      
      // Fetch member names for audit trail
      const expensesWithNames = await Promise.all(
        (data || []).map(async (expense) => {
          let created_by_name: string | undefined;
          let paid_by_name: string | undefined;

          if (expense.created_by_member_id) {
            const { data: nameData } = await supabase.rpc("get_member_name", {
              member_id: expense.created_by_member_id,
            });
            created_by_name = nameData || undefined;
          }

          if (expense.paid_by_member_id) {
            const { data: nameData } = await supabase.rpc("get_member_name", {
              member_id: expense.paid_by_member_id,
            });
            paid_by_name = nameData || undefined;
          }

          return { ...expense, created_by_name, paid_by_name };
        })
      );

      setExpenses(expensesWithNames);
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

    // Get business_id for insert
    const { data: businessId } = await supabase.rpc('get_user_business_id');
    if (!businessId) return;

    let hasNewExpenses = false;

    for (const type of expenseTypes) {
      if (currentDay >= type.available_day) {
        // Check directly in database to prevent duplicates (not local state)
        const { data: existingExpense } = await supabase
          .from("expenses")
          .select("id")
          .eq("expense_type_id", type.id)
          .eq("month_year", selectedMonth)
          .eq("business_id", businessId)
          .maybeSingle();

        if (!existingExpense) {
          try {
            await supabase.from("expenses").insert({
              user_id: userId,
              business_id: businessId,
              expense_type_id: type.id,
              expense_name: type.expense_name,
              status: "pendente",
              month_year: selectedMonth,
              is_recurring: true,
            });
            hasNewExpenses = true;
          } catch (error) {
            console.error(`Error creating expense for ${type.expense_name}:`, error);
          }
        }
      }
    }

    if (hasNewExpenses) {
      fetchExpenses();
    }
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
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <DollarSign className="h-8 w-8 text-accent" />
          <div>
            <h2 className="text-3xl font-bold flex items-center gap-2">
              Despesas do Mês
              <Sparkles className="h-6 w-6 text-accent" />
            </h2>
            <p className="text-muted-foreground text-lg">
              Gerencie as despesas mensais do lava rápido
            </p>
          </div>
        </div>

        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="w-[200px] h-11 bg-secondary/50 font-semibold">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Array.from({ length: 12 }, (_, i) => {
              const date = new Date();
              date.setMonth(date.getMonth() - i);
              const value = format(date, "yyyy-MM");
              const label = format(date, "MMMM 'de' yyyy", { locale: ptBR });
              return (
                <SelectItem key={value} value={value} className="capitalize">
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
          {expenses.some((e) => e.is_recurring) && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-px bg-border flex-1" />
                <h3 className="text-lg font-bold text-muted-foreground uppercase tracking-wider">
                  📌 Contas Fixas
                </h3>
                <div className="h-px bg-border flex-1" />
              </div>

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {expenses
                  .filter((expense) => expense.is_recurring)
                  .map((expense) => {
                    const typeInfo = expense.expense_type_id ? getExpenseTypeInfo(expense.expense_type_id) : null;
                    const isPaid = expense.status === "pago";
                    
                    return (
                      <Card 
                        key={expense.id} 
                        className={`glass-effect hover-lift overflow-hidden ${
                          isPaid ? "border-l-4 border-l-status-success" : "border-l-4 border-l-status-pending"
                        }`}
                      >
                        <div className="p-6 space-y-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`p-3 rounded-xl ${
                                isPaid ? "bg-status-success/20" : "bg-status-pending/20"
                              }`}>
                                <div className={isPaid ? "text-status-success" : "text-status-pending"}>
                                  {getExpenseIcon(expense.expense_name, expense.category)}
                                </div>
                              </div>
                              <div>
                                <h3 className="font-bold text-lg">{expense.expense_name}</h3>
                                {typeInfo && (
                                  <p className="text-xs text-muted-foreground font-semibold">
                                    Vence: dia {typeInfo.due_day}
                                  </p>
                                )}
                              </div>
                            </div>
                            <Badge
                              className={`font-bold px-3 py-1 ${
                                isPaid
                                  ? "bg-status-success/20 text-status-success border border-status-success/30"
                                  : "bg-status-pending/20 text-status-pending border border-status-pending/30"
                              }`}
                            >
                              {isPaid ? "✓ PAGO" : "⏳ PENDENTE"}
                            </Badge>
                          </div>

                          {isPaid ? (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span className="font-semibold text-muted-foreground">Pago em:</span>
                                <span className="font-bold">
                                  {expense.paid_at ? format(new Date(expense.paid_at), "dd/MM/yyyy") : "-"}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-muted-foreground text-sm">Valor:</span>
                                <span className="text-xl font-bold text-status-success">
                                  R$ {expense.amount_paid?.toFixed(2) || "0.00"}
                                </span>
                              </div>
                              {expense.description && (
                                <p className="text-sm text-muted-foreground italic">
                                  {expense.description}
                                </p>
                              )}
                              {expense.paid_by_name && (
                                <div className="mt-2 pt-2 border-t border-border/30">
                                  <p className="text-xs text-muted-foreground">
                                    👤 Pago por: <span className="font-semibold text-foreground">{expense.paid_by_name}</span>
                                  </p>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {typeInfo?.is_fixed && typeInfo.default_value && (
                                <div className="flex items-center justify-between">
                                  <span className="font-semibold text-muted-foreground text-sm">Valor:</span>
                                  <span className="text-xl font-bold">
                                    R$ {typeInfo.default_value.toFixed(2)}
                                  </span>
                                </div>
                              )}
                              <Button
                                onClick={() => handlePayExpense(expense)}
                                className="w-full bg-gradient-accent hover:shadow-accent transition-all duration-300 hover:scale-105 font-bold"
                              >
                                <DollarSign className="h-5 w-5 mr-2" />
                                PAGUEI
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

          <div className="space-y-4 mt-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 flex-1">
                <div className="h-px bg-border flex-1" />
                <h3 className="text-lg font-bold text-muted-foreground uppercase tracking-wider">
                  📋 Despesas Adicionais
                </h3>
                <div className="h-px bg-border flex-1" />
              </div>
            </div>

            <Button
              onClick={() => setShowAddModal(true)}
              className="w-full bg-gradient-primary hover:shadow-glow transition-all duration-300 hover:scale-105 font-bold h-12 text-lg"
            >
              <Plus className="mr-2 h-5 w-5" />
              Adicionar Despesa
            </Button>

            {expenses.some((e) => !e.is_recurring) && (
              <div className="grid gap-4 md:grid-cols-1">
                {expenses
                  .filter((expense) => !expense.is_recurring)
                  .map((expense) => {
                    const isPaid = expense.status === "pago";
                    
                    return (
                      <Card 
                        key={expense.id} 
                        className={`glass-effect hover-lift p-5 border-l-4 ${
                          isPaid ? "border-l-status-success" : "border-l-destructive"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-4 flex-1">
                            <div className={`p-3 rounded-xl ${
                              isPaid ? "bg-status-success/20" : "bg-destructive/20"
                            }`}>
                              <div className={isPaid ? "text-status-success" : "text-destructive"}>
                                {getExpenseIcon(expense.expense_name, expense.category)}
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="font-bold text-xl uppercase">
                                  {expense.category || expense.expense_name}
                                </h3>
                                <Badge
                                  className={`font-bold px-3 py-1 ${
                                    isPaid
                                      ? "bg-status-success/20 text-status-success border border-status-success/30"
                                      : "bg-destructive/20 text-destructive border border-destructive/30"
                                  }`}
                                >
                                  {isPaid ? "✓ PAGO" : "⏳ PENDENTE"}
                                </Badge>
                              </div>
                              
                              {expense.description && (
                                <p className="text-sm text-muted-foreground mb-3 font-medium">
                                  {expense.description}
                                </p>
                              )}

                              <div className="flex flex-wrap gap-3 text-sm font-semibold">
                                {isPaid ? (
                                  <span>
                                    Pago em: {expense.paid_at ? format(new Date(expense.paid_at), "dd/MM/yyyy") : "-"}
                                  </span>
                                ) : (
                                  expense.due_date && (
                                    <span className="text-destructive">
                                      Vence: {format(new Date(expense.due_date), "dd/MM/yyyy")}
                                    </span>
                                  )
                                )}
                                {(expense.created_by_name || expense.paid_by_name) && (
                                  <div className="flex gap-4 mt-1">
                                    {expense.created_by_name && (
                                      <span className="text-xs text-muted-foreground">
                                        👤 Criado por: <span className="font-semibold text-foreground">{expense.created_by_name}</span>
                                      </span>
                                    )}
                                    {expense.paid_by_name && (
                                      <span className="text-xs text-muted-foreground">
                                        💰 Pago por: <span className="font-semibold text-foreground">{expense.paid_by_name}</span>
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-3">
                            <p className={`font-bold text-2xl whitespace-nowrap ${
                              isPaid ? "text-status-success" : "text-foreground"
                            }`}>
                              R$ {isPaid ? expense.amount_paid?.toFixed(2) : "0.00"}
                            </p>
                            {!isPaid && (
                              <Button
                                onClick={() => handlePayExpense(expense)}
                                className="bg-gradient-accent hover:shadow-accent transition-all duration-300 hover:scale-105 font-bold"
                              >
                                <DollarSign className="h-4 w-4 mr-2" />
                                PAGUEI
                              </Button>
                            )}
                          </div>
                        </div>
                      </Card>
                    );
                  })}
              </div>
            )}
          </div>
        </>
      )}

      {expenses.length === 0 && !loading && (
        <Card className="p-16 text-center glass-effect hover-lift">
          <DollarSign className="h-20 w-20 mx-auto mb-6 text-muted-foreground opacity-50" />
          <h3 className="text-2xl font-bold mb-3">Nenhuma despesa registrada</h3>
          <p className="text-muted-foreground text-lg">
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
