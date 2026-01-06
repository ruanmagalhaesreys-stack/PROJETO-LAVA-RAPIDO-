import { useState, useEffect } from "react";
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
import { Loader2, Save } from "lucide-react";

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
}

interface EditServiceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: Service | null;
  onServiceUpdated: () => void;
}

const VEHICLE_TYPES = ["MOTO", "RET", "SEDAN", "SUV", "CAMINHONETE", "OUTRO"];

const EditServiceModal = ({
  open,
  onOpenChange,
  service,
  onServiceUpdated,
}: EditServiceModalProps) => {
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    client_name: "",
    client_phone: "",
    car_plate: "",
    car_make_model: "",
    car_color: "",
    service_name: "",
    vehicle_type: "",
    value: "",
  });
  const [servicePrices, setServicePrices] = useState<{ service_name: string; price: number }[]>([]);

  useEffect(() => {
    if (service) {
      setFormData({
        client_name: service.client_name,
        client_phone: service.client_phone,
        car_plate: service.car_plate,
        car_make_model: service.car_make_model || "",
        car_color: service.car_color || "",
        service_name: service.service_name,
        vehicle_type: service.vehicle_type || "SEDAN",
        value: service.value.toString(),
      });
    }
  }, [service]);

  useEffect(() => {
    if (formData.vehicle_type) {
      fetchServicePrices();
    }
  }, [formData.vehicle_type]);

  const fetchServicePrices = async () => {
    try {
      const { data: businessId } = await supabase.rpc("get_user_business_id");
      if (!businessId) return;

      const { data, error } = await supabase
        .from("service_prices")
        .select("service_name, price")
        .eq("business_id", businessId)
        .eq("vehicle_type", formData.vehicle_type);

      if (error) throw error;
      setServicePrices(data || []);
    } catch (error) {
      console.error("Error fetching service prices:", error);
    }
  };

  const handleServiceChange = (serviceName: string) => {
    const priceInfo = servicePrices.find((p) => p.service_name === serviceName);
    setFormData({
      ...formData,
      service_name: serviceName,
      value: priceInfo ? priceInfo.price.toString() : formData.value,
    });
  };

  const handleSave = async () => {
    if (!service) return;

    if (!formData.client_name || !formData.client_phone || !formData.car_plate || !formData.service_name || !formData.value) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("daily_services")
        .update({
          client_name: formData.client_name,
          client_phone: formData.client_phone,
          car_plate: formData.car_plate.toUpperCase(),
          car_make_model: formData.car_make_model,
          car_color: formData.car_color,
          service_name: formData.service_name,
          vehicle_type: formData.vehicle_type,
          value: parseFloat(formData.value),
        })
        .eq("id", service.id);

      if (error) throw error;

      toast.success("Serviço atualizado!");
      onOpenChange(false);
      onServiceUpdated();
    } catch (error) {
      console.error("Error updating service:", error);
      toast.error("Erro ao atualizar serviço");
    } finally {
      setSaving(false);
    }
  };

  if (!service) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Serviço</DialogTitle>
          <DialogDescription>
            Altere as informações do serviço
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="client_name">Nome do Cliente *</Label>
              <Input
                id="client_name"
                value={formData.client_name}
                onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                className="mt-1"
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="client_phone">Telefone *</Label>
              <Input
                id="client_phone"
                value={formData.client_phone}
                onChange={(e) => setFormData({ ...formData, client_phone: e.target.value })}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="car_plate">Placa *</Label>
              <Input
                id="car_plate"
                value={formData.car_plate}
                onChange={(e) => setFormData({ ...formData, car_plate: e.target.value.toUpperCase() })}
                className="mt-1 font-mono"
                maxLength={7}
              />
            </div>

            <div>
              <Label htmlFor="vehicle_type">Tipo de Veículo</Label>
              <Select
                value={formData.vehicle_type}
                onValueChange={(value) => setFormData({ ...formData, vehicle_type: value })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VEHICLE_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2">
              <Label htmlFor="car_make_model">Modelo do Carro</Label>
              <Input
                id="car_make_model"
                value={formData.car_make_model}
                onChange={(e) => setFormData({ ...formData, car_make_model: e.target.value })}
                className="mt-1"
                placeholder="Ex: Honda Civic"
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="car_color">Cor</Label>
              <Input
                id="car_color"
                value={formData.car_color}
                onChange={(e) => setFormData({ ...formData, car_color: e.target.value })}
                className="mt-1"
                placeholder="Ex: Preto"
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="service_name">Serviço *</Label>
              <Select
                value={formData.service_name}
                onValueChange={handleServiceChange}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {servicePrices.map((sp) => (
                    <SelectItem key={sp.service_name} value={sp.service_name}>
                      {sp.service_name} - R$ {sp.price.toFixed(2)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2">
              <Label htmlFor="value">Valor (R$) *</Label>
              <Input
                id="value"
                type="number"
                step="0.01"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                className="mt-1 text-lg font-bold"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditServiceModal;
