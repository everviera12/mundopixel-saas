import type { User } from "@supabase/supabase-js";
import { createHash } from "node:crypto";

import { ensureProfile } from "./profiles";
import type { createServer } from "./supabase/server";

type ServerSupabase = Awaited<ReturnType<typeof createServer>>;

export type InvitationRow = {
    organization_name: string;
    email: string;
    role_name: string | null;
    status: boolean;
    expires_at: string | null;
    invitation_id: string;
};

export type AcceptInvitationResult = {
    error: string | null;
};

export function hashInvitationToken(token: string) {
    return createHash("sha256").update(token).digest("hex");
}

export function isInvitationExpired(expiresAt: string | null) {
    if (!expiresAt) {
        return false;
    }

    return new Date(expiresAt).getTime() <= Date.now();
}

/**
 * Devuelve el token cuando `next` es una ruta `/invite/<token>` y `null` en
 * cualquier otro caso. Ignora query strings y fragmentos.
 */
export function getInvitationToken(next: string) {
    if (!next.startsWith("/invite/")) {
        return null;
    }

    const token = next.slice("/invite/".length).split(/[?#]/)[0].trim();

    return token || null;
}

export async function getInvitationByToken(supabase: ServerSupabase, token: string) {
    const { data, error } = await supabase.rpc("get_invitation_by_token", {
        p_token_hash: hashInvitationToken(token),
    });

    if (error) {
        return { invitation: null, error: error.message };
    }

    const rows = (data ?? []) as InvitationRow[];

    return { invitation: rows[0] ?? null, error: null };
}

export function mapAcceptError(message: string) {
    if (message.includes("invitation_not_found")) {
        return "Esta invitación no existe o fue revocada.";
    }

    if (message.includes("invitation_not_valid")) {
        return "Esta invitación ya fue utilizada o expiró. Pide una nueva.";
    }

    if (message.includes("email_mismatch")) {
        return "Debes iniciar sesión con el correo al que se envió la invitación.";
    }

    return message;
}

/**
 * Acepta la invitación para la sesión indicada. Es el núcleo compartido por la
 * action del botón manual, `/confirmed` (alta automática al confirmar el
 * correo) y el login con `next=/invite/...`: valida que la invitación exista,
 * esté pendiente, no haya expirado y que el correo de la sesión coincida; luego
 * asegura el perfil y ejecuta la RPC `accept_invitation` (miembro + sucursales).
 */
export async function acceptInvitationCore(
    supabase: ServerSupabase,
    user: User,
    token: string,
): Promise<AcceptInvitationResult> {
    const cleanToken = token.trim();

    if (!cleanToken) {
        return { error: "El enlace de la invitación no es válido." };
    }

    const { invitation, error: invitationError } = await getInvitationByToken(supabase, cleanToken);

    if (invitationError) {
        return { error: invitationError };
    }

    if (!invitation) {
        return { error: "Esta invitación no existe o fue revocada." };
    }

    if (!invitation.status) {
        return { error: "Esta invitación ya fue utilizada." };
    }

    if (isInvitationExpired(invitation.expires_at)) {
        return { error: "Esta invitación expiró. Pide a un administrador que genere una nueva." };
    }

    if (!user.email || user.email.toLowerCase() !== invitation.email.toLowerCase()) {
        return { error: `Debes iniciar sesión con el correo ${invitation.email} para aceptar esta invitación.` };
    }

    const profileError = await ensureProfile(supabase, user);

    if (profileError) {
        return { error: profileError };
    }

    const { error: acceptError } = await supabase.rpc("accept_invitation", {
        p_token_hash: hashInvitationToken(cleanToken),
    });

    if (acceptError) {
        return { error: mapAcceptError(acceptError.message) };
    }

    return { error: null };
}
