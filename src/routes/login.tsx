import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { FileBarChart, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/login")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Entrar — Gestão de Projetos, Cobrança e Fiscalização" },
      {
        name: "description",
        content:
          "Acesso restrito ao sistema corporativo de gestão de projetos, cobrança e fiscalização.",
      },
      { property: "og:title", content: "Entrar — Gestão de Projetos" },
      {
        property: "og:description",
        content: "Acesso restrito ao sistema corporativo de gestão de projetos.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [nome, setNome] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) void navigate({ to: "/", replace: true });
    });
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
        if (error) throw error;
        await navigate({ to: "/", replace: true });
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password: senha,
          options: {
            data: { full_name: nome },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        if (data.session) {
          await navigate({ to: "/", replace: true });
        } else {
          toast.success("Conta criada. Confirme o e-mail para acessar o sistema.");
          setMode("login");
        }
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? traduzErro(error.message) : "Não foi possível concluir a operação.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-sidebar p-10 text-sidebar-foreground lg:flex">
        <div className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
            <FileBarChart className="size-4" />
          </span>
          <div>
            <p className="text-sm font-semibold">Gestão de Projetos</p>
            <p className="text-[11px] text-sidebar-muted">Cobrança e Fiscalização</p>
          </div>
        </div>
        <div className="max-w-sm">
          <h2 className="text-2xl font-semibold">Controle operacional em um só lugar</h2>
          <p className="mt-3 text-sm text-sidebar-muted">
            Projetos, notificações, empresas, localidades e auditoria — com permissões por perfil de
            acesso e histórico completo de alterações.
          </p>
        </div>
        <p className="text-[11px] text-sidebar-muted">Uso interno · acesso monitorado</p>
      </div>

      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <h1 className="text-xl font-semibold">
            {mode === "login" ? "Acessar o sistema" : "Criar acesso"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "login"
              ? "Informe suas credenciais corporativas."
              : "O perfil de acesso será liberado por um administrador."}
          </p>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            {mode === "signup" ? (
              <div>
                <Label htmlFor="nome">
                  Nome completo <span className="text-danger">*</span>
                </Label>
                <Input
                  id="nome"
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="mt-1.5"
                  autoComplete="name"
                />
              </div>
            ) : null}
            <div>
              <Label htmlFor="email">
                E-mail <span className="text-danger">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5"
                autoComplete="email"
              />
            </div>
            <div>
              <Label htmlFor="senha">
                Senha <span className="text-danger">*</span>
              </Label>
              <Input
                id="senha"
                type="password"
                required
                minLength={6}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="mt-1.5"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
              />
            </div>
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? <Loader2 className="size-4 animate-spin" /> : null}
              {mode === "login" ? "Entrar" : "Criar conta"}
            </Button>
          </form>

          <button
            type="button"
            onClick={() => setMode(mode === "login" ? "signup" : "login")}
            className="mt-4 text-sm text-primary hover:underline"
          >
            {mode === "login" ? "Não tenho acesso ainda" : "Já tenho acesso"}
          </button>
        </div>
      </div>
    </div>
  );
}

function traduzErro(message: string): string {
  if (/invalid login credentials/i.test(message)) return "E-mail ou senha inválidos.";
  if (/email not confirmed/i.test(message)) return "Confirme seu e-mail antes de acessar.";
  if (/already registered/i.test(message)) return "Este e-mail já possui acesso.";
  if (/signups not allowed|disabled/i.test(message))
    return "Cadastro de novas contas está desativado no Supabase.";
  return message;
}
