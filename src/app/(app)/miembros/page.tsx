import { Separator } from "@/components/ui/separator";
import {
    getAssignableBranches,
    getAssignableRoles,
    getMembers,
    getMyMembership,
    getPendingInvitations,
} from "@/lib/actions/members";
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

export default async function MembersPage() {
    const membership = await getMyMembership();

    if (!membership) {
        return (
            <div className="p-6">
                <h1 className="text-xl font-semibold">Miembros</h1>
                <p className="mt-4 text-sm text-destructive">
                    No tienes una organización registrada.
                </p>
            </div>
        );
    }

    const isManager = membership.roleName === "owner" || membership.roleName === "admin";

    const [membersResponse, rolesResponse, invitationsResponse, branchesResponse] = await Promise.all([
        getMembers(),
        getAssignableRoles(),
        getPendingInvitations(),
        getAssignableBranches(),
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
                        Administra el equipo de {membership.organizationName ?? "tu organización"}.
                    </p>
                </div>

                {isManager && <InviteMemberDialog roles={roles} branches={branches} />}
            </div>

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
                    canManage={isManager}
                />
            </section>

            {isManager && (
                <>
                    <Separator />

                    <section className="space-y-3">
                        <div>
                            <h2 className="text-lg font-semibold tracking-tight">Invitaciones pendientes</h2>
                            <p className="text-sm text-muted-foreground">
                                Los enlaces se pueden revocar en cualquier momento antes de ser aceptados.
                            </p>
                        </div>

                        <InvitationsTable invitations={invitations} />
                    </section>
                </>
            )}
        </div>
    );
}
