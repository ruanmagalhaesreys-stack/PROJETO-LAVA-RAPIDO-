import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Building, Link2, Wind, Sparkles, ArrowLeft } from "lucide-react";
import { z } from "zod";

// Validation schemas
const displayNameSchema = z.string().trim().min(2, "Nome deve ter pelo menos 2 caracteres").max(100, "Nome muito longo");
const businessCodeSchema = z.string().trim().min(1, "Digite o código").regex(/^LR-[A-Z0-9]+$/i, "Código inválido. Formato: LR-ABC123");

const Setup = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [mode, setMode] = useState<"choose" | "create" | "connect">("choose");
  const [displayName, setDisplayName] = useState("");
  const [businessCode, setBusinessCode] = useState("");
  const [foundBusiness, setFoundBusiness] = useState<{
    id: string;
    name: string;
    owner_name: string;
  } | null>(null);
  const [errors, setErrors] = useState<{ displayName?: string; businessCode?: string }>({});

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        setIsLoggedIn(true);
        
        // Check if user already has a business
        const { data: businessId } = await supabase.rpc('get_user_business_id');
        
        if (businessId) {
          // User already has a business, go to dashboard
          navigate("/dashboard");
          return;
        }
      }
    } catch (error) {
      console.error("Error checking session:", error);
    } finally {
      setCheckingSession(false);
    }
  };

  const validateDisplayName = (): boolean => {
    const result = displayNameSchema.safeParse(displayName);
    if (!result.success) {
      setErrors(prev => ({ ...prev, displayName: result.error.errors[0].message }));
      return false;
    }
    setErrors(prev => ({ ...prev, displayName: undefined }));
    return true;
  };

  const validateBusinessCode = (): boolean => {
    const result = businessCodeSchema.safeParse(businessCode);
    if (!result.success) {
      setErrors(prev => ({ ...prev, businessCode: result.error.errors[0].message }));
      return false;
    }
    setErrors(prev => ({ ...prev, businessCode: undefined }));
    return true;
  };

  // If user is logged in, execute actions directly
  const handleCreateBusiness = async () => {
    if (!validateDisplayName()) return;

    if (!isLoggedIn) {
      // Store choice and redirect to auth
      localStorage.setItem("setupAction", "create");
      localStorage.setItem("setupDisplayName", displayName.trim());
      navigate("/auth");
      return;
    }

    // User is logged in, create business directly
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("create_my_business", {
        p_display_name: displayName.trim(),
      });

      if (error) throw error;

      if (data) {
        toast.success("Lava Rápido criado com sucesso!");
        navigate("/dashboard");
      } else {
        toast.error("Você já está associado a um lava rápido");
        navigate("/dashboard");
      }
    } catch (error: any) {
      console.error("Error creating business:", error);
      toast.error(error.message || "Erro ao criar lava rápido");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchBusiness = async () => {
    if (!validateBusinessCode()) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("find_business_by_code", {
        p_code: businessCode.trim().toUpperCase(),
      });

      if (error) throw error;

      if (data && data.length > 0) {
        setFoundBusiness(data[0]);
        setErrors(prev => ({ ...prev, businessCode: undefined }));
      } else {
        toast.error("Código não encontrado");
        setFoundBusiness(null);
      }
    } catch (error: any) {
      console.error("Error searching business:", error);
      toast.error(error.message || "Erro ao buscar lava rápido");
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    if (!validateDisplayName()) return;
    if (!foundBusiness) return;

    if (!isLoggedIn) {
      // Store choice and redirect to auth
      localStorage.setItem("setupAction", "connect");
      localStorage.setItem("setupDisplayName", displayName.trim());
      localStorage.setItem("setupBusinessCode", businessCode.trim().toUpperCase());
      navigate("/auth");
      return;
    }

    // User is logged in, connect directly
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("connect_to_business", {
        p_code: businessCode.trim().toUpperCase(),
        p_display_name: displayName.trim(),
      });

      if (error) throw error;

      if (data) {
        toast.success(`Conectado ao lava rápido de ${foundBusiness.owner_name}!`);
        navigate("/dashboard");
      } else {
        toast.error("Não foi possível conectar. Você já está em um lava rápido?");
      }
    } catch (error: any) {
      console.error("Error connecting:", error);
      toast.error(error.message || "Erro ao conectar");
    } finally {
      setLoading(false);
    }
  };

  const resetMode = () => {
    setMode("choose");
    setFoundBusiness(null);
    setBusinessCode("");
    setDisplayName("");
    setErrors({});
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center gap-3 mb-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-primary rounded-xl blur-lg opacity-50"></div>
              <div className="relative bg-gradient-primary p-3 rounded-xl">
                <Wind className="h-8 w-8 text-primary-foreground" />
              </div>
            </div>
          </div>
          <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
            Bem-vindo!
            <Sparkles className="h-6 w-6 text-accent" />
          </h1>
          <p className="text-muted-foreground mt-2">
            {isLoggedIn ? "Configure seu acesso ao sistema" : "Escolha como deseja começar"}
          </p>
        </div>

        {mode === "choose" && (
          <div className="space-y-4">
            <Card
              className="glass-effect p-6 cursor-pointer hover-lift border-2 border-transparent hover:border-primary/50 transition-all"
              onClick={() => setMode("create")}
            >
              <div className="flex items-center gap-4">
                <div className="p-4 bg-gradient-primary rounded-xl">
                  <Building className="h-8 w-8 text-primary-foreground" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold">Criar Meu Lava Rápido</h3>
                  <p className="text-muted-foreground text-sm">
                    Sou proprietário e quero gerenciar meu negócio
                  </p>
                </div>
              </div>
            </Card>

            <div className="text-center text-muted-foreground font-medium">OU</div>

            <Card
              className="glass-effect p-6 cursor-pointer hover-lift border-2 border-transparent hover:border-accent/50 transition-all"
              onClick={() => setMode("connect")}
            >
              <div className="flex items-center gap-4">
                <div className="p-4 bg-gradient-accent rounded-xl">
                  <Link2 className="h-8 w-8 text-primary-foreground" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold">Conectar a um Lava Rápido</h3>
                  <p className="text-muted-foreground text-sm">
                    Tenho um código de convite do meu sócio
                  </p>
                </div>
              </div>
            </Card>

            {isLoggedIn && (
              <div className="mt-6 text-center">
                <button
                  onClick={async () => {
                    await supabase.auth.signOut();
                    setIsLoggedIn(false);
                    toast.success("Logout realizado");
                  }}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Sair da conta atual
                </button>
              </div>
            )}
          </div>
        )}

        {mode === "create" && (
          <Card className="glass-effect p-6 space-y-6">
            <div className="text-center">
              <div className="p-4 bg-gradient-primary rounded-xl inline-block mb-4">
                <Building className="h-8 w-8 text-primary-foreground" />
              </div>
              <h2 className="text-2xl font-bold">Criar Meu Lava Rápido</h2>
              <p className="text-muted-foreground text-sm mt-2">
                {isLoggedIn 
                  ? "Você será o proprietário e terá acesso completo ao sistema"
                  : "Você precisará criar uma conta ou fazer login para continuar"
                }
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="font-semibold">Seu nome de exibição</Label>
                <Input
                  placeholder="Ex: João Silva"
                  value={displayName}
                  onChange={(e) => {
                    setDisplayName(e.target.value);
                    if (errors.displayName) setErrors(prev => ({ ...prev, displayName: undefined }));
                  }}
                  className={`h-12 bg-secondary/50 ${errors.displayName ? "border-destructive" : ""}`}
                />
                {errors.displayName && (
                  <p className="text-sm text-destructive">{errors.displayName}</p>
                )}
              </div>

              <Button
                onClick={handleCreateBusiness}
                disabled={loading || !displayName.trim()}
                className="w-full h-12 bg-gradient-primary hover:shadow-glow font-bold text-lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    {isLoggedIn ? "Criando..." : "Processando..."}
                  </>
                ) : isLoggedIn ? (
                  "CRIAR MEU LAVA RÁPIDO"
                ) : (
                  "CONTINUAR →"
                )}
              </Button>

              <Button
                variant="ghost"
                onClick={resetMode}
                className="w-full"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
            </div>
          </Card>
        )}

        {mode === "connect" && (
          <Card className="glass-effect p-6 space-y-6">
            <div className="text-center">
              <div className="p-4 bg-gradient-accent rounded-xl inline-block mb-4">
                <Link2 className="h-8 w-8 text-primary-foreground" />
              </div>
              <h2 className="text-2xl font-bold">Conectar a um Lava Rápido</h2>
              <p className="text-muted-foreground text-sm mt-2">
                Digite o código que seu sócio compartilhou com você
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="font-semibold">Código do Lava Rápido</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="LR-ABC123"
                    value={businessCode}
                    onChange={(e) => {
                      setBusinessCode(e.target.value.toUpperCase());
                      setFoundBusiness(null);
                      if (errors.businessCode) setErrors(prev => ({ ...prev, businessCode: undefined }));
                    }}
                    className={`h-12 bg-secondary/50 font-mono text-lg uppercase tracking-wider ${errors.businessCode ? "border-destructive" : ""}`}
                  />
                  <Button
                    onClick={handleSearchBusiness}
                    disabled={loading || !businessCode.trim()}
                    className="h-12 px-6 bg-gradient-accent"
                  >
                    {loading && !foundBusiness ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      "Buscar"
                    )}
                  </Button>
                </div>
                {errors.businessCode && (
                  <p className="text-sm text-destructive">{errors.businessCode}</p>
                )}
              </div>

              {foundBusiness && (
                <div className="bg-status-success/10 border border-status-success/30 rounded-xl p-4 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-status-success/20 rounded-full">
                      <Building className="h-5 w-5 text-status-success" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Lava Rápido encontrado:</p>
                      <p className="font-bold text-lg">{foundBusiness.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Proprietário: {foundBusiness.owner_name}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="font-semibold">Seu nome de exibição</Label>
                    <Input
                      placeholder="Ex: Pedro Santos"
                      value={displayName}
                      onChange={(e) => {
                        setDisplayName(e.target.value);
                        if (errors.displayName) setErrors(prev => ({ ...prev, displayName: undefined }));
                      }}
                      className={`h-12 bg-secondary/50 ${errors.displayName ? "border-destructive" : ""}`}
                    />
                    {errors.displayName && (
                      <p className="text-sm text-destructive">{errors.displayName}</p>
                    )}
                  </div>

                  <Button
                    onClick={handleConnect}
                    disabled={loading || !displayName.trim()}
                    className="w-full h-12 bg-status-success hover:bg-status-success/90 font-bold text-lg"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        {isLoggedIn ? "Conectando..." : "Processando..."}
                      </>
                    ) : isLoggedIn ? (
                      "CONECTAR COMO SÓCIO"
                    ) : (
                      "CONTINUAR →"
                    )}
                  </Button>
                </div>
              )}

              <Button
                variant="ghost"
                onClick={resetMode}
                className="w-full"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Setup;