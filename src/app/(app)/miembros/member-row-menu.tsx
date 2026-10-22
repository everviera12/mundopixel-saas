"use client";

import { useActionState, useEffect, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { EllipsisVerticalIcon } from "@hugeicons/core-free-icons";
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
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { deleteMember, setMemberRole } from "@/lib/actions/members";
import { MemberBranchesDialog } from "./member-branches-dialog";

type RoleOption = {
    id: string;
    label: string;
};

type BranchOption = {
    id: string;
    name: string;
};

type MemberRowMenuProps = {
    memberId: string;
    memberName: string;
    roleId: string | null;
    roles: RoleOption[];
    branches: BranchOption[];
    isSelf: boolean;
};

type ChangeRoleFormProps = {
    memberId: string;
    defaultRoleId: string | null;
    roles: RoleOption[];
    onCancel: () => void;
    onSuccess: () => void;
};

type DeleteMemberFormProps = {
    memberId: string;
    onSuccess: () => void;
};

export function MemberRowMenu({
    memberId,
    memberName,
    roleId,
    roles,
    branches,
    isSelf,
}: MemberRowMenuProps) {
    const [roleOpen, setRoleOpen] = useState(false);
    const [branchesOpen, setBranchesOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const defaultRoleId = roleId && roles.some((role) => role.id === roleId) ? roleId : null;

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger
                    render={
                        <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            aria-label={`Acciones para ${memberName}`}
                        >
                            <HugeiconsIcon icon={EllipsisVerticalIcon} />
                        </Button>
                    }
                />

                <DropdownMenuContent align="end">
                    {!isSelf && (
                        <DropdownMenuItem onClick={() => setRoleOpen(true)}>
                            Cambiar rol
                        </DropdownMenuItem>
                    )}

                    <DropdownMenuItem onClick={() => setBranchesOpen(true)}>
                        Asignar sucursales
                    </DropdownMenuItem>

                    {!isSelf && (
                        <>
                            <DropdownMenuSeparator />

                            <DropdownMenuItem
                                variant="destructive"
                                onClick={() => setDeleteOpen(true)}
                            >
                                Quitar del equipo
                            </DropdownMenuItem>
                        </>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>

            <Dialog open={roleOpen} onOpenChange={setRoleOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Cambiar rol</DialogTitle>
                        <DialogDescription>
                            Actualiza el rol de{" "}
                            <span className="font-medium text-foreground">{memberName}</span> en tu organización.
                        </DialogDescription>
                    </DialogHeader>

                    <ChangeRoleForm
                        memberId={memberId}
                        defaultRoleId={defaultRoleId}
                        roles={roles}
                        onCancel={() => setRoleOpen(false)}
                        onSuccess={() => setRoleOpen(false)}
                    />
                </DialogContent>
            </Dialog>

            <MemberBranchesDialog
                memberId={memberId}
                memberName={memberName}
                branches={branches}
                open={branchesOpen}
                onOpenChange={setBranchesOpen}
            />

            <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Quitar miembro?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Vas a quitar a{" "}
                            <span className="font-medium text-foreground">{memberName}</span> de la organización.
                            Perderá el acceso a las sucursales asignadas y esta acción no se puede deshacer.
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <DeleteMemberForm
                        memberId={memberId}
                        onSuccess={() => setDeleteOpen(false)}
                    />
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

function ChangeRoleForm({ memberId, defaultRoleId, roles, onCancel, onSuccess }: ChangeRoleFormProps) {
    const [state, formAction, isPending] = useActionState(setMemberRole, {
        error: null,
        success: null,
    });

    useEffect(() => {
        if (state.success) {
            onSuccess();
        }
    }, [state.success, onSuccess]);

    const selectItems = roles.map((role) => ({
        value: role.id,
        label: role.label,
    }));

    return (
        <form action={formAction}>
            <input type="hidden" name="memberId" value={memberId} />

            <FieldGroup>
                <Field>
                    <FieldLabel htmlFor={`member-role-${memberId}`}>Rol</FieldLabel>

                    <Select
                        name="role_id"
                        items={selectItems}
                        defaultValue={defaultRoleId ?? undefined}
                        required
                    >
                        <SelectTrigger id={`member-role-${memberId}`} className="w-full">
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
                </Field>

                {roles.length === 0 && (
                    <p className="text-sm text-destructive">
                        No hay roles disponibles para asignar.
                    </p>
                )}

                {state.error && (
                    <Alert className="border-none p-0">
                        <AlertDescription className="font-medium text-red-600">{state.error}</AlertDescription>
                    </Alert>
                )}

                <DialogFooter>
                    <Button type="button" variant="outline" disabled={isPending} onClick={onCancel}>
                        Cancelar
                    </Button>

                    <Button type="submit" disabled={isPending || roles.length === 0}>
                        {isPending && <span className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent" />}
                        {isPending ? "Guardando..." : "Guardar cambios"}
                    </Button>
                </DialogFooter>
            </FieldGroup>
        </form>
    );
}

function DeleteMemberForm({ memberId, onSuccess }: DeleteMemberFormProps) {
    const [state, formAction, isPending] = useActionState(deleteMember, {
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
            <input type="hidden" name="memberId" value={memberId} />

            {state.error && (
                <Alert className="border-none p-0">
                    <AlertDescription className="font-medium text-red-600">{state.error}</AlertDescription>
                </Alert>
            )}

            <AlertDialogFooter>
                <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>

                <Button variant="destructive" type="submit" disabled={isPending}>
                    {isPending && <span className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent" />}
                    {isPending ? "Quitando..." : "Quitar miembro"}
                </Button>
            </AlertDialogFooter>
        </form>
    );
}
