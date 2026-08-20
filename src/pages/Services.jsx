import { Link } from 'react-router-dom';

export default function Services({ services }) {
  return <section className="section page">
    <span className="eyebrow">SERVIÇOS</span>
    <h1>Serviços</h1>
    <div className="cards service-cards">
      {services.filter(s => s.active).map(s => <article className="card service-card" key={s.id}>
        {s.image ? <img className="service-image" src={s.image} alt={s.name} /> : <div className="service-image placeholder">Foto do serviço</div>}
        <div className="service-card-body">
          <span>{s.category}</span>
          <h3>{s.name}</h3>
          <p>{s.description || 'Veja detalhes, duração e valor deste serviço.'}</p>
          <div className="row"><b>R$ {Number(s.price).toFixed(2).replace('.', ',')}</b><small>{s.duration} min</small></div>
          <Link className="btn full" to={`/agendar?service=${s.id}`}>Agendar</Link>
        </div>
      </article>)}
    </div>
  </section>;
}
