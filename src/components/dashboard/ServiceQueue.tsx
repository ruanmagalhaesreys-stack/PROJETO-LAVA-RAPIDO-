import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CheckCircle, Clock, MessageCircle, RefreshCw, Car, Sparkles } from "lucide-react";
import { format } from "date-fns";

interface Service {
  id: string;
  client_name: string;
  client_phone: string;
  car_plate: string;
  car_make_model: string;
  car_color: string;
  service_name: string;
  value: number;
  status: string;
  created_at: string;
}

interface ServiceQueueProps {
  userId: string;
  refreshTrigger: number;
  onRefresh: () => void;
}

const ServiceQueue = ({ userId, refreshTrigger, onRefresh }: ServiceQueueProps) => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchServices();
  }, [userId, refreshTrigger]);

  const fetchServices = async () => {
    try {
      const today = format(new Date(), "yyyy-MM-dd");
      
      const { data, error } = await supabase
        .from("daily_services")
        .select("*")
        .eq("user_id", userId)
        .eq("date_yyyymmdd", today)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error("Error fetching services:", error);
      toast.error("Erro ao carregar serviços");
    } finally {
      setLoading(false);
    }
  };

  const handleFinishService = async (service: Service) => {
    try {
      const { error } = await supabase
        .from("daily_services")
        .update({ status: "finalizado" })
        .eq("id", service.id);

      if (error) throw error;

      const phone = service.client_phone.replace(/\D/g, "");
      const message = encodeURIComponent(
        "Olá! O serviço no seu carro está finalizado e ele está pronto para a retirada no Lava Rápido Inglaterra. Até breve!"
      );
      window.open(`https://wa.me/${phone}?text=${message}`, "_blank");

      toast.success("Serviço finalizado!");
      onRefresh();
    } catch (error) {
      console.error("Error finishing service:", error);
      toast.error("Erro ao finalizar serviço");
    }
  };

  const handleSendReminders = async () => {
    const finishedServices = services.filter(s => s.status === "finalizado");
    
    if (finishedServices.length === 0) {
      toast.info("Não há serviços finalizados para enviar lembretes");
      return;
    }

    finishedServices.forEach(service => {
      const phone = service.client_phone.replace(/\D/g, "");
      const message = encodeURIComponent(
        "Olá, estamos quase fechando! Pedimos que, caso você ainda não tenha buscado seu carro, se dirija ao Lava Rápido Inglaterra antes das 18:00. Obrigado!"
      );
      window.open(`https://wa.me/${phone}?text=${message}`, "_blank");
    });

    toast.success(`Lembretes enviados para ${finishedServices.length} cliente(s)!`);
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
      <div className="flex gap-3 flex-wrap">
        <Button
          onClick={handleSendReminders}
          className="bg-accent/10 text-accent border-2 border-accent/30 hover:bg-accent hover:text-accent-foreground hover:shadow-accent transition-all duration-300 font-semibold"
        >
          <MessageCircle className="h-4 w-4 mr-2" />
          Gerar Lembretes (17:40)
        </Button>
        
        <Button
          onClick={onRefresh}
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
