# Gonçales Veículos

Site estático com catálogo público de veículos e painel administrativo integrado ao Supabase.

## Estrutura

- `index.html`: página pública do catálogo.
- `admin.html`: área do dono para login e gestão do estoque.
- `css/`: estilos do site.
- `js/`: JavaScript da aplicação e configuração do Supabase.
- `assets/`: logos e imagens fixas do projeto.
- `database/`: SQL para criar/atualizar o banco no Supabase.
- `docs/screenshots/`: capturas usadas para validação visual.
- `server.mjs`: servidor local simples para testar o site.

## Supabase

1. Rode `database/supabase-schema.sql` no SQL Editor do Supabase.
2. Edite `js/supabase-config.js` com a URL e anon key do projeto.
3. Crie o usuário do dono no Supabase Authentication.
4. Substitua `DONO@EMAIL.COM` no SQL pelo e-mail real do dono antes de rodar o bootstrap.
