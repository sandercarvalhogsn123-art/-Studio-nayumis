const initial = {
  settings: {
    name: 'Studio Nayumi Siqueira',
    subtitle: 'Nails & Lash',
    phone: '',
    instagram: '',
    address: '',
    primary: '#b78877',
    background: '#f7f1eb',
    hero: '#efe2d8',
    logo: '',
  },
  services: [
    {
      id: 's1',
      name: 'Esmaltação em Gel',
      category: 'Nails',
      description: 'Acabamento duradouro e elegante.',
      price: 120,
      duration: 120,
      active: true,
    },
    {
      id: 's2',
      name: 'Banho em Gel',
      category: 'Nails',
      description: 'Proteção e resistência com acabamento natural.',
      price: 100,
      duration: 90,
      active: true,
    },
  ],
  professionals: [
    {
      id: 'p1',
      name: 'Nayumi Siqueira',
      bio: 'Nail designer e lash specialist.',
      active: true,
      services: ['s1', 's2'],
      hours: {
        1: ['08:00', '18:00'],
        2: ['08:00', '18:00'],
        3: ['08:00', '18:00'],
        4: ['08:00', '18:00'],
        5: ['08:00', '18:00'],
        6: ['08:00', '14:00'],
      },
    },
  ],
  appointments: [],
  expenses: [],
  gallery: [],
  blocks: [],
}

function asArray(value, fallback = []) {
  return Array.isArray(value) ? value : fallback
}

export function load() {
  try {
    const raw = localStorage.getItem('nayumi-data')
    if (!raw) return initial

    const saved = JSON.parse(raw)
    if (!saved || typeof saved !== 'object') return initial

    return {
      ...initial,
      ...saved,
      settings: {
        ...initial.settings,
        ...(saved.settings && typeof saved.settings === 'object' ? saved.settings : {}),
      },
      services: asArray(saved.services, initial.services),
      professionals: asArray(saved.professionals, initial.professionals),
      appointments: asArray(saved.appointments),
      expenses: asArray(saved.expenses),
      gallery: asArray(saved.gallery),
      blocks: asArray(saved.blocks),
    }
  } catch {
    return initial
  }
}

export function save(data) {
  try {
    localStorage.setItem('nayumi-data', JSON.stringify(data))
  } catch (error) {
    console.warn('Não foi possível salvar os dados locais.', error)
  }
}

export { initial }
