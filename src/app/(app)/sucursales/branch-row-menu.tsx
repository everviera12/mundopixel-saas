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
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { deleteOrganizationBranch, updateOrganizationBranch } from "@/lib/actions/organizations";

type BranchRowMenuProps = {
    branchId: string;
    branchName: string;
};

type DeleteBranchFormProps = {
    branchId: string;
    onSuccess: () => void;
};

type EditBranchFormProps = {
    branchId: string;
    defaultName: string;
    onCancel: () => void;
    onSuccess: () => void;
};

export function BranchRowMenu({ branchId, branchName }: BranchRowMenuProps) {
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const displayName = branchName || "esta sucursal";

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger
                    render={
                        <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            aria-label={`Acciones para ${displayName}`}
                        >
                            <HugeiconsIcon icon={EllipsisVerticalIcon} />
                        </Button>
                    }
                />

                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setEditOpen(true)}>
                        Editar
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem
                        variant="destructive"
                        onClick={() => setDeleteOpen(true)}
                    >
                        Eliminar
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Editar sucursal</DialogTitle>
                        <DialogDescription>
                            Actualiza el nombre de{" "}
                            <span className="font-medium text-foreground">{displayName}</span>.
                        </DialogDescription>
                    </DialogHeader>

                    <EditBranchForm
                        branchId={branchId}
                        defaultName={branchName}
                        onCancel={() => setEditOpen(false)}
                        onSuccess={() => setEditOpen(false)}
                    />
                </DialogContent>
            </Dialog>

            <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar sucursal?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Vas a eliminar{" "}
                            <span className="font-medium text-foreground">{displayName}</span>.
                            Esta acción no se puede deshacer.
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <DeleteBranchForm
                        branchId={branchId}
                        onSuccess={() => setDeleteOpen(false)}
                    />
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

function EditBranchForm({ branchId, defaultName, onCancel, onSuccess }: EditBranchFormProps) {
    const [state, formAction, isPending] = useActionState(updateOrganizationBranch, {
        error: null,
        success: null,
    });

    useEffect(() => {
        if (state.success) {
            onSuccess();
        }
    }, [state.success, onSuccess]);

    return (
        <form action={formAction}>
            <input type="hidden" name="branchId" value={branchId} />

            <FieldGroup>
                <Field>
                    <FieldLabel htmlFor={`edit-branch-${branchId}`}>Nombre de la sucursal</FieldLabel>
                    <Input
                        id={`edit-branch-${branchId}`}
                        name="name"
                        type="text"
                        placeholder="Ej. Sucursal Centro"
                        autoComplete="organization"
                        defaultValue={defaultName}
                        required
                    />
                    <FieldDescription>
                        El identificador (slug) se regenera a partir del nombre.
                        No puedes repetir el nombre de otra sucursal de tu organización.
                    </FieldDescription>
                </Field>

                {state.error && (
                    <Alert className="border-none p-0">
                        <AlertDescription className="font-medium text-red-600">{state.error}</AlertDescription>
                    </Alert>
                )}

                {state.success && (
                    <Alert className="border-none p-0">
                        <AlertDescription className="font-medium text-green-600">{state.success}</AlertDescription>
                    </Alert>
                )}

                <DialogFooter>
                    <Button type="button" variant="outline" disabled={isPending} onClick={onCancel}>
                        Cancelar
                    </Button>
                    <Button type="submit" disabled={isPending}>
                        {isPending && <span className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent" />}
                        {isPending ? "Guardando..." : "Guardar cambios"}
                    </Button>
                </DialogFooter>
            </FieldGroup>
        </form>
    );
}

function DeleteBranchForm({ branchId, onSuccess }: DeleteBranchFormProps) {
    const [state, formAction, isPending] = useActionState(deleteOrganizationBranch, {
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
            <input type="hidden" name="branchId" value={branchId} />

            {state.error && (
                <Alert className="border-none p-0">
                    <AlertDescription className="font-medium text-red-600">{state.error}</AlertDescription>
                </Alert>
            )}

            {state.success && (
                <Alert className="border-none p-0">
                    <AlertDescription className="font-medium text-green-600">{state.success}</AlertDescription>
                </Alert>
            )}

            <AlertDialogFooter>
                <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>

                <Button variant="destructive" type="submit" disabled={isPending}>
                    {isPending && <span className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent" />}
                    {isPending ? "Eliminando..." : "Eliminar"}
                </Button>
            </AlertDialogFooter>
        </form>
    );
}
