import { supabase as generatedSupabase } from "../integrations/supabase/client";

// O banco recém-ativado ainda não possui tipos gerados para o esquema legado.
// Mantém as consultas existentes utilizáveis até a próxima geração automática.
export const supabase: any = generatedSupabase;