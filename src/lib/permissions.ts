export type Role = "administrador" | "analista" | "operador" | "visualizador";

export type Capability =
  | "projetos.ver"
  | "projetos.criar"
  | "projetos.editar"
  | "projetos.excluir"
  | "notificacoes.ver"
  | "notificacoes.criar"
  | "notificacoes.editar"
  | "notificacoes.excluir"
  | "empresas.ver"
  | "empresas.criar"
  | "empresas.editar"
  | "empresas.excluir"
  | "localidades.ver"
  | "localidades.criar"
  | "localidades.editar"
  | "localidades.excluir"
  | "usuarios.ver"
  | "usuarios.gerenciar"
  | "auditoria.ver";

const MATRIX: Record<Role, Capability[]> = {
  administrador: [
    "projetos.ver",
    "projetos.criar",
    "projetos.editar",
    "projetos.excluir",
    "notificacoes.ver",
    "notificacoes.criar",
    "notificacoes.editar",
    "notificacoes.excluir",
    "empresas.ver",
    "empresas.criar",
    "empresas.editar",
    "empresas.excluir",
    "localidades.ver",
    "localidades.criar",
    "localidades.editar",
    "localidades.excluir",
    "usuarios.ver",
    "usuarios.gerenciar",
    "auditoria.ver",
  ],
  analista: [
    "projetos.ver",
    "projetos.criar",
    "projetos.editar",
    "notificacoes.ver",
    "notificacoes.criar",
    "notificacoes.editar",
    "empresas.ver",
    "localidades.ver",
    "auditoria.ver",
  ],
  operador: [
    "projetos.ver",
    "projetos.criar",
    "projetos.editar",
    "notificacoes.ver",
    "notificacoes.criar",
    "notificacoes.editar",
    "empresas.ver",
    "empresas.criar",
    "empresas.editar",
    "localidades.ver",
    "localidades.criar",
    "localidades.editar",
    "auditoria.ver",
  ],
  visualizador: [
    "projetos.ver",
    "notificacoes.ver",
    "empresas.ver",
    "localidades.ver",
    "auditoria.ver",
  ],
};

export const ROLE_LABEL: Record<Role, string> = {
  administrador: "Administrador",
  analista: "Analista",
  operador: "Operador",
  visualizador: "Visualizador",
};

export function isRole(value?: string | null): value is Role {
  return value === "administrador" || value === "analista" || value === "operador" || value === "visualizador";
}

/**
 * Autorização de interface (UX). A autoridade de segurança continua sendo o
 * RLS do Supabase — nunca confiar apenas nesta checagem.
 */
export function can(role: Role | null | undefined, capability: Capability): boolean {
  if (!role) return false;
  return MATRIX[role].includes(capability);
}
