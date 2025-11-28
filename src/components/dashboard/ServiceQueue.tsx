import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CheckCircle, Clock, MessageCircle, RefreshCw } from "lucide-react";
import { format } from "date-fns";

interface Service {
  id: string;
  client_name: string;
  client_phone: string;
  car_plate: string;
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

      // Open WhatsApp with message
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
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        <Button
          onClick={handleSendReminders}
          variant="outline"
          className="border-accent text-accent hover:bg-accent/10"
        >
          <MessageCircle className="h-4 w-4 mr-2" />
          Gerar Lembretes (17:40)
        </Button>
        
        <Button
          onClick={onRefresh}
          variant="outline"
          disabled={hasPendingServices}
          className={hasPendingServices ? "opacity-50" : ""}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Novo Dia
        </Button>
        
        {hasPendingServices && (
          <p className="text-sm text-muted-foreground flex items-center">
            Finalize todos os serviços pendentes para iniciar um novo dia
          </p>
        )}
      </div>

      {services.length === 0 ? (
        <Card className="p-12 text-center">
          <Clock className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl font-semibold mb-2">Nenhum serviço hoje</h3>
          <p className="text-muted-foreground">
            Adicione o primeiro serviço do dia
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <Card key={service.id} className="p-6 shadow-card hover:shadow-hover transition-shadow">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">{service.client_name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {service.car_plate}
                    </p>
                  </div>
                  <Badge
                    className={
                      service.status === "finalizado"
                        ? "bg-status-ready text-white"
                        : "bg-status-pending text-white"
                    }
                  >
                    {service.status === "finalizado" ? "PRONTO" : "EM LAVAGEM"}
                  </Badge>
                </div>

                <div className="space-y-1">
                  <p className="text-sm">
                    <span className="font-medium">Serviço:</span> {service.service_name}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Valor:</span> R$ {service.value.toFixed(2)}
                  </p>
                </div>

                {service.status === "pendente" && (
                  <Button
                    onClick={() => handleFinishService(service)}
                    className="w-full bg-accent hover:bg-accent/90"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Finalizar Serviço
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