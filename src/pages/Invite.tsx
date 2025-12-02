import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, UserPlus, AlertCircle } from "lucide-react";

const Invite = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [inviteValid, setInviteValid] = useState(false);
  const [businessName, setBusinessName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    checkInviteValidity();
  }, [token]);

  const checkInviteValidity = async () => {
    if (!token) {
      toast.error("Link de convite inválido");
      navigate("/auth");
      return;
    }

    try {
      const { data: invite, error } = await supabase
        .from("business_invites")
        .select(`
          *,
          businesses (name)
        `)
        .eq("token", token)
        .is("used_by", null)
        .single();

      if (error || !invite) {
        toast.error("Convite inválido ou já utilizado");
        navigate("/auth");
        return;
      }

      // Check if expired
      const expiresAt = new Date(invite.expires_at);
      if (expiresAt < new Date()) {
        toast.error("Este convite já expirou");
        navigate("/auth");
        return;
      }

      setBusinessName(invite.businesses?.name || "");
      setInviteValid(true);
    } catch (error) {
      console.error("Error checking invite:", error);
      toast.error("Erro ao verificar convite");
      navigate("/auth");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!displayName || !email || !password) {
      toast.error("Por favor, preencha todos os campos");
      return;
    }

    if (password.length < 6) {
      toast.error("A senha deve ter no mínimo 6 caracteres");
      return;
    }

    setSubmitting(true);

    try {
      // Create user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName,
            invited_via_token: token,
          },
        },
      });

      if (authError) throw authError;

      if (!authData.user) {
        throw new Error("Erro ao criar conta");
      }

      // Get invite details
      const { data: invite, error: inviteError } = await supabase
        .from("business_invites")
        .select("business_id")
        .eq("token", token)
        .single();

      if (inviteError) throw inviteError;

      // Add user as partner
      const { error: memberError } = await supabase
        .from("business_members")
        .insert({
          business_id: invite.business_id,
          user_id: authData.user.id,
          role: "partner",
          display_name: displayName,
        });

      if (memberError) throw memberError;

      // Mark invite as used
      const { error: updateError } = await supabase
        .from("business_invites")
        .update({
          used_by: authData.user.id,
          used_at: new Date().toISOString(),
        })
        .eq("token", token);

      if (updateError) throw updateError;

      toast.success("Conta criada com sucesso! Redirecionando...");
      setTimeout(() => {
        navigate("/dashboard");
      }, 1500);
    } catch (error: any) {
      console.error("Error signing up:", error);
      toast.error(error.message || "Erro ao criar conta");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900">
        <Loader2 className="h-12 w-12 animate-spin text-accent" />
      </div>
    );
  }

  if (!inviteValid) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900">
      <Card className="w-full max-w-md glass-effect p-8 space-y-6">
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <div className="p-4 bg-gradient-primary rounded-full">
              <UserPlus className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-3xl font-bold">Você foi convidado!</h1>
          <p className="text-muted-foreground">
            Você foi convidado para se juntar ao <span className="font-bold text-accent">{businessName}</span>
          </p>
        </div>

        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 flex gap-3">
          <AlertCircle className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-100">
            Como sócio, você terá acesso às abas de <strong>Entradas</strong> e <strong>Despesas</strong> para gerenciar o dia a dia do negócio.
          </p>
        </div>

        <form onSubmit={handleSignUp} className="space-y-4">
          <div>
            <Label htmlFor="displayName" className="font-semibold">Seu Nome</Label>
            <Input
              id="displayName"
              type="text"
              placeholder="Como você quer ser chamado?"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="mt-2 h-11 bg-secondary/50"
              disabled={submitting}
              required
            />
          </div>

          <div>
            <Label htmlFor="email" className="font-semibold">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 h-11 bg-secondary/50"
              disabled={submitting}
              required
            />
          </div>

          <div>
            <Label htmlFor="password" className="font-semibold">Senha</Label>
            <Input
              id="password"
              type="password"
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 h-11 bg-secondary/50"
              disabled={submitting}
              required
            />
          </div>

          <Button
            type="submit"
            className="w-full h-12 bg-gradient-primary hover:shadow-glow transition-all duration-300 hover:scale-105 font-bold text-lg"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Criando conta...
              </>
            ) : (
              <>
                <UserPlus className="mr-2 h-5 w-5" />
                Aceitar Convite
              </>
            )}
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default Invite;
