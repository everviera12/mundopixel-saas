
"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signUpNewUser } from "@/lib/actions/auth";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { insertUserInfo } from "@/lib/actions/profiles";

export default function ProfilePage() {
    const [state, formAction, isPending] = useActionState(insertUserInfo, {
        error: null,
        success: null,
    });

    return (
        <div className="">
            <form action={formAction}>
                <FieldGroup>
                    <Field>
                        <FieldLabel htmlFor="first_name">Nombre(s)</FieldLabel>
                        <Input
                            id="first_name"
                            name="first_name"
                            type="text"
                            placeholder="Ej. Mario"
                            autoComplete="given-name"
                            required
                        />
                    </Field>

                    <Field>
                        <FieldLabel htmlFor="last_name">Apellido(s)</FieldLabel>
                        <Input
                            id="last_name"
                            name="last_name"
                            type="text"
                            placeholder="Ej. Hernández"
                            autoComplete="family-name"
                            required
                        />
                    </Field>

                    <Button disabled={isPending} type="submit">
                        {isPending && (
                            <span className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
                        )}
                        {isPending ? "Creando cuenta..." : "Crear cuenta"}
                    </Button>

                    {state.error && (
                        <Alert className="border-none p-0">
                            <AlertDescription className="font-medium text-red-600">
                                {state.error}
                            </AlertDescription>
                        </Alert>
                    )}

                    {state.success && (
                        <Alert className="border-none p-0">
                            <AlertDescription className="font-medium text-green-600">
                                {state.success}
                            </AlertDescription>
                        </Alert>
                    )}
                </FieldGroup>
            </form>
        </div>
    );
}