import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Car, Sparkles, ArrowLeft } from "lucide-react";
import { z } from "zod";

// Schema validation for auth forms
const authSchema = z.object({
  email: z.string().trim().email({ message: "Email inválido" }).max(255, { message: "Email muito longo" }),
  password: z.string().min(6, { message: "Senha deve ter pelo menos 6 caracteres" }).max(72, { message: "Senha muito longa" }),
});

const Auth = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  useEffect(() => {
    // Check for pending setup action
    const setupAction = localStorage.getItem("setupAction");
    if (setupAction) {
      setPendingAction(setupAction);
    } else {
      // No pending action, redirect to setup
      navigate("/setup");
      return;
    }

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session && event === 'SIGNED_IN') {
          // Defer the action execution to avoid deadlock
          setTimeout(() => {
            executePendingAction();
          }, 0);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        executePendingAction();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const executePendingAction = async () => {
    const setupAction = localStorage.getItem("setupAction");
    const setupDisplayName = localStorage.getItem("setupDisplayName");
    const setupBusinessCode = localStorage.getItem("setupBusinessCode");

    if (!setupAction || !setupDisplayName) {
      navigate("/dashboard");
      return;
    }

    setLoading(true);
    try {
      if (setupAction === "create") {
        const { data, error } = await supabase.rpc("create_my_business", {
          p_display_name: setupDisplayName,
        });

        if (error) throw error;

        if (data) {
          toast.success("Lava Rápido criado com sucesso!");
        } else {
          toast.error("Você já está associado a um lava rápido");
        }
      } else if (setupAction === "connect" && setupBusinessCode) {
        const { data, error } = await supabase.rpc("connect_to_business", {
          p_code: setupBusinessCode,
          p_display_name: setupDisplayName,
        });

        if (error) throw error;

        if (data) {
          toast.success("Conectado ao lava rápido com sucesso!");
        } else {
          toast.error("Não foi possível conectar. Você já está em um lava rápido?");
        }
      }

      // Clear localStorage
      localStorage.removeItem("setupAction");
      localStorage.removeItem("setupDisplayName");
      localStorage.removeItem("setupBusinessCode");

      navigate("/dashboard");
    } catch (error: any) {
      console.error("Error executing pending action:", error);
      toast.error(error.message || "Erro ao processar ação");
      // Clear localStorage on error too
      localStorage.removeItem("setupAction");
      localStorage.removeItem("setupDisplayName");
      localStorage.removeItem("setupBusinessCode");
      navigate("/setup");
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const result = authSchema.safeParse({ email, password });
    if (!result.success) {
      const fieldErrors: { email?: string; password?: string } = {};
      result.error.errors.forEach((err) => {
        if (err.path[0] === "email") fieldErrors.email = err.message;
        if (err.path[0] === "password") fieldErrors.password = err.message;
      });
      setErrors(fieldErrors);
      return false;
    }
    setErrors({});
    return true;
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        toast.success("Login realizado com sucesso!");
        // executePendingAction will be called by onAuthStateChange
      } else {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
          },
        });
        if (error) throw error;
        
        toast.success("Conta criada com sucesso!");
        // executePendingAction will be called by onAuthStateChange
      }
    } catch (error: any) {
      setLoading(false);
      if (error.message?.includes("User already registered")) {
        toast.error("Este email já está cadastrado. Tente fazer login.");
      } else if (error.message?.includes("Invalid login credentials")) {
        toast.error("Email ou senha incorretos.");
      } else {
        toast.error(error.message || "Erro ao processar autenticação");
      }
    }
  };

  const handleBackToSetup = () => {
    // Clear pending action
    localStorage.removeItem("setupAction");
    localStorage.removeItem("setupDisplayName");
    localStorage.removeItem("setupBusinessCode");
    navigate("/setup");
  };

  const getActionDescription = () => {
    if (pendingAction === "create") {
      return "Criar seu Lava Rápido";
    } else if (pendingAction === "connect") {
      return "Conectar ao Lava Rápido";
    }
    return "";
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-gradient-to-br from-background via-background to-primary/5">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent/10 rounded-full blur-3xl animate-pulse delay-700"></div>
      </div>

      <Card className="w-full max-w-md glass-effect shadow-glow animate-fade-in relative z-10">
        <div className="p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-gradient-primary rounded-full blur-xl opacity-50"></div>
              <div className="relative bg-gradient-primary p-5 rounded-2xl">
                <Car className="h-14 w-14 text-primary-foreground" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-foreground mb-2 flex items-center gap-2">
              Lava Rápido Inglaterra
              <Sparkles className="h-6 w-6 text-accent" />
            </h1>
            <p className="text-muted-foreground text-center text-lg">
              {isLogin ? "Faça login para continuar" : "Crie sua conta"}
            </p>
            {pendingAction && (
              <div className="mt-3 px-4 py-2 bg-primary/10 rounded-lg">
                <p className="text-sm text-primary font-medium">
                  Próximo passo: {getActionDescription()}
                </p>
              </div>
            )}
          </div>

          <form onSubmit={handleAuth} className="space-y-5">
            <div>
              <label htmlFor="email" className="text-sm font-semibold text-foreground block mb-2 flex items-center gap-2">
                📧 Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                }}
                required
                disabled={loading}
                className={`h-12 bg-secondary/50 border-border/50 focus:border-primary transition-all ${errors.email ? "border-destructive" : ""}`}
              />
              {errors.email && (
                <p className="text-sm text-destructive mt-1">{errors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="text-sm font-semibold text-foreground block mb-2 flex items-center gap-2">
                🔒 Senha
              </label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                }}
                required
                disabled={loading}
                minLength={6}
                className={`h-12 bg-secondary/50 border-border/50 focus:border-primary transition-all ${errors.password ? "border-destructive" : ""}`}
              />
              {errors.password && (
                <p className="text-sm text-destructive mt-1">{errors.password}</p>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="rememberMe"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                disabled={loading}
              />
              <Label
                htmlFor="rememberMe"
                className="text-sm font-medium leading-none cursor-pointer text-muted-foreground hover:text-foreground transition-colors"
              >
                Lembrar-me neste dispositivo
              </Label>
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-lg font-bold bg-gradient-primary hover:shadow-glow transition-all duration-300 hover:scale-[1.02]"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Processando...
                </>
              ) : isLogin ? (
                <>
                  <Sparkles className="mr-2 h-5 w-5" />
                  Entrar
                </>
              ) : (
                "Criar Conta"
              )}
            </Button>
          </form>

          <div className="mt-6 space-y-4">
            <div className="text-center">
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium"
                disabled={loading}
              >
                {isLogin ? "Não tem uma conta? Criar conta" : "Já tem uma conta? Entrar"}
              </button>
            </div>

            <Button
              variant="ghost"
              onClick={handleBackToSetup}
              className="w-full"
              disabled={loading}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para escolha
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Auth;