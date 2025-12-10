import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { LogOut, Plus, Wind } from "lucide-react";
import { format } from "date-fns";
import ServiceQueue from "@/components/dashboard/ServiceQueue";
import AddServiceModal from "@/components/dashboard/AddServiceModal";
import AdminPanel from "@/components/dashboard/AdminPanel";
import HistoryPanel from "@/components/dashboard/HistoryPanel";
import ExpensesPanel from "@/components/dashboard/ExpensesPanel";

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<'owner' | 'partner'>('owner');
  const [showAddModal, setShowAddModal] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!session) {
          navigate("/setup");
        } else if (event === 'SIGNED_IN') {
          // Defer to avoid deadlock
          setTimeout(() => {
            checkUserBusiness(session.user.id);
          }, 0);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/setup");
      } else {
        checkUserBusiness(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const checkUserBusiness = async (uid: string) => {
    try {
      setUserId(uid);

      // Check if user has a business
      const { data: businessId } = await supabase.rpc('get_user_business_id');
      
      if (!businessId) {
        // User not associated with any business, redirect to setup
        navigate("/setup");
        return;
      }

      // Get user role
      const { data: roleData } = await supabase.rpc('get_user_role');
      if (roleData) {
        setUserRole(roleData as 'owner' | 'partner');
      }

      // Check for expense reminders
      await checkExpenseReminders(uid);
      setLoading(false);
    } catch (error) {
      console.error("Error checking user:", error);
      navigate("/setup");
    }
  };

  const checkExpenseReminders = async (userId: string) => {
    try {
      const today = new Date();
      const todayStr = format(today, "yyyy-MM-dd");
      const currentDay = today.getDate();
      
      // RLS will filter by business_id automatically
      const { data: expenseTypes, error: typesError } = await supabase
        .from("expense_types")
        .select("*");
      
      if (typesError) throw typesError;
      
      const currentMonthYear = format(today, "yyyy-MM");
      const { data: expenses, error: expensesError } = await supabase
        .from("expenses")
        .select("*")
        .eq("status", "pendente")
        .eq("month_year", currentMonthYear);
      
      if (expensesError) throw expensesError;
      
      for (const expense of expenses || []) {
        const expenseType = expenseTypes?.find(et => et.id === expense.expense_type_id);
        if (expenseType && currentDay === expenseType.due_day) {
          const { data: existingReminder } = await supabase
            .from("expense_reminders")
            .select("*")
            .eq("expense_id", expense.id)
            .eq("shown_date", todayStr)
            .maybeSingle();
          
          if (!existingReminder) {
            toast.error(`⚠️ Lembrete de Pagamento: Hoje é o dia limite para pagar ${expense.expense_name}!`, {
              duration: 10000
            });
            
            // Get business_id for insert
            const { data: businessId } = await supabase.rpc('get_user_business_id');
            
            await supabase.from("expense_reminders").insert({
              user_id: userId,
              business_id: businessId,
              expense_id: expense.id,
              shown_date: todayStr
            });
          }
        }
      }
    } catch (error) {
      console.error("Error checking expense reminders:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Logout realizado com sucesso!");
      navigate("/setup");
    } catch (error) {
      toast.error("Erro ao fazer logout");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-gradient-header border-b border-border/50 shadow-card backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-primary rounded-lg blur-lg opacity-50"></div>
                <div className="relative bg-gradient-primary p-2 rounded-lg">
                  <Wind className="h-7 w-7 text-primary-foreground" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                  Lava Rápido Inglaterra
                </h1>
                <p className="text-xs text-muted-foreground font-medium">Sistema Premium de Gerenciamento</p>
              </div>
            </div>
            <Button variant="ghost" onClick={handleLogout} className="text-foreground hover:bg-secondary/50 hover:text-accent transition-all">
              <LogOut className="h-5 w-5 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="dashboard" className="space-y-8">
          <TabsList className={`grid w-full ${userRole === 'owner' ? 'grid-cols-4' : 'grid-cols-3'} max-w-3xl mx-auto h-14 bg-card/50 backdrop-blur-sm p-1 rounded-xl`}>
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-gradient-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-glow transition-all font-semibold rounded-lg">
              📋 Entradas
            </TabsTrigger>
            <TabsTrigger value="expenses" className="data-[state=active]:bg-gradient-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-glow transition-all font-semibold rounded-lg">
              💰 Despesas
            </TabsTrigger>
            {userRole === 'owner' && (
              <TabsTrigger value="history" className="data-[state=active]:bg-gradient-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-glow transition-all font-semibold rounded-lg">
                📊 Histórico
              </TabsTrigger>
            )}
            <TabsTrigger value="admin" className="data-[state=active]:bg-gradient-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-glow transition-all font-semibold rounded-lg">
              ⚙️ {userRole === 'owner' ? 'Admin' : 'Conexão'}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-bold text-foreground">Serviços de Hoje</h2>
              <Button onClick={() => setShowAddModal(true)} className="bg-gradient-accent hover:shadow-accent transition-all duration-300 hover:scale-105 font-bold">
                <Plus className="h-5 w-5 mr-2" />
                Novo Serviço
              </Button>
            </div>
            
            <ServiceQueue userId={userId!} refreshTrigger={refreshTrigger} onRefresh={() => setRefreshTrigger(prev => prev + 1)} />
          </TabsContent>

          <TabsContent value="expenses" className="animate-fade-in">
            <ExpensesPanel userId={userId!} />
          </TabsContent>

          {userRole === 'owner' && (
            <TabsContent value="history" className="animate-fade-in">
              <HistoryPanel userId={userId!} />
            </TabsContent>
          )}

          <TabsContent value="admin" className="animate-fade-in">
            <AdminPanel userId={userId!} userRole={userRole} />
          </TabsContent>
        </Tabs>
      </main>

      <AddServiceModal 
        open={showAddModal} 
        onOpenChange={setShowAddModal} 
        userId={userId!} 
        onSuccess={() => {
          setRefreshTrigger(prev => prev + 1);
          setShowAddModal(false);
        }} 
      />
    </div>
  );
};

export default Dashboard;