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
import { Search, Loader2, Sparkles, UserPlus } from "lucide-react";
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
  car_color: string;
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
    carColor: "",
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
          carColor: data.car_color || "",
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
            car_color: formData.carColor,
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
            car_color: formData.carColor,
          })
          .eq("id", clientId);
      }

      const { error: serviceError } = await supabase
        .from("daily_services")
        .insert({
          user_id: userId,
          client_id: clientId,
          client_name: formData.clientName,
          client_phone: formData.clientPhone,
          car_plate: formData.carPlate.toUpperCase(),
          car_make_model: formData.carMakeModel,
          car_color: formData.carColor,
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
      carColor: "",
      serviceName: "",
      value: "",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto glass-effect border-2 border-border/50">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-accent" />
            Adicionar Novo Serviço
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex gap-2">
            <Input
              placeholder="🔍 Buscar por nome ou telefone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && searchClient()}
              className="h-12 bg-secondary/50 font-medium"
            />
            <Button onClick={searchClient} disabled={loading} className="bg-primary hover:bg-primary/90 h-12 px-6">
              <Search className="h-5 w-5" />
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <Label htmlFor="clientName" className="font-semibold text-base">Nome Completo *</Label>
                <Input
                  id="clientName"
                  value={formData.clientName}
                  onChange={(e) =>
                    setFormData({ ...formData, clientName: e.target.value })
                  }
                  required
                  disabled={!!foundClient}
                  className="mt-2 h-11 bg-secondary/50"
                />
              </div>

              <div>
                <Label htmlFor="clientPhone" className="font-semibold text-base">Telefone (apenas números) *</Label>
                <Input
                  id="clientPhone"
                  value={formData.clientPhone}
                  onChange={(e) =>
                    setFormData({ ...formData, clientPhone: e.target.value.replace(/\D/g, "") })
                  }
                  required
                  disabled={!!foundClient}
                  placeholder="5511999999999"
                  className="mt-2 h-11 bg-secondary/50"
                />
              </div>

              <div>
                <Label htmlFor="carMakeModel" className="font-semibold text-base">Marca e Modelo *</Label>
                <Input
                  id="carMakeModel"
                  value={formData.carMakeModel}
                  onChange={(e) =>
                    setFormData({ ...formData, carMakeModel: e.target.value })
                  }
                  required
                  className="mt-2 h-11 bg-secondary/50"
                />
              </div>

              <div>
                <Label htmlFor="carPlate" className="font-semibold text-base">Placa *</Label>
                <Input
                  id="carPlate"
                  value={formData.carPlate}
                  onChange={(e) =>
                    setFormData({ ...formData, carPlate: e.target.value.toUpperCase() })
                  }
                  required
                  maxLength={7}
                  className="mt-2 h-11 bg-secondary/50 font-mono font-bold"
                />
              </div>

              <div>
                <Label htmlFor="carColor" className="font-semibold text-base">Cor do Carro</Label>
                <Input
                  id="carColor"
                  value={formData.carColor}
                  onChange={(e) =>
                    setFormData({ ...formData, carColor: e.target.value })
                  }
                  placeholder="Ex: Prata, Preto, Branco..."
                  className="mt-2 h-11 bg-secondary/50"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="serviceName" className="font-semibold text-base">Serviço *</Label>
              <Select
                value={formData.serviceName}
                onValueChange={handleServiceChange}
                required
              >
                <SelectTrigger className="mt-2 h-11 bg-secondary/50 font-semibold">
                  <SelectValue placeholder="Selecione o serviço" />
                </SelectTrigger>
                <SelectContent>
                  {servicePrices.map((service) => (
                    <SelectItem key={service.service_name} value={service.service_name}>
                      <span className="font-semibold">{service.service_name}</span> - R$ {service.price.toFixed(2)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="value" className="font-semibold text-base">Valor do Serviço *</Label>
              <Input
                id="value"
                type="number"
                step="0.01"
                value={formData.value}
                readOnly
                className="mt-2 h-11 bg-muted font-bold text-lg text-accent"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-accent hover:shadow-accent transition-all duration-300 hover:scale-105 font-bold h-12 text-lg"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Adicionando...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-5 w-5" />
                  ADICIONAR SERVIÇO
                </>
              )}
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddServiceModal;
