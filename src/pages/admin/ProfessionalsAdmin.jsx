import { useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function ProfessionalsAdmin({ data, setData }) {
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function add(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError('');
    const { data: created, error: dbError } = await supabase
      .from('professionals')
      .insert({ name: name.trim(), bio: '', active: true })
      .select()
      .single();
    if (dbError) { setSaving(false); setError(dbError.message); return; }

    if (data.services.length) {
      const links = data.services.map(s => ({ professional_id: created.id, service_id: s.id }));
      const { error: linkError } = await supabase.from('professional_services').insert(links);
      if (linkError) { setSaving(false); setError(linkError.message); return; }
    }

    const hours = [1,2,3,4,5].map(weekday => ({
      professional_id: created.id,
      weekday,
      start_time: '08:00',
      end_time: '18:00',
      active: true
    }));
    const { error: hoursError } = await supabase.from('working_hours').insert(hours);
    setSaving(false);
    if (hoursError) { setError(hoursError.message); return; }

    setData(d => ({
      ...d,
      professionals: [...d.professionals, {
        id: created.id,
        name: created.name,
        bio: created.bio || '',
        image: created.image_url || '',
        active: created.active !== false,
        services: d.services.map(s => s.id),
        hours: {1:['08:00','18:00'],2:['08:00','18:00'],3:['08:00','18:00'],4:['08:00','18:00'],5:['08:00','18:00']}
      }]
    }));
    setName('');
  }

  async function toggle(p, active) {
    setError('');
    const { error: dbError } = await supabase.from('professionals').update({ active }).eq('id', p.id);
    if (dbError) { setError(dbError.message); return; }
    setData(d => ({ ...d, professionals: d.professionals.map(x => x.id === p.id ? { ...x, active } : x) }));
  }

  return <>
    <div className="admin-head"><h1>Profissionais</h1></div>
    <form className="panel inline" onSubmit={add}>
      <input placeholder="Nome da profissional" value={name} onChange={e => setName(e.target.value)} />
      <button className="btn" disabled={saving}>{saving ? 'Salvando...' : 'Adicionar'}</button>
    </form>
    {error && <div className="panel"><small>{error}</small></div>}
    <div className="panel">{data.professionals.map(p => <div className="list-row" key={p.id}><div><b>{p.name}</b><small>{p.bio || 'Bio editável'}</small></div><label className="switch">Ativa <input type="checkbox" checked={p.active} onChange={e => toggle(p, e.target.checked)} /></label></div>)}</div>
  </>;
}
