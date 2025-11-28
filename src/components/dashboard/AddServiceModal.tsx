import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Search, Loader2 } from "lucide-react";
import { format } from "date-fns";

interface AddServiceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  onSuccess: () => void;
}

interface Client {
  id: string;
  client_name: string;
  client_phone: string;
  car_make_model: string;
  car_plate: string;
}

interface ServicePrice {
  service_name: string;
  price: number;
}

const AddServiceModal = ({ open, onOpenChange, userId, onSuccess }: AddServiceModalProps) => {
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [foundClient, setFoundClient] = useState<Client | null>(null);
  const [servicePrices, setServicePrices] = useState<ServicePrice[]>([]);
  
  const [formData, setFormData] = useState({
    clientName: "",
    clientPhone: "",
    carMakeModel: "",
    carPlate: "",
    serviceName: "",
    value: "",
  });

  useEffect(() => {
    if (open) {
      fetchServicePrices();
      resetForm();
    }
  }, [open, userId]);

  const fetchServicePrices = async () => {
    try {
      const { data, error } = await supabase
        .from("service_prices")
        .select("service_name, price")
        .eq("user_id", userId);

      if (error) throw error;
      setServicePrices(data || []);
    } catch (error) {
      console.error("Error fetching prices:", error);
    }
  };

  const searchClient = async () => {
    if (!searchTerm) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("user_id", userId)
        .or(`client_name.ilike.%${searchTerm}%,client_phone.ilike.%${searchTerm}%`)
        .limit(1)
        .single();

      if (data) {
        setFoundClient(data);
        setFormData({
          clientName: data.client_name,
          clientPhone: data.client_phone,
          carMakeModel: data.car_make_model,
          carPlate: data.car_plate,
          serviceName: "",
          value: "",
        });
        toast.success("Cliente encontrado!");
      } else {
        toast.info("Cliente não encontrado. Preencha os dados.");
        setFoundClient(null);
      }
    } catch (error) {
      console.error("Error searching client:", error);
      toast.info("Cliente não encontrado. Preencha os dados.");
      setFoundClient(null);
    } finally {
      setLoading(false);
    }
  };

  const handleServiceChange = (serviceName: string) => {
    const service = servicePrices.find((s) => s.service_name === serviceName);
    setFormData((prev) => ({
      ...prev,
      serviceName,
      value: service ? service.price.toFixed(2) : "",
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Upsert client
      let clientId = foundClient?.id;

      if (!clientId) {
        const { data: newClient, error: clientError } = await supabase
          .from("clients")
          .insert({
            user_id: userId,
            client_name: formData.clientName,
            client_phone: formData.clientPhone,
            car_make_model: formData.carMakeModel,
            car_plate: formData.carPlate.toUpperCase(),
          })
          .select()
          .single();

        if (clientError) throw clientError;
        clientId = newClient.id;
      } else {
        await supabase
          .from("clients")
          .update({
            car_make_model: formData.carMakeModel,
            car_plate: formData.carPlate.toUpperCase(),
          })
          .eq("id", clientId);
      }

      // Insert service
      const { error: serviceError } = await supabase
        .from("daily_services")
        .insert({
          user_id: userId,
          client_id: clientId,
          client_name: formData.clientName,
          client_phone: formData.clientPhone,
          car_plate: formData.carPlate.toUpperCase(),
          service_name: formData.serviceName,
          value: parseFloat(formData.value),
          status: "pendente",
          date_yyyymmdd: format(new Date(), "yyyy-MM-dd"),
        });

      if (serviceError) throw serviceError;

      toast.success("Serviço adicionado com sucesso!");
      onSuccess();
    } catch (error: any) {
      console.error("Error adding service:", error);
      toast.error(error.message || "Erro ao adicionar serviço");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSearchTerm("");
    setFoundClient(null);
    setFormData({
      clientName: "",
      clientPhone: "",
      carMakeModel: "",
      carPlate: "",
      serviceName: "",
      value: "",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionar Novo Serviço</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Buscar por nome ou telefone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && searchClient()}
            />
            <Button onClick={searchClient} disabled={loading} variant="outline">
              <Search className="h-4 w-4" />
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="clientName">Nome Completo *</Label>
                <Input
                  id="clientName"
                  value={formData.clientName}
                  onChange={(e) =>
                    setFormData({ ...formData, clientName: e.target.value })
                  }
                  required
                  disabled={!!foundClient}
                />
              </div>

              <div>
                <Label htmlFor="clientPhone">Telefone (apenas números) *</Label>
                <Input
                  id="clientPhone"
                  value={formData.clientPhone}
                  onChange={(e) =>
                    setFormData({ ...formData, clientPhone: e.target.value.replace(/\D/g, "") })
                  }
                  required
                  disabled={!!foundClient}
                  placeholder="5511999999999"
                />
              </div>

              <div>
                <Label htmlFor="carMakeModel">Marca e Modelo *</Label>
                <Input
                  id="carMakeModel"
                  value={formData.carMakeModel}
                  onChange={(e) =>
                    setFormData({ ...formData, carMakeModel: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <Label htmlFor="carPlate">Placa *</Label>
                <Input
                  id="carPlate"
                  value={formData.carPlate}
                  onChange={(e) =>
                    setFormData({ ...formData, carPlate: e.target.value.toUpperCase() })
                  }
                  required
                  maxLength={7}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="serviceName">Serviço *</Label>
              <Select
                value={formData.serviceName}
                onValueChange={handleServiceChange}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o serviço" />
                </SelectTrigger>
                <SelectContent>
                  {servicePrices.map((service) => (
                    <SelectItem key={service.service_name} value={service.service_name}>
                      {service.service_name} - R$ {service.price.toFixed(2)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="value">Valor do Serviço *</Label>
              <Input
                id="value"
                type="number"
                step="0.01"
                value={formData.value}
                readOnly
                className="bg-muted"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-accent hover:bg-accent/90"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adicionando...
                </>
              ) : (
                "Adicionar Serviço"
              )}
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddServiceModal;