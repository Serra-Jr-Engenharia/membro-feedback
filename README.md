# Membro Feedback

## Lembretes de avaliação por e-mail

Em produção, a Vercel executa diariamente `GET /api/cron/send-evaluation-reminders` pelo cron configurado em [vercel.json](vercel.json). O agendamento `0 11 * * *` está em UTC (atualmente, 08:00 em `America/Sao_Paulo`); o worker sempre decide a elegibilidade pela data local de São Paulo.

O cron é automático somente em deployments de produção. No plano Hobby, a execução pode ocorrer dentro de uma janela aproximada de uma hora, portanto não deve ser tratada como pontual ao minuto.

### Configuração de produção

Antes do deployment de produção, cadastre as variáveis abaixo apenas no ambiente server-side da Vercel. Use [.env.example](.env.example) como referência de nomes e formatos, mas nunca copie segredos para arquivos versionados nem use o prefixo `VITE_`.

| Variável | Finalidade |
| --- | --- |
| `CRON_SECRET` | Protege a rota do cron; a chamada precisa enviar `Authorization: Bearer <CRON_SECRET>`. |
| `SUPABASE_URL` | URL do projeto Supabase. |
| `SUPABASE_SERVICE_ROLE_KEY` | Permite ao worker acessar os dados e os logs sem expor a credencial ao navegador. |
| `RESEND_API_KEY` | Chave de API usada exclusivamente para enviar os e-mails. |
| `RESEND_FROM_EMAIL` | Remetente; o domínio correspondente deve estar verificado no Resend antes da ativação. |
| `APP_URL` | URL pública do dashboard usada no link do e-mail. |
| `MEMBER_CYCLE_ANCHOR_DATE` | Segunda-feira que ancora os blocos quinzenais globais de Membros, no formato `YYYY-MM-DD`. |

### Operação e acompanhamento

- Não exponha a rota ao frontend: ela aceita somente `GET` e exige o `CRON_SECRET` no cabeçalho `Authorization`.
- Acompanhe cada execução nos logs da Function na Vercel. A resposta registra os contadores `scanned`, `sent`, `skipped` e `failed`.
- Use `reminder_logs` para conferir reservas, envios e falhas por usuário/ciclo. Falhas de entrega ficam registradas para diagnóstico e não são reenviadas automaticamente fora da janela de dois dias.
- Antes de ativar, verifique o domínio remetente no Resend e configure todas as variáveis no ambiente de produção. Não dispare envios reais sem essa configuração explícita.

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

## Supabase workflow

This project uses Supabase migrations as the source of truth for database changes.

- Keep generated local state out of Git. The repo already ignores `supabase/.temp/`.
- Use the dashboard only to inspect the database, not to create long-lived schema changes.
- Create new changes with `npx supabase migration new <migration_name>`.
- Apply changes with `npx supabase db push` after the migration is committed.
- If you need to align with an existing remote schema, run `npx supabase db pull` first, then review the generated migration before merging.

For this repository, the current remote schema has already been pulled into migrations, so the team should follow a single path from now on:

1. Update the existing migration baseline only when the remote schema itself changes outside the repo.
2. Create every new table, column, policy, function, or trigger as a new migration file.
3. Never split the same schema change between the Supabase dashboard and a migration.
4. Run `npx supabase db push` from the branch that contains the migration before merging it to `development`.
5. If a migration was generated from the remote baseline, keep it in Git even if it looks small or empty, because it is part of the applied history.

Suggested team flow:

1. `npx supabase login`
2. `npx supabase link --project-ref <project_ref>`
3. `npx supabase db pull` only when the remote schema changed outside Git and you need to refresh the baseline
4. `npx supabase migration new <name>` for each new database change
5. `npx supabase db push` to apply the migration
6. Open a PR into `development` after the migration works locally

If `db pull` fails with a Docker error, start Docker Desktop and retry after `docker ps` works locally.

## Database migrations

The migration [supabase/migrations/20260818002652_remote_schema.sql](supabase/migrations/20260818002652_remote_schema.sql) is the current local baseline for the remote schema.
Add future schema changes as separate files in [supabase/migrations](supabase/migrations).
