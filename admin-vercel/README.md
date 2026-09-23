# Goncales Veiculos Admin

Projeto separado para publicar somente a area do dono na Vercel.

## Vercel

- Root Directory: `admin-vercel`
- Build Command: `npm run build`
- Output Directory: `dist`
- Framework Preset: `Other`

Para deixar apenas uma pessoa acessar, ative a protecao de acesso no projeto da Vercel, como Deployment Protection, Password Protection ou acesso via login da equipe, conforme o plano disponivel.

## Supabase

Este painel usa `js/supabase-config.js`. Se o banco estiver com permissoes sem login, quem acessar este dominio podera alterar o estoque.
