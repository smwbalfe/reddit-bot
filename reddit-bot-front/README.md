# shadcn/ui + tailwind + next.js basic project template

- `src` - components, hooks, pages, utils ...
- `app` - root routing logic.
- `components.json` - shadcn/ui configuration file.
- `tailwind.config.ts` - tailwind configuration file.

---
- Add more components using `npx shadcn@latest add <component>` where `<component>` is one of many from [shadcn/ui](https://ui.shadcn.com/docs/components/button)

# SaaS Starter Template

### Payments

- Stripe
    - Generate a checkout session
    - Deal with webhook events
    - stripe listen --forward-to localhost:3000/api/webhooks/stripe

### Authentication

- Supabase
     - Setup confirmation email to our API route for OTP confirmation
     - Setup Google Auth with the env

### Database
- Supabase (PostgreSQL)
- Drizzle ORM
  - `yarn db:generate` - generates migration files from schema
  - `yarn db:migrate` - applies migrations to database
  - `yarn db:studio` - visual database editor

### UI

- TailwindCSS
    - Using tailwind v4 `@theme` tag to control global styling system.
    - All configuration is centered in `src/globals.css`.
    - Utilises [Theme variable namespaces](https://tailwindcss.com/docs/theme#theme-variable-namespaces)
- ShadCN
    - We have currently included all shadcn components, make sure to remove unused ones after.

### Email

- Resend
    - Setup records & DNS.
