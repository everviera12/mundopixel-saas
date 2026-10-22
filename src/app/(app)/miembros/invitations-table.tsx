"use client";

import { useActionState, useEffect, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { CancelCircleIcon, CheckmarkCircle01Icon, EllipsisVerticalIcon } from "@hugeicons/core-free-icons";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FieldGroup } from "@/components/ui/field";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { deleteInvitation, regenerateInvitation } from "@/lib/actions/members";
import { InvitationLink } from "./invitation-link";

type InvitationItem = {
    id: string;
    email: string;
    roleLabel: string;
    expiresAtLabel: string;
    isExpired: boolean;
    canRegister: boolean | null;
};

type InvitationsTableProps = {
    invitations: InvitationItem[];
};

export function InvitationsTable({ invitations }: InvitationsTableProps) {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Correo</TableHead>
                    <TableHead>Registrarse</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Expira</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
            </TableHeader>

            <TableBody>
                {invitations.length > 0 ? (
                    invitations.map((invitation) => (
                        <TableRow key={invitation.id}>
                            <TableCell className="font-medium">{invitation.email}</TableCell>

                            <TableCell>
                                {invitation.canRegister === null ? (
                                    <span
                                        className="text-muted-foreground"
                                        title="No se pudo determinar si ya tiene una cuenta"
                                    >
                                        –
                                    </span>
                                ) : invitation.canRegister ? (
                                    <span
                                        className="inline-flex items-center text-green-600"
                                        title="Puede registrarse: no existe una cuenta con este correo"
                                    >
                                        <HugeiconsIcon
                                            icon={CheckmarkCircle01Icon}
                                            strokeWidth={2}
                                            className="size-4"
                                            aria-hidden="true"
                                        />
                                        <span className="sr-only">Puede registrarse</span>
                                    </span>
                                ) : (
                                    <span
                                        className="inline-flex items-center text-red-600"
                                        title="Ya existe una cuenta con este correo; debe iniciar sesión y aceptar"
                                    >
                                        <HugeiconsIcon
                                            icon={CancelCircleIcon}
                                            strokeWidth={2}
                                            className="size-4"
                                            aria-hidden="true"
                                        />
                                        <span className="sr-only">Ya tiene cuenta</span>
                                    </span>
                                )}
                            </TableCell>

                            <TableCell>
                                <Badge variant="outline">{invitation.roleLabel}</Badge>
                            </TableCell>

                            <TableCell>
                                <span className={invitation.isExpired ? "text-red-600" : "text-muted-foreground"}>
                                    {invitation.isExpired ? "Expirada" : invitation.expiresAtLabel}
                                </span>
                            </TableCell>

                            <TableCell className="text-right">
                                <InvitationRowActions
                                    invitationId={invitation.id}
                                    email={invitation.email}
                                />
                            </TableCell>
                        </TableRow>
                    ))
                ) : (
                    <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                            No hay invitaciones pendientes.
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    );
}

function InvitationRowActions({ invitationId, email }: { invitationId: string; email: string }) {
    const [regenerateOpen, setRegenerateOpen] = useState(false);
    const [linkOpen, setLinkOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [regenerating, setRegenerating] = useState(false);
    const [regenerateError, setRegenerateError] = useState<string | null>(null);
    const [regeneratedLink, setRegeneratedLink] = useState("");

    async function handleRegenerate() {
        setRegenerating(true);
        setRegenerateError(null);

        const response = await regenerateInvitation(invitationId);

        setRegenerating(false);

        if (response.error || !response.data) {
            setRegenerateError(response.error ?? "No se pudo regenerar el enlace.");
            return;
        }

        setRegeneratedLink(response.data.inviteUrl);
        setRegenerateOpen(false);
        setLinkOpen(true);
    }

    function handleLinkOpenChange(open: boolean) {
        setLinkOpen(open);

        if (!open) {
            setRegeneratedLink("");
        }
    }

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger
                    render={
                        <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            aria-label={`Acciones para la invitación de ${email}`}
                        >
                            <HugeiconsIcon icon={EllipsisVerticalIcon} />
                        </Button>
                    }
                />

                <DropdownMenuContent align="end">
                    <DropdownMenuItem
                        onClick={() => {
                            setRegenerateError(null);
                            setRegenerateOpen(true);
                        }}
                    >
                        Generar nuevo enlace
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem
                        variant="destructive"
                        onClick={() => setDeleteOpen(true)}
                    >
                        Revocar invitación
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <AlertDialog open={regenerateOpen} onOpenChange={setRegenerateOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Generar un nuevo enlace?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Vas a generar un enlace nuevo para{" "}
                            <span className="font-medium text-foreground">{email}</span>.
                            El enlace anterior dejará de funcionar de inmediato.
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    {regenerateError && (
                        <Alert className="border-none p-0">
                            <AlertDescription className="font-medium text-red-600">{regenerateError}</AlertDescription>
                        </Alert>
                    )}

                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={regenerating}>Cancelar</AlertDialogCancel>

                        <Button type="button" disabled={regenerating} onClick={handleRegenerate}>
                            {regenerating && <span className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent" />}
                            {regenerating ? "Generando..." : "Generar enlace"}
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <Dialog open={linkOpen} onOpenChange={handleLinkOpenChange}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Enlace regenerado</DialogTitle>
                        <DialogDescription>
                            Comparte este enlace con{" "}
                            <span className="font-medium text-foreground">{email}</span>.
                            Por seguridad, solo se muestra una vez.
                        </DialogDescription>
                    </DialogHeader>

                    <FieldGroup>
                        <InvitationLink
                            inviteUrl={regeneratedLink}
                            inputId={`regenerated-invite-${invitationId}`}
                        />

                        <DialogFooter>
                            <Button type="button" onClick={() => handleLinkOpenChange(false)}>
                                Cerrar
                            </Button>
                        </DialogFooter>
                    </FieldGroup>
                </DialogContent>
            </Dialog>

            <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Revocar invitación?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Vas a revocar la invitación de{" "}
                            <span className="font-medium text-foreground">{email}</span>.
                            El enlace dejará de funcionar y esta acción no se puede deshacer.
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <RevokeInvitationForm
                        invitationId={invitationId}
                        onSuccess={() => setDeleteOpen(false)}
                    />
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

function RevokeInvitationForm({ invitationId, onSuccess }: { invitationId: string; onSuccess: () => void }) {
    const [state, formAction, isPending] = useActionState(deleteInvitation, {
        error: null,
        success: null,
    });

    useEffect(() => {
        if (state.success) {
            onSuccess();
        }
    }, [state.success, onSuccess]);

    return (
        <form action={formAction} className="space-y-4">
            <input type="hidden" name="invitationId" value={invitationId} />

            {state.error && (
                <Alert className="border-none p-0">
                    <AlertDescription className="font-medium text-red-600">{state.error}</AlertDescription>
                </Alert>
            )}

            <AlertDialogFooter>
                <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>

                <Button variant="destructive" type="submit" disabled={isPending}>
                    {isPending && <span className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent" />}
                    {isPending ? "Revocando..." : "Revocar invitación"}
                </Button>
            </AlertDialogFooter>
        </form>
    );
}
