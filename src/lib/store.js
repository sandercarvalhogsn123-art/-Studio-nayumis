const initialContent = {
  navHome: 'Início', navServices: 'Serviços', navProfessionals: 'Profissionais', navBooking: 'Agendar', headerCta: 'Agendar agora',
  heroEyebrow: 'BELEZA • CUIDADO • PRECISÃO', heroTitle: 'Studio Nayumi Siqueira', heroText: 'Nails & Lash com atendimento personalizado e agendamento simples.', heroPrimary: 'Agendar agora', heroSecondary: 'Ver serviços', heroCardLabel: 'Studio',
  feature1Title: 'Agenda inteligente', feature1Text: 'Escolha um horário realmente livre.', feature2Title: 'Serviços personalizados', feature2Text: 'Duração e valores claros antes da reserva.', feature3Title: 'Reserva segura', feature3Text: 'Sem conflitos ou horários duplicados.',
  homeServicesEyebrow: 'SERVIÇOS', homeServicesTitle: 'Escolha seu cuidado', homeServicesLink: 'Ver todos', homeProfessionalsEyebrow: 'PROFISSIONAIS', homeProfessionalsTitle: 'Atendimento especializado',
  servicesEyebrow: 'SERVIÇOS', servicesTitle: 'Serviços', serviceFallbackDescription: 'Veja detalhes, duração e valor deste serviço.', serviceButton: 'Agendar',
  professionalsEyebrow: 'EQUIPE', professionalsTitle: 'Profissionais',
  bookingEyebrow: 'AGENDAMENTO', bookingTitle: 'Reserve seu horário', bookingServiceLabel: '1. Serviço', bookingProfessionalLabel: '2. Profissional', bookingDateLabel: '3. Data', bookingSlotsLabel: '4. Horários disponíveis', bookingEmptySlots: 'Escolha serviço, profissional e uma data com expediente.', bookingNameLabel: 'Nome *', bookingPhoneLabel: 'WhatsApp *', bookingNotesLabel: 'Observações', bookingConfirmButton: 'Confirmar agendamento', bookingConfirmingButton: 'Confirmando...', bookingSummaryTitle: 'Resumo', bookingSuccessTitle: 'Agendamento confirmado ✨', bookingSuccessText: 'Seu horário foi reservado com sucesso.', bookingNewButton: 'Novo agendamento',
  footerAddressFallback: 'Endereço editável no painel administrativo', footerAdmin: 'Admin'
}

const initial = {
  settings: { name: 'Studio Nayumi Siqueira', subtitle: 'Nails & Lash', phone: '', instagram: '', address: '', primary: '#b78877', background: '#f7f1eb', hero: '#efe2d8', logo: '', content: initialContent },
  services: [
    { id: 's1', name: 'Esmaltação em Gel', category: 'Nails', description: 'Acabamento duradouro e elegante.', price: 120, duration: 120, active: true },
    { id: 's2', name: 'Banho em Gel', category: 'Nails', description: 'Proteção e resistência com acabamento natural.', price: 100, duration: 90, active: true },
  ],
  professionals: [{ id: 'p1', name: 'Nayumi Siqueira', bio: 'Nail designer e lash specialist.', active: true, services: ['s1', 's2'], hours: {1:['08:00','18:00'],2:['08:00','18:00'],3:['08:00','18:00'],4:['08:00','18:00'],5:['08:00','18:00'],6:['08:00','14:00']} }],
  appointments: [], expenses: [], gallery: [], blocks: [],
}
function asArray(value,fallback=[]){return Array.isArray(value)?value:fallback}
export function load(){try{const raw=localStorage.getItem('nayumi-data');if(!raw)return initial;const saved=JSON.parse(raw);if(!saved||typeof saved!=='object')return initial;return {...initial,...saved,settings:{...initial.settings,...(saved.settings&&typeof saved.settings==='object'?saved.settings:{}),content:{...initialContent,...(saved.settings?.content&&typeof saved.settings.content==='object'?saved.settings.content:{})}},services:asArray(saved.services,initial.services),professionals:asArray(saved.professionals,initial.professionals),appointments:asArray(saved.appointments),expenses:asArray(saved.expenses),gallery:asArray(saved.gallery),blocks:asArray(saved.blocks)}}catch{return initial}}
export function save(data){try{localStorage.setItem('nayumi-data',JSON.stringify(data))}catch(error){console.warn('Não foi possível salvar os dados locais.',error)}}
export {initial,initialContent}
