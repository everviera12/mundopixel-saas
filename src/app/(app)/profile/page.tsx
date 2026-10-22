import Link from "next/link";

import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";

import { getMyMemberships } from "@/lib/actions/members";
import { getOrganization } from "@/lib/actions/organizations";
import { getProfile } from "@/lib/actions/profiles";
import { getRoleLabel } from "@/lib/role-labels";
import { OrganizationBanner } from "./organization-banner";
import { OrganizationForm } from "./organization-form";
import { ProfileBanner } from "./profile-banner";

export default async function ProfilePage() {
    const { user, profile, emailVerified } = await getProfile();
    const { data: organization } = await getOrganization();
    const memberships = await getMyMemberships();
    const otherMemberships = memberships.filter(
        (membership) => membership.organizationId !== organization?.id,
    );

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

            <section className="grid gap-3">
                <h2 className="text-lg font-semibold tracking-tight">Mi organización</h2>

                {organization ? (
                    <OrganizationBanner
                        name={organization.name}
                        slug={organization.slug}
                    />
                ) : (
                    <OrganizationForm />
                )}
            </section>

            {otherMemberships.length > 0 ? (
                <section className="grid gap-3">
                    <h2 className="text-lg font-semibold tracking-tight">Mis organizaciones</h2>

                    <div className="grid gap-4">
                        {otherMemberships.map((membership) => (
                            <OrganizationBanner
                                key={membership.organizationId}
                                name={membership.organizationName ?? "Organización"}
                                slug={membership.organizationSlug ?? undefined}
                                roleLabel={getRoleLabel(membership.roleName)}
                            />
                        ))}
                    </div>

                    <Link
                        href="/sucursales/organizaciones"
                        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                    >
                        Ver todas mis organizaciones
                        <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} className="size-4" />
                    </Link>
                </section>
            ) : null}
        </div>
    );
}
