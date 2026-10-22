"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { signInWithEmail } from "@/lib/actions/auth";

type LoginFormProps = {
    email: string;
    next: string;
};

export function LoginForm({ email, next }: LoginFormProps) {
    const [state, formAction, isPending] = useActionState(signInWithEmail, {
        error: null,
        success: null,
    });

    const signUpParams = new URLSearchParams();

    if (email) {
        signUpParams.set("email", email);
    }

    if (next) {
        signUpParams.set("next", next);
    }

    const signUpQuery = signUpParams.toString();
    const signUpHref = signUpQuery ? `/auth/sign-up?${signUpQuery}` : "/auth/sign-up";

    return (
        <div className="flex flex-col gap-6">
            <Card className="overflow-hidden p-0">
                <CardContent className="grid p-0 md:grid-cols-2">
                    <form action={formAction} className="p-6 md:p-8">
                        {next && <input type="hidden" name="next" value={next} />}

                        <FieldGroup>
                            <div className="flex flex-col items-center gap-2 text-center">
                                <h1 className="text-2xl font-bold">MPSAAS</h1>
                                <p className="text-balance text-muted-foreground">
                                    Inicia sesión para acceder a tu cuenta.
                                </p>
                            </div>

                            <Field>
                                <FieldLabel htmlFor="email">Correo</FieldLabel>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="hola@loquesea.com"
                                    autoComplete="email"
                                    defaultValue={email}
                                    required
                                />
                            </Field>

                            <Field>
                                <div className="flex items-center">
                                    <FieldLabel htmlFor="password">Contraseña</FieldLabel>
                                    <Link
                                        href="/auth/account/forgot-password"
                                        className="ml-auto text-sm underline-offset-2 hover:underline"
                                    >
                                        ¿Olvidaste tu contraseña?
                                    </Link>
                                </div>
                                <Input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="current-password"
                                    required
                                />
                            </Field>

                            <Field>
                                <Button disabled={isPending} type="submit">
                                    {isPending && (
                                        <span className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
                                    )}
                                    {isPending ? "Iniciando sesión..." : "Iniciar sesión"}
                                </Button>
                            </Field>

                            {state.error && (
                                <Alert className="border-none p-0">
                                    <AlertDescription className="font-medium text-red-600">
                                        {state.error || "Error en la contraseña o correo"}
                                    </AlertDescription>
                                </Alert>
                            )}

                            <FieldDescription className="text-center">
                                ¿No tienes una cuenta? <Link href={signUpHref}>Regístrate</Link>
                            </FieldDescription>
                        </FieldGroup>
                    </form>

                    <div className="relative hidden bg-muted md:block">
                        <img
                            src="https://ui.shadcn.com/placeholder.svg"
                            alt="Image"
                            className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
