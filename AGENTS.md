<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# AGENTS.md — MundoPixel SaaS

> Contexto de trabajo para agentes. Lee esto antes de tocar código: describe el stack, las convenciones y las trampas de este repo, **incluida la base de datos (§13, fuente de verdad)**.
> El bloque de arriba lo genera `next dev`: no lo borres ni lo reescribas.

## 1. Qué es este proyecto

SaaS multi-sucursal (marca "MPSAAS") con interfaz **en español** y autenticación con Supabase.

- **Next.js 16.4** (App Router, Turbopack) + **React 19.3** + **TypeScript** estricto
- **Tailwind CSS v4** + **shadcn/ui** style `base-maia` → primitivas de **Base UI** (no Radix)
- **Supabase** (`@supabase/ssr`) para auth y datos; RLS hace el control de acceso real
- **Hugeicons** como única librería de iconos
- **pnpm** como gestor de paquetes (`packageManager: pnpm@11.5.2`) — no uses npm ni yarn

Regla de idiomas: **la UI y el copy en español**, el código y los mensajes de commit en inglés.

## 2. Comandos

| Tarea | Comando |
|---|---|
| Servidor de desarrollo | `pnpm dev` (localhost:3000) |
| Build de producción | `pnpm build` |
| Lint de todo el proyecto | `pnpm lint` |
| Tipos | `pnpm exec tsc --noEmit` |
| Lint de archivos concretos | `pnpm exec eslint <archivo> [<archivo>]` |

**Antes de dar una tarea por terminada:** `pnpm exec tsc --noEmit` + `pnpm exec eslint` sobre los archivos tocados deben pasar sin errores.

No hay framework de tests instalado: la verificación es `tsc` + `eslint` + prueba manual en el dev server. Como smoke test rápido de rutas:

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/profile
```

`307` = redirige a `/auth/login` (esperado sin sesión), `200` = renderiza, `500` = error de compilación o de runtime.

## 3. Estructura y routing

Dos route groups; **no cambian la URL**, solo el layout:

- **`(app)`** — zona autenticada, **con sidebar**. Su `layout.tsx` envuelve en `SidebarProvider` + `AppSidebar` y el contenido en `w-full px-5 py-8`.
- **`(auth)`** — pantallas de autenticación, **sin sidebar**. Su `layout.tsx` solo renderiza `children`.

Rutas actuales:

| Ruta | Archivo | Estado |
|---|---|---|
| `/` | `src/app/(app)/page.tsx` | Home; solo muestra el nombre (pendiente enriquecer) |
| `/profile` | `src/app/(app)/profile/` | Completo: perfil editable + organización (banner o formulario de alta) |
| `/sucursales` | `src/app/(app)/sucursales/` | Completo: tabla de sucursales + crear/editar/eliminar |
| `/miembros` | `src/app/(app)/miembros/` | Completo: lista de members, cambio/borrado, invitaciones con enlace copiable, asignación de sucursales |
| `/invite/[token]` | `src/app/(auth)/invite/[token]/` | Completo: preview pública + botón manual de aceptación (respaldo; el alta normal es automática al confirmar el correo o iniciar sesión) |
| `/confirmed` | `src/app/(auth)/confirmed/route.ts` | Completo: intercambia el código por sesión; si `next` es `/invite/<token>` acepta la invitación (auto-alta) y redirige a `/sucursales`; si no, regresa a `next` |
| `/auth/login` | `src/app/(auth)/auth/login/page.tsx` | Completo |
| `/auth/sign-up` | `src/app/(auth)/auth/sign-up/page.tsx` | Completo (guarda `first_name`/`last_name` en `user_metadata`) |
| `/auth/account/forgot-password` | `src/app/(auth)/auth/account/forgot-password/page.tsx` | Completo |
| `/auth/account/update-password` | `src/app/(auth)/auth/account/update-password/page.tsx` | Completo |
| `/auth/account/error` | `src/app/(auth)/auth/account/error/page.tsx` | Página de error de cuenta |
| `/auth/account/confirm` | `src/app/(auth)/auth/account/confirm/route.ts` | Route handler de confirmación |
| `/auth` | `src/app/(auth)/auth/page.tsx` | Stub; `next.config.ts` redirige `/auth` → `/auth/login` |

`.next/` está en `.gitignore`: los tipos de rutas se regeneran solos, no hay nada que commitear de ahí.

## 4. Next.js 16: cambios que rompen hábitos

- **`src/proxy.ts` sustituye a `middleware.ts`** (exporta la función `proxy`). Aquí solo refresca la sesión de Supabase (`updateSession`) y redirige: sin usuario fuera de `/auth/*`, `/invite/*` y `/confirmed` → `/auth/login`; con usuario en `/auth/login` o `/auth/sign-up` → `/`.
- **Tipos globales de ruta**: `LayoutProps<"/">` y `PageProps<...>`. El layout raíz ya los usa; no escribas `{ children: React.ReactNode }` a mano ahí.
- **Flags activos** en `next.config.ts`: `cacheComponents: true`, `partialPrefetching: true`, `reactCompiler: true`, y Turbopack con `@tailwindcss/turbopack` para los `.css`.
- **`cookies()` es asíncrono**: siempre `await cookies()` (ver `src/lib/supabase/server.ts`).
- Ante cualquier duda de API de Next, **lee la guía en `node_modules/next/dist/docs/`** antes de escribir código.

## 5. Supabase

- **Cliente de servidor**: `await createServer()` desde `@/lib/supabase/server` (lee/escribe cookies de la request). Cliente de browser: `@/lib/supabase/client`.
- **Valida la sesión en el servidor, siempre**: `requireUser()` (`src/lib/auth.ts`) resuelve `supabase.auth.getUser()` y devuelve `{ supabase, user }` o `null` en un solo paso; úsalo en cada action antes de tocar datos.
- **Variables de entorno** (en `.env.local`, gitignored): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_SITE_URL` (usada en recuperación de contraseña, en los enlaces de invitación y en el `emailRedirectTo` del sign-up hacia `/confirmed`).
- **No hay tipos generados de la base de datos**: los tipos (`Profile`, `Organization`, `Branch`, `MemberSummary`...) están declarados a mano al inicio de los archivos de `src/lib/actions/*.ts`. Si agregas tablas o columnas, actualiza esas declaraciones.
- **Embeds sin tipos generados**: PostgREST devuelve un objeto cuando la relación es muchos-a-uno, pero el verificador lo escribe como arreglo. Normaliza con `normalizeRelated` de `src/lib/actions/members.ts` (ver `existing.roles`).
- En `profiles` usa `upsert`, no `insert`: `id` es la PK. Ojo con el RLS de esa tabla (ver §13.8).

## 6. Server actions y formularios

Convenciones ya establecidas en `src/lib/actions/*.ts`:

- Cada archivo de acciones empieza con `'use server'`.
- **Firma para formularios**: `async function accion(_prevState, formData): Promise<State>`; `_prevState` es el estado anterior que entrega `useActionState`.
- **Estado uniforme**: `{ error, success, data? }`. Los errores de Supabase se devuelven tal cual en `error`.
- **Excepción admitida**: actions que no vienen de un form reciben argumentos normales (`regenerateInvitation(invitationId)`, `getMemberBranchIds(memberId)`, `setMemberBranches(memberId, branchIds)`) y se llaman desde handlers de client components.
- **Lado cliente**: `useActionState(accion, estadoInicial)` y `<form action={formAction}>`; para actions sin form, el handler llama la action y comparte el mismo shape de estado.
- Hasta que existan tipos de DB, los resultados `.select()` se castean con `as`/normalizadores como `normalizeRelated`.

Patrones visuales canónicos (cópialos, no inventes otros):

```tsx
// Botón con estado pendiente
<Button disabled={isPending} type="submit">
    {isPending && <span className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent" />}
    {isPending ? "Guardando..." : "Guardar"}
</Button>

// Mensaje de error o éxito inline
<Alert className="border-none p-0">
    <AlertDescription className="font-medium text-red-600">{state.error}</AlertDescription>
</Alert>
```

- Lógica de permisos a nivel app: `MANAGER_ROLES = ["owner", "admin"]` y `canManageMembers()` en `members.ts`; los colores/variantes de rol: `isOwner ? "default" : "outline"` para el Badge.
- `redirect()` desde `next/navigation` dentro de la action (login → `/`, logout → `/auth/login`).
- **Tras una mutación que cambie lo que se ve, revalida**: `revalidatePath("/profile", "/sucursales" o "/miembros")`, si no el server component sigue mostrando datos viejos.

## 7. Feature map: perfil

Tres grupos de archivos en `src/app/(app)/profile/`:

- **`page.tsx`** (server): llama `getProfile()`, `getOrganization()` y `getMyMembership()`; calcula `firstName` / `lastName` / `displayName` / `initials` (fila de `profiles` con fallback a `user.user_metadata`) y pasa **primitivas** a los banners.
- **`profile-banner.tsx` + `profile-form.tsx`** (client): card gris con avatar, nombre, correo y check verde si el correo está verificado; el lápiz abre el formulario (`insertUserInfo`, inputs con `defaultValue`, props `onCancel` / `onSuccess`).
- **`organization-banner.tsx` + `organization-form.tsx`** (client): si el usuario todavía no tiene organización, muestra el formulario (`insertOrganization`); si existe, la card con nombre y slug. Si no es owner pero pertenece como member a una org, la card muestra esa org y su rol (sin formulario); el formulario solo aparece si no tiene org ni membership.

La acción `insertUserInfo` en `src/lib/actions/profiles.ts` valida sesión → `upsert` en `profiles` → `revalidatePath("/profile")` → devuelve el estado. `insertOrganization` en `organizations.ts` valida uniqueness (única org por owner) → `insert` → revalidate.

**Patrón a reutilizar** cuando una vista tenga "ver" y "editar": los datos se calculan en el server component, el estado del toggle vive en un wrapper client que solo recibe primitivas (nada de objetos completos hacia el cliente), y el formulario es un client component con `onCancel` / `onSuccess`.

## 8. Feature map: sucursales y miembros

- **`/sucursales`**: `page.tsx` (server) llama `getOrganizationBranches()` + `getOrganization()` (para el nombre en el título). UI en `Table`, `BranchForm` (crear, `useActionState(insertOrganizationBranch)`) y `BranchRowMenu` (dropdown por fila → editar con `Dialog`/`updateOrganizationBranch`, eliminar con `AlertDialog`/`deleteOrganizationBranch`). Un member sin org propia (invitado) ve título + `MembershipBanner` con su org y cargo; sin formulario ni tabla (RLS no le permite leer `organizations_branches`).
- **`/miembros`**: `page.tsx` (server) resuelve la membresía del usuario (`getMyMembership`; usa `canManageMembers` = rol `owner` o `admin`) y carga en paralelo members, roles, invitaciones y sucursales (`Promise.all`).
  - `MembersTable`: badges de rol, `MemberRowMenu` → cambiar rol (`setMemberRole`), eliminar (`deleteMember` con `AlertDialog`), asignar sucursales (`MemberBranchesDialog`, checkbox por sucursal → `getMemberBranchIds` + `setMemberBranches`).
  - `InviteMemberDialog` → `insertInvitation` devuelve `{ token, inviteUrl }` (enlace `/invite/[token]` copiable con `navigator.clipboard`).
  - `InvitationsTable` → revocar (`deleteInvitation` con `AlertDialog`) y regenerar el enlace (`regenerateInvitation`). La columna **Registrarse** usa `get_pending_invitation_email_states` vía `getPendingInvitations`: ✓ verde = el correo no tiene cuenta (puede registrarse), ✗ rojo = ya existe una cuenta (debe iniciar sesión y aceptar); “–” si la RPC falla o no está disponible.
- El núcleo de aceptación vive en `src/lib/invitations.ts` (`acceptInvitationCore`: valida que la invitación exista, esté pendiente, no haya expirado y que el correo de la sesión coincida → `ensureProfile` → RPC `accept_invitation`). La aceptación es **automática**: al confirmar el correo (`/confirmed`) o al iniciar sesión con `next=/invite/...` (`signInWithEmail`); si sale bien redirige a `/sucursales` (donde el nuevo miembro ve su card) y si falla vuelve a `/invite/[token]`, donde el botón manual "Aceptar invitación" queda como respaldo.

## 9. Componentes UI: Base UI, NO Radix

El style de shadcn en este repo es `base-maia`, que usa primitivas de **Base UI** (`@base-ui/react`). Lo que de Radix no aplica:

| En vez de | Usa |
|---|---|
| `<MenuItem asChild>` | `render={<Link href="/x" />}` |
| `data-[state=open]:...` | `data-popup-open:...` |
| `MenuGroupLabel` suelto | Siempre dentro de un `Menu.Group` / `DropdownMenuGroup` (lanza error si no) |
| — | `nativeButton` en items que renderizan un `<button>` |

Componentes disponibles en `src/components/ui/`: `alert`, `alert-dialog`, `badge`, `button`, `card`, `checkbox`, `dialog`, `dropdown-menu`, `field`, `input`, `label`, `select`, `separator`, `sheet`, `sidebar`, `skeleton`, `table`, `tooltip`.

Para agregar componentes, usa el CLI de shadcn (`components.json` define style, aliases e `iconLibrary: hugeicons`). **No edites ni reformattees las primitivas a mano**: vienen generadas con 2 espacios de indentación.

## 10. Iconos: solo Hugeicons

No hay `lucide-react` en este proyecto. Patrón:

```tsx
import { HugeiconsIcon } from "@hugeicons/react";
import { CheckmarkBadge01Icon, Edit01Icon } from "@hugeicons/core-free-icons";

<HugeiconsIcon icon={CheckmarkBadge01Icon} strokeWidth={2} className="size-4" />
```

Antes de usar un icono, **verifica que exista** (no adivines el nombre):

```bash
grep -o "Edit01Icon" node_modules/@hugeicons/core-free-icons/dist/types/index.d.ts
```

## 11. Estilos

- Tailwind v4 con **tokens semánticos** definidos en `src/app/globals.css` (`--muted`, `--border`, `--card`, `--sidebar*`, ...) y mapeados en `@theme inline`. Usa tokens (`bg-muted`, `border-border`, `text-muted-foreground`); colores sueltos solo si no hay token.
- **Look "card gris" del proyecto**: `border border-border bg-muted/50 ring-0` (el `Card` por defecto trae `ring-1 ring-foreground/10`).
- Radios: `rounded-4xl` es el tamaño de referencia (botones, contenedores).
- Tipografía: `font-sans` = **Montserrat** (aplicada a `html`), `font-heading` = **Space Grotesk** (usada en títulos de primitivas: `CardTitle`, `DialogTitle`, `SheetTitle`). Geist y Geist Mono se cargan como variables CSS pero no tienen utilidad.
- Modo oscuro: variante custom `dark (&:is(.dark *))` y bloque `.dark` en `globals.css` (todavía sin uso activo).

## 12. Estilo de código

- **Código de aplicación**: 4 espacios, comillas dobles, punto y coma.
- **Primitivas en `src/components/ui/`**: 2 espacios (generadas por shadcn) — déjalas como están.
- Alias de imports: `@/components/...`, `@/lib/...`, `@/hooks/...`.
- `cn` para clases: en código de app se importa de `@/lib/utils` (que re-exporta el paquete `cn`); las primitivas usan `import { cn } from "cn"`.
- Exports: **named export** para componentes (`export function ProfileBanner`), default export solo para `page.tsx`, `layout.tsx` y `route.ts`.
- Props: `type XProps = { ... }` declarado en el archivo del componente (no hay interfaces en el repo).

## 13. Base de datos (Supabase, schema `public`)

> **Esta sección es la fuente de verdad de la DB.** Si cambias tablas, columnas o policies en Supabase, actualízala en la misma tarea. Las tablas de `auth`, `storage`, `realtime`, `extensions` y `vault` son infraestructura de Supabase: no las documentes aquí ni las toques como si fueran tuyas.

### 13.1 Cómo inspeccionar la DB (queries de referencia)

```sql
-- Columnas
select table_name, ordinal_position, column_name, data_type, udt_name, is_nullable, column_default
from information_schema.columns where table_schema = 'public'
order by table_name, ordinal_position;

-- Constraints (PK/FK/UNIQUE/CHECK)
select c.conrelid::regclass as table_name, c.conname,
       case c.contype when 'p' then 'PK' when 'f' then 'FK' when 'u' then 'UNIQUE' when 'c' then 'CHECK' end as type,
       pg_get_constraintdef(c.oid) as definition
from pg_constraint c join pg_namespace n on n.oid = c.connamespace
where n.nspname = 'public' order by 1, 2;

-- Policies
select * from pg_policies where schemaname = 'public' order by tablename, policy_name;

-- RLS activo por tabla
select c.relname as table_name, c.relrowsecurity as rls_enabled, c.relforcerowsecurity
from pg_class c join pg_namespace n on n.oid = c.connamespace
where n.nspname = 'public' and c.relkind = 'r' order by 1;

-- Seed de roles
select id, name from public.roles order by name;
```

### 13.2 Modelo de permisos: 3 niveles

- **Owner** (dueño): `organizations.owner_user_id = auth.uid()`.
- **Admin**: fila en `organization_members` con `roles.name` en `('owner', 'admin')`.
- **Member**: cualquier fila en `organization_members`.

Helpers (`SECURITY DEFINER`, `search_path` fijado, llamables por RLS y por la app):

- `is_org_owner_or_admin(p_organization_id uuid)` → owner por `owner_user_id` **o** member con rol `owner`/`admin`.
- `is_org_member(p_organization_id uuid)` → delega en el anterior + member normal.
- `shares_organization(target_user_id uuid)` → comparte alguna organización vía `organization_members` (solo mira members, no owner_user_id).

**Distinción clave**: el rol `owner` en `organization_members` **no** es lo mismo que `organizations.owner_user_id`. Los helpers tratan ambos como "nivel owner/admin". Las policies de sucursales siguen mirando solo `owner_user_id`; el SELECT de `organizations` ya acepta también members vía `is_org_member` (ver §13.4).

### 13.3 Relaciones (versión de la jerarquía, no un grafo)

```
auth.users 1—1 profiles (id iguales)
profiles 1—1 organizations (owner_user_id, UNIQUE → 1 org por owner)
profiles 1—N organization_members (user_id)
organizations 1—N organization_members
organizations 1—N organizations_branches
roles 1—N organization_members
roles ?—N organization_invitations (por confirmar: FK no en DDL aportado)
organization_members 1—N organizations_branch_members
organizations_branches 1—N organizations_branch_members
organization_invitations 1—N invitation_branches (⚠️ PK actual limita a 1)
organizations_branches 1—N invitation_branches
```

- Las FK de `user_id`/`owner_user_id` apuntan a **`profiles(id)`, no a `auth.users(id)`**: hay que hacerlo así para que PostgREST pueda embeber `profiles(first_name, last_name)`.
- **Cascada destructiva**: borrar un `profiles` borra su `organization` si es owner, y de ahí members/branches/invitations (`ON DELETE CASCADE`).
- `role_id` es FK a `roles` **sin** `ON DELETE` (aunque la fila de roles no debería borrarse jamás).

### 13.4 Tablas y columnas

#### `profiles` (⚠️ DDL por confirmar; columnas inferidas del código)

| Columna | Tipo | Default | Null |
|---|---|---|---|
| `id` | uuid | — | no (PK; igual a `auth.users.id`) |
| `first_name` | text | — | sí |
| `last_name` | text | — | sí |
| `created_at` | timestamptz | now() | no |

RLS: INSERT propio (`auth.uid() = id`), UPDATE propio (policy `profiles update own`, agregada el 22-10-2026), SELECT propio, SELECT de members que comparten org. **Sin policy de DELETE.** Además, el trigger `on_auth_user_created` (`after insert on auth.users` → `handle_new_user()`, `SECURITY DEFINER`) crea la fila con `first_name`/`last_name` de `raw_user_meta_data`.

#### `organizations`

| Columna | Tipo | Default | Null | Notas |
|---|---|---|---|---|
| `id` | uuid | gen_random_uuid() | no | PK |
| `name` | text | — | no | |
| `slug` | text | — | no | |
| `status` | boolean | true | no | no la usan las policies |
| `created_at` | timestamptz | now() | no | |
| `updated_at` | timestamptz | — | sí | no hay trigger que la actualice |
| `owner_user_id` | uuid | ⚠️ gen_random_uuid() | no | UNIQUE; FK → `profiles(id)` CASCADE |

RLS: INSERT propio (`owner_user_id = auth.uid()`), SELECT del owner o de un member de la org (policy `organizations select for members` con `is_org_member(id)`). **Sin UPDATE ni DELETE.**

#### `organization_members`

| Columna | Tipo | Default | Null | Notas |
|---|---|---|---|---|
| `id` | uuid | gen_random_uuid() | no | PK |
| `organization_id` | uuid | — | no | FK → `organizations(id)` CASCADE |
| `user_id` | uuid | — | no | FK → `profiles(id)` CASCADE |
| `role_id` | uuid | — | sí | FK → `roles(id)` |
| `status` | boolean | true | sí | no la usan los helpers de RLS |
| `created_at` | timestamptz | now() | no | |

Unique: `(organization_id, user_id)`. RLS: SELECT para members de la org; INSERT/UPDATE/DELETE para owner/admin.

#### `organizations_branches`

| Columna | Tipo | Default | Null | Notas |
|---|---|---|---|---|
| `id` | uuid | gen_random_uuid() | no | PK |
| `organization_id` | uuid | — | no | FK → `organizations(id)` CASCADE |
| `name` | text | — | ⚠️ sí | |
| `slug` | text | — | ⚠️ sí | sin unique `(organization_id, slug)` |
| `status` | boolean | true | sí | no la usan las policies |
| `created_at` | timestamptz | now() | no | |
| `updated_at` | timestamptz | — | sí | no hay trigger |

RLS: SELECT owner/admin; INSERT/UPDATE/DELETE **solo owner** (`owner_user_id`).

#### `organizations_branch_members`

| Columna | Tipo | Default | Null |
|---|---|---|---|
| `id` | uuid | gen_random_uuid() | no (PK) |
| `organization_member_id` | uuid | — | no (FK → `organization_members(id)` CASCADE) |
| `branch_id` | uuid | — | no (FK → `organizations_branches(id)` CASCADE) |
| `created_at` | timestamptz | now() | no |

Unique: `(organization_member_id, branch_id)`. RLS: SELECT para members de la org; INSERT/DELETE owner/admin.

#### `organization_invitations` (⚠️ DDL por confirmar; columnas inferidas del código)

| Columna | Tipo | Null | Notas |
|---|---|---|---|
| `id` | uuid | no (PK) | |
| `organization_id` | uuid | no | FK → `organizations(id)` |
| `email` | text | no | |
| `role_id` | uuid | no | FK → `roles(id)` |
| `invited_by` | uuid | ? | referencia un `organization_members.id` (el owner la bootstrapea) |
| `token_hash` | text | no | SHA-256 hex del token base64url de 32 bytes |
| `status` | boolean | no | TRUE = pendiente |
| `expires_at` | timestamptz | no | 7 días (constante `INVITATION_EXPIRATION_DAYS`) |
| `created_at` | timestamptz | no | |

RLS: SELECT/INSERT/DELETE/UPDATE para owner/admin. La policy de UPDATE (agregada a mano el 21-10-2026) usa `is_org_owner_or_admin` en USING y WITH CHECK, y **permite cambiar cualquier columna** (ver gotcha en §13.8).

#### `invitation_branches`

| Columna | Tipo | Default | Null | Notas |
|---|---|---|---|---|
| `invitation_id` | uuid | ⚠️ gen_random_uuid() | no | **PK** (limita a 1 sucursal por invitación); FK → `organization_invitations(id)` CASCADE |
| `branch_id` | uuid | — | sí | FK → `organizations_branches(id)` CASCADE |

RLS: **sin policies** en el dump; confirmar si tiene RLS activado.

#### `roles`

| Columna | Tipo | Null | Notas |
|---|---|---|---|
| `id` | uuid | no (PK) | default gen_random_uuid() |
| `name` | varchar | ⚠️ sí | sin UNIQUE |
| `created_at` | timestamptz | no |

RLS: SELECT libre para authenticated; **sin escritura** (el seed va por SQL/dashboard). El código usa los nombres `owner`, `admin`, `manager`, `salesperson` (labels en `miembros/page.tsx: ROLE_LABELS`).

### 13.5 Matriz RLS (quién puede escribir qué)

| Tabla | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| `profiles` | propio + coworkers de org compartida | propio | propio | ❌ |
| `organizations` | owner + members de la org | propio (`owner_user_id = uid`) | ❌ | ❌ |
| `organization_members` | members de la org | owner/admin | owner/admin | owner/admin |
| `organizations_branches` | owner/admin | solo owner | solo owner | solo owner |
| `organizations_branch_members` | members de la org | owner/admin | ❌ | owner/admin |
| `organization_invitations` | owner/admin | owner/admin | owner/admin ⚠️ (cualquier columna) | owner/admin |
| `invitation_branches` | (sin policies) | ? | ? | ? |
| `roles` | todos los authenticated | ❌ | ❌ | ❌ |

### 13.6 Funciones RPC

- **`accept_invitation(p_token_hash text) → uuid`**
  1. Busca la invitación por `token_hash` (errores: `invitation_not_found`).
  2. Valida `status = true` y expiración (`invitation_not_valid`).
  3. Valida que el email del JWT coincida (`email_mismatch`).
  4. Hace upsert del member (`organization_members`, `on conflict do update` con `role_id`, `status = true`) y copia las sucursales de `invitation_branches` a `organizations_branch_members` (`on conflict do nothing`).
  5. Marca `status = false` en la invitación. Devuelve el `id` del member.
- **`get_invitation_by_token(p_token_hash text)`** → tabla `(organization_name, email, role_name, status, expires_at, invitation_id)`. `SECURITY DEFINER`, pensada para renderizar la pantalla pública de invitación.
- **`get_pending_invitation_email_states(p_organization_id uuid)`** → tabla `(invitation_id, email, can_register)`.
    - Devuelve una fila por invitación **pendiente** (`status = true`) de la organización. ⚠️ **No filtra expiradas**: quien consuma los datos debe calcularlo con `expires_at` (en la app: `isInvitationExpired`).
    - `can_register` = `TRUE` si **no existe** ninguna fila en `auth.users` con ese email (comparación con `lower()`). Sirve para decidir si el flujo de invitación debe llevar a sign-up o a login. Solo mira `auth.users`, no `profiles`.
    - `SECURITY DEFINER` con el guard **dentro de la función**: `is_org_owner_or_admin(p_organization_id)` en el WHERE. Como salta RLS, sin ese guard cualquiera podría leer todas las invitaciones. Si el caller no es owner/admin devuelve filas vacías (no lanza error). `search_path = 'auth', 'public'` porque consulta `auth.users` directamente.
- Las dos que reciben `p_token_hash` esperan el **hash** SHA-256, no el token en sí (`randomBytes(32).toString("base64url")`): la app lo hashea con `hashInvitationToken` (`src/lib/actions/invitations.ts`) y el token original nunca llega a la DB.
- **La app sí llama a las RPC de invitaciones** desde `src/lib/actions/invitations.ts` (pantalla `/invite/[token]`, en el grupo `(auth)`): preview con `get_invitation_by_token` y aceptación con `accept_invitation` (el definer hace el trabajo real: member + branches + marcar la invitación como usada). `get_pending_invitation_email_states` la llama `getPendingInvitations` (`src/lib/actions/members.ts`) para la columna “Registrarse”; si la RPC falla, la app muestra “–”.

### 13.7 Quién toca qué desde la app

| Archivo | Tablas |
|---|---|
| `profiles.ts` | `profiles` (upsert del perfil) |
| `organizations.ts` | `organizations`, `organizations_branches` (CRUD de sucursales; owner-only) y `profiles` vía `ensureProfile` (INSERT si falta) |
| `members.ts` | `organizations`, `organization_members`, `roles`, `organizations_branches`, `organization_invitations`, `organizations_branch_members` |
| `invitations.ts` | RPC `get_invitation_by_token` + `accept_invitation` (escriben member/branches/invitación en la DB) y `profiles` vía `ensureProfile`; la aceptación real y sus validaciones viven en el núcleo `src/lib/invitations.ts` |

`ensureProfile` vive en `src/lib/profiles.ts` (módulo utilitario, no `'use server'`) y lo comparten `insertOrganization` y `acceptInvitationCore`.

El núcleo de invitaciones vive en `src/lib/invitations.ts` (también utilitario, sin `'use server'`): `hashInvitationToken`, `getInvitationToken`, `getInvitationByToken`, `isInvitationExpired`, `mapAcceptError` y `acceptInvitationCore`. Lo usan la action `acceptInvitation`, el route handler `/confirmed` y `signInWithEmail` (auto-alta).

Bootstrap importante: `getActorMembership()` (en `members.ts`) crea **perezosamente** la fila de member del owner (rol `owner`) si no la tiene, porque `invited_by` la necesita y el RLS la reconoce. Esa fila obliga a que el owner ya tenga perfil (`profiles`).

### 13.8 Gotchas / deudas reales de la DB

1. **Resuelto: el sign-up ya crea el perfil.** El trigger `on_auth_user_created` (`after insert on auth.users`) ejecuta `handle_new_user()`, que inserta en `profiles` con `first_name`/`last_name` de `raw_user_meta_data` (`SECURITY DEFINER`, `on conflict do nothing`). Además la app tiene el respaldo `ensureProfile` (`src/lib/profiles.ts`), usado por `insertOrganization` y `acceptInvitationCore`, para cuentas anteriores al trigger o entornos sin él. El backfill de perfiles faltantes ya se ejecutó (22-10-2026).
2. **Resuelto: `profiles` ya tiene policy de UPDATE.** Policy `profiles update own` (`using` y `with check` con `auth.uid() = id`, agregada el 22-10-2026), así que el `upsert` de `insertUserInfo` funciona tanto en INSERT como en UPDATE. Sigue sin policy de DELETE.
3. **`invitation_branches` tiene la PK mal**: `primary key (invitation_id)` permite solo una sucursal por invitación, contradice el nombre y `accept_invitation`. Debe ser `(invitation_id, branch_id)` (o `id` propio + unique). Además, `invitation_id` con `default gen_random_uuid()` sobra (igual que `organizations.owner_user_id`).
4. **`status` es decorativo**: ni `is_org_member`, ni `is_org_owner_or_admin`, ni las policies de organizations/branches consultan `status`. Un member desactivado o una sucursal "off" siguen funcionando igual. Definir qué es antes de usarlas.
5. **`roles` frágil**: `name` nullable y sin unique. `getActorMembership` hace `.eq("name", "owner").maybeSingle()`; un seed duplicado rompe esa consulta. Además, RLS permite a un admin asignar `role_id = owner` por API aunque la app lo evite con `getAssignableRole` (que filtra con `neq("name", "owner")`).
6. **`organizations` sin UPDATE/DELETE**: no se puede renombrar/eliminar la organización desde el cliente.
7. **Resuelto: SELECT de `organizations` para members.** La policy `organizations select for members` (`is_org_member(id)`) permite que un invitado lea su organización; `getActorMembership` llena `organizationName` y `organizationSlug` vía embed. Sigue **sin UPDATE/DELETE**: el member no puede editar la org.
8. **Sucursales: admins solo miran.** Crear/editar/eliminar es exclusivo del owner aunque el helper diga "owner_or_admin".
9. **`organizations_branches` sin unique `(organization_id, slug)`**: el chequeo de duplicados es solo de la app; dos requests concurrentes pueden duplicar. `name`/`slug` nullable agravan.
10. **La policy de UPDATE de invitations permite cambiar cualquier columna**, incluida `organization_id`: un admin de dos orgs podría mover una invitación de una a otra y `invitation_branches` quedaría apuntando a sucursales de la org vieja (y `accept_invitation` no valida esa coherencia). Si solo se quiere revocar: `grant update (status) ...` o un trigger que impida tocar `organization_id`/`token_hash`.
11. **`shares_organization` solo mira `organization_members`**: si un owner se borra de members pierde visibilidad de perfiles de su equipo.
12. **Cascada destructiva** desde `profiles` (borrar el perfil del owner = borrar toda la organización). Confirmar intención.
13. **Sin triggers en `public`**: nada mantiene `updated_at` automáticamente; si lo necesitas, actualízalo en la action o agrega el trigger.

### 13.9 Pendientes de confirmar con más queries

- DDL exacto de `profiles` y `organization_invitations` (columnas de arriba son inferidas del código).
- `relrowsecurity` por tabla: ¿RLS habilitado en todas? ¿`invitation_branches` tiene RLS?

## 14. Estado actual

**Completo:** auth (login, sign-up, recuperación y actualización de contraseña, error de cuenta, confirmación), sidebar con menú de usuario, perfil editable, alta de organización desde `/profile`, CRUD de sucursales, gestión de miembros (roles, borrado, invitaciones con enlace copiable, asignación de sucursales), auto-alta de invitados al confirmar el correo o iniciar sesión con el enlace de invitación, sesión de Supabase vía proxy.

**Pendiente:** el home (solo muestra el nombre), la `metadata` de los layouts raíz (texto de create-next-app), el `README.md`, y las deudas de DB de §13.8.

## 15. Reglas de trabajo

- **Planea antes de codificar.** Para features o cambios de UI, presenta el plan y espera aprobación.
- **Alcance estricto.** Solo modifica los archivos acordados. Si descubres que hace falta tocar algo más, dilo explícitamente y explica por qué antes de hacerlo.
- **Habla en español** y explica el porqué de las decisiones: quien lee está aprendiendo; nada de "mágico" ni de cambios silenciosos.
- **Verifica antes de asumir**: si no estás seguro del nombre de un export, un token de color, una prop o un icono, búscalo en el código o en `node_modules` primero.
- **Cambios mínimos y reversibles.** Lo que no es necesario para la idea pedida no se hace "de paso".
- **La DB se administra desde el SQL Editor del dashboard de Supabase**: no hay carpeta `supabase/`, ni migraciones versionadas en el repo. El CLI está instalado pero sin `supabase/` vinculado. Todo cambio de esquema debe reflejarse en §13.

## 16. Commits

Conventional Commits, **descripción corta en inglés**:

```
feat(profile): add profile card with edit toggle
refactor(profile): simplify getProfile signature
fix(sidebar): correct width calculations
```

Un tema por commit, sin cuerpo largo. Ojo: `.agents/` y `skills-lock.json` están en `.gitignore`; no intentar commitearlos.

## 17. Skills locales

En `.agents/skills/` hay 13 skills del proyecto: `shadcn`, `react-best-practices`, `composition-patterns`, `next-cache-components-adoption`, `supabase-postgres-best-practices`, `tailwind-v4-shadcn`, `tailwind-css-patterns`, `typescript-advanced-types`, `frontend-design`, `accessibility`, `seo`, `nodejs-backend-patterns`, `nodejs-best-practices`.

Revísalas cuando el pedido toque su tema (el usuario lo pide de forma explícita: "revisa las skills para mejorarlo").
