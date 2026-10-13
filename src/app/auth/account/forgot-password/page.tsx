"use client";

import { useActionState } from "react";
import Link from "next/link";
import { forgotPassword } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPasswordPage() {
    const [state, formAction, isPending] = useActionState(forgotPassword, {
        error: null,
        success: null,
    });

    console.log(state.error);
    

    return (
        <div className="mx-auto w-full max-w-md p-6">
            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl">Recuperar contraseña</CardTitle>
                    <CardDescription>
                        Introduce tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    <form action={formAction}>
                        <div className="flex flex-col gap-6">
                            <div className="grid gap-2">
                                <Label htmlFor="email">Correo electrónico</Label>
                                <Input id="email" name="email" type="email" placeholder="hola@loquesea.com" autoComplete="email" required />
                            </div>

                            {state.error && (
                                <p className="text-sm text-red-500">{state.error}</p>
                            )}

                            {state.success && (
                                <p className="text-sm text-green-600">{state.success}</p>
                            )}

                            <Button type="submit" className="w-full" disabled={isPending}>
                                {isPending ? "Enviando..." : "Enviar enlace de recuperación"}
                            </Button>
                        </div>

                        <p className="mt-4 text-center text-sm">
                            ¿Ya tienes una cuenta? <Link href="/auth/login">Inicia sesión</Link>
                        </p>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}