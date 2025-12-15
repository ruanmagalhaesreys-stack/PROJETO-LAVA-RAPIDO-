import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CheckCircle, Clock, RefreshCw, Car } from "lucide-react";
import { getTodayBrazil } from "@/lib/dateUtils";

interface Service {
  id: string;
  client_name: string;
  client_phone: string;
  car_plate: string;
  car_make_model: string;
  car_color: string;
  service_name: string;
  vehicle_type: string | null;
  value: number;
  status: string;
  created_at: string;
  created_by_member_id: string | null;
  finished_by_member_id: string | null;
  created_by_name?: string;
  finished_by_name?: string;
}

interface ServiceQueueProps {
  userId: string;
  refreshTrigger: number;
  onRefresh: () => void;
}

const ServiceQueue = ({ userId, refreshTrigger, onRefresh }: ServiceQueueProps) => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeDate, setActiveDate] = useState<string | null>(null);
  const [businessId, setBusinessId] = useState<string | null>(null);

  useEffect(() => {
    initializeAndFetch();
  }, [userId, refreshTrigger]);

  // Set up realtime subscription for services
  useEffect(() => {
    if (!businessId || !activeDate) return;

    const channel = supabase
      .channel('services-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'daily_services',
          filter: `business_id=eq.${businessId}`
        },
        () => {
          // Refetch when any change happens
          fetchServices(businessId, activeDate);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [businessId, activeDate]);

  const initializeAndFetch = async () => {
    try {
      // Get business_id
      const { data: bizId } = await supabase.rpc('get_user_business_id');
      if (!bizId) {
        setLoading(false);
        return;
      }
      setBusinessId(bizId);

      // Get or create the active day for this business
      const today = getTodayBrazil();
      
      const { data: dayState, error: dayError } = await supabase
        .from("business_day_state")
        .select("active_date_yyyymmdd")
        .eq("business_id", bizId)
        .maybeSingle();

      if (dayError) throw dayError;

      let currentActiveDate: string;
      
      if (!dayState) {
        // First time - create the day state with today's date
        const { error: insertError } = await supabase
          .from("business_day_state")
          .insert({
            business_id: bizId,
            active_date_yyyymmdd: today
          });
        
        if (insertError) throw insertError;
        currentActiveDate = today;
      } else {
        currentActiveDate = dayState.active_date_yyyymmdd;
      }

      setActiveDate(currentActiveDate);
      await fetchServices(bizId, currentActiveDate);
    } catch (error) {
      console.error("Error initializing:", error);
      toast.error("Erro ao carregar serviços");
      setLoading(false);
    }
  };

  const fetchServices = async (bizId: string, date: string) => {
    try {
      const { data, error } = await supabase
        .from("daily_services")
        .select("*")
        .eq("business_id", bizId)
        .eq("date_yyyymmdd", date)
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Fetch member names for audit trail
      const servicesWithNames = await Promise.all(
        (data || []).map(async (service) => {
          let created_by_name = null;
          let finished_by_name = null;

          if (service.created_by_member_id) {
            const { data: createdBy } = await supabase.rpc('get_member_name', {
              member_id: service.created_by_member_id
            });
            created_by_name = createdBy;
          }

          if (service.finished_by_member_id) {
            const { data: finishedBy } = await supabase.rpc('get_member_name', {
              member_id: service.finished_by_member_id
            });
            finished_by_name = finishedBy;
          }

          return {
            ...service,
            created_by_name,
            finished_by_name,
          };
        })
      );

      setServices(servicesWithNames);
    } catch (error) {
      console.error("Error fetching services:", error);
      toast.error("Erro ao carregar serviços");
    } finally {
      setLoading(false);
    }
  };

  const handleFinishService = async (service: Service) => {
    try {
      // Get current user's member_id
      const { data: memberData } = await supabase
        .from("business_members")
        .select("id")
        .eq("user_id", userId)
        .single();

      const { error } = await supabase
        .from("daily_services")
        .update({ 
          status: "finalizado",
          finished_by_member_id: memberData?.id 
        })
        .eq("id", service.id);

      if (error) throw error;

      toast.success("Serviço finalizado!");
      onRefresh();
    } catch (error) {
      console.error("Error finishing service:", error);
      toast.error("Erro ao finalizar serviço");
    }
  };

  const handleNewDay = async () => {
    if (!businessId) return;
    
    try {
      const today = getTodayBrazil();
      
      // Update the active date to today
      const { error } = await supabase
        .from("business_day_state")
        .update({ active_date_yyyymmdd: today })
        .eq("business_id", businessId);

      if (error) throw error;

      setActiveDate(today);
      toast.success("Novo dia iniciado!");
      onRefresh();
    } catch (error) {
      console.error("Error starting new day:", error);
      toast.error("Erro ao iniciar novo dia");
    }
  };

  const hasPendingServices = services.some(s => s.status === "pendente");

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-3 flex-wrap items-center">
        <Button
          onClick={handleNewDay}
          variant="outline"
          disabled={hasPendingServices}
          className={`border-2 transition-all duration-300 font-semibold ${
            hasPendingServices 
              ? "opacity-50" 
              : "hover:bg-primary/10 hover:border-primary hover:text-primary"
          }`}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Novo Dia
        </Button>
        
        {hasPendingServices && (
          <p className="text-sm text-muted-foreground flex items-center font-medium">
            Finalize todos os serviços pendentes para iniciar um novo dia
          </p>
        )}

        {activeDate && (
          <Badge variant="outline" className="ml-auto font-mono">
            📅 {activeDate}
          </Badge>
        )}
      </div>

      {services.length === 0 ? (
        <Card className="p-16 text-center glass-effect hover-lift">
          <Clock className="h-20 w-20 mx-auto mb-6 text-muted-foreground opacity-50" />
          <h3 className="text-2xl font-bold mb-3">Nenhum serviço hoje</h3>
          <p className="text-muted-foreground text-lg">
            Adicione o primeiro serviço do dia
          </p>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <Card key={service.id} className="glass-effect hover-lift overflow-hidden border-l-4 border-l-primary">
              <div className="p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <Badge
                    className={`font-bold px-3 py-1 ${
                      service.status === "finalizado"
                        ? "bg-status-success/20 text-status-success border border-status-success/30"
                        : "bg-status-pending/20 text-status-pending border border-status-pending/30"
                    }`}
                  >
                    {service.status === "finalizado" ? "✓ PRONTO" : "⏳ EM LAVAGEM"}
                  </Badge>
                  {service.vehicle_type && (
                    <Badge className="font-bold px-3 py-1 bg-primary/20 text-primary border border-primary/30">
                      {service.vehicle_type}
                    </Badge>
                  )}
                </div>

                <div className="flex items-start gap-3">
                  <div className="bg-gradient-primary p-3 rounded-xl">
                    <Car className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg leading-tight">
                      {service.car_make_model}
                    </h3>
                    {service.car_color && (
                      <p className="text-sm text-muted-foreground font-medium">
                        {service.car_color}
                      </p>
                    )}
                    <p className="text-sm text-foreground/80 font-medium mt-1">
                      {service.client_name} • {service.car_plate}
                    </p>
                  </div>
                </div>

                <div className="h-px bg-border/50"></div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-muted-foreground">📋 Serviço</span>
                    <span className="text-sm font-bold">{service.service_name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-muted-foreground">💰 Valor</span>
                    <span className="text-lg font-bold text-accent">R$ {service.value.toFixed(2)}</span>
                  </div>
                </div>

                {(service.created_by_name || service.finished_by_name) && (
                  <div className="bg-secondary/30 px-3 py-2 rounded-lg border border-border/30">
                    <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                      👤 {service.created_by_name && `Aberto por: ${service.created_by_name}`}
                      {service.created_by_name && service.finished_by_name && " • "}
                      {service.finished_by_name && `Finalizado por: ${service.finished_by_name}`}
                    </p>
                  </div>
                )}

                {service.status === "pendente" && (
                  <Button
                    onClick={() => handleFinishService(service)}
                    className="w-full bg-gradient-success hover:shadow-success transition-all duration-300 hover:scale-105 font-bold"
                  >
                    <CheckCircle className="h-5 w-5 mr-2" />
                    FINALIZAR SERVIÇO
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ServiceQueue;
