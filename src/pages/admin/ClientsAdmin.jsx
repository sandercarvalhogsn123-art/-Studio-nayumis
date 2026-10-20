import {useMemo,useState} from 'react';
import Papa from 'papaparse';
import {supabase} from '../../lib/supabase';
const blank={name:'',phone:'',email:'',notes:''};
const digits=v=>String(v||'').replace(/\D/g,'');
const cleanPhone=v=>String(Array.isArray(v)?v[0]||'':v||'').trim();
const normalizeHeader=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
const unescapeVCard=v=>String(v||'').replace(/\\n/gi,' ').replace(/\\,/g,',').replace(/\\;/g,';').replace(/\\\\/g,'\\').trim();
function parseVCard(text){
 const unfolded=String(text||'').replace(/\r\n[ \t]/g,'').replace(/\n[ \t]/g,'');
 return unfolded.split(/BEGIN:VCARD/i).slice(1).map(block=>{
  const fields=block.split(/\r?\n/);let name='',phone='',email='';
  for(const line of fields){const ix=line.indexOf(':');if(ix<0)continue;const key=line.slice(0,ix).split(';')[0].split('.').pop().toUpperCase(),value=unescapeVCard(line.slice(ix+1));if(key==='FN')name=value;else if(key==='N'&&!name){const p=value.split(';');name=[p[1],p[0]].filter(Boolean).join(' ').trim()}else if(key==='TEL'&&!phone)phone=value;else if(key==='EMAIL'&&!email)email=value}
  return{name,phone,email,notes:''};
 }).filter(x=>x.name&&digits(x.phone));
}
function parseContactsFile(text,name){
 if(/\.vcf$|\.vcard$/i.test(name)||/BEGIN:VCARD/i.test(text))return parseVCard(text);
 const parsed=Papa.parse(text,{header:true,skipEmptyLines:true});
 return(parsed.data||[]).map(row=>{
  const entries=Object.entries(row).filter(([k,v])=>String(v||'').trim());
  const find=test=>entries.find(([k])=>test(normalizeHeader(k)))?.[1]||'';
  let nameValue=find(k=>/^(full name|name|nome|contact name|display name)$/.test(k));
  if(!nameValue){const first=find(k=>/(given name|first name|nome proprio|primeiro nome)$/.test(k));const last=find(k=>/(family name|last name|sobrenome)$/.test(k));nameValue=[first,last].filter(Boolean).join(' ')}
  const phone=find(k=>(k.includes('phone')||k.includes('telefone')||k.includes('celular')||k==='tel')&&!/(type|label|country code|codigo)/.test(k));
  const email=find(k=>k==='email'||k.includes('e-mail')||k.includes('email address')||k.includes('email 1'));
  return{name:String(nameValue||'').trim(),phone:cleanPhone(phone),email:String(email||'').trim(),notes:''};
 }).filter(x=>x.name&&digits(x.phone));
}
export default function ClientsAdmin({data,setData}){
 const [q,setQ]=useState(''),[form,setForm]=useState(blank),[editing,setEditing]=useState(null),[showForm,setShowForm]=useState(false),[saving,setSaving]=useState(false),[error,setError]=useState(''),[selected,setSelected]=useState(null);
 const [importing,setImporting]=useState(false),[importMessage,setImportMessage]=useState(''),[importError,setImportError]=useState('');
 const clients=useMemo(()=>{const map=new Map();(data.clients||[]).forEach(c=>map.set(c.id,c));(data.appointments||[]).forEach(a=>{const key=digits(a.phone)||a.clientName?.toLocaleLowerCase('pt-BR');if(!key)return;const existing=[...map.values()].find(c=>(digits(c.phone)&&digits(c.phone)===digits(a.phone))||c.name?.toLocaleLowerCase('pt-BR')===a.clientName?.toLocaleLowerCase('pt-BR'));if(!existing)map.set('appointment-'+key,{id:'appointment-'+key,name:a.clientName||'Cliente',phone:a.phone||'',email:a.email||'',notes:'',derived:true});});return [...map.values()].filter(c=>!q||[c.name,c.phone,c.email].some(v=>String(v||'').toLocaleLowerCase('pt-BR').includes(q.toLocaleLowerCase('pt-BR')))).sort((a,b)=>a.name.localeCompare(b.name,'pt-BR'))},[data.clients,data.appointments,q]);
 function startEdit(c){setEditing(c.id);setShowForm(true);setForm({name:c.name||'',phone:c.phone||'',email:c.email||'',notes:c.notes||''});setError('');}
 async function save(e){e.preventDefault();if(!form.name.trim()||!form.phone.trim()){setError('Informe o nome e o WhatsApp.');return;}setSaving(true);setError('');const payload={name:form.name.trim(),phone:form.phone.trim(),email:form.email.trim()||null,notes:form.notes.trim()||null,updated_at:new Date().toISOString()};let result;if(editing&&!String(editing).startsWith('appointment-'))result=await supabase.from('clients').update(payload).eq('id',editing).select().single();else result=await supabase.from('clients').insert(payload).select().single();setSaving(false);if(result.error){setError(result.error.message);return;}const c={id:result.data.id,name:result.data.name,phone:result.data.phone||'',email:result.data.email||'',notes:result.data.notes||'',createdAt:result.data.created_at};setData(d=>({...d,clients:editing&&!String(editing).startsWith('appointment-')?(d.clients||[]).map(x=>x.id===editing?c:x):[...(d.clients||[]),c]}));setForm(blank);setEditing(null);setShowForm(false);}
 async function importContactRecords(records){
  setImporting(true);setImportError('');setImportMessage('');
  const unique=new Map();
  (records||[]).forEach(c=>{const phone=cleanPhone(c.phone||c.tel),key=digits(phone),name=String(c.name||c.fn||'').trim();if(key&&name&&!unique.has(key))unique.set(key,{name,phone,email:String(c.email||'').trim(),notes:''})});
  const known=new Set([...(data.clients||[]).map(c=>digits(c.phone)),...(data.appointments||[]).map(a=>digits(a.phone))].filter(Boolean));
  const fresh=[...unique.values()].filter(c=>!known.has(digits(c.phone)));
  if(!fresh.length){setImportMessage(unique.size?'Todos os contatos com telefone já estão cadastrados. Nenhum duplicado foi importado.':'Não encontrei contatos com nome e telefone válidos no arquivo/seleção.');setImporting(false);return}
  const createdRows=[];
  try{
   for(let i=0;i<fresh.length;i+=100){
    const batch=fresh.slice(i,i+100).map(c=>({name:c.name,phone:c.phone,email:c.email||null,notes:c.notes||null}));
    const result=await supabase.from('clients').insert(batch).select();
    if(result.error)throw result.error;
    (result.data||[]).forEach(c=>createdRows.push({id:c.id,name:c.name,phone:c.phone||'',email:c.email||'',notes:c.notes||'',createdAt:c.created_at}));
   }
   setData(d=>({...d,clients:[...(d.clients||[]),...createdRows]}));
   setImportMessage(createdRows.length+' contato(s) importado(s) com sucesso. Contatos repetidos ou sem telefone foram ignorados.');
  }catch(e){
   if(createdRows.length)setData(d=>({...d,clients:[...(d.clients||[]),...createdRows]}));
   setImportError('Foram importados '+createdRows.length+' contato(s) antes do erro: '+(e.message||'falha ao salvar no banco'));
  }finally{setImporting(false)}
 }
 async function pickPhoneContacts(){
  setImportError('');setImportMessage('');
  try{
   if(!navigator.contacts?.select){setImportError('Este navegador não permite abrir a agenda do telefone diretamente. Exporte seus contatos como arquivo .vcf ou .csv e use “Importar arquivo”.');return}
   const selectedContacts=await navigator.contacts.select(['name','tel','email'],{multiple:true});
   await importContactRecords((selectedContacts||[]).map(c=>({name:Array.isArray(c.name)?c.name[0]:c.name,phone:Array.isArray(c.tel)?c.tel[0]:c.tel,email:Array.isArray(c.email)?c.email[0]:c.email})));
  }catch(e){if(e.name!=='AbortError')setImportError(e.message||'Não foi possível acessar os contatos. Tente importar um arquivo .vcf ou .csv.')}
 }
 async function readContactsFile(e){
  const file=e.target.files?.[0];e.target.value='';if(!file)return;
  setImportError('');setImportMessage('');
  try{const text=await file.text();const rows=parseContactsFile(text,file.name);if(!rows.length){setImportError('Não encontrei contatos válidos. Use um arquivo .vcf ou .csv com nome e telefone.');return}await importContactRecords(rows)}catch(err){setImportError(err.message||'Não foi possível ler o arquivo de contatos.')}
 }
 return <><div className="admin-head"><div><span className="eyebrow">RELACIONAMENTO</span><h1>Clientes</h1><p>Cadastro centralizado e histórico de atendimentos.</p></div><div className="client-total">{clients.length} clientes</div></div>
 <section className="panel client-import-panel"><div><h2>Importar contatos do telefone</h2><p className="hint">Importe contatos em lote. Os telefones repetidos são ignorados e os novos ficam salvos na base de clientes do Studio.</p></div><div className="client-import-actions"><button type="button" className="btn" onClick={pickPhoneContacts} disabled={importing}>{importing?'Importando…':'Selecionar contatos do telefone'}</button><label className="btn ghost client-file-button">{importing?'Aguarde…':'Importar arquivo .VCF ou .CSV'}<input type="file" accept=".vcf,.vcard,.csv,text/vcard,text/csv" onChange={readContactsFile} disabled={importing}/></label></div><small className="hint">Se a seleção direta não estiver disponível no seu celular, exporte os contatos pelo aplicativo Contatos como .vcf e envie o arquivo aqui. Também aceitamos CSV do Google Contatos.</small>{importMessage&&<p className="client-import-success">{importMessage}</p>}{importError&&<p className="form-error">{importError}</p>}</section>
 <div className="client-toolbar"><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Buscar por nome, telefone ou e-mail…"/><button className="btn" onClick={()=>{setEditing(null);setForm(blank);setShowForm(true);setError('')}}>+ Novo cliente</button></div>
 {showForm&&<form className="panel form-grid client-form" onSubmit={save}><h2 className="span2">{editing?'Editar cliente':'Novo cliente'}</h2><label>Nome completo<input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required/></label><label>WhatsApp<input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} required/></label><label>E-mail<input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></label><label className="span2">Observações<textarea value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}/></label>{error&&<p className="span2 form-error">{error}</p>}<div className="span2 inline"><button className="btn" disabled={saving}>{saving?'Salvando…':'Salvar cliente'}</button><button type="button" className="btn ghost" onClick={()=>{setEditing(null);setForm(blank);setShowForm(false);setError('')}}>Cancelar</button></div></form>}
 <div className="client-list">{clients.map(c=>{const history=data.appointments.filter(a=>(digits(a.phone)&&digits(a.phone)===digits(c.phone))||a.clientName?.toLocaleLowerCase('pt-BR')===c.name?.toLocaleLowerCase('pt-BR')).sort((a,b)=>(b.date+b.start).localeCompare(a.date+a.start));const attended=history.filter(a=>['concluido','completed'].includes(a.status));const last=attended[0];return <article className="client-card" key={c.id}><div className="client-avatar">{(c.name||'?').trim().slice(0,1).toLocaleUpperCase('pt-BR')}</div><div className="client-info"><strong>{c.name}</strong><span>{c.phone||'Sem WhatsApp'}{c.email?' · '+c.email:''}</span><small>{attended.length} atendimentos realizados{last?' · Último: '+last.date.split('-').reverse().join('/')+' às '+last.start:''}</small></div><div className="client-actions"><button className="text-button" onClick={()=>setSelected(selected===c.id?null:c.id)}>{selected===c.id?'Fechar histórico':'Histórico'}</button><button className="text-button" onClick={()=>startEdit(c)}>Editar</button>{c.phone&&<a className="client-wa" href={'https://wa.me/'+(digits(c.phone).startsWith('55')?digits(c.phone):'55'+digits(c.phone))} target="_blank" rel="noreferrer">WhatsApp</a>}</div>{selected===c.id&&<div className="client-history">{history.length?history.map(a=><div className="list-row" key={a.id}><div><b>{a.date.split('-').reverse().join('/')} · {a.start}</b><small>{data.services.find(s=>s.id===a.serviceId)?.name||'Serviço'} · {data.professionals.find(p=>p.id===a.professionalId)?.name||'Profissional'}</small></div><span className="badge">{a.status}</span></div>):<p className="hint">Nenhum atendimento no histórico.</p>}</div>}</article>})}{!clients.length&&<div className="panel">Nenhum cliente encontrado. Cadastre o primeiro cliente.</div>}</div></>;
}
