
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

export default function SignUpPage() {
    const [state, formAction, isPending] = useActionState(signUpNewUser, {
        error: null,
        success: null,
    });

    return (
        <div className={cn("flex flex-col gap-6")}>
            <Card className="overflow-hidden p-0">
                <CardContent className="grid p-0 md:grid-cols-2">
                    <form action={formAction} className="p-6 md:p-8">
                        <FieldGroup>
                            <div className="flex flex-col items-center gap-2 text-center">
                                <h1 className="text-2xl font-bold">Crear cuenta</h1>
                                <p className="text-sm text-muted-foreground">Completa tus datos para crear una cuenta.</p>
                            </div>

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

                            <Field>
                                <FieldLabel htmlFor="email">Correo electrónico</FieldLabel>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="Ej. hola@ejemplo.com"
                                    autoComplete="email"
                                    required
                                />
                                <FieldDescription>
                                    Utilizaremos tu correo para verificar tu cuenta y comunicarnos contigo.
                                </FieldDescription>
                            </Field>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <Field>
                                    <FieldLabel htmlFor="password">Contraseña</FieldLabel>
                                    <Input
                                        id="password"
                                        name="password"
                                        type="password"
                                        autoComplete="new-password"
                                        minLength={8}
                                        required
                                    />
                                </Field>

                                <Field>
                                    <FieldLabel htmlFor="confirm_password">
                                        Confirmar contraseña
                                    </FieldLabel>
                                    <Input
                                        id="confirm_password"
                                        name="confirm_password"
                                        type="password"
                                        autoComplete="new-password"
                                        minLength={8}
                                        required
                                    />
                                </Field>
                            </div>

                            <FieldDescription>
                                La contraseña debe tener al menos 8 caracteres.
                            </FieldDescription>

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

                            <FieldDescription className="text-center">
                                ¿Ya tienes una cuenta?{" "}
                                <Link href="/auth/login" className="underline underline-offset-4">
                                    Inicia sesión
                                </Link>
                            </FieldDescription>
                        </FieldGroup>
                    </form>

                    <div className="relative hidden bg-muted md:block">
                        <img
                            src="https://ui.shadcn.com/placeholder.svg"
                            alt="Imagen ilustrativa"
                            className="absolute inset-0 size-full object-cover"
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}