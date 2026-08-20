import { supabase } from './supabase'

export async function ensureAdmin() {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession()

  if (sessionError || !session) return false

  const { data: isAdmin, error } = await supabase.rpc('is_admin')

  if (error) {
    console.error('Erro ao verificar acesso administrativo:', error)
    return false
  }

  return isAdmin === true
}
