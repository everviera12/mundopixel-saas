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
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deleteOrganizationBranch } from "@/lib/actions/organizations";

type BranchRowMenuProps = {
    branchId: string;
    branchName: string;
};

type DeleteBranchFormProps = {
    branchId: string;
    onSuccess: () => void;
};

export function BranchRowMenu({ branchId, branchName }: BranchRowMenuProps) {
    const [open, setOpen] = useState(false);

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger
                    render={
                        <Button variant="ghost" size="icon" className="size-8">
                            <HugeiconsIcon icon={EllipsisVerticalIcon} />
                        </Button>
                    }
                />

                <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                        Editar
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem
                        variant="destructive"
                        onClick={() => setOpen(true)}
                    >
                        Eliminar
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <AlertDialog open={open} onOpenChange={setOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar sucursal?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Vas a eliminar{" "}
                            <span className="font-medium text-foreground">{branchName}</span>.
                            Esta acción no se puede deshacer.
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <DeleteBranchForm
                        branchId={branchId}
                        onSuccess={() => setOpen(false)}
                    />
                </AlertDialogContent>
            </AlertDialog>
        </>
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
