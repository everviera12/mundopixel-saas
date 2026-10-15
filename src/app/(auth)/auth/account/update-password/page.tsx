'use client'

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";

import { updatePassword } from "@/lib/actions/auth";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useRouter } from "next/navigation";


export default function UpdatePasswordPage() {
    const [state, formAction, isPending] = useActionState(updatePassword, {
        error: null,
        success: null,
    });

    const [isCheckingSession, setIsCheckingSession] = useState(true);
    const [hasRecoverySession, setHasRecoverySession] = useState(false);
    const router = useRouter()

    const logout = () => {
        const supabase = createClient();
        supabase.auth.signOut().then(() => {
            router.push("/auth/login");
        })
    }

    useEffect(() => {
        let active = true;

        /**
         * El enlace de recuperación llega con el token en el fragmento de la URL,
         * que nunca viaja al servidor. createClient() lo lee y escribe las cookies
         * de sesión que consume la server action.
         */
        async function checkRecoverySession() {
            const supabase = createClient();
            const { data } = await supabase.auth.getSession();

            if (active) {
                setHasRecoverySession(Boolean(data.session));
                setIsCheckingSession(false);
            }
        }

        checkRecoverySession();

        return () => {
            active = false;
        };
    }, []);

    if (isCheckingSession) {
        return (
            <div className="flex min-h-screen items-center justify-center p-4">
                <p className="text-sm text-muted-foreground">Validando enlace de recuperación...</p>
            </div>
        );
    }

    if (!hasRecoverySession) {
        return (
            <div className="flex min-h-screen items-center justify-center p-5">
                <Card className="w-full max-w-md">
                    <CardContent className="grid gap-6">
                        <Alert className="p-0 border-none" variant="destructive">
                            <AlertDescription className="text-destructive">
                                El enlace de recuperación es inválido o ha expirado. Solicita uno nuevo.
                            </AlertDescription>
                        </Alert>

                        <FieldDescription>
                            ¿No recibiste el correo?{" "}
                            <Link href="/auth/account/forgot-password">Solicitar nuevo enlace</Link>
                        </FieldDescription>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardContent className="p-6">
                    <form action={formAction}>
                        <FieldGroup>
                            <div className="flex flex-col items-center gap-2 text-center">
                                <h1 className="text-2xl font-bold">Restablecer contraseña</h1>
                                <p className="text-balance text-muted-foreground">Introduce tu nueva contraseña.</p>
                            </div>

                            <Field>
                                <FieldLabel htmlFor="password">Nueva contraseña</FieldLabel>
                                <Input id="password" name="password" type="password" placeholder="Nueva contraseña" autoComplete="new-password" minLength={8} required />
                            </Field>

                            <Field>
                                <FieldLabel htmlFor="confirm_password">Confirma tu contraseña</FieldLabel>
                                <Input id="confirm_password" name="confirm_password" type="password" placeholder="Confirma tu nueva contraseña" autoComplete="new-password" minLength={8} required />
                            </Field>

                            {state.error && (
                                <Alert className="p-0 border-none">
                                    <AlertDescription className="text-red-600 font-medium">
                                        {state.error}
                                    </AlertDescription>
                                </Alert>
                            )}

                            {state.success && (
                                <Alert className="p-0 border-none">
                                    <AlertDescription className="text-green-600 font-medium">
                                        {state.success}
                                    </AlertDescription>
                                </Alert>
                            )}

                            <Field>
                                {state.success ? (
                                    <Button onClick={logout} className="w-full">Volver a iniciar sesión</Button>
                                ) : (
                                    <Button disabled={isPending} type="submit" className="w-full" >
                                        {isPending && <span className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent" />}
                                        {isPending ? "Guardando..." : "Guardar nueva contraseña"}
                                    </Button>
                                )}
                            </Field>
                        </FieldGroup>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}