import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import {
    getAssignableBranches,
    getAssignableRoles,
    getMembers,
    getMyMembership,
    getMyMemberships,
    getPendingInvitations,
} from "@/lib/actions/members";
import { cn } from "@/lib/utils";
import { InvitationsTable } from "./invitations-table";
import { InviteMemberDialog } from "./invite-member-dialog";
import { MembersTable } from "./members-table";

const ROLE_LABELS: Record<string, string> = {
    owner: "Propietario",
    admin: "Administrador",
    manager: "Gerente",
    salesperson: "Vendedor",
};

function getRoleLabel(roleName: string | null) {
    if (!roleName) {
        return "Sin rol";
    }

    return ROLE_LABELS[roleName] ?? roleName;
}

export default async function MembersPage({ searchParams }: PageProps<"/miembros">) {
    const params = await searchParams;
    const requestedOrganizationId = typeof params.org === "string" ? params.org : null;

    const memberships = await getMyMemberships();

    if (memberships.length === 0) {
        return (
            <div className="p-6">
                <h1 className="text-xl font-semibold">Miembros</h1>
                <p className="mt-4 text-sm text-destructive">
                    No perteneces a ninguna organización.
                </p>
            </div>
        );
    }

    // Contexto por defecto: la organización propia si existe; si no, la primera
    // membresía. El ?org= solo se respeta si es una organización del usuario.
    const defaultMembership = await getMyMembership();

    const membership =
        memberships.find((item) => item.organizationId === requestedOrganizationId) ??
        defaultMembership ??
        memberships[0];

    const canManage = membership.roleName === "owner" || membership.roleName === "admin";
    const canInvite = canManage || membership.roleName === "manager";

    const [membersResponse, rolesResponse, invitationsResponse, branchesResponse] = await Promise.all([
        getMembers(membership.organizationId),
        getAssignableRoles(membership.organizationId),
        getPendingInvitations(membership.organizationId),
        getAssignableBranches(membership.organizationId),
    ]);

    if (membersResponse.error) {
        return (
            <div className="p-6">
                <h1 className="text-xl font-semibold">Miembros</h1>
                <p className="mt-4 text-sm text-destructive">{membersResponse.error}</p>
            </div>
        );
    }

    const members = (membersResponse.data ?? []).map((member) => ({
        ...member,
        roleLabel: getRoleLabel(member.roleName),
    }));

    const roles = (rolesResponse.data ?? []).map((role) => ({
        id: role.id,
        label: getRoleLabel(role.name),
    }));

    const branches = (branchesResponse.data ?? []).map((branch) => ({
        id: branch.id,
        name: branch.name ?? "Sin nombre",
    }));

    const invitations = (invitationsResponse.data ?? []).map((invitation) => {
        const expiresAt = invitation.expiresAt ? new Date(invitation.expiresAt) : null;

        return {
            id: invitation.id,
            email: invitation.email,
            roleLabel: getRoleLabel(invitation.roleName),
            expiresAtLabel: expiresAt
                ? expiresAt.toLocaleDateString("es-MX", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                })
                : "Sin fecha",
            isExpired: invitation.isExpired,
            canRegister: invitation.canRegister,
        };
    });

    const loadError = rolesResponse.error ?? branchesResponse.error ?? invitationsResponse.error;

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">Miembros</h1>
                    <p className="text-sm text-muted-foreground">
                        {canInvite ? "Administra el equipo de" : "Consulta el equipo de"}{" "}
                        {membership.organizationName ?? "tu organización"}.
                    </p>
                </div>

                {canInvite && (
                    <InviteMemberDialog
                        roles={roles}
                        branches={branches}
                        organizationId={membership.organizationId}
                    />
                )}
            </div>

            {memberships.length > 1 && (
                <nav className="flex flex-wrap items-center gap-2" aria-label="Organizaciones">
                    {memberships.map((item) => {
                        const isActive = item.organizationId === membership.organizationId;

                        return (
                            <Link
                                key={item.organizationId}
                                href={{ pathname: "/miembros", query: { org: item.organizationId } }}
                                aria-current={isActive ? "page" : undefined}
                                className={cn(
                                    "rounded-4xl border px-3 py-1.5 text-sm font-medium transition-colors",
                                    isActive
                                        ? "border-primary bg-primary text-primary-foreground"
                                        : "border-border bg-muted/50 text-muted-foreground hover:text-foreground",
                                )}
                            >
                                {item.organizationName ?? "Organización"}
                            </Link>
                        );
                    })}
                </nav>
            )}

            {loadError && (
                <p className="text-sm text-destructive">{loadError}</p>
            )}

            <section className="space-y-3">
                <h2 className="text-lg font-semibold tracking-tight">Miembros del equipo</h2>

                <MembersTable
                    members={members}
                    roles={roles}
                    branches={branches}
                    currentMemberId={membership.memberId}
                    canManage={canManage}
                />
            </section>

            {canInvite && (
                <>
                    <Separator />

                    <section className="space-y-3">
                        <div>
                            <h2 className="text-lg font-semibold tracking-tight">Invitaciones pendientes</h2>
                            <p className="text-sm text-muted-foreground">
                                Los enlaces se pueden revocar en cualquier momento antes de ser aceptados.
                            </p>
                        </div>

                        <InvitationsTable invitations={invitations} canRegenerate={canManage} />
                    </section>
                </>
            )}
        </div>
    );
}
