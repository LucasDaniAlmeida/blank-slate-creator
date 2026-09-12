export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          changed_fields: string[] | null
          created_at: string
          id: string
          new_data: Json | null
          old_data: Json | null
          record_id: string | null
          table_name: string
          user_id: string | null
        }
        Insert: {
          action: string
          changed_fields?: string[] | null
          created_at?: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name: string
          user_id?: string | null
        }
        Update: {
          action?: string
          changed_fields?: string[] | null
          created_at?: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string
          user_id?: string | null
        }
        Relationships: []
      }
      contadores_notificacao: {
        Row: {
          ano: number
          ultimo_numero: number
        }
        Insert: {
          ano: number
          ultimo_numero?: number
        }
        Update: {
          ano?: number
          ultimo_numero?: number
        }
        Relationships: []
      }
      empresas: {
        Row: {
          cnpj: string
          codigo_contrato: string | null
          contatos: Json
          created_at: string
          emails: string[]
          endereco_correspondencia: string | null
          id: string
          nome_comercial: string
          nome_fantasia: string | null
          numero_sigum: string | null
          responsavel: string | null
          uc: string | null
          updated_at: string
        }
        Insert: {
          cnpj: string
          codigo_contrato?: string | null
          contatos?: Json
          created_at?: string
          emails?: string[]
          endereco_correspondencia?: string | null
          id?: string
          nome_comercial: string
          nome_fantasia?: string | null
          numero_sigum?: string | null
          responsavel?: string | null
          uc?: string | null
          updated_at?: string
        }
        Update: {
          cnpj?: string
          codigo_contrato?: string | null
          contatos?: Json
          created_at?: string
          emails?: string[]
          endereco_correspondencia?: string | null
          id?: string
          nome_comercial?: string
          nome_fantasia?: string | null
          numero_sigum?: string | null
          responsavel?: string | null
          uc?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      localidades: {
        Row: {
          cidade: string
          created_at: string
          estado: string
          id: string
          polo: string | null
          regional: string | null
          updated_at: string
        }
        Insert: {
          cidade: string
          created_at?: string
          estado: string
          id?: string
          polo?: string | null
          regional?: string | null
          updated_at?: string
        }
        Update: {
          cidade?: string
          created_at?: string
          estado?: string
          id?: string
          polo?: string | null
          regional?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      notificacoes: {
        Row: {
          ano: number
          created_at: string
          data_abertura_protocolo_faturamento: string | null
          data_retirada_adequacao_pe: string | null
          data_verificacao_revelia: string | null
          empresa_notificada_id: string | null
          id: string
          numero_notificacao: string
          numero_sequencial: number
          observacao: string | null
          projeto_id: string | null
          protocolo_faturamento: string | null
          qtde_dias_ocupacao: number | null
          quantidade_pontos: number
          updated_at: string
          valor_arrecadado: number
        }
        Insert: {
          ano?: number
          created_at?: string
          data_abertura_protocolo_faturamento?: string | null
          data_retirada_adequacao_pe?: string | null
          data_verificacao_revelia?: string | null
          empresa_notificada_id?: string | null
          id?: string
          numero_notificacao: string
          numero_sequencial: number
          observacao?: string | null
          projeto_id?: string | null
          protocolo_faturamento?: string | null
          qtde_dias_ocupacao?: number | null
          quantidade_pontos?: number
          updated_at?: string
          valor_arrecadado?: number
        }
        Update: {
          ano?: number
          created_at?: string
          data_abertura_protocolo_faturamento?: string | null
          data_retirada_adequacao_pe?: string | null
          data_verificacao_revelia?: string | null
          empresa_notificada_id?: string | null
          id?: string
          numero_notificacao?: string
          numero_sequencial?: number
          observacao?: string | null
          projeto_id?: string | null
          protocolo_faturamento?: string | null
          qtde_dias_ocupacao?: number | null
          quantidade_pontos?: number
          updated_at?: string
          valor_arrecadado?: number
        }
        Relationships: [
          {
            foreignKeyName: "notificacoes_empresa_notificada_id_fkey"
            columns: ["empresa_notificada_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notificacoes_projeto_id_fkey"
            columns: ["projeto_id"]
            isOneToOne: false
            referencedRelation: "projetos"
            referencedColumns: ["id"]
          },
        ]
      }
      perfis_acesso: {
        Row: {
          ativo: boolean
          created_at: string
          descricao: string | null
          id: string
          nome: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
        }
        Relationships: []
      }
      projetos: {
        Row: {
          analista_id: string | null
          created_at: string
          data_abertura: string | null
          data_atualizacao_sigum: string | null
          data_fiscalizacao: string | null
          data_inicio_cobranca: string | null
          data_resposta: string | null
          empresa_id: string
          id: string
          localidade_id: string
          numero_chamado: string | null
          numero_contrato_sigum: string | null
          numero_projeto: string
          observacoes: string | null
          projeto_cadastrado: boolean
          quantidade_postes: number
          solicitante: string | null
          status_cobranca_id: string | null
          status_fiscalizacao_id: string | null
          updated_at: string
        }
        Insert: {
          analista_id?: string | null
          created_at?: string
          data_abertura?: string | null
          data_atualizacao_sigum?: string | null
          data_fiscalizacao?: string | null
          data_inicio_cobranca?: string | null
          data_resposta?: string | null
          empresa_id: string
          id?: string
          localidade_id: string
          numero_chamado?: string | null
          numero_contrato_sigum?: string | null
          numero_projeto: string
          observacoes?: string | null
          projeto_cadastrado?: boolean
          quantidade_postes?: number
          solicitante?: string | null
          status_cobranca_id?: string | null
          status_fiscalizacao_id?: string | null
          updated_at?: string
        }
        Update: {
          analista_id?: string | null
          created_at?: string
          data_abertura?: string | null
          data_atualizacao_sigum?: string | null
          data_fiscalizacao?: string | null
          data_inicio_cobranca?: string | null
          data_resposta?: string | null
          empresa_id?: string
          id?: string
          localidade_id?: string
          numero_chamado?: string | null
          numero_contrato_sigum?: string | null
          numero_projeto?: string
          observacoes?: string | null
          projeto_cadastrado?: boolean
          quantidade_postes?: number
          solicitante?: string | null
          status_cobranca_id?: string | null
          status_fiscalizacao_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projetos_analista_id_fkey"
            columns: ["analista_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projetos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projetos_localidade_id_fkey"
            columns: ["localidade_id"]
            isOneToOne: false
            referencedRelation: "localidades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projetos_status_cobranca_id_fkey"
            columns: ["status_cobranca_id"]
            isOneToOne: false
            referencedRelation: "status_cobranca"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projetos_status_fiscalizacao_id_fkey"
            columns: ["status_fiscalizacao_id"]
            isOneToOne: false
            referencedRelation: "status_fiscalizacao"
            referencedColumns: ["id"]
          },
        ]
      }
      status_cobranca: {
        Row: {
          ativo: boolean
          created_at: string
          id: string
          nome: string
          ordem: number
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome: string
          ordem?: number
        }
        Update: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome?: string
          ordem?: number
        }
        Relationships: []
      }
      status_fiscalizacao: {
        Row: {
          ativo: boolean
          created_at: string
          id: string
          nome: string
          ordem: number
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome: string
          ordem?: number
        }
        Update: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome?: string
          ordem?: number
        }
        Relationships: []
      }
      usuarios: {
        Row: {
          ativo: boolean
          cargo: string | null
          created_at: string
          id: string
          matricula: string | null
          nome: string | null
          perfil_id: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          cargo?: string | null
          created_at?: string
          id: string
          matricula?: string | null
          nome?: string | null
          perfil_id?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          cargo?: string | null
          created_at?: string
          id?: string
          matricula?: string | null
          nome?: string | null
          perfil_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "usuarios_perfil_id_fkey"
            columns: ["perfil_id"]
            isOneToOne: false
            referencedRelation: "perfis_acesso"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
