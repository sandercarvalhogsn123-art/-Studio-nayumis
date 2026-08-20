import { useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function ServicesAdmin({ data, setData }) {
  const blank = { name: '', category: 'Nails', description: '', price: 0, duration: 60, active: true };
  const [f, setF] = useState(blank);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function add(e) {
    e.preventDefault();
    if (!f.name.trim()) return;
    setSaving(true);
    setError('');
    const payload = {
      name: f.name.trim(),
      category: f.category.trim(),
      description: f.description.trim(),
      price: Number(f.price || 0),
      duration_minutes: Number(f.duration || 60),
      active: true
    };
    const { data: created, error: dbError } = await supabase.from('services').insert(payload).select().single();
    setSaving(false);
    if (dbError) { setError(dbError.message); return; }
    const item = {
      id: created.id,
      name: created.name,
      category: created.category || '',
      description: created.description || '',
      price: Number(created.price || 0),
      duration: created.duration_minutes || 0,
      active: created.active !== false,
      image: created.image_url || ''
    };
    setData(d => ({ ...d, services: [...d.services, item] }));
    setF(blank);
  }

  async function del(id) {
    if (!confirm('Excluir serviço?')) return;
    setError('');
    const { error: dbError } = await supabase.from('services').delete().eq('id', id);
    if (dbError) { setError(dbError.message); return; }
    setData(d => ({ ...d, services: d.services.filter(s => s.id !== id) }));
  }

  return <>
    <div className="admin-head"><div><span className="eyebrow">CATÁLOGO</span><h1>Serviços</h1></div></div>
    <form className="panel form-grid" onSubmit={add}>
      <input placeholder="Nome" value={f.name} onChange={e => setF({ ...f, name: e.target.value })} />
      <input placeholder="Categoria" value={f.category} onChange={e => setF({ ...f, category: e.target.value })} />
      <input type="number" step="0.01" placeholder="Preço" value={f.price} onChange={e => setF({ ...f, price: e.target.value })} />
      <input type="number" placeholder="Duração (min)" value={f.duration} onChange={e => setF({ ...f, duration: e.target.value })} />
      <input className="span2" placeholder="Descrição" value={f.description} onChange={e => setF({ ...f, description: e.target.value })} />
      <button className="btn" disabled={saving}>{saving ? 'Salvando...' : 'Adicionar serviço'}</button>
    </form>
    {error && <div className="panel"><small>{error}</small></div>}
    <div className="panel">{data.services.map(s => <div className="list-row" key={s.id}><div><b>{s.name}</b><small>{s.duration} min • R$ {Number(s.price).toFixed(2)}</small></div><button className="danger" onClick={() => del(s.id)}>Excluir</button></div>)}</div>
  </>;
}
