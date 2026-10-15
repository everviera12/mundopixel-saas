import { createServer } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const token_hash = searchParams.get("token_hash");
    const type = searchParams.get("type") as string | null;

    if (token_hash && type) {
        const supabase = await createServer();

        const { error } = await supabase.auth.verifyOtp({
            type,
            token_hash,
        });

        if (!error) {
            // Redirige a la página de restablecimiento de contraseña
            return NextResponse.redirect(new URL("/auth/account/update-password", request.url));
        } else {
            // Redirige a una página de error con el mensaje
            return NextResponse.redirect(
                new URL(`/auth/account/error?error=${error.message}`, request.url)
            );
        }
    }

    // Token inválido o faltante
    return NextResponse.redirect(new URL("/auth/account/error?error=Token inválido", request.url));
}
