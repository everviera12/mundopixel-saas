import { getOrganization } from "@/lib/actions/organizations";
import { getProfile } from "@/lib/actions/profiles";
import { OrganizationBanner } from "./organization-banner";
import { OrganizationForm } from "./organization-form";
import { ProfileBanner } from "./profile-banner";

export default async function ProfilePage() {
    const { user, profile, emailVerified } = await getProfile();
    const { data: organization } = await getOrganization();

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
            ) : (
                <OrganizationForm />
            )}
        </div>
    );
}
