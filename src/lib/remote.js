import { supabase, hasSupabase } from './supabase';

export async function loadRemote(base){
  if(!hasSupabase) return base;
  const [bs,sv,pr,ps,wh,ap,bl,ft,ga] = await Promise.all([
    supabase.from('business_settings').select('*').limit(1).maybeSingle(),
    supabase.from('services').select('*').order('sort_order'),
    supabase.from('professionals').select('*').order('name'),
    supabase.from('professional_services').select('*'),
    supabase.from('working_hours').select('*'),
    supabase.from('appointments').select('*').order('start_datetime'),
    supabase.from('blocked_times').select('*'),
    supabase.from('financial_transactions').select('*').order('transaction_date',{ascending:false}),
    supabase.from('gallery_items').select('*').order('sort_order')
  ]);
  const settings=bs.data?{
    ...base.settings,name:bs.data.business_name,subtitle:bs.data.subtitle||'',phone:bs.data.phone||'',instagram:bs.data.instagram||'',address:bs.data.address||'',primary:bs.data.primary_color||base.settings.primary,background:bs.data.hero_color||base.settings.background,hero:bs.data.hero_color||base.settings.hero,logo:bs.data.profile_image_url||bs.data.logo_url||''
  }:base.settings;
  const services=(sv.data||[]).map(s=>({id:s.id,name:s.name,category:s.category||'',description:s.description||'',price:Number(s.price),duration:s.duration_minutes,active:s.active,image:s.image_url||''}));
  const professionals=(pr.data||[]).map(p=>({id:p.id,name:p.name,bio:p.bio||'',image:p.image_url||'',active:p.active,services:(ps.data||[]).filter(x=>x.professional_id===p.id).map(x=>x.service_id),hours:Object.fromEntries((wh.data||[]).filter(x=>x.professional_id===p.id&&x.active).map(x=>[x.weekday,[x.start_time.slice(0,5),x.end_time.slice(0,5)]]))}));
  const appointments=(ap.data||[]).map(a=>{const d=new Date(a.start_datetime);const e=new Date(a.end_datetime);const local=(x)=>new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).format(x);const tm=(x)=>new Intl.DateTimeFormat('pt-BR',{timeZone:'America/Sao_Paulo',hour:'2-digit',minute:'2-digit',hour12:false}).format(x);return {id:a.id,clientName:a.client_name,phone:a.client_phone,email:a.client_email||'',notes:a.notes||'',serviceId:a.service_id,professionalId:a.professional_id,date:local(d),start:tm(d),end:tm(e),price:Number(a.price),status:a.status==='confirmed'?'confirmado':a.status==='cancelled'?'cancelado':a.status==='completed'?'concluido':a.status,createdAt:a.created_at}});
  const blocks=(bl.data||[]).map(b=>{const d=new Date(b.start_datetime),e=new Date(b.end_datetime);return {id:b.id,professionalId:b.professional_id,date:new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo'}).format(d),start:new Intl.DateTimeFormat('pt-BR',{timeZone:'America/Sao_Paulo',hour:'2-digit',minute:'2-digit',hour12:false}).format(d),end:new Intl.DateTimeFormat('pt-BR',{timeZone:'America/Sao_Paulo',hour:'2-digit',minute:'2-digit',hour12:false}).format(e),reason:b.reason||''}});
  const expenses=(ft.data||[]).filter(x=>x.type==='saida').map(x=>({id:x.id,description:x.description||'',category:x.category||'',amount:Number(x.amount),date:x.transaction_date}));
  return {...base,settings,services:services.length?services:base.services,professionals:professionals.length?professionals:base.professionals,appointments,blocks,expenses,gallery:ga.data||[]};
}

export async function remoteAvailableSlots(serviceId,professionalId,date){
  if(!hasSupabase) return null;
  const {data,error}=await supabase.rpc('get_available_slots',{p_service_id:serviceId,p_professional_id:professionalId,p_date:date});
  if(error) throw error;
  return (data||[]).map(x=>String(x.slot_time).slice(0,5));
}

export async function remoteBook({serviceId,professionalId,date,time,client}){
  const {data,error}=await supabase.rpc('book_appointment',{p_service_id:serviceId,p_professional_id:professionalId,p_date:date,p_time:time,p_client_name:client.name,p_client_phone:client.phone,p_client_email:client.email||null,p_notes:client.notes||null});
  if(error) throw error;
  return data;
}
