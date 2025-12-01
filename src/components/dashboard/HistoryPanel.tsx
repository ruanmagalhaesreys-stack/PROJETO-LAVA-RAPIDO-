import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Calendar, TrendingUp, DollarSign, Receipt, Sparkles, ArrowUp, ArrowDown } from "lucide-react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

interface HistoryPanelProps {
  userId: string;
}

interface Service {
  id: string;
  client_name: string;
  car_plate: string;
  service_name: string;
  value: number;
  status: string;
  date_yyyymmdd: string;
  created_at: string;
}

interface Expense {
  id: string;
  expense_name: string;
  amount_paid: number;
  paid_at: string;
  description: string | null;
  category: string | null;
  is_recurring: boolean;
}

interface Stats {
  total: number;
  revenue: number;
  totalExpenses: number;
  profit: number;
  partnerCommission: number;
}

const HistoryPanel = ({ userId }: HistoryPanelProps) => {
  const [loading, setLoading] = useState(false);
  const [currentMonthLoading, setCurrentMonthLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [services, setServices] = useState<Service[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    revenue: 0,
    totalExpenses: 0,
    profit: 0,
    partnerCommission: 0,
  });
  
  // Current month stats
  const [currentMonthStats, setCurrentMonthStats] = useState<Stats>({
    total: 0,
    revenue: 0,
    totalExpenses: 0,
    profit: 0,
    partnerCommission: 0,
  });
  
  useEffect(() => {
    fetchCurrentMonthData();
  }, [userId]);

  const fetchCurrentMonthData = async () => {
    setCurrentMonthLoading(true);
    try {
      const now = new Date();
      const monthStart = format(startOfMonth(now), "yyyy-MM-dd");
      const monthEnd = format(endOfMonth(now), "yyyy-MM-dd");

      // Fetch current month services
      const { data: servicesData, error: servicesError } = await supabase
        .from("daily_services")
        .select("*")
        .eq("user_id", userId)
        .gte("date_yyyymmdd", monthStart)
        .lte("date_yyyymmdd", monthEnd);

      if (servicesError) throw servicesError;

      // Fetch paid expenses in current month
      const { data: expensesData, error: expensesError } = await supabase
        .from("expenses")
        .select("*")
        .eq("user_id", userId)
        .eq("status", "pago")
        .gte("paid_at", monthStart)
        .lte("paid_at", monthEnd);

      if (expensesError) throw expensesError;

      const total = servicesData?.length || 0;
      const revenue = servicesData?.reduce((sum, s) => sum + parseFloat(s.value.toString()), 0) || 0;
      const totalExpenses = expensesData?.reduce((sum, e) => sum + parseFloat(e.amount_paid?.toString() || "0"), 0) || 0;
      const profit = revenue - totalExpenses;
      const partnerCommission = revenue * 0.25;

      setCurrentMonthStats({ total, revenue, totalExpenses, profit, partnerCommission });
    } catch (error) {
      console.error("Error fetching current month data:", error);
      toast.error("Erro ao carregar dados do mês atual");
    } finally {
      setCurrentMonthLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!startDate || !endDate) {
      toast.error("Por favor, selecione as datas");
      return;
    }

    setLoading(true);
    try {
      const { data: servicesData, error: servicesError } = await supabase
        .from("daily_services")
        .select("*")
        .eq("user_id", userId)
        .gte("date_yyyymmdd", startDate)
        .lte("date_yyyymmdd", endDate)
        .order("date_yyyymmdd", { ascending: false })
        .order("created_at", { ascending: false });

      if (servicesError) throw servicesError;

      const { data: expensesData, error: expensesError } = await supabase
        .from("expenses")
        .select("*")
        .eq("user_id", userId)
        .eq("status", "pago")
        .gte("paid_at", startDate)
        .lte("paid_at", endDate)
        .order("paid_at", { ascending: false });

      if (expensesError) throw expensesError;

      setServices(servicesData || []);
      setExpenses(expensesData || []);

      const total = servicesData?.length || 0;
      const revenue = servicesData?.reduce((sum, s) => sum + parseFloat(s.value.toString()), 0) || 0;
      const totalExpenses = expensesData?.reduce((sum, e) => sum + parseFloat(e.amount_paid?.toString() || "0"), 0) || 0;
      const profit = revenue - totalExpenses;
      const partnerCommission = revenue * 0.25;

      setStats({ total, revenue, totalExpenses, profit, partnerCommission });
      toast.success(`${total} serviço(s) e ${expensesData?.length || 0} despesa(s) encontrado(s)`);
    } catch (error) {
      console.error("Error searching history:", error);
      toast.error("Erro ao buscar histórico");
    } finally {
      setLoading(false);
    }
  };

  const currentMonthName = format(new Date(), "MMMM yyyy", { locale: ptBR });

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Calendar className="h-8 w-8 text-accent" />
        <div>
          <h2 className="text-3xl font-bold">Histórico de Serviços</h2>
          <p className="text-muted-foreground text-lg">
            Consulte serviços prestados por período
          </p>
        </div>
      </div>

      {/* Current Month Summary */}
      <Card className="glass-effect overflow-hidden border-t-4 border-t-accent">
        <div className="bg-gradient-card p-6">
          <div className="flex items-center gap-3 mb-6">
            <Sparkles className="h-6 w-6 text-accent" />
            <h3 className="text-2xl font-bold capitalize">
              Resumo de {currentMonthName}
            </h3>
            <Badge className="bg-accent/20 text-accent border border-accent/30 font-bold">
              EM TEMPO REAL
            </Badge>
          </div>

          {currentMonthLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-card/50 p-5 hover-lift border-t-2 border-t-primary">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="bg-primary/20 p-2 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-primary" />
                    </div>
                    <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Serviços</p>
                  </div>
                  <p className="text-3xl font-bold">{currentMonthStats.total}</p>
                  <div className="flex items-center gap-1 mt-1 text-xs text-status-success">
                    <ArrowUp className="h-3 w-3" />
                    <span className="font-semibold">Acumulado do mês</span>
                  </div>
                </Card>

                <Card className="bg-card/50 p-5 hover-lift border-t-2 border-t-accent">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="bg-accent/20 p-2 rounded-lg">
                      <DollarSign className="h-5 w-5 text-accent" />
                    </div>
                    <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Faturamento</p>
                  </div>
                  <p className="text-3xl font-bold text-accent">R$ {currentMonthStats.revenue.toFixed(2)}</p>
                  <div className="flex items-center gap-1 mt-1 text-xs text-status-success">
                    <ArrowUp className="h-3 w-3" />
                    <span className="font-semibold">Total recebido</span>
                  </div>
                </Card>

                <Card className="bg-card/50 p-5 hover-lift border-t-2 border-t-destructive">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="bg-destructive/20 p-2 rounded-lg">
                      <Receipt className="h-5 w-5 text-destructive" />
                    </div>
                    <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Despesas</p>
                  </div>
                  <p className="text-3xl font-bold text-destructive">R$ {currentMonthStats.totalExpenses.toFixed(2)}</p>
                  <div className="flex items-center gap-1 mt-1 text-xs text-destructive">
                    <ArrowDown className="h-3 w-3" />
                    <span className="font-semibold">Contas pagas</span>
                  </div>
                </Card>

                <Card className="bg-card/50 p-5 hover-lift border-t-2 border-t-status-success">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="bg-status-success/20 p-2 rounded-lg">
                      <Sparkles className="h-5 w-5 text-status-success" />
                    </div>
                    <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Lucro</p>
                  </div>
                  <p className="text-3xl font-bold text-status-success">R$ {currentMonthStats.profit.toFixed(2)}</p>
                  <div className="flex items-center gap-1 mt-1 text-xs text-status-success">
                    <ArrowUp className="h-3 w-3" />
                    <span className="font-semibold">Resultado líquido</span>
                  </div>
                </Card>
              </div>

              <Card className="bg-gradient-accent p-6 text-accent-foreground border-accent/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-accent-foreground/20 p-3 rounded-xl">
                      <DollarSign className="h-7 w-7" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold opacity-90 uppercase tracking-wider">Comissão do Sócio (25%)</p>
                      <p className="text-4xl font-bold mt-1">R$ {currentMonthStats.partnerCommission.toFixed(2)}</p>
                    </div>
                  </div>
                  <Sparkles className="h-12 w-12 opacity-20" />
                </div>
              </Card>
            </div>
          )}
        </div>
      </Card>

      {/* Search Period Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="h-px bg-border flex-1" />
          <h3 className="text-lg font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Consultar Período Específico
          </h3>
          <div className="h-px bg-border flex-1" />
        </div>

        <Card className="p-6 glass-effect">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <Label htmlFor="startDate" className="font-semibold">📅 Data Início</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-2 h-11 bg-secondary/50"
              />
            </div>

            <div>
              <Label htmlFor="endDate" className="font-semibold">📅 Data Fim</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="mt-2 h-11 bg-secondary/50"
              />
            </div>

            <div className="flex items-end">
              <Button
                onClick={handleSearch}
                className="w-full h-11 bg-gradient-primary hover:shadow-glow transition-all duration-300 hover:scale-105 font-bold"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Buscando...
                  </>
                ) : (
                  <>
                    <Calendar className="mr-2 h-4 w-4" />
                    Buscar
                  </>
                )}
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {services.length > 0 && (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="p-6 glass-effect hover-lift">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-full">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-semibold">Total de Serviços</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6 glass-effect hover-lift">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-accent/10 rounded-full">
                  <DollarSign className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-semibold">Faturamento</p>
                  <p className="text-2xl font-bold">R$ {stats.revenue.toFixed(2)}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6 glass-effect hover-lift">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-destructive/10 rounded-full">
                  <Receipt className="h-6 w-6 text-destructive" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-semibold">Despesas</p>
                  <p className="text-2xl font-bold">R$ {stats.totalExpenses.toFixed(2)}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6 glass-effect hover-lift">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-status-success/10 rounded-full">
                  <Sparkles className="h-6 w-6 text-status-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-semibold">Lucro</p>
                  <p className="text-2xl font-bold">R$ {stats.profit.toFixed(2)}</p>
                </div>
              </div>
            </Card>
          </div>

          <Card className="p-6 bg-gradient-accent text-accent-foreground glass-effect">
            <div className="space-y-2">
              <p className="text-sm font-semibold opacity-90 uppercase tracking-wider">Comissão do Sócio (25% do Faturamento)</p>
              <p className="text-4xl font-bold">R$ {stats.partnerCommission.toFixed(2)}</p>
            </div>
          </Card>

          <Card className="overflow-hidden glass-effect">
            <h3 className="text-xl font-bold p-6 border-b border-border/50 bg-gradient-card">Serviços</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-bold">Data</th>
                    <th className="px-6 py-4 text-left text-sm font-bold">Cliente</th>
                    <th className="px-6 py-4 text-left text-sm font-bold">Placa</th>
                    <th className="px-6 py-4 text-left text-sm font-bold">Serviço</th>
                    <th className="px-6 py-4 text-left text-sm font-bold">Valor</th>
                    <th className="px-6 py-4 text-left text-sm font-bold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {services.map((service) => (
                    <tr key={service.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium">
                        {format(new Date(service.date_yyyymmdd), "dd/MM/yyyy")}
                      </td>
                      <td className="px-6 py-4 text-sm">{service.client_name}</td>
                      <td className="px-6 py-4 text-sm font-mono font-bold">{service.car_plate}</td>
                      <td className="px-6 py-4 text-sm">{service.service_name}</td>
                      <td className="px-6 py-4 text-sm font-bold text-accent">
                        R$ {service.value.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <Badge
                          className={
                            service.status === "finalizado"
                              ? "bg-status-success/20 text-status-success border border-status-success/30"
                              : "bg-status-pending/20 text-status-pending border border-status-pending/30"
                          }
                        >
                          {service.status === "finalizado" ? "Finalizado" : "Pendente"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {expenses.length > 0 && (
            <Card className="overflow-hidden glass-effect">
              <h3 className="text-xl font-bold p-6 border-b border-border/50 bg-gradient-card">Despesas Pagas</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-bold">Data Pagamento</th>
                      <th className="px-6 py-4 text-left text-sm font-bold">Tipo</th>
                      <th className="px-6 py-4 text-left text-sm font-bold">Categoria</th>
                      <th className="px-6 py-4 text-left text-sm font-bold">Valor</th>
                      <th className="px-6 py-4 text-left text-sm font-bold">Descrição</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {expenses.map((expense) => (
                      <tr key={expense.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium">
                          {format(new Date(expense.paid_at), "dd/MM/yyyy")}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {expense.is_recurring ? "Recorrente" : "Adicional"}
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold">
                          {expense.category || expense.expense_name}
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-destructive">
                          R$ {expense.amount_paid.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {expense.description || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default HistoryPanel;
