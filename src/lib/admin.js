import {supabase} from './supabase';
export async function ensureAdmin(){
  const {data:{session}}=await supabase.auth.getSession();
  if(!session) return false;
  let {data:isAdmin}=await supabase.rpc('is_admin');
  if(isAdmin) return true;
  await supabase.rpc('claim_admin');
  ({data:isAdmin}=await supabase.rpc('is_admin'));
  return !!isAdmin;
}
