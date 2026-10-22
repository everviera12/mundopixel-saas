'use server'

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUser } from "../auth";
import { acceptInvitationCore, getInvitationByToken, isInvitationExpired } from "../invitations";
import { getSafeInternalPath } from "../redirects";
import { createServer } from "../supabase/server";

type InvitationPreview = {
    organizationName: string;
    email: string;
    roleName: string | null;
    status: boolean;
    expiresAt: string | null;
    invitationId: string;
    isExpired: boolean;
};

type InvitationReadState = {
    error: string | null;
    data: InvitationPreview | null;
};

type InvitationActionState = {
    error: string | null;
    success: string | null;
};

export async function getInvitationPreview(token: string): Promise<InvitationReadState> {
    const cleanToken = token.trim();

    if (!cleanToken) {
        return { error: null, data: null };
    }

    const supabase = await createServer();
    const { invitation, error } = await getInvitationByToken(supabase, cleanToken);

    if (error) {
        return { error, data: null };
    }

    if (!invitation) {
        return { error: null, data: null };
    }

    return {
        error: null,
        data: {
            organizationName: invitation.organization_name,
            email: invitation.email,
            roleName: invitation.role_name,
            status: invitation.status,
            expiresAt: invitation.expires_at,
            invitationId: invitation.invitation_id,
            isExpired: isInvitationExpired(invitation.expires_at),
        },
    };
}

/**
 * Botón manual "Aceptar invitación" de `/invite/[token]`. El alta normal es
 * automática (al confirmar el correo o al iniciar sesión con `next` apuntando
 * a la invitación); esta action queda como respaldo y para reintentos.
 */
export async function acceptInvitation(
    _prevState: InvitationActionState,
    formData: FormData,
): Promise<InvitationActionState> {
    const token = String(formData.get("token") ?? "").trim();

    if (!token) {
        return {
            error: "El enlace de la invitación no es válido.",
            success: null,
        };
    }

    const session = await requireUser();

    if (!session) {
        return {
            error: "Debes iniciar sesión para aceptar la invitación.",
            success: null,
        };
    }

    const { supabase, user } = session;
    const { error } = await acceptInvitationCore(supabase, user, token);

    if (error) {
        return {
            error,
            success: null,
        };
    }

    revalidatePath("/miembros");
    redirect("/sucursales");
}

/**
 * Cierra la sesión actual para que la persona pueda entrar con el correo de la
 * invitación. Conserva `next` y el correo para prellenar el login.
 */
export async function signOutForInvitation(formData: FormData) {
    const next = getSafeInternalPath(String(formData.get("next") ?? ""), "");
    const email = String(formData.get("email") ?? "").trim();
    const supabase = await createServer();
    const { error } = await supabase.auth.signOut();

    if (error) {
        throw new Error(error.message);
    }

    const query = new URLSearchParams();

    if (next) {
        query.set("next", next);
    }

    if (email) {
        query.set("email", email);
    }

    const search = query.toString();

    redirect(search ? `/auth/login?${search}` : "/auth/login");
}
