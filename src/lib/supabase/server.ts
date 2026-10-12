import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

{/**
    Crea un cliente de Supabase para utilizarlo desde el servidor de Next.js.
        1. Permite consultar datos y acceder a la sesión del usuario mediante las cookies.
        2. Obtiene las cookies de la petición actual.
        3. Se utiliza await porque cookies() es asíncrono en las versiones actuales de Next.js.
        4. Crea el cliente de Supabase y configura la gestión de cookies para mantener sincronizada la sesión del usuario.
*/}

export async function createClient() {
    const cookieStore = await cookies()
    console.log(cookieStore);

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet, _headers) {
                    console.log("_headers: ", _headers);

                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    } catch {
                        // The `setAll` method was called from a Server Component.
                        // This can be ignored if you have a proxy refreshing
                        // user sessions.
                    }
                },
            },
        }
    )
}