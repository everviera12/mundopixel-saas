import { getMyMembership } from "@/lib/actions/members";
import { getOrganization } from "@/lib/actions/organizations";
import { getProfile } from "@/lib/actions/profiles";
import { OrganizationBanner } from "./organization-banner";
import { OrganizationForm } from "./organization-form";
import { ProfileBanner } from "./profile-banner";

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

export default async function ProfilePage() {
    const { user, profile, emailVerified } = await getProfile();
    const { data: organization } = await getOrganization();
    const membership = await getMyMembership();

    if (!user) {
        return null;
    }

    const firstName = profile?.first_name ?? user.user_metadata?.first_name ?? "";
    const lastName = profile?.last_name ?? user.user_metadata?.last_name ?? "";
    const displayName = [firstName, lastName].filter(Boolean).join(" ") || "Usuario";
    const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || "U";

    return (
        <div className="grid gap-6">
            <ProfileBanner
                initials={initials}
                firstName={firstName}
                lastName={lastName}
                displayName={displayName}
                email={user.email ?? ""}
                emailVerified={emailVerified}
            />

            {organization ? (
                <OrganizationBanner
                    name={organization.name}
                    slug={organization.slug}
                />
            ) : membership?.organizationName ? (
                <OrganizationBanner
                    name={membership.organizationName}
                    slug={membership.organizationSlug ?? undefined}
                    roleLabel={getRoleLabel(membership.roleName)}
                />
            ) : (
                <OrganizationForm />
            )}
        </div>
    );
}
