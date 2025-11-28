import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { LogOut, Plus } from "lucide-react";
import ServiceQueue from "@/components/dashboard/ServiceQueue";
import AddServiceModal from "@/components/dashboard/AddServiceModal";
import AdminPanel from "@/components/dashboard/AdminPanel";
import HistoryPanel from "@/components/dashboard/HistoryPanel";
const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  useEffect(() => {
    checkUser();
  }, []);
  const checkUser = async () => {
    try {
      const {
        data: {
          session
        }
      } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUserId(session.user.id);

      // Initialize default prices if not exists
      const {
        error: initError
      } = await supabase.rpc('initialize_service_prices', {
        p_user_id: session.user.id
      });
      if (initError) {
        console.error("Error initializing prices:", initError);
      }
      setLoading(false);
    } catch (error) {
      console.error("Error checking user:", error);
      navigate("/auth");
    }
  };
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Logout realizado com sucesso!");
      navigate("/auth");
    } catch (error) {
      toast.error("Erro ao fazer logout");
    }
  };
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>;
  }
  return <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground shadow-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-normal">Lava Rápido Inglaterra</h1>
          <Button variant="ghost" onClick={handleLogout} className="text-primary-foreground hover:bg-primary-foreground/10">
            <LogOut className="h-5 w-5 mr-2" />
            Sair
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="history">Histórico</TabsTrigger>
            <TabsTrigger value="admin">Admin</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-foreground">Serviços de Hoje</h2>
              <Button onClick={() => setShowAddModal(true)} className="bg-accent hover:bg-accent/90">
                <Plus className="h-5 w-5 mr-2" />
                Novo Serviço
              </Button>
            </div>
            
            <ServiceQueue userId={userId!} refreshTrigger={refreshTrigger} onRefresh={() => setRefreshTrigger(prev => prev + 1)} />
          </TabsContent>

          <TabsContent value="history">
            <HistoryPanel userId={userId!} />
          </TabsContent>

          <TabsContent value="admin">
            <AdminPanel userId={userId!} />
          </TabsContent>
        </Tabs>
      </main>

      <AddServiceModal open={showAddModal} onOpenChange={setShowAddModal} userId={userId!} onSuccess={() => {
      setRefreshTrigger(prev => prev + 1);
      setShowAddModal(false);
    }} />
    </div>;
};
export default Dashboard;