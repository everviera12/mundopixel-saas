'use server'

import { revalidatePath } from "next/cache";
import { createHash, randomBytes } from "node:crypto";
import { requireUser } from "../auth";

type MemberFormState = {
    error: string | null;
    success: string | null;
};

type MyMembership = {
    organizationId: string;
    organizationName: string | null;
    organizationSlug?: string | null;
    memberId: string;
    roleId: string | null;
    roleName: string | null;
};

type MemberSummary = {
    id: string;
    firstName: string | null;
    lastName: string | null;
    roleId: string | null;
    roleName: string | null;
};

type MembersState = {
    error: string | null;
    success: string | null;
    data: MemberSummary[] | null;
};

type RoleOption = {
    id: string;
    name: string;
};

type RolesState = {
    error: string | null;
    success: string | null;
    data: RoleOption[] | null;
};

type BranchOption = {
    id: string;
    name: string | null;
};

type BranchesState = {
    error: string | null;
    success: string | null;
    data: BranchOption[] | null;
};

type InvitationSummary = {
    id: string;
    email: string;
    roleName: string | null;
    expiresAt: string | null;
    isExpired: boolean;
    createdAt: string;
    canRegister: boolean | null;
};

type InvitationEmailState = {
    invitation_id: string;
    email: string;
    can_register: boolean;
};

type InvitationsState = {
    error: string | null;
    success: string | null;
    data: InvitationSummary[] | null;
};

type InvitationFormState = {
    error: string | null;
    success: string | null;
    data: { token: string; inviteUrl: string } | null;
};

type MemberBranchIdsState = {
    error: string | null;
    success: string | null;
    data: string[] | null;
};

type ServerSession = NonNullable<Awaited<ReturnType<typeof requireUser>>>;
type ServerSupabase = ServerSession["supabase"];

const INVITATION_EXPIRATION_DAYS = 7;

const MANAGER_ROLES = ["owner", "admin"];

function canManageMembers(roleName: string | null) {
    return roleName !== null && MANAGER_ROLES.includes(roleName);
}

function createInvitationToken() {
    const token = randomBytes(32).toString("base64url");
    const tokenHash = createHash("sha256").update(token).digest("hex");
    const expiresAt = new Date(Date.now() + INVITATION_EXPIRATION_DAYS * 24 * 60 * 60 * 1000).toISOString();
    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/+$/, "");

    return {
        token,
        tokenHash,
        expiresAt,
        inviteUrl: `${siteUrl}/invite/${token}`,
    };
}

/**
 * PostgREST devuelve un objeto cuando la relación es de muchos a uno, pero el
 * cliente sin tipos generados la declara como arreglo. Normalizamos ambos casos.
 */
function normalizeRelated<T>(value: unknown): T | null {
    if (Array.isArray(value)) {
        return (value[0] as T | undefined) ?? null;
    }

    return (value as T | null) ?? null;
}

/**
 * Obtiene la membresía del usuario actual.
 * Si el usuario es dueño de una organización pero todavía no tiene fila en
 * organization_members, la crea con el rol owner. Así el dueño siempre tiene
 * un memberId que usar como `invited_by` y las policies lo reconocen.
 */
async function getActorMembership(supabase: ServerSupabase, userId: string): Promise<MyMembership | null> {
    const { data: organization } = await supabase
        .from("organizations")
        .select("id, name")
        .eq("owner_user_id", userId)
        .maybeSingle();

    if (organization) {
        const { data: existing } = await supabase
            .from("organization_members")
            .select("id, role_id, roles(name)")
            .eq("organization_id", organization.id)
            .eq("user_id", userId)
            .maybeSingle();

        if (existing) {
            const role = normalizeRelated<{ name: string | null }>(existing.roles);

            return {
                organizationId: organization.id,
                organizationName: organization.name,
                memberId: existing.id,
                roleId: existing.role_id,
                roleName: role?.name ?? "owner",
            };
        }

        const { data: ownerRole } = await supabase
            .from("roles")
            .select("id")
            .eq("name", "owner")
            .maybeSingle();

        const { data: created, error } = await supabase
            .from("organization_members")
            .insert({
                organization_id: organization.id,
                user_id: userId,
                role_id: ownerRole?.id ?? null,
                status: true,
            })
            .select("id")
            .single();

        if (!error && created) {
            return {
                organizationId: organization.id,
                organizationName: organization.name,
                memberId: created.id,
                roleId: ownerRole?.id ?? null,
                roleName: "owner",
            };
        }

        // Si otra petición creó la fila al mismo tiempo, la leemos de nuevo.
        const { data: retry } = await supabase
            .from("organization_members")
            .select("id, role_id, roles(name)")
            .eq("organization_id", organization.id)
            .eq("user_id", userId)
            .maybeSingle();

        if (!retry) {
            return null;
        }

        const retryRole = normalizeRelated<{ name: string | null }>(retry.roles);

        return {
            organizationId: organization.id,
            organizationName: organization.name,
            memberId: retry.id,
            roleId: retry.role_id,
            roleName: retryRole?.name ?? "owner",
        };
    }

    const { data: membership } = await supabase
        .from("organization_members")
        .select("id, organization_id, role_id, roles(name), organizations(name, slug)")
        .eq("user_id", userId)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();

    if (!membership) {
        return null;
    }

    const role = normalizeRelated<{ name: string | null }>(membership.roles);
    const memberOrganization = normalizeRelated<{ name: string | null; slug: string | null }>(
        membership.organizations,
    );

    return {
        organizationId: membership.organization_id,
        organizationName: memberOrganization?.name ?? null,
        organizationSlug: memberOrganization?.slug ?? null,
        memberId: membership.id,
        roleId: membership.role_id,
        roleName: role?.name ?? null,
    };
}

async function getAssignableRole(supabase: ServerSupabase, roleId: string) {
    const { data: role, error } = await supabase
        .from("roles")
        .select("id, name")
        .eq("id", roleId)
        .neq("name", "owner")
        .maybeSingle();

    return { role, error };
}

export async function getMyMembership(): Promise<MyMembership | null> {
    const session = await requireUser();

    if (!session) {
        return null;
    }

    return getActorMembership(session.supabase, session.user.id);
}

export async function getMembers(): Promise<MembersState> {
    const session = await requireUser();

    if (!session) {
        return {
            error: "No se encontró un usuario autenticado.",
            success: null,
            data: null,
        };
    }

    const { supabase } = session;
    const actor = await getActorMembership(supabase, session.user.id);

    if (!actor) {
        return {
            error: "No tienes una organización registrada.",
            success: null,
            data: null,
        };
    }

    const { data, error } = await supabase
        .from("organization_members")
        .select("id, user_id, role_id, roles(name), profiles(first_name, last_name)")
        .eq("organization_id", actor.organizationId)
        .order("created_at", { ascending: true });

    if (error) {
        return {
            error: error.message,
            success: null,
            data: null,
        };
    }

    const members: MemberSummary[] = (data ?? []).map((row) => {
        const role = normalizeRelated<{ name: string | null }>(row.roles);
        const profile = normalizeRelated<{ first_name: string | null; last_name: string | null }>(row.profiles);

        return {
            id: row.id as string,
            firstName: profile?.first_name ?? null,
            lastName: profile?.last_name ?? null,
            roleId: row.role_id as string | null,
            roleName: role?.name ?? null,
        };
    });

    return {
        error: null,
        success: "Miembros obtenidos correctamente.",
        data: members,
    };
}

export async function getAssignableRoles(): Promise<RolesState> {
    const session = await requireUser();

    if (!session) {
        return {
            error: "No se encontró un usuario autenticado.",
            success: null,
            data: null,
        };
    }

    const { data, error } = await session.supabase
        .from("roles")
        .select("id, name")
        .neq("name", "owner")
        .order("name", { ascending: true });

    if (error) {
        return {
            error: error.message,
            success: null,
            data: null,
        };
    }

    const roles: RoleOption[] = (data ?? []).map((role) => ({
        id: role.id as string,
        name: role.name as string,
    }));

    return {
        error: null,
        success: "Roles obtenidos correctamente.",
        data: roles,
    };
}

export async function getAssignableBranches(): Promise<BranchesState> {
    const session = await requireUser();

    if (!session) {
        return {
            error: "No se encontró un usuario autenticado.",
            success: null,
            data: null,
        };
    }

    const { supabase } = session;
    const actor = await getActorMembership(supabase, session.user.id);

    if (!actor) {
        return {
            error: "No tienes una organización registrada.",
            success: null,
            data: null,
        };
    }

    const { data, error } = await supabase
        .from("organizations_branches")
        .select("id, name")
        .eq("organization_id", actor.organizationId)
        .order("created_at", { ascending: true });

    if (error) {
        return {
            error: error.message,
            success: null,
            data: null,
        };
    }

    const branches: BranchOption[] = (data ?? []).map((branch) => ({
        id: branch.id as string,
        name: branch.name as string | null,
    }));

    return {
        error: null,
        success: "Sucursales obtenidas correctamente.",
        data: branches,
    };
}

export async function insertInvitation(_prevState: InvitationFormState, formData: FormData): Promise<InvitationFormState> {
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const roleId = String(formData.get("role_id") ?? "").trim();

    if (!email) {
        return {
            error: "El correo electrónico es obligatorio.",
            success: null,
            data: null,
        };
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return {
            error: "Ingresa un correo electrónico válido.",
            success: null,
            data: null,
        };
    }

    if (!roleId) {
        return {
            error: "Selecciona un rol para la invitación.",
            success: null,
            data: null,
        };
    }

    const session = await requireUser();

    if (!session) {
        return {
            error: "Debes iniciar sesión antes de invitar a alguien.",
            success: null,
            data: null,
        };
    }

    const { supabase } = session;
    const actor = await getActorMembership(supabase, session.user.id);

    if (!actor) {
        return {
            error: "No tienes una organización registrada.",
            success: null,
            data: null,
        };
    }

    if (!canManageMembers(actor.roleName)) {
        return {
            error: "No tienes permiso para invitar miembros.",
            success: null,
            data: null,
        };
    }

    const { role, error: roleError } = await getAssignableRole(supabase, roleId);

    if (roleError) {
        return {
            error: roleError.message,
            success: null,
            data: null,
        };
    }

    if (!role) {
        return {
            error: "El rol seleccionado no es válido.",
            success: null,
            data: null,
        };
    }

    const { data: pending, error: pendingError } = await supabase
        .from("organization_invitations")
        .select("id")
        .eq("organization_id", actor.organizationId)
        .eq("email", email)
        .eq("status", true)
        .limit(1)
        .maybeSingle();

    if (pendingError) {
        return {
            error: pendingError.message,
            success: null,
            data: null,
        };
    }

    if (pending) {
        return {
            error: "Ya existe una invitación pendiente para ese correo.",
            success: null,
            data: null,
        };
    }

    const { token, tokenHash, expiresAt, inviteUrl } = createInvitationToken();

    const { error } = await supabase
        .from("organization_invitations")
        .insert({
            organization_id: actor.organizationId,
            email,
            role_id: role.id,
            invited_by: actor.memberId,
            token_hash: tokenHash,
            status: true,
            expires_at: expiresAt,
        });

    if (error) {
        if (error.code === "23505") {
            return {
                error: "Ya existe una invitación pendiente para ese correo.",
                success: null,
                data: null,
            };
        }

        return {
            error: error.message,
            success: null,
            data: null,
        };
    }

    revalidatePath("/miembros");

    return {
        error: null,
        success: "Invitación creada correctamente.",
        data: {
            token,
            inviteUrl,
        },
    };
}

export async function regenerateInvitation(invitationId: string): Promise<InvitationFormState> {
    const targetInvitationId = invitationId.trim();

    if (!targetInvitationId) {
        return {
            error: "No se encontró la invitación que quieres regenerar.",
            success: null,
            data: null,
        };
    }

    const session = await requireUser();

    if (!session) {
        return {
            error: "Debes iniciar sesión antes de regenerar una invitación.",
            success: null,
            data: null,
        };
    }

    const { supabase } = session;
    const actor = await getActorMembership(supabase, session.user.id);

    if (!actor) {
        return {
            error: "No tienes una organización registrada.",
            success: null,
            data: null,
        };
    }

    if (!canManageMembers(actor.roleName)) {
        return {
            error: "No tienes permiso para regenerar invitaciones.",
            success: null,
            data: null,
        };
    }

    const { data: invitation, error: invitationError } = await supabase
        .from("organization_invitations")
        .select("id")
        .eq("id", targetInvitationId)
        .eq("organization_id", actor.organizationId)
        .eq("status", true)
        .maybeSingle();

    if (invitationError) {
        return {
            error: invitationError.message,
            success: null,
            data: null,
        };
    }

    if (!invitation) {
        return {
            error: "La invitación no existe o ya fue revocada.",
            success: null,
            data: null,
        };
    }

    const { token, tokenHash, expiresAt, inviteUrl } = createInvitationToken();

    const { data: updated, error } = await supabase
        .from("organization_invitations")
        .update({
            token_hash: tokenHash,
            expires_at: expiresAt,
        })
        .eq("id", targetInvitationId)
        .eq("organization_id", actor.organizationId)
        .eq("status", true)
        .select("id");

    if (error) {
        return {
            error: error.message,
            success: null,
            data: null,
        };
    }

    if (!updated || updated.length === 0) {
        return {
            error: "No se pudo regenerar el enlace. La invitación pudo haber sido revocada.",
            success: null,
            data: null,
        };
    }

    revalidatePath("/miembros");

    return {
        error: null,
        success: "Enlace regenerado correctamente.",
        data: {
            token,
            inviteUrl,
        },
    };
}

export async function getPendingInvitations(): Promise<InvitationsState> {
    const session = await requireUser();

    if (!session) {
        return {
            error: "No se encontró un usuario autenticado.",
            success: null,
            data: null,
        };
    }

    const { supabase } = session;
    const actor = await getActorMembership(supabase, session.user.id);

    if (!actor) {
        return {
            error: "No tienes una organización registrada.",
            success: null,
            data: null,
        };
    }

    const { data, error } = await supabase
        .from("organization_invitations")
        .select("id, email, role_id, roles(name), status, expires_at, created_at")
        .eq("organization_id", actor.organizationId)
        .eq("status", true)
        .order("created_at", { ascending: false });

    if (error) {
        return {
            error: error.message,
            success: null,
            data: null,
        };
    }

    const invitationRows = data ?? [];

    // La función es SECURITY DEFINER porque consulta auth.users, que PostgREST no
    // expone. Si la RPC falla o no está disponible, la columna se degrada a "–"
    // en vez de tumbar la lista completa de invitaciones.
    const canRegisterById = new Map<string, boolean>();
    let hasEmailStates = true;

    if (invitationRows.length > 0) {
        const { data: emailStates, error: emailStatesError } = await supabase.rpc(
            "get_pending_invitation_email_states",
            { p_organization_id: actor.organizationId },
        );

        if (emailStatesError) {
            hasEmailStates = false;
        } else {
            for (const state of (emailStates ?? []) as InvitationEmailState[]) {
                canRegisterById.set(state.invitation_id, state.can_register);
            }
        }
    }

    const invitations: InvitationSummary[] = invitationRows.map((invitation) => {
        const role = normalizeRelated<{ name: string | null }>(invitation.roles);
        const expiresAt = invitation.expires_at as string | null;
        const invitationId = invitation.id as string;

        return {
            id: invitationId,
            email: (invitation.email as string | null) ?? "",
            roleName: role?.name ?? null,
            expiresAt,
            isExpired: expiresAt ? new Date(expiresAt).getTime() <= Date.now() : false,
            createdAt: invitation.created_at as string,
            canRegister: hasEmailStates ? (canRegisterById.get(invitationId) ?? null) : null,
        };
    });

    return {
        error: null,
        success: "Invitaciones obtenidas correctamente.",
        data: invitations,
    };
}

export async function deleteInvitation(_prevState: MemberFormState, formData: FormData): Promise<MemberFormState> {
    const invitationId = String(formData.get("invitationId") ?? "").trim();

    if (!invitationId) {
        return {
            error: "No se encontró la invitación que quieres revocar.",
            success: null,
        };
    }

    const session = await requireUser();

    if (!session) {
        return {
            error: "Debes iniciar sesión antes de revocar una invitación.",
            success: null,
        };
    }

    const { supabase } = session;
    const actor = await getActorMembership(supabase, session.user.id);

    if (!actor) {
        return {
            error: "No tienes una organización registrada.",
            success: null,
        };
    }

    if (!canManageMembers(actor.roleName)) {
        return {
            error: "No tienes permiso para revocar invitaciones.",
            success: null,
        };
    }

    const { data: deleted, error } = await supabase
        .from("organization_invitations")
        .delete()
        .eq("id", invitationId)
        .eq("organization_id", actor.organizationId)
        .select("id");

    if (error) {
        return {
            error: error.message,
            success: null,
        };
    }

    if (!deleted || deleted.length === 0) {
        return {
            error: "La invitación no existe o ya fue revocada.",
            success: null,
        };
    }

    revalidatePath("/miembros");

    return {
        error: null,
        success: "Invitación revocada correctamente.",
    };
}

export async function setMemberRole(_prevState: MemberFormState, formData: FormData): Promise<MemberFormState> {
    const memberId = String(formData.get("memberId") ?? "").trim();
    const roleId = String(formData.get("role_id") ?? "").trim();

    if (!memberId) {
        return {
            error: "No se encontró el miembro que quieres actualizar.",
            success: null,
        };
    }

    if (!roleId) {
        return {
            error: "Selecciona un rol para el miembro.",
            success: null,
        };
    }

    const session = await requireUser();

    if (!session) {
        return {
            error: "Debes iniciar sesión antes de actualizar un rol.",
            success: null,
        };
    }

    const { supabase } = session;
    const actor = await getActorMembership(supabase, session.user.id);

    if (!actor) {
        return {
            error: "No tienes una organización registrada.",
            success: null,
        };
    }

    if (!canManageMembers(actor.roleName)) {
        return {
            error: "No tienes permiso para cambiar roles.",
            success: null,
        };
    }

    const { data: target, error: targetError } = await supabase
        .from("organization_members")
        .select("id, user_id, role_id, roles(name)")
        .eq("id", memberId)
        .eq("organization_id", actor.organizationId)
        .maybeSingle();

    if (targetError) {
        return {
            error: targetError.message,
            success: null,
        };
    }

    if (!target) {
        return {
            error: "El miembro no existe en tu organización.",
            success: null,
        };
    }

    const targetRole = normalizeRelated<{ name: string | null }>(target.roles);

    if (targetRole?.name === "owner") {
        return {
            error: "No puedes cambiar el rol del propietario.",
            success: null,
        };
    }

    if (target.user_id === session.user.id) {
        return {
            error: "No puedes cambiar tu propio rol.",
            success: null,
        };
    }

    const { role, error: roleError } = await getAssignableRole(supabase, roleId);

    if (roleError) {
        return {
            error: roleError.message,
            success: null,
        };
    }

    if (!role) {
        return {
            error: "El rol seleccionado no es válido.",
            success: null,
        };
    }

    const { data: updated, error } = await supabase
        .from("organization_members")
        .update({ role_id: role.id })
        .eq("id", memberId)
        .eq("organization_id", actor.organizationId)
        .select("id");

    if (error) {
        return {
            error: error.message,
            success: null,
        };
    }

    if (!updated || updated.length === 0) {
        return {
            error: "El miembro no existe en tu organización.",
            success: null,
        };
    }

    revalidatePath("/miembros");

    return {
        error: null,
        success: "Rol actualizado correctamente.",
    };
}

export async function deleteMember(_prevState: MemberFormState, formData: FormData): Promise<MemberFormState> {
    const memberId = String(formData.get("memberId") ?? "").trim();

    if (!memberId) {
        return {
            error: "No se encontró el miembro que quieres quitar.",
            success: null,
        };
    }

    const session = await requireUser();

    if (!session) {
        return {
            error: "Debes iniciar sesión antes de quitar a un miembro.",
            success: null,
        };
    }

    const { supabase } = session;
    const actor = await getActorMembership(supabase, session.user.id);

    if (!actor) {
        return {
            error: "No tienes una organización registrada.",
            success: null,
        };
    }

    if (!canManageMembers(actor.roleName)) {
        return {
            error: "No tienes permiso para quitar miembros.",
            success: null,
        };
    }

    const { data: target, error: targetError } = await supabase
        .from("organization_members")
        .select("id, user_id, role_id, roles(name)")
        .eq("id", memberId)
        .eq("organization_id", actor.organizationId)
        .maybeSingle();

    if (targetError) {
        return {
            error: targetError.message,
            success: null,
        };
    }

    if (!target) {
        return {
            error: "El miembro no existe en tu organización.",
            success: null,
        };
    }

    const targetRole = normalizeRelated<{ name: string | null }>(target.roles);

    if (targetRole?.name === "owner") {
        return {
            error: "No puedes quitar al propietario de la organización.",
            success: null,
        };
    }

    if (target.user_id === session.user.id) {
        return {
            error: "No puedes quitarte a ti mismo de la organización.",
            success: null,
        };
    }

    const { data: deleted, error } = await supabase
        .from("organization_members")
        .delete()
        .eq("id", memberId)
        .eq("organization_id", actor.organizationId)
        .select("id");

    if (error) {
        return {
            error: error.message,
            success: null,
        };
    }

    if (!deleted || deleted.length === 0) {
        return {
            error: "El miembro no existe en tu organización.",
            success: null,
        };
    }

    revalidatePath("/miembros");

    return {
        error: null,
        success: "Miembro eliminado correctamente.",
    };
}

export async function getMemberBranchIds(memberId: string): Promise<MemberBranchIdsState> {
    const targetMemberId = memberId.trim();

    if (!targetMemberId) {
        return {
            error: "No se encontró el miembro que quieres revisar.",
            success: null,
            data: null,
        };
    }

    const session = await requireUser();

    if (!session) {
        return {
            error: "Debes iniciar sesión antes de revisar las sucursales.",
            success: null,
            data: null,
        };
    }

    const { supabase } = session;
    const actor = await getActorMembership(supabase, session.user.id);

    if (!actor) {
        return {
            error: "No tienes una organización registrada.",
            success: null,
            data: null,
        };
    }

    if (!canManageMembers(actor.roleName)) {
        return {
            error: "No tienes permiso para revisar sucursales.",
            success: null,
            data: null,
        };
    }

    const { data: target } = await supabase
        .from("organization_members")
        .select("id")
        .eq("id", targetMemberId)
        .eq("organization_id", actor.organizationId)
        .maybeSingle();

    if (!target) {
        return {
            error: "El miembro no existe en tu organización.",
            success: null,
            data: null,
        };
    }

    const { data, error } = await supabase
        .from("organizations_branch_members")
        .select("branch_id")
        .eq("organization_member_id", targetMemberId);

    if (error) {
        return {
            error: error.message,
            success: null,
            data: null,
        };
    }

    return {
        error: null,
        success: "Sucursales del miembro obtenidas correctamente.",
        data: (data ?? []).map((row) => row.branch_id as string),
    };
}

export async function setMemberBranches(memberId: string, branchIds: string[]): Promise<MemberFormState> {
    const targetMemberId = memberId.trim();

    if (!targetMemberId) {
        return {
            error: "No se encontró el miembro que quieres actualizar.",
            success: null,
        };
    }

    const uniqueBranchIds = Array.from(new Set(branchIds.map((branchId) => branchId.trim()).filter(Boolean)));

    const session = await requireUser();

    if (!session) {
        return {
            error: "Debes iniciar sesión antes de asignar sucursales.",
            success: null,
        };
    }

    const { supabase } = session;
    const actor = await getActorMembership(supabase, session.user.id);

    if (!actor) {
        return {
            error: "No tienes una organización registrada.",
            success: null,
        };
    }

    if (!canManageMembers(actor.roleName)) {
        return {
            error: "No tienes permiso para asignar sucursales.",
            success: null,
        };
    }

    const { data: target } = await supabase
        .from("organization_members")
        .select("id")
        .eq("id", targetMemberId)
        .eq("organization_id", actor.organizationId)
        .maybeSingle();

    if (!target) {
        return {
            error: "El miembro no existe en tu organización.",
            success: null,
        };
    }

    if (uniqueBranchIds.length > 0) {
        const { data: validBranches, error: branchesError } = await supabase
            .from("organizations_branches")
            .select("id")
            .eq("organization_id", actor.organizationId)
            .in("id", uniqueBranchIds);

        if (branchesError) {
            return {
                error: branchesError.message,
                success: null,
            };
        }

        if (!validBranches || validBranches.length !== uniqueBranchIds.length) {
            return {
                error: "Una de las sucursales seleccionadas no pertenece a tu organización.",
                success: null,
            };
        }
    }

    const { data: current, error: currentError } = await supabase
        .from("organizations_branch_members")
        .select("branch_id")
        .eq("organization_member_id", targetMemberId);

    if (currentError) {
        return {
            error: currentError.message,
            success: null,
        };
    }

    const currentBranchIds = (current ?? []).map((row) => row.branch_id as string);
    const branchIdsToAdd = uniqueBranchIds.filter((branchId) => !currentBranchIds.includes(branchId));
    const branchIdsToRemove = currentBranchIds.filter((branchId) => !uniqueBranchIds.includes(branchId));

    if (branchIdsToAdd.length > 0) {
        const { error } = await supabase
            .from("organizations_branch_members")
            .insert(branchIdsToAdd.map((branchId) => ({
                organization_member_id: targetMemberId,
                branch_id: branchId,
            })));

        if (error) {
            return {
                error: error.message,
                success: null,
            };
        }
    }

    if (branchIdsToRemove.length > 0) {
        const { error } = await supabase
            .from("organizations_branch_members")
            .delete()
            .eq("organization_member_id", targetMemberId)
            .in("branch_id", branchIdsToRemove);

        if (error) {
            return {
                error: error.message,
                success: null,
            };
        }
    }

    revalidatePath("/miembros");

    return {
        error: null,
        success: "Sucursales actualizadas correctamente.",
    };
}
