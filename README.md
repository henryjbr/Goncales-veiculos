# Gonçales Veículos

Site estático com catálogo público de veículos e painel administrativo integrado ao Supabase.

## Estrutura

- `index.html`: página pública do catálogo.
- `admin.html`: área do dono para gestão direta do estoque.
- `css/`: estilos do site.
- `js/`: JavaScript da aplicação e configuração do Supabase.
- `assets/`: logos e imagens fixas do projeto.
- `database/`: SQL para criar/atualizar o banco no Supabase.
- `docs/screenshots/`: capturas usadas para validação visual.
- `server.mjs`: servidor local simples para testar o site.

## Deploy na Vercel

O projeto gera uma pasta `dist` com todos os arquivos publicos.

- Build Command: `npm run build`
- Output Directory: `dist`
- Framework Preset: `Other`
- Root Directory: deixe vazio se o repositorio for somente este projeto

Se a Vercel mostrar a pagina sem CSS, imagem e JavaScript, confira se ela esta usando a branch `master` e faca um redeploy sem cache.

## Supabase

1. Rode `database/supabase-schema.sql` no SQL Editor do Supabase.
2. Edite `js/supabase-config.js` com a URL e anon key do projeto.
3. A área do dono abre sem login. Quem tiver acesso ao link do painel poderá alterar o estoque.

Se aparecer `new row violates row-level security policy` ao salvar um carro, rode novamente `database/supabase-schema.sql` no Supabase para aplicar as permissões sem login.
