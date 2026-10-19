"use client";

import { useActionState, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { insertOrganization } from "@/lib/actions/organizations";
import { createSlug } from "@/lib/slug";

export function OrganizationForm() {
    const [state, formAction, isPending] = useActionState(insertOrganization, {
        error: null,
        success: null,
    });
    const [name, setName] = useState("");
    const slug = createSlug(name);

    return (
        <Card className="border border-border bg-muted/50 ring-0">
            <CardContent>
                <form action={formAction}>
                    <FieldGroup>
                        <div className="grid gap-1">
                            <span className="text-base font-medium">Crea tu organización</span>
                            <span className="text-sm text-muted-foreground">
                                Aún no tienes una organización registrada.
                            </span>
                        </div>

                        <Field>
                            <FieldLabel htmlFor="name">Nombre</FieldLabel>
                            <Input id="name" name="name" type="text" placeholder="Ej. Papelería e Imprenta" autoComplete="organization" value={name} onChange={(event) => setName(event.target.value)} required />
                        </Field>

                        <Field>
                            <FieldLabel htmlFor="slug">Tu identificador</FieldLabel>
                            <Input id="slug" type="text" value={slug} readOnly />
                            <FieldDescription>Se genera automáticamente a partir del nombre.</FieldDescription>
                        </Field>

                        <Button disabled={isPending} type="submit">
                            {isPending && <span className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent" />}
                            {isPending ? "Creando organización..." : "Crear organización"}
                        </Button>

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
            </CardContent>
        </Card>
    );
}
