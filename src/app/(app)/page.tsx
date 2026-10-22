import Link from "next/link";

import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import {
    ArrowRight01Icon,
    Building03Icon,
    Mail01Icon,
    Settings01Icon,
    Store01Icon,
    UserMultiple02Icon,
} from "@hugeicons/core-free-icons";

import { Badge } from "@/components/ui/badge";
import {
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    getAssignableBranches,
    getMembers,
    getMyMembership,
    getMyMemberships,
    getPendingInvitations,
} from "@/lib/actions/members";
import { getProfile } from "@/lib/actions/profiles";
import { getRoleLabel } from "@/lib/role-labels";

type StatCardProps = {
    label: string;
    value: string;
    description: string;
    href: string;
    icon: IconSvgElement;
};

function StatCard({ label, value, description, href, icon }: StatCardProps) {
    return (
        <Link href={href} className="group">
            <Card className="h-full border border-border bg-muted/50 ring-0 transition-colors group-hover:bg-muted">
                <CardContent className="flex items-start justify-between gap-3">
                    <div className="grid gap-1">
                        <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                            {label}
                        </span>
                        <span className="font-heading text-3xl font-semibold tracking-tight">
                            {value}
                        </span>
                        <span className="text-xs text-muted-foreground">{description}</span>
                    </div>

                    <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl border border-border bg-background/70">
                        <HugeiconsIcon
                            icon={icon}
                            strokeWidth={2}
                            className="size-5 text-muted-foreground"
                        />
                    </span>
                </CardContent>
            </Card>
        </Link>
    );
}

function getMemberName(member: { firstName: string | null; lastName: string | null }) {
    return [member.firstName, member.lastName].filter(Boolean).join(" ") || "Sin nombre";
}

function getMemberInitials(member: { firstName: string | null; lastName: string | null }) {
    const first = member.firstName?.charAt(0) ?? "";
    const last = member.lastName?.charAt(0) ?? "";

    return `${first}${last}`.toUpperCase() || "?";
}

export default async function HomePage() {
    const { user, profile } = await getProfile();
    const memberships = await getMyMemberships();
    const defaultMembership = await getMyMembership();

    // Misma regla que /miembros: la organización propia si existe; si no, la
    // primera membresía. Así el home muestra el mismo contexto que esa página.
    const membership =
        memberships.find((item) => item.organizationId === defaultMembership?.organizationId) ??
        defaultMembership ??
        memberships[0] ??
        null;

    const canManage = membership?.roleName === "owner" || membership?.roleName === "admin";
    const canInvite = canManage || membership?.roleName === "manager";

    const [membersResponse, branchesResponse, invitationsResponse] = membership
        ? await Promise.all([
            getMembers(membership.organizationId),
            getAssignableBranches(membership.organizationId),
            getPendingInvitations(membership.organizationId),
        ])
        : [null, null, null];

    const members = membersResponse?.data ?? [];
    const branches = branchesResponse?.data ?? [];
    const pendingInvitations = (invitationsResponse?.data ?? []).filter(
        (invitation) => !invitation.isExpired,
    );
    const loadError =
        membersResponse?.error ??
        branchesResponse?.error ??
        invitationsResponse?.error;

    const firstName = profile?.first_name ?? user?.user_metadata?.first_name ?? "";
    const displayName = firstName || "Usuario";
    const organizationName = membership?.organizationName ?? "tu organización";

    const quickLinks = [
        {
            href: "/sucursales",
            label: "Gestionar sucursales",
            description: "Crea y edita las sucursales de la organización.",
            icon: Store01Icon,
        },
        {
            href: "/miembros",
            label: "Miembros e invitaciones",
            description: "Roles, permisos e invitaciones del equipo.",
            icon: UserMultiple02Icon,
        },
        {
            href: "/profile",
            label: "Mi perfil",
            description: "Tus datos personales y tu organización.",
            icon: Settings01Icon,
        },
        ...(memberships.length > 1
            ? [
                {
                    href: "/sucursales/organizaciones",
                    label: "Mis organizaciones",
                    description: "Organizaciones a las que perteneces.",
                    icon: Building03Icon,
                },
            ]
            : []),
    ];

    return (
        <div className="grid gap-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div className="grid gap-1">
                    <span className="text-sm font-medium text-muted-foreground">
                        Panel de control
                    </span>
                    <h1 className="font-heading text-3xl font-semibold tracking-tight">
                        Hola, {displayName}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        {membership ? (
                            <>
                                Estás viendo{" "}
                                <span className="font-medium text-foreground">
                                    {organizationName}
                                </span>{" "}
                                como {getRoleLabel(membership.roleName).toLowerCase()}.
                            </>
                        ) : (
                            "Crea tu organización para empezar a gestionar sucursales y equipo."
                        )}
                    </p>
                </div>

                {membership ? (
                    <Badge variant="outline" className="h-7 px-3 text-sm">
                        {getRoleLabel(membership.roleName)}
                    </Badge>
                ) : null}
            </div>

            {loadError ? <p className="text-sm text-destructive">{loadError}</p> : null}

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                    label="Sucursales"
                    value={canManage ? String(branches.length) : "—"}
                    description={canManage ? "Registradas en la organización" : "Solo owner y admins"}
                    href="/sucursales"
                    icon={Store01Icon}
                />
                <StatCard
                    label="Miembros"
                    value={membership ? String(members.length) : "0"}
                    description="Personas con acceso a la organización"
                    href="/miembros"
                    icon={UserMultiple02Icon}
                />
                <StatCard
                    label="Invitaciones"
                    value={canInvite ? String(pendingInvitations.length) : "—"}
                    description={
                        canInvite
                            ? "Pendientes de aceptar"
                            : "Solo owner, admins y gerentes"
                    }
                    href="/miembros"
                    icon={Mail01Icon}
                />
                <StatCard
                    label="Organizaciones"
                    value={String(memberships.length)}
                    description={
                        memberships.length === 1
                            ? "Organización a la que perteneces"
                            : "Organizaciones a las que perteneces"
                    }
                    href="/sucursales/organizaciones"
                    icon={Building03Icon}
                />
            </div>

            {membership ? (
                <div className="grid items-start gap-4 lg:grid-cols-3">
                    <div className="grid gap-4 lg:col-span-2">
                        <Card className="border border-border bg-muted/50 ring-0">
                            <CardHeader>
                                <CardTitle>Miembros del equipo</CardTitle>
                                <CardDescription>
                                    Personas con acceso a {organizationName}.
                                </CardDescription>
                                <CardAction>
                                    <Link
                                        href="/miembros"
                                        className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                                    >
                                        Ver todos
                                        <HugeiconsIcon
                                            icon={ArrowRight01Icon}
                                            strokeWidth={2}
                                            className="size-4"
                                        />
                                    </Link>
                                </CardAction>
                            </CardHeader>

                            <CardContent>
                                {members.length > 0 ? (
                                    <ul className="grid gap-1">
                                        {members.slice(0, 6).map((member) => (
                                            <li
                                                key={member.id}
                                                className="flex items-center gap-3 rounded-2xl px-2 py-2"
                                            >
                                                <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border bg-background/70 text-xs font-semibold text-muted-foreground">
                                                    {getMemberInitials(member)}
                                                </span>

                                                <span className="min-w-0 flex-1 truncate text-sm font-medium">
                                                    {getMemberName(member)}
                                                    {member.id === membership.memberId ? (
                                                        <span className="ml-2 text-xs font-normal text-muted-foreground">
                                                            (tú)
                                                        </span>
                                                    ) : null}
                                                </span>

                                                <Badge
                                                    variant={
                                                        member.roleName === "owner"
                                                            ? "default"
                                                            : "outline"
                                                    }
                                                >
                                                    {getRoleLabel(member.roleName)}
                                                </Badge>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-sm text-muted-foreground">
                                        Todavía no hay miembros en esta organización.
                                    </p>
                                )}
                            </CardContent>
                        </Card>

                        {canInvite ? (
                            <Card className="border border-border bg-muted/50 ring-0">
                                <CardHeader>
                                    <CardTitle>Invitaciones pendientes</CardTitle>
                                    <CardDescription>
                                        Enlaces activos que todavía no se han aceptado.
                                    </CardDescription>
                                    <CardAction>
                                        <Link
                                            href="/miembros"
                                            className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                                        >
                                            Gestionar
                                            <HugeiconsIcon
                                                icon={ArrowRight01Icon}
                                                strokeWidth={2}
                                                className="size-4"
                                            />
                                        </Link>
                                    </CardAction>
                                </CardHeader>

                                <CardContent>
                                    {pendingInvitations.length > 0 ? (
                                        <ul className="grid gap-1">
                                            {pendingInvitations.slice(0, 5).map((invitation) => {
                                                const expiresAt = invitation.expiresAt
                                                    ? new Date(invitation.expiresAt)
                                                    : null;

                                                return (
                                                    <li
                                                        key={invitation.id}
                                                        className="flex items-center gap-3 rounded-2xl px-2 py-2"
                                                    >
                                                        <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border bg-background/70">
                                                            <HugeiconsIcon
                                                                icon={Mail01Icon}
                                                                strokeWidth={2}
                                                                className="size-4 text-muted-foreground"
                                                            />
                                                        </span>

                                                        <span className="min-w-0 flex-1">
                                                            <span className="block truncate text-sm font-medium">
                                                                {invitation.email}
                                                            </span>
                                                            <span className="block text-xs text-muted-foreground">
                                                                {expiresAt
                                                                    ? `Vence el ${expiresAt.toLocaleDateString("es-MX", {
                                                                        day: "numeric",
                                                                        month: "short",
                                                                        year: "numeric",
                                                                    })}`
                                                                    : "Sin fecha de vencimiento"}
                                                            </span>
                                                        </span>

                                                        <Badge variant="outline">
                                                            {getRoleLabel(invitation.roleName)}
                                                        </Badge>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    ) : (
                                        <p className="text-sm text-muted-foreground">
                                            No hay invitaciones pendientes.
                                        </p>
                                    )}
                                </CardContent>
                            </Card>
                        ) : null}
                    </div>

                    <div className="grid gap-4">
                        <Card className="border border-border bg-muted/50 ring-0">
                            <CardHeader>
                                <CardTitle>Tu organización</CardTitle>
                                <CardDescription>
                                    El espacio de trabajo que estás viendo.
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="grid gap-4">
                                <div className="flex items-center gap-3">
                                    <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-border bg-background/70">
                                        <HugeiconsIcon
                                            icon={Building03Icon}
                                            strokeWidth={2}
                                            className="size-5 text-muted-foreground"
                                        />
                                    </span>

                                    <div className="grid min-w-0">
                                        <span className="truncate text-sm font-medium">
                                            {organizationName}
                                        </span>
                                        <span className="truncate text-xs text-muted-foreground">
                                            {membership.organizationSlug ?? "Sin slug"}
                                        </span>
                                    </div>

                                    <Badge variant="outline" className="ml-auto">
                                        {getRoleLabel(membership.roleName)}
                                    </Badge>
                                </div>

                                <Link
                                    href="/profile"
                                    className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                                >
                                    Ver en mi perfil
                                    <HugeiconsIcon
                                        icon={ArrowRight01Icon}
                                        strokeWidth={2}
                                        className="size-4"
                                    />
                                </Link>
                            </CardContent>
                        </Card>

                        <Card className="border border-border bg-muted/50 ring-0">
                            <CardHeader>
                                <CardTitle>Accesos rápidos</CardTitle>
                                <CardDescription>Lo que más se usa, a un clic.</CardDescription>
                            </CardHeader>

                            <CardContent>
                                <ul className="grid gap-1">
                                    {quickLinks.map((link) => (
                                        <li key={link.href}>
                                            <Link
                                                href={link.href}
                                                className="flex items-center gap-3 rounded-2xl px-2 py-2 transition-colors hover:bg-background/60"
                                            >
                                                <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border bg-background/70">
                                                    <HugeiconsIcon
                                                        icon={link.icon}
                                                        strokeWidth={2}
                                                        className="size-4 text-muted-foreground"
                                                    />
                                                </span>

                                                <span className="min-w-0 flex-1">
                                                    <span className="block text-sm font-medium">
                                                        {link.label}
                                                    </span>
                                                    <span className="block text-xs text-muted-foreground">
                                                        {link.description}
                                                    </span>
                                                </span>

                                                <HugeiconsIcon
                                                    icon={ArrowRight01Icon}
                                                    strokeWidth={2}
                                                    className="size-4 shrink-0 text-muted-foreground"
                                                />
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>

                        {memberships.length > 1 ? (
                            <Card className="border border-border bg-muted/50 ring-0">
                                <CardHeader>
                                    <CardTitle>Mis organizaciones</CardTitle>
                                    <CardDescription>
                                        Cambia de contexto desde Miembros.
                                    </CardDescription>
                                </CardHeader>

                                <CardContent>
                                    <ul className="grid gap-1">
                                        {memberships.map((item) => (
                                            <li key={item.organizationId}>
                                                <Link
                                                    href={{
                                                        pathname: "/miembros",
                                                        query: { org: item.organizationId },
                                                    }}
                                                    className="flex items-center gap-2 rounded-2xl px-2 py-2 transition-colors hover:bg-background/60"
                                                >
                                                    <span className="min-w-0 flex-1 truncate text-sm font-medium">
                                                        {item.organizationName ?? "Organización"}
                                                    </span>

                                                    {item.organizationId === membership.organizationId ? (
                                                        <Badge variant="secondary">Actual</Badge>
                                                    ) : null}

                                                    <Badge variant="outline">
                                                        {getRoleLabel(item.roleName)}
                                                    </Badge>
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                            </Card>
                        ) : null}
                    </div>
                </div>
            ) : (
                <Card className="border border-border bg-muted/50 ring-0">
                    <CardHeader>
                        <CardTitle>Da el primer paso</CardTitle>
                        <CardDescription>
                            Aún no perteneces a ninguna organización.
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="grid gap-4">
                        <p className="text-sm text-muted-foreground">
                            Crea tu organización desde tu perfil para empezar a registrar
                            sucursales e invitar a tu equipo.
                        </p>

                        <Link
                            href="/profile"
                            className="inline-flex w-fit items-center gap-1 text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                        >
                            Crear mi organización
                            <HugeiconsIcon
                                icon={ArrowRight01Icon}
                                strokeWidth={2}
                                className="size-4"
                            />
                        </Link>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
