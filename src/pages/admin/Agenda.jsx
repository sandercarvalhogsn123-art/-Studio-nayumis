import React, {useState} from 'react';
import {supabase} from '../../lib/supabase';

const toDbStatus={pendente:'pending',confirmado:'confirmed',concluido:'completed',cancelado:'cancelled',nao_compareceu:'no_show'};

export default function Agenda({data,setData}){
  const [date,setDate]=useState(new Date().toISOString().slice(0,10));
  const [pro,setPro]=useState('');
  const [saving,setSaving]=useState('');
  const [error,setError]=useState('');
  const apps=data.appointments.filter(a=>a.date===date&&(!pro||a.professionalId===pro)).sort((a,b)=>a.start.localeCompare(b.start));

  async function status(id,s){
    setSaving(id);setError('');
    try{
      const {error}=await supabase.from('appointments').update({status:toDbStatus[s]||s,updated_at:new Date().toISOString()}).eq('id',id);
      if(error)throw error;
      setData(d=>({...d,appointments:d.appointments.map(a=>a.id===id?{...a,status:s}:a)}));
    }catch(e){setError(e.message||'Não foi possível atualizar o status.')}finally{setSaving('')}
  }

  return <>
    <div className="admin-head"><div><span className="eyebrow">AGENDA</span><h1>Calendário</h1></div><div className="filters"><input type="date" value={date} onChange={e=>setDate(e.target.value)}/><select value={pro} onChange={e=>setPro(e.target.value)}><option value="">Todos profissionais</option>{data.professionals.map(p=><option value={p.id} key={p.id}>{p.name}</option>)}</select></div></div>
    {error&&<div className="panel" style={{marginBottom:16}}><b>Erro:</b> {error}</div>}
    <div className="calendar-day"><div className="timeline">{Array.from({length:16},(_,i)=><div key={i}>{String(8+i).padStart(2,'0')}:00</div>)}</div><div className="appointments">{apps.length?apps.map(a=>{const svc=data.services.find(s=>s.id===a.serviceId);const p=data.professionals.find(p=>p.id===a.professionalId);return <article className="appointment" key={a.id}><div><strong>{a.start}–{a.end} • {a.clientName}</strong><span>{svc?.name} • {p?.name}</span><small>{a.phone}</small></div><select disabled={saving===a.id} value={a.status} onChange={e=>status(a.id,e.target.value)}><option value="pendente">Pendente</option><option value="confirmado">Confirmado</option><option value="concluido">Concluído</option><option value="cancelado">Cancelado</option><option value="nao_compareceu">Não compareceu</option></select></article>}):<div className="empty">Nenhum agendamento neste dia.</div>}</div></div>
  </>
}
