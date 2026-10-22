import { Suspense, type ReactNode } from "react";
import Link from "next/link";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
    getInvitationPreview,
    signOutForInvitation,
} from "@/lib/actions/invitations";
import { requireUser } from "@/lib/auth";
import { AcceptInvitationForm } from "./accept-invitation-form";

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

function formatExpiration(expiresAt: string | null) {
    if (!expiresAt) {
        return null;
    }

    const date = new Date(expiresAt);

    if (Number.isNaN(date.getTime())) {
        return null;
    }

    return new Intl.DateTimeFormat("es-MX", {
        dateStyle: "long",
    }).format(date);
}

function buildAuthHref(path: string, email: string, next: string) {
    const params = new URLSearchParams();

    if (email) {
        params.set("email", email);
    }

    if (next) {
        params.set("next", next);
    }

    const query = params.toString();

    return query ? `${path}?${query}` : path;
}

export default function InvitePage({ params }: PageProps<"/invite/[token]">) {
    return (
        <InvitationShell>
            <Suspense fallback={<InvitationLoading />}>
                <InvitationContent params={params} />
            </Suspense>
        </InvitationShell>
    );
}

async function InvitationContent({
    params,
}: Pick<PageProps<"/invite/[token]">, "params">) {
    const { token } = await params;
    const [preview, session] = await Promise.all([
        getInvitationPreview(token),
        requireUser(),
    ]);

    const invitation = preview.data;
    const invitePath = `/invite/${token}`;
    const isAuthenticated = Boolean(session);

    if (preview.error) {
        return (
            <UnavailableInvitation
                title="No pudimos cargar la invitación"
                description="Intenta de nuevo más tarde o pide un nuevo enlace."
                isAuthenticated={isAuthenticated}
            >
                <Alert className="border-none p-0">
                    <AlertDescription className="font-medium text-red-600">
                        {preview.error}
                    </AlertDescription>
                </Alert>
            </UnavailableInvitation>
        );
    }

    if (!invitation) {
        return (
            <UnavailableInvitation
                title="Invitación no encontrada"
                description="El enlace no es válido o fue revocado. Pide a un administrador que te envíe una nueva invitación."
                isAuthenticated={isAuthenticated}
            />
        );
    }

    if (!invitation.status) {
        return (
            <UnavailableInvitation
                title="Esta invitación ya fue utilizada"
                description="Si ya eres miembro de la organización, inicia sesión para entrar. Si necesitas otro acceso, pide una nueva invitación."
                isAuthenticated={isAuthenticated}
            />
        );
    }

    if (invitation.isExpired) {
        return (
            <UnavailableInvitation
                title="Esta invitación expiró"
                description="Pide a un administrador de la organización que genere un enlace nuevo."
                isAuthenticated={isAuthenticated}
            />
        );
    }

    const roleLabel = getRoleLabel(invitation.roleName);
    const expirationLabel = formatExpiration(invitation.expiresAt);
    const userEmail = session?.user.email ?? "";
    const sessionMatchesInvitation = Boolean(
        userEmail && userEmail.toLowerCase() === invitation.email.toLowerCase(),
    );

    return (
        <>
            <div className="grid gap-2 text-center">
                <p className="text-xs font-semibold tracking-[0.2em] text-muted-foreground">MPSAAS</p>
                <h1 className="font-heading text-2xl font-semibold">Invitación</h1>
                <p className="text-sm text-muted-foreground">
                    Te invitaron a unirte a{" "}
                    <span className="font-medium text-foreground">{invitation.organizationName}</span>{" "}
                    como{" "}
                    <span className="font-medium text-foreground">{roleLabel}</span>.
                </p>
            </div>

            <div className="grid gap-3 rounded-2xl border border-border bg-muted/50 p-4 text-sm">
                <InvitationDetail label="Organización" value={invitation.organizationName} />
                <InvitationDetail label="Rol" value={roleLabel} />
                <InvitationDetail label="Invitación para" value={invitation.email} />
                {expirationLabel && <InvitationDetail label="Vence" value={expirationLabel} />}
            </div>

            {sessionMatchesInvitation ? (
                <AcceptInvitationForm token={token} roleLabel={roleLabel} />
            ) : session ? (
                <div className="grid gap-4">
                    <Alert variant="destructive">
                        <AlertDescription>
                            {userEmail ? (
                                <>
                                    Estás conectado como{" "}
                                    <span className="font-medium">{userEmail}</span>, pero esta
                                    invitación es para{" "}
                                    <span className="font-medium">{invitation.email}</span>.
                                </>
                            ) : (
                                <>
                                    Esta invitación es para{" "}
                                    <span className="font-medium">{invitation.email}</span>, pero ya
                                    hay otra sesión iniciada.
                                </>
                            )}
                        </AlertDescription>
                    </Alert>

                    <form action={signOutForInvitation}>
                        <input type="hidden" name="next" value={invitePath} />
                        <input type="hidden" name="email" value={invitation.email} />
                        <Button className="w-full" type="submit" variant="outline">
                            Usar otra cuenta
                        </Button>
                    </form>
                </div>
            ) : (
                <div className="grid gap-3">
                    <Button
                        render={
                            <Link
                                href={buildAuthHref("/auth/sign-up", invitation.email, invitePath)}
                            />
                        }
                    >
                        Crear cuenta
                    </Button>

                    <Button
                        render={
                            <Link
                                href={buildAuthHref("/auth/login", invitation.email, invitePath)}
                            />
                        }
                        variant="outline"
                    >
                        Ya tengo cuenta
                    </Button>

                    <p className="text-center text-xs text-muted-foreground">
                        Para aceptar, usa una cuenta con el correo {invitation.email}.
                    </p>
                </div>
            )}
        </>
    );
}

type InvitationShellProps = {
    children: ReactNode;
};

function InvitationShell({ children }: InvitationShellProps) {
    return (
        <div className="flex min-h-screen items-center justify-center p-5">
            <Card className="w-full max-w-md">
                <CardContent className="grid gap-6">{children}</CardContent>
            </Card>
        </div>
    );
}

function InvitationLoading() {
    return (
        <div className="grid gap-6" role="status">
            <span className="sr-only">Cargando invitación...</span>
            <div className="grid gap-2">
                <Skeleton className="mx-auto h-3 w-16" />
                <Skeleton className="mx-auto h-7 w-40" />
                <Skeleton className="mx-auto h-4 w-64 max-w-full" />
            </div>
            <Skeleton className="h-36 rounded-2xl" />
            <Skeleton className="h-9 rounded-4xl" />
        </div>
    );
}

type InvitationDetailProps = {
    label: string;
    value: string;
};

function InvitationDetail({ label, value }: InvitationDetailProps) {
    return (
        <div className="flex items-start justify-between gap-4">
            <span className="text-muted-foreground">{label}</span>
            <span className="min-w-0 wrap-break-word text-right font-medium">{value}</span>
        </div>
    );
}

type UnavailableInvitationProps = {
    title: string;
    description: string;
    isAuthenticated: boolean;
    children?: ReactNode;
};

function UnavailableInvitation({
    title,
    description,
    isAuthenticated,
    children,
}: UnavailableInvitationProps) {
    return (
        <>
            <div className="grid gap-2 text-center">
                <p className="text-xs font-semibold tracking-[0.2em] text-muted-foreground">
                    MPSAAS
                </p>
                <h1 className="font-heading text-2xl font-semibold">{title}</h1>
                <p className="text-sm text-muted-foreground">{description}</p>
            </div>

            {children}

            <Button
                className="w-full"
                render={<Link href={isAuthenticated ? "/" : "/auth/login"} />}
                variant="outline"
            >
                {isAuthenticated ? "Ir al inicio" : "Iniciar sesión"}
            </Button>
        </>
    );
}
