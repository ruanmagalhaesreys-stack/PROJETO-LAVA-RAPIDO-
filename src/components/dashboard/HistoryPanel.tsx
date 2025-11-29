import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Calendar, TrendingUp } from "lucide-react";
import { format } from "date-fns";

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
}

const HistoryPanel = ({ userId }: HistoryPanelProps) => {
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [services, setServices] = useState<Service[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    revenue: 0,
    totalExpenses: 0,
    profit: 0,
    partnerCommission: 0,
  });

  const handleSearch = async () => {
    if (!startDate || !endDate) {
      toast.error("Por favor, selecione as datas");
      return;
    }

    setLoading(true);
    try {
      // Fetch services
      const { data: servicesData, error: servicesError } = await supabase
        .from("daily_services")
        .select("*")
        .eq("user_id", userId)
        .gte("date_yyyymmdd", startDate)
        .lte("date_yyyymmdd", endDate)
        .order("date_yyyymmdd", { ascending: false })
        .order("created_at", { ascending: false });

      if (servicesError) throw servicesError;

      // Fetch paid expenses in the date range
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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Calendar className="h-8 w-8 text-accent" />
        <div>
          <h2 className="text-2xl font-bold">Histórico de Serviços</h2>
          <p className="text-muted-foreground">
            Consulte serviços prestados por período
          </p>
        </div>
      </div>

      <Card className="p-6">
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <Label htmlFor="startDate">Data Início</Label>
            <Input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="endDate">Data Fim</Label>
            <Input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          <div className="flex items-end">
            <Button
              onClick={handleSearch}
              className="w-full bg-accent hover:bg-accent/90"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Buscando...
                </>
              ) : (
                "Buscar"
              )}
            </Button>
          </div>
        </div>
      </Card>

      {services.length > 0 && (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-full">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total de Serviços</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-accent/10 rounded-full">
                  <TrendingUp className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Faturamento</p>
                  <p className="text-2xl font-bold">R$ {stats.revenue.toFixed(2)}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-destructive/10 rounded-full">
                  <TrendingUp className="h-6 w-6 text-destructive" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Despesas</p>
                  <p className="text-2xl font-bold">R$ {stats.totalExpenses.toFixed(2)}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-status-ready/10 rounded-full">
                  <TrendingUp className="h-6 w-6 text-status-ready" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Lucro</p>
                  <p className="text-2xl font-bold">R$ {stats.profit.toFixed(2)}</p>
                </div>
              </div>
            </Card>
          </div>

          <Card className="p-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Comissão do Sócio (25% do Faturamento)</p>
              <p className="text-3xl font-bold text-primary">R$ {stats.partnerCommission.toFixed(2)}</p>
            </div>
          </Card>

          <Card className="overflow-hidden">
            <h3 className="text-lg font-semibold p-4 border-b">Serviços</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium">Data</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Cliente</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Placa</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Serviço</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Valor</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {services.map((service) => (
                    <tr key={service.id} className="hover:bg-muted/50">
                      <td className="px-4 py-3 text-sm">
                        {format(new Date(service.date_yyyymmdd), "dd/MM/yyyy")}
                      </td>
                      <td className="px-4 py-3 text-sm">{service.client_name}</td>
                      <td className="px-4 py-3 text-sm font-mono">{service.car_plate}</td>
                      <td className="px-4 py-3 text-sm">{service.service_name}</td>
                      <td className="px-4 py-3 text-sm font-medium">
                        R$ {service.value.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <Badge
                          className={
                            service.status === "finalizado"
                              ? "bg-status-ready"
                              : "bg-status-pending"
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
            <Card className="overflow-hidden">
              <h3 className="text-lg font-semibold p-4 border-b">Despesas Pagas</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium">Data Pagamento</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Tipo</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Valor</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Descrição</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {expenses.map((expense) => (
                      <tr key={expense.id} className="hover:bg-muted/50">
                        <td className="px-4 py-3 text-sm">
                          {format(new Date(expense.paid_at), "dd/MM/yyyy")}
                        </td>
                        <td className="px-4 py-3 text-sm">{expense.expense_name}</td>
                        <td className="px-4 py-3 text-sm font-medium">
                          R$ {expense.amount_paid.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-sm">
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