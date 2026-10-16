"use client";

import { useActionState, useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { insertUserInfo } from "@/lib/actions/profiles";

type ProfileFormProps = {
    defaultFirstName?: string;
    defaultLastName?: string;
    onCancel?: () => void;
    onSuccess?: () => void;
};

export function ProfileForm({ defaultFirstName, defaultLastName, onCancel, onSuccess }: ProfileFormProps) {
    const [state, formAction, isPending] = useActionState(insertUserInfo, {
        error: null,
        success: null,
        data: null,
    });

    useEffect(() => {
        if (state.success) {
            onSuccess?.();
        }
    }, [state.success, onSuccess]);

    return (
        <form action={formAction}>
            <FieldGroup>
                <Field>
                    <FieldLabel htmlFor="first_name">Nombre(s)</FieldLabel>
                    <Input id="first_name" name="first_name" type="text" placeholder="Ej. Mario" autoComplete="given-name" defaultValue={defaultFirstName} required />
                </Field>

                <Field>
                    <FieldLabel htmlFor="last_name">Apellido(s)</FieldLabel>
                    <Input id="last_name" name="last_name" type="text" placeholder="Ej. Hernández" autoComplete="family-name" defaultValue={defaultLastName} required />
                </Field>

                <div className="flex items-center gap-2">
                    <Button disabled={isPending} type="submit">
                        {isPending && <span className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent" />}
                        {isPending ? "Guardando..." : "Guardar"}
                    </Button>

                    {onCancel ? (
                        <Button type="button" variant="outline" disabled={isPending} onClick={onCancel}>
                            Cancelar
                        </Button>
                    ) : null}
                </div>

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
            </FieldGroup>
        </form>
    );
}