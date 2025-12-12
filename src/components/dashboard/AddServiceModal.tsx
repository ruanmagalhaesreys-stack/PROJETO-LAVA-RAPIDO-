import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { Search, Loader2 } from "lucide-react";
import { getTodayBrazil } from "@/lib/dateUtils";
import { z } from "zod";

// Validation schema for service form
const serviceFormSchema = z.object({
  clientName: z.string().trim().min(1, "Nome obrigatório").max(100, "Nome muito longo"),
  clientPhone: z.string().trim().min(1, "Telefone obrigatório").max(20, "Telefone muito longo"),
  carMakeModel: z.string().trim().min(1, "Marca/modelo obrigatório").max(100, "Texto muito longo"),
  carPlate: z.string().trim().min(1, "Placa obrigatória").max(10, "Placa inválida"),
  carColor: z.string().trim().max(50, "Cor muito longa").optional(),
  vehicleType: z.string().min(1, "Selecione o tipo de veículo"),
  serviceName: z.string().min(1, "Selecione o serviço"),
  value: z.string().refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num > 0 && num <= 100000;
  }, "Valor deve ser entre R$0,01 e R$100.000"),
});

// Validation schema for search term (to prevent injection)
const searchTermSchema = z.string().trim().max(100, "Termo de busca muito longo");

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
  car_color: string | null;
}

interface ServicePrice {
  service_name: string;
  vehicle_type: string;
  price: number;
}

const VEHICLE_TYPES = [
  { value: "RET", label: "Carro Curto (RET)" },
  { value: "SEDAN", label: "Carro Baixo (SEDAN)" },
  { value: "SUV", label: "Carro Alto (SUV)" },
  { value: "MOTO", label: "Moto" },
  { value: "CAMINHONETE", label: "Caminhonete" },
  { value: "OUTRO", label: "Outro" },
];

const SERVICE_NAMES = [
  "Lavagem Completa",
  "Lavagem Interna",
  "Lavagem Externa",
  "Lavagem Completa + Cera",
  "Lavagem Motor",
  "Lavagem Externa + Cera",
  "Vitrificação",
  "Hidratação de Bancos",
  "Outros",
];

const AddServiceModal = ({
  open,
  onOpenChange,
  userId,
  onSuccess,
}: AddServiceModalProps) => {
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Client[]>([]);
  const [servicePrices, setServicePrices] = useState<ServicePrice[]>([]);
  const [memberId, setMemberId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    clientName: "",
    clientPhone: "",
    carMakeModel: "",
    carPlate: "",
    carColor: "",
    vehicleType: "",
    serviceName: "",
    value: "",
  });

  useEffect(() => {
    if (open && userId) {
      fetchServicePrices();
      fetchMemberId();
    }
  }, [open, userId]);

  const fetchMemberId = async () => {
    try {
      const { data, error } = await supabase
        .from("business_members")
        .select("id")
        .eq("user_id", userId)
        .single();

      if (error) throw error;
      setMemberId(data.id);
    } catch (error) {
      console.error("Error fetching member ID:", error);
    }
  };

  const fetchServicePrices = async () => {
    try {
      const { data, error } = await supabase
        .from("service_prices")
        .select("service_name, vehicle_type, price")
        .eq("user_id", userId);

      if (error) throw error;
      setServicePrices(data || []);
    } catch (error) {
      console.error("Error fetching service prices:", error);
      toast.error("Erro ao carregar preços dos serviços");
    }
  };

  const searchClient = async () => {
    // Validate and sanitize search term
    const searchValidation = searchTermSchema.safeParse(searchTerm);
    if (!searchValidation.success || !searchTerm.trim()) {
      toast.error("Digite um nome ou telefone válido para buscar");
      return;
    }

    const sanitizedTerm = searchValidation.data;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("user_id", userId)
        .or(`client_name.ilike.%${sanitizedTerm}%,client_phone.ilike.%${sanitizedTerm}%`)
        .limit(10);

      if (error) throw error;

      if (data && data.length > 0) {
        setSearchResults(data);
        const firstClient = data[0];
        setFormData({
          ...formData,
          clientName: firstClient.client_name,
          clientPhone: firstClient.client_phone,
          carMakeModel: firstClient.car_make_model,
          carPlate: firstClient.car_plate,
          carColor: firstClient.car_color || "",
        });
        toast.success("Cliente encontrado!");
      } else {
        toast.info("Cliente não encontrado. Preencha os dados manualmente.");
        setSearchResults([]);
      }
    } catch (error) {
      console.error("Error searching client:", error);
      toast.error("Erro ao buscar cliente");
    } finally {
      setLoading(false);
    }
  };

  const handleVehicleTypeChange = (vehicleType: string) => {
    setFormData(prev => {
      const newData = { ...prev, vehicleType };
      
      // If service is already selected, update price
      if (prev.serviceName && prev.serviceName !== "Outros") {
        const price = servicePrices.find(
          p => p.service_name === prev.serviceName && p.vehicle_type === vehicleType
        )?.price || 0;
        newData.value = price.toFixed(2);
      }
      
      return newData;
    });
  };

  const handleServiceChange = (serviceName: string) => {
    setFormData(prev => {
      const newData = { ...prev, serviceName };
      
      // If "Outros", clear the value for manual input
      if (serviceName === "Outros") {
        newData.value = "";
      } else if (prev.vehicleType) {
        // Auto-fill price based on vehicle type and service
        const price = servicePrices.find(
          p => p.service_name === serviceName && p.vehicle_type === prev.vehicleType
        )?.price || 0;
        newData.value = price.toFixed(2);
      }
      
      return newData;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form data with Zod schema
    const validation = serviceFormSchema.safeParse(formData);
    if (!validation.success) {
      const firstError = validation.error.errors[0];
      toast.error(firstError.message);
      return;
    }

    const validatedData = validation.data;
    const valueNum = parseFloat(validatedData.value);

    setLoading(true);
    try {
      // Get business_id for RLS compliance
      const { data: businessId } = await supabase.rpc('get_user_business_id');
      if (!businessId) {
        toast.error("Erro: não foi possível identificar o negócio");
        setLoading(false);
        return;
      }

      // Check if client exists
      const { data: existingClient } = await supabase
        .from("clients")
        .select("id")
        .eq("user_id", userId)
        .eq("client_phone", formData.clientPhone)
        .single();

      let clientId = existingClient?.id;

      // If client doesn't exist, create new one
      if (!clientId) {
        const { data: newClient, error: clientError } = await supabase
          .from("clients")
          .insert({
            user_id: userId,
            business_id: businessId,
            client_name: formData.clientName,
            client_phone: formData.clientPhone,
            car_make_model: formData.carMakeModel,
            car_plate: formData.carPlate,
            car_color: formData.carColor || null,
          })
          .select()
          .single();

        if (clientError) throw clientError;
        clientId = newClient.id;
      } else {
        // Update existing client data
        await supabase
          .from("clients")
          .update({
            client_name: formData.clientName,
            car_make_model: formData.carMakeModel,
            car_plate: formData.carPlate,
            car_color: formData.carColor || null,
          })
          .eq("id", clientId);
      }

      // Add service to daily_services
      const today = getTodayBrazil();
      const { error: serviceError } = await supabase
        .from("daily_services")
        .insert({
          user_id: userId,
          business_id: businessId,
          client_id: clientId,
          client_name: formData.clientName,
          client_phone: formData.clientPhone,
          car_plate: formData.carPlate,
          car_make_model: formData.carMakeModel,
          car_color: formData.carColor || null,
          service_name: formData.serviceName,
          vehicle_type: formData.vehicleType,
          value: valueNum,
          status: "pendente",
          date_yyyymmdd: today,
          created_by_member_id: memberId,
        });

      if (serviceError) throw serviceError;

      toast.success("Serviço adicionado com sucesso!");
      resetForm();
      onSuccess();
    } catch (error: any) {
      console.error("Error adding service:", error);
      toast.error(error.message || "Erro ao adicionar serviço");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      clientName: "",
      clientPhone: "",
      carMakeModel: "",
      carPlate: "",
      carColor: "",
      vehicleType: "",
      serviceName: "",
      value: "",
    });
    setSearchTerm("");
    setSearchResults([]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto glass-effect">
        <DialogHeader>
          <DialogTitle className="text-3xl font-bold flex items-center gap-2">
            ➕ Adicionar Novo Serviço
          </DialogTitle>
          <DialogDescription className="text-base">
            Busque o cliente ou preencha os dados manualmente
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Search Section */}
          <div className="flex gap-2">
            <Input
              placeholder="🔍 Buscar cliente por nome ou telefone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), searchClient())}
              className="flex-1 h-12 text-base"
            />
            <Button
              type="button"
              onClick={searchClient}
              disabled={loading}
              className="bg-gradient-primary hover:shadow-glow font-bold h-12 px-6"
            >
              <Search className="h-5 w-5" />
            </Button>
          </div>

          {/* Client Info Section */}
          <div className="p-6 bg-secondary/20 rounded-xl space-y-4 border border-border/50">
            <h3 className="font-bold text-lg">👤 Dados do Cliente</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="clientName" className="font-semibold">Nome Completo *</Label>
                <Input
                  id="clientName"
                  value={formData.clientName}
                  onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                  placeholder="Ex: João Silva"
                  required
                  className="mt-2 h-11"
                />
              </div>

              <div>
                <Label htmlFor="clientPhone" className="font-semibold">Telefone *</Label>
                <Input
                  id="clientPhone"
                  value={formData.clientPhone}
                  onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
                  placeholder="Ex: (11) 98765-4321"
                  required
                  className="mt-2 h-11"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="carMakeModel" className="font-semibold">Marca e Modelo *</Label>
                <Input
                  id="carMakeModel"
                  value={formData.carMakeModel}
                  onChange={(e) => setFormData({ ...formData, carMakeModel: e.target.value })}
                  placeholder="Ex: Toyota Corolla"
                  required
                  className="mt-2 h-11"
                />
              </div>

              <div>
                <Label htmlFor="carPlate" className="font-semibold">Placa *</Label>
                <Input
                  id="carPlate"
                  value={formData.carPlate}
                  onChange={(e) => setFormData({ ...formData, carPlate: e.target.value.toUpperCase() })}
                  placeholder="Ex: ABC-1234"
                  required
                  className="mt-2 h-11"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="carColor" className="font-semibold">Cor do Carro</Label>
              <Input
                id="carColor"
                value={formData.carColor}
                onChange={(e) => setFormData({ ...formData, carColor: e.target.value })}
                placeholder="Ex: Prata"
                className="mt-2 h-11"
              />
            </div>
          </div>

          {/* Vehicle Type Section */}
          <div className="p-6 bg-secondary/20 rounded-xl space-y-4 border border-border/50">
            <h3 className="font-bold text-lg">🚗 Tipo do Veículo *</h3>
            
            <RadioGroup
              value={formData.vehicleType}
              onValueChange={handleVehicleTypeChange}
              className="grid grid-cols-2 gap-3"
            >
              {VEHICLE_TYPES.map((type) => (
                <div key={type.value} className="flex items-center space-x-2 p-3 bg-background/50 rounded-lg border border-border/30 hover:border-primary/50 transition-all">
                  <RadioGroupItem value={type.value} id={type.value} />
                  <Label htmlFor={type.value} className="cursor-pointer font-medium flex-1">
                    {type.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Service Section */}
          <div className="p-6 bg-secondary/20 rounded-xl space-y-4 border border-border/50">
            <h3 className="font-bold text-lg">📋 Serviço e Valor</h3>
            
            <div>
              <Label htmlFor="serviceName" className="font-semibold">Serviço *</Label>
              <Select
                value={formData.serviceName}
                onValueChange={handleServiceChange}
              >
                <SelectTrigger className="mt-2 h-12 text-base">
                  <SelectValue placeholder="Selecione o serviço" />
                </SelectTrigger>
                <SelectContent className="bg-background border-border">
                  {SERVICE_NAMES.map((service) => (
                    <SelectItem key={service} value={service} className="text-base">
                      {service}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="value" className="font-semibold">Valor do Serviço (R$) *</Label>
              <Input
                id="value"
                type="number"
                step="0.01"
                min="0"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                placeholder="Ex: 80.00"
                required
                disabled={loading}
                className="mt-2 h-12 text-lg font-bold"
              />
              {formData.serviceName !== "Outros" && formData.vehicleType && (
                <p className="text-sm text-muted-foreground mt-2 font-medium">
                  💡 Valor auto-preenchido. Você pode editá-lo se necessário.
                </p>
              )}
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-14 bg-gradient-accent hover:shadow-accent transition-all duration-300 hover:scale-105 font-bold text-lg"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                Adicionando...
              </>
            ) : (
              <>
                ✓ ADICIONAR SERVIÇO
              </>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddServiceModal;
