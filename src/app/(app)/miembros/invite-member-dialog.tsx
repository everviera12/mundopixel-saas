"use client";

import { useActionState, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { UserAdd01Icon } from "@hugeicons/core-free-icons";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { insertInvitation } from "@/lib/actions/members";
import { InvitationLink } from "./invitation-link";

type RoleOption = {
    id: string;
    label: string;
};

type BranchOption = {
    id: string;
    name: string;
};

type InviteMemberDialogProps = {
    roles: RoleOption[];
    branches: BranchOption[];
};

type InviteMemberContentProps = {
    roles: RoleOption[];
    branches: BranchOption[];
    onClose: () => void;
};

export function InviteMemberDialog({ roles, branches }: InviteMemberDialogProps) {
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger
                render={
                    <Button>
                        <HugeiconsIcon icon={UserAdd01Icon} strokeWidth={2} />
                        Invitar miembro
                    </Button>
                }
            />

            <DialogContent>
                <InviteMemberContent roles={roles} branches={branches} onClose={() => setOpen(false)} />
            </DialogContent>
        </Dialog>
    );
}

function InviteMemberContent({ roles, branches, onClose }: InviteMemberContentProps) {
    const [state, formAction, isPending] = useActionState(insertInvitation, {
        error: null,
        success: null,
        data: null,
    });
    const token = state.data?.token ?? null;
    const inviteLink = state.data?.inviteUrl ?? "";

    if (token) {
        return (
            <>
                <DialogHeader>
                    <DialogTitle>Invitación creada</DialogTitle>
                    <DialogDescription>
                        Comparte este enlace con la persona invitada. Por seguridad, solo se muestra una vez.
                    </DialogDescription>
                </DialogHeader>

                <FieldGroup>
                    <InvitationLink inviteUrl={inviteLink} inputId="invite-link" />

                    {state.warning && (
                        <Alert className="border-none p-0">
                            <AlertDescription className="font-medium text-amber-600">
                                {state.warning}
                            </AlertDescription>
                        </Alert>
                    )}

                    <DialogFooter>
                        <Button type="button" onClick={onClose}>Cerrar</Button>
                    </DialogFooter>
                </FieldGroup>
            </>
        );
    }

    const selectItems = roles.map((role) => ({
        value: role.id,
        label: role.label,
    }));

    return (
        <>
            <DialogHeader>
                <DialogTitle>Invitar miembro</DialogTitle>
                <DialogDescription>
                    Crea una invitación para que una persona se una a tu organización.
                </DialogDescription>
            </DialogHeader>

            <form action={formAction}>
                <FieldGroup>
                    <Field>
                        <FieldLabel htmlFor="invite-email">Correo electrónico</FieldLabel>
                        <Input
                            id="invite-email"
                            name="email"
                            type="email"
                            placeholder="persona@ejemplo.com"
                            autoComplete="email"
                            required
                        />
                    </Field>

                    <Field>
                        <FieldLabel htmlFor="invite-role">Rol</FieldLabel>

                        <Select name="role_id" items={selectItems} required>
                            <SelectTrigger id="invite-role" className="w-full">
                                <SelectValue placeholder="Selecciona un rol" />
                            </SelectTrigger>

                            <SelectContent>
                                {roles.map((role) => (
                                    <SelectItem key={role.id} value={role.id}>
                                        {role.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <FieldDescription>
                            El rol define los permisos de la persona cuando acepte la invitación.
                        </FieldDescription>
                    </Field>

                    {branches.length > 0 && (
                        <Field>
                            <FieldLabel>Sucursales (opcional)</FieldLabel>

                            <div className="grid gap-2">
                                {branches.map((branch) => (
                                    <label
                                        key={branch.id}
                                        className="flex cursor-pointer items-center gap-3 rounded-2xl border border-border px-3 py-2.5 text-sm"
                                    >
                                        <Checkbox
                                            name="branchId"
                                            value={branch.id}
                                            disabled={isPending}
                                        />
                                        <span>{branch.name}</span>
                                    </label>
                                ))}
                            </div>

                            <FieldDescription>
                                La persona podrá ver estas sucursales al aceptar. Si no seleccionas
                                ninguna, se le asignan después desde Miembros.
                            </FieldDescription>
                        </Field>
                    )}

                    {roles.length === 0 && (
                        <p className="text-sm text-destructive">
                            No hay roles disponibles para invitar.
                        </p>
                    )}

                    {state.error && (
                        <Alert className="border-none p-0">
                            <AlertDescription className="font-medium text-red-600">{state.error}</AlertDescription>
                        </Alert>
                    )}

                    <DialogFooter>
                        <Button type="button" variant="outline" disabled={isPending} onClick={onClose}>
                            Cancelar
                        </Button>

                        <Button type="submit" disabled={isPending || roles.length === 0}>
                            {isPending && <span className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent" />}
                            {isPending ? "Creando..." : "Crear invitación"}
                        </Button>
                    </DialogFooter>
                </FieldGroup>
            </form>
        </>
    );
}
