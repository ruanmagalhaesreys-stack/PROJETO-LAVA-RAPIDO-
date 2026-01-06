import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Phone, Car, User, Trash2, AlertTriangle, Loader2 } from "lucide-react";

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
  created_by_name?: string;
  finished_by_name?: string;
}

interface ServiceDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: Service | null;
  onServiceDeleted: () => void;
}

const ServiceDetailsModal = ({
  open,
  onOpenChange,
  service,
  onServiceDeleted,
}: ServiceDetailsModalProps) => {
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!service) return null;

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }

    setDeleting(true);
    try {
      const { error } = await supabase
        .from("daily_services")
        .delete()
        .eq("id", service.id);

      if (error) throw error;

      toast.success(
        service.status === "finalizado"
          ? "Serviço excluído do histórico"
          : "Serviço cancelado com sucesso"
      );
      onOpenChange(false);
      onServiceDeleted();
    } catch (error) {
      console.error("Error deleting service:", error);
      toast.error("Erro ao excluir serviço");
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  const handleClose = () => {
    setConfirmDelete(false);
    onOpenChange(false);
  };

  const formatPhone = (phone: string) => {
    // Format phone for WhatsApp link
    const cleaned = phone.replace(/\D/g, "");
    return cleaned;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Car className="h-5 w-5 text-primary" />
            Detalhes do Serviço
          </DialogTitle>
          <DialogDescription>
            Informações completas do serviço
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status Badge */}
          <div className="flex justify-center">
            <Badge
              className={`text-sm px-4 py-2 ${
                service.status === "finalizado"
                  ? "bg-status-success/20 text-status-success border border-status-success/30"
                  : "bg-status-pending/20 text-status-pending border border-status-pending/30"
              }`}
            >
              {service.status === "finalizado" ? "✓ FINALIZADO" : "⏳ EM LAVAGEM"}
            </Badge>
          </div>

          {/* Client Info */}
          <div className="bg-secondary/30 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Cliente</p>
                <p className="font-bold">{service.client_name}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Telefone</p>
                <p className="font-bold">{service.client_phone}</p>
              </div>
              <a
                href={`https://wa.me/55${formatPhone(service.client_phone)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-status-success text-white px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-status-success/80 transition-colors"
              >
                WhatsApp
              </a>
            </div>
          </div>

          {/* Vehicle Info */}
          <div className="bg-secondary/30 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-3">
              <Car className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Veículo</p>
                <p className="font-bold">
                  {service.car_make_model}
                  {service.car_color && ` - ${service.car_color}`}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Placa</span>
              <span className="font-mono font-bold text-lg">{service.car_plate}</span>
            </div>
            {service.vehicle_type && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Tipo</span>
                <Badge variant="outline" className="font-bold">
                  {service.vehicle_type}
                </Badge>
              </div>
            )}
          </div>

          {/* Service Info */}
          <div className="bg-secondary/30 rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Serviço</span>
              <span className="font-bold">{service.service_name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Valor</span>
              <span className="font-bold text-xl text-accent">
                R$ {service.value.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Audit Trail */}
          {(service.created_by_name || service.finished_by_name) && (
            <div className="text-xs text-muted-foreground text-center space-y-1">
              {service.created_by_name && (
                <p>Aberto por: {service.created_by_name}</p>
              )}
              {service.finished_by_name && (
                <p>Finalizado por: {service.finished_by_name}</p>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          {confirmDelete ? (
            <div className="w-full space-y-3">
              <div className="flex items-center gap-2 text-destructive bg-destructive/10 p-3 rounded-lg">
                <AlertTriangle className="h-5 w-5" />
                <span className="text-sm font-medium">
                  {service.status === "finalizado"
                    ? "Isso também removerá do relatório financeiro!"
                    : "Tem certeza que deseja cancelar este serviço?"}
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setConfirmDelete(false)}
                  className="flex-1"
                >
                  Voltar
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1"
                >
                  {deleting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Confirmar
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="destructive"
              onClick={handleDelete}
              className="w-full"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {service.status === "finalizado" ? "Excluir Serviço" : "Cancelar Serviço"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ServiceDetailsModal;
