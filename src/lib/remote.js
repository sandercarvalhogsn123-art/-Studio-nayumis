import { supabase, hasSupabase } from './supabase';

const ok = r => (r && !r.error && Array.isArray(r.data)) ? r.data : [];
const statusPt = s => s==='pending'?'pendente':s==='confirmed'?'confirmado':s==='completed'?'concluido':s==='cancelled'?'cancelado':s==='no_show'?'nao_compareceu':s;

export async function loadRemote(base){
  if(!hasSupabase) return base;
  try {
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
    const bsd = bs && !bs.error ? bs.data : null;
    const settings=bsd?{...base.settings,name:bsd.business_name||base.settings.name,subtitle:bsd.subtitle||'',phone:bsd.phone||'',instagram:bsd.instagram||'',address:bsd.address||'',primary:bsd.primary_color||base.settings.primary,background:bsd.hero_color||base.settings.background,hero:bsd.hero_color||base.settings.hero,logo:bsd.profile_image_url||bsd.logo_url||base.settings.logo||'',content:{...(base.settings.content||{}),...(bsd.site_content&&typeof bsd.site_content==='object'?bsd.site_content:{})}}:base.settings;
    const services=ok(sv).map(s=>({id:s.id,name:s.name,category:s.category||'',description:s.description||'',price:Number(s.price||0),duration:s.duration_minutes||0,active:s.active!==false,image:s.image_url||''}));
    const psd=ok(ps), whd=ok(wh);
    const professionals=ok(pr).map(p=>({id:p.id,name:p.name,bio:p.bio||'',image:p.image_url||'',active:p.active!==false,services:psd.filter(x=>x.professional_id===p.id).map(x=>x.service_id),hours:Object.fromEntries(whd.filter(x=>x.professional_id===p.id&&x.active).map(x=>[x.weekday,[String(x.start_time||'').slice(0,5),String(x.end_time||'').slice(0,5)]]))}));
    const appointments=ok(ap).map(a=>({id:a.id,clientName:a.client_name,phone:a.client_phone,email:a.client_email||'',notes:a.notes||'',serviceId:a.service_id,professionalId:a.professional_id,date:String(a.start_datetime||'').slice(0,10),start:new Date(a.start_datetime).toLocaleTimeString('pt-BR',{timeZone:'America/Sao_Paulo',hour:'2-digit',minute:'2-digit'}),end:new Date(a.end_datetime).toLocaleTimeString('pt-BR',{timeZone:'America/Sao_Paulo',hour:'2-digit',minute:'2-digit'}),price:Number(a.price||0),status:statusPt(a.status),createdAt:a.created_at}));
    const blocks=ok(bl).map(b=>({id:b.id,professionalId:b.professional_id,date:String(b.start_datetime||'').slice(0,10),start:new Date(b.start_datetime).toLocaleTimeString('pt-BR',{timeZone:'America/Sao_Paulo',hour:'2-digit',minute:'2-digit'}),end:new Date(b.end_datetime).toLocaleTimeString('pt-BR',{timeZone:'America/Sao_Paulo',hour:'2-digit',minute:'2-digit'}),reason:b.reason||''}));
    const expenses=ok(ft).filter(x=>x.type==='saida').map(x=>({id:x.id,description:x.description||'',category:x.category||'',amount:Number(x.amount||0),date:x.transaction_date}));
    return {...base,settings,services:services.length?services:base.services,professionals:professionals.length?professionals:base.professionals,appointments,blocks,expenses,gallery:ok(ga)};
  } catch(e){ console.error('Falha ao sincronizar dados remotos:',e); return base; }
}

export async function remoteAvailableSlots(serviceId,professionalId,date){if(!hasSupabase)return null;const {data,error}=await supabase.rpc('get_available_slots',{p_service_id:serviceId,p_professional_id:professionalId,p_date:date});if(error)throw error;return(data||[]).map(x=>String(x.slot_time).slice(0,5));}
export async function remoteBook({serviceId,professionalId,date,time,client}){const {data,error}=await supabase.rpc('book_appointment',{p_service_id:serviceId,p_professional_id:professionalId,p_date:date,p_time:time,p_client_name:client.name,p_client_phone:client.phone,p_client_email:client.email||null,p_notes:client.notes||null});if(error)throw error;return data;}
