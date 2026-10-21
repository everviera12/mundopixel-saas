"use client";

import { useActionState, useEffect, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon } from "@hugeicons/core-free-icons";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
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
import { insertOrganizationBranch } from "@/lib/actions/organizations";

type BranchFormProps = {
    organizationName: string;
};

type BranchFormFieldsProps = {
    onCancel: () => void;
    onSuccess: () => void;
};

export function BranchForm({ organizationName }: BranchFormProps) {
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger
                render={
                    <Button>
                        <HugeiconsIcon icon={Add01Icon} strokeWidth={2} />
                        Nueva sucursal
                    </Button>
                }
            />

            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Nueva sucursal</DialogTitle>
                    <DialogDescription>
                        Agregar sucursal a{" "}
                        <span className="font-medium text-foreground">{organizationName}</span>
                    </DialogDescription>
                </DialogHeader>

                <BranchFormFields
                    onCancel={() => setOpen(false)}
                    onSuccess={() => setOpen(false)}
                />
            </DialogContent>
        </Dialog>
    );
}

function BranchFormFields({ onCancel, onSuccess }: BranchFormFieldsProps) {
    const [state, formAction, isPending] = useActionState(insertOrganizationBranch, {
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
            <FieldGroup>
                <Field>
                    <FieldLabel htmlFor="branch-name">Nombre de la sucursal</FieldLabel>
                    <Input id="branch-name" name="name" type="text" placeholder="Ej. Sucursal Centro" autoComplete="organization" required />
                    <FieldDescription>
                        El identificador (slug) se genera automáticamente a partir del nombre.
                        No puedes crear dos sucursales con el mismo nombre en tu organización.
                    </FieldDescription>
                </Field>

                {state.error && (
                    <Alert className="border-none p-0">
                        <AlertDescription className="font-medium text-red-600">{state.error}</AlertDescription>
                    </Alert>
                )}

                <DialogFooter>
                    <Button type="button" variant="outline" disabled={isPending} onClick={onCancel}>
                        Cancelar
                    </Button>
                    <Button disabled={isPending} type="submit">
                        {isPending && <span className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent" />}
                        {isPending ? "Guardando..." : "Agregar sucursal"}
                    </Button>
                </DialogFooter>
            </FieldGroup>
        </form>
    );
}
