import Link from "next/link";

import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft02Icon } from "@hugeicons/core-free-icons";

import { OrganizationBanner } from "@/app/(app)/profile/organization-banner";
import { getMyMemberships } from "@/lib/actions/members";
import { getRoleLabel } from "@/lib/role-labels";

export default async function MyOrganizationsPage() {
    const memberships = await getMyMemberships();

    return (
        <div className="space-y-6">
            <div className="grid gap-1">
                <h1 className="text-2xl font-semibold tracking-tight">Mis organizaciones</h1>
                <p className="text-sm text-muted-foreground">
                    Organizaciones a las que perteneces y tu cargo en cada una.
                </p>
            </div>

            {memberships.length > 0 ? (
                <div className="grid gap-4">
                    {memberships.map((membership) => (
                        <OrganizationBanner
                            key={membership.organizationId}
                            name={membership.organizationName ?? "Organización"}
                            slug={membership.organizationSlug ?? undefined}
                            roleLabel={getRoleLabel(membership.roleName)}
                        />
                    ))}
                </div>
            ) : (
                <p className="text-sm text-muted-foreground">
                    No perteneces a ninguna organización todavía.
                </p>
            )}

            <Link
                href="/sucursales"
                className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
                <HugeiconsIcon icon={ArrowLeft02Icon} strokeWidth={2} className="size-4" />
                Volver a sucursales
            </Link>
        </div>
    );
}
