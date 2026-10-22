import type { EmailOtpType, User } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { acceptInvitationCore, getInvitationToken } from "@/lib/invitations";
import { getSafeInternalPath } from "@/lib/redirects";
import { createServer } from "@/lib/supabase/server";

type ServerSupabase = Awaited<ReturnType<typeof createServer>>;

/**
 * Si `next` apunta a una invitación, la acepta automáticamente (alta del
 * miembro) y devuelve la ruta de destino: `/sucursales` para que la persona vea
 * su organización, o el propio enlace para que la página explique qué pasó
 * (usada, expirada, revocada...).
 */
async function resolveInvitationDestination(
    supabase: ServerSupabase,
    user: User,
    next: string,
) {
    const token = getInvitationToken(next);

    if (!token) {
        return next;
    }

    const { error } = await acceptInvitationCore(supabase, user, token);

    if (error) {
        return next;
    }

    revalidatePath("/miembros");

    return "/sucursales";
}

/**
 * Destino de `emailRedirectTo` en el sign-up. Supabase llega aquí con `code`
 * (flujo PKCE) o con `token_hash` + `type` (plantilla con {{ .TokenHash }}).
 * Cambiamos ese token por una sesión y devolvemos a la persona a `next`
 * (normalmente el enlace de invitación que estaba aceptando). Si `next` es una
 * invitación, el alta del miembro se hace aquí mismo, sin paso manual.
 */
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const tokenHash = searchParams.get("token_hash");
    const type = searchParams.get("type") as EmailOtpType | null;
    const next = getSafeInternalPath(searchParams.get("next"), "/");

    const supabase = await createServer();

    if (code) {
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);

        if (!error) {
            const destination = data.user
                ? await resolveInvitationDestination(supabase, data.user, next)
                : next;

            return NextResponse.redirect(new URL(destination, request.url));
        }
    }

    if (tokenHash && type) {
        const { data, error } = await supabase.auth.verifyOtp({
            type,
            token_hash: tokenHash,
        });

        if (!error) {
            const destination = data.user
                ? await resolveInvitationDestination(supabase, data.user, next)
                : next;

            return NextResponse.redirect(new URL(destination, request.url));
        }
    }

    // La cuenta puede haber quedado confirmada del lado de Supabase aunque no
    // se haya creado la sesión (por ejemplo, si el enlace se abrió en otro
    // navegador). Se conserva `next` para que el login manual regrese a la
    // invitación.
    const loginUrl = new URL("/auth/login", request.url);

    if (next !== "/") {
        loginUrl.searchParams.set("next", next);
    }

    return NextResponse.redirect(loginUrl);
}
