# Studio Nayumi Siqueira — Agenda

Projeto React/Vite para um site de agendamento Nails & Lash com painel administrativo.

## O que já está implementado
- Site público responsivo, visual creme/rosé gold e capa sem imagem.
- Serviços e profissionais.
- Fluxo de agendamento completo.
- Agenda inteligente por duração do serviço, com prevenção de sobreposição.
- Exemplo: Esmaltação em Gel = 120 min; Banho em Gel = 90 min.
- Painel admin com Dashboard, Agenda, Serviços, Profissionais, Financeiro, Editar Site e Integrações.
- Exportação CSV/PDF no financeiro.
- Modo demo local usando localStorage.
- Integração preparada para Supabase Auth/Postgres.
- SQL base com constraint de não sobreposição no banco.
- WhatsApp e MinhaAgenda marcados como “Não conectado”, sem simulação.

## Rodar localmente
```bash
npm install
npm run dev
```

## Acesso demo
Enquanto o Supabase não estiver configurado:
- E-mail: `admin@studio.local`
- Senha: `admin123`

> Esse login é apenas demonstração local. Em produção, configure o Supabase e remova o fallback de demo.

## Supabase
1. Crie um projeto no Supabase.
2. Rode `supabase/schema.sql` no SQL Editor.
3. Copie `.env.example` para `.env`.
4. Preencha `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
5. Crie seu usuário administrador no Supabase Auth.

## Publicar na Vercel
1. Envie este projeto para um repositório GitHub.
2. Importe o repositório na Vercel.
3. Adicione as variáveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
4. Build command: `npm run build`.
5. Output: `dist`.

## Próximos passos recomendados para produção
- Trocar o store local por CRUD integral do Supabase.
- Criar `admin_profiles` + RLS por administrador.
- Salvar imagens em Supabase Storage e ativar recorte real com `react-easy-crop`.
- Adicionar calendário semana/mês completo.
- Conectar API oficial do WhatsApp Business para lembretes.
- Conectar MinhaAgenda somente quando houver API oficial/autorizada.
