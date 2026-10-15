'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";

export default function ErrorPage() {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const errorMsg = params.get("error");

        if (errorMsg) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setError(errorMsg);
        }

        // Siempre redirigir después de procesar
        // const timeout = setTimeout(() => {
        //     router.push("/auth/account/update-password");
        // }, 3000);
        // return () => clearTimeout(timeout);

    }, [router]);

    // if (!error) {
    //     router.push("/auth/account/update-password");
    //     return null;
    // }

    return (
        <div className="flex min-h-screen items-center justify-center p-5">
            <Card className="w-full max-w-md">
                <CardContent className="grid gap-6">
                    <Alert className="border-none p-0" variant="destructive">
                        <AlertDescription className="text-destructive">
                            Error: {error}
                        </AlertDescription>
                    </Alert>

                    <Link href="/auth/account/update-password" className="text-primary w-fit underline-offset-4 hover:underline">
                        Intenta de nuevo
                    </Link>
                </CardContent>
            </Card>
        </div>
    );
}
