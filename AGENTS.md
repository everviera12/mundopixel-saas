<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# AGENTS.md — MundoPixel SaaS

> Contexto de trabajo para agentes. Lee esto antes de tocar código: describe el stack, las convenciones y las trampas de este repo.
> El bloque de arriba lo genera `next dev`: no lo borres ni lo reescribas.

## 1. Qué es este proyecto

SaaS multi-sucursal (marca "MPSAAS") con interfaz **en español** y autenticación con Supabase.

- **Next.js 16.4** (App Router, Turbopack) + **React 19.3** + **TypeScript** estricto
- **Tailwind CSS v4** + **shadcn/ui** style `base-maia` → primitivas de **Base UI** (no Radix)
- **Supabase** (`@supabase/ssr`) para auth y datos
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
| `/` | `src/app/(app)/page.tsx` | Muestra el `first_name` del usuario |
| `/profile` | `src/app/(app)/profile/` | Completo (ver §7) |
| `/sucursales` | `src/app/(app)/sucursales/page.tsx` | Stub pendiente |
| `/auth/login` | `src/app/(auth)/auth/login/page.tsx` | Completo |
| `/auth/sign-up` | `src/app/(auth)/auth/sign-up/page.tsx` | Completo (guarda `first_name`/`last_name` en `user_metadata`) |
| `/auth/account/forgot-password` | `src/app/(auth)/auth/account/forgot-password/page.tsx` | Completo |
| `/auth/account/update-password` | `src/app/(auth)/auth/account/update-password/page.tsx` | Completo |
| `/auth/account/error` | `src/app/(auth)/auth/account/error/page.tsx` | Página de error de cuenta |
| `/auth/account/confirm` | `src/app/(auth)/auth/account/confirm/route.ts` | Route handler de confirmación |
| `/auth` | `src/app/(auth)/auth/page.tsx` | Stub; `next.config.ts` redirige `/auth` → `/auth/login` |

`.next/` está en `.gitignore`: los tipos de rutas se regeneran solos, no hay nada que commitear de ahí.

## 4. Next.js 16: cambios que rompen hábitos

- **`src/proxy.ts` sustituye a `middleware.ts`** (exporta la función `proxy`). Aquí solo refresca la sesión de Supabase (`updateSession`) y redirige: sin usuario fuera de `/auth/*` → `/auth/login`; con usuario en `/auth/login` o `/auth/sign-up` → `/`.
- **Tipos globales de ruta**: `LayoutProps<"/">` y `PageProps<...>`. El layout raíz ya los usa; no escribas `{ children: React.ReactNode }` a mano ahí.
- **Flags activos** en `next.config.ts`: `cacheComponents: true`, `partialPrefetching: true`, `reactCompiler: true`, y Turbopack con `@tailwindcss/turbopack` para los `.css`.
- **`cookies()` es asíncrono**: siempre `await cookies()` (ver `src/lib/supabase/server.ts`).
- Ante cualquier duda de API de Next, **lee la guía en `node_modules/next/dist/docs/`** antes de escribir código.

## 5. Supabase

- **Cliente de servidor**: `await createServer()` desde `@/lib/supabase/server` (lee/escribe cookies de la request). Cliente de browser: `@/lib/supabase/client`.
- **Valida la sesión en el servidor, siempre**: `supabase.auth.getUser()` dentro de la página o server action antes de leer o escribir datos.
- **Variables de entorno** (en `.env.local`, gitignored): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_SITE_URL` (usada en recuperación de contraseña).
- **Tabla `profiles`**: columnas `id` (PK = `auth.users.id`), `first_name`, `last_name`, `created_at`.
- **No hay tipos generados de la base de datos**: el tipo `Profile` está declarado a mano al inicio de `src/lib/actions/profiles.ts`. Si agregas tablas o columnas, actualiza ese tipo.
- **Para guardar el perfil usa `upsert`, no `insert`**: `id` es la PK, así que un `insert` falla con *duplicate key* cuando el perfil ya existe.
- Si la tabla tiene RLS activo, necesita una policy de **UPDATE** además de la de INSERT para que el upsert pueda actualizar.
- `emailVerified` se deriva de `Boolean(user.email_confirmed_at)`.

## 6. Server actions y formularios

Convenciones ya establecidas en `src/lib/actions/*.ts`:

- Cada archivo de acciones empieza con `'use server'`.
- **Firma para formularios**: `async function accion(_prevState, formData): Promise<State>`; `_prevState` es el estado anterior que entrega `useActionState`.
- **Estado uniforme**: `{ error, success, data? }` (ver `AuthStateProps` en `auth.ts` y `profiles.ts`). Los errores de Supabase se devuelven tal cual en `error`.
- **Lado cliente**: `const [state, formAction, isPending] = useActionState(accion, estadoInicial)` y `<form action={formAction}>`.

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

- `redirect()` desde `next/navigation` dentro de la action (login → `/`, logout → `/auth/login`).
- **Tras una mutación que cambie lo que se ve, revalida**: `revalidatePath("/profile")` (de `next/cache`), si no el server component sigue mostrando datos viejos.

## 7. Feature map: perfil

Tres archivos en `src/app/(app)/profile/`:

- **`page.tsx`** (server component): llama `getProfile()`, calcula `firstName` / `lastName` / `displayName` / `initials` (fila de `profiles` con fallback a `user.user_metadata`) y pasa **primitivas** a `ProfileBanner`.
- **`profile-banner.tsx`** (client): `useState(isEditing)`; muestra la card gris con avatar, nombre, correo y check verde si el correo está verificado; el botón de lápiz abre el formulario.
- **`profile-form.tsx`** (client): `useActionState(insertUserInfo)`, inputs con `defaultValue` (prellenados) y props `onCancel` / `onSuccess` para cerrar.

La acción `insertUserInfo` en `src/lib/actions/profiles.ts` valida sesión → `upsert` en `profiles` → `revalidatePath("/profile")` → devuelve el estado.

**Patrón a reutilizar** cuando una vista tenga "ver" y "editar": los datos se calculan en el server component, el estado del toggle vive en un wrapper client que solo recibe primitivas (nada de objetos completos hacia el cliente), y el formulario es un client component con `onCancel` / `onSuccess`.

## 8. Componentes UI: Base UI, NO Radix

El style de shadcn en este repo es `base-maia`, que usa primitivas de **Base UI** (`@base-ui/react`). Lo que de Radix no aplica:

| En vez de | Usa |
|---|---|
| `<MenuItem asChild>` | `render={<Link href="/x" />}` |
| `data-[state=open]:...` | `data-popup-open:...` |
| `MenuGroupLabel` suelto | Siempre dentro de un `Menu.Group` / `DropdownMenuGroup` (lanza error si no) |
| — | `nativeButton` en items que renderizan un `<button>` |

Componentes disponibles en `src/components/ui/`: `alert`, `button`, `card`, `dialog`, `dropdown-menu`, `field`, `input`, `label`, `separator`, `sheet`, `sidebar`, `skeleton`, `tooltip`.

Para agregar componentes, usa el CLI de shadcn (`components.json` define style, aliases e `iconLibrary: hugeicons`). **No edites ni reformattees las primitivas a mano**: vienen generadas con 2 espacios de indentación.

## 9. Iconos: solo Hugeicons

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

## 10. Estilos

- Tailwind v4 con **tokens semánticos** definidos en `src/app/globals.css` (`--muted`, `--border`, `--card`, `--sidebar*`, ...) y mapeados en `@theme inline`. Usa tokens (`bg-muted`, `border-border`, `text-muted-foreground`); colores sueltos solo si no hay token.
- **Look "card gris" del proyecto**: `border border-border bg-muted/50 ring-0` (el `Card` por defecto trae `ring-1 ring-foreground/10`).
- Radios: `rounded-4xl` es el tamaño de referencia (botones, contenedores).
- Tipografía: `font-sans` = **Montserrat** (aplicada a `html`), `font-heading` = **Space Grotesk** (usada en títulos de primitivas: `CardTitle`, `DialogTitle`, `SheetTitle`). Geist y Geist Mono se cargan como variables CSS pero no tienen utilidad.
- Modo oscuro: variante custom `dark (&:is(.dark *))` y bloque `.dark` en `globals.css` (todavía sin uso activo).

## 11. Estilo de código

- **Código de aplicación**: 4 espacios, comillas dobles, punto y coma.
- **Primitivas en `src/components/ui/`**: 2 espacios (generadas por shadcn) — déjalas como están.
- Alias de imports: `@/components/...`, `@/lib/...`, `@/hooks/...`.
- `cn` para clases: en código de app se importa de `@/lib/utils` (que re-exporta el paquete `cn`); las primitivas usan `import { cn } from "cn"`.
- Exports: **named export** para componentes (`export function ProfileBanner`), default export solo para `page.tsx`, `layout.tsx` y `route.ts`.
- Props: `type XProps = { ... }` declarado en el archivo del componente (no hay interfaces en el repo).

## 12. Estado actual

**Completo:** auth (login, sign-up, recuperación y actualización de contraseña, error de cuenta, confirmación), sidebar con menú de usuario, card de perfil editable, sesión de Supabase vía proxy.

**Pendiente:** `/sucursales` y `/auth` son stubs; el home solo muestra el nombre; la `metadata` de `src/app/layout.tsx` y `src/app/(auth)/layout.tsx` sigue con el texto por defecto de create-next-app; el `README.md` también está desactualizado.

## 13. Reglas de trabajo

- **Planea antes de codificar.** Para features o cambios de UI, presenta el plan y espera aprobación.
- **Alcance estricto.** Solo modifica los archivos acordados. Si descubres que hace falta tocar algo más, dilo explícitamente y explica por qué antes de hacerlo.
- **Habla en español** y explica el porqué de las decisiones: quien lee está aprendiendo; nada de "mágico" ni de cambios silenciosos.
- **Verifica antes de asumir**: si no estás seguro del nombre de un export, un token de color, una prop o un icono, búscalo en el código o en `node_modules` primero.
- **Cambios mínimos y reversibles.** Lo que no es necesario para la idea pedida no se hace "de paso".

## 14. Commits

Conventional Commits, **descripción corta en inglés**:

```
feat(profile): add profile card with edit toggle
refactor(profile): simplify getProfile signature
fix(sidebar): correct width calculations
```

Un tema por commit, sin cuerpo largo. Ojo: `.agents/` y `skills-lock.json` están en `.gitignore`; no intentar commitearlos.

## 15. Skills locales

En `.agents/skills/` hay 13 skills del proyecto: `shadcn`, `react-best-practices`, `composition-patterns`, `next-cache-components-adoption`, `supabase-postgres-best-practices`, `tailwind-v4-shadcn`, `tailwind-css-patterns`, `typescript-advanced-types`, `frontend-design`, `accessibility`, `seo`, `nodejs-backend-patterns`, `nodejs-best-practices`.

Revísalas cuando el pedido toque su tema (el usuario lo pide de forma explícita: "revisa las skills para mejorarlo").
