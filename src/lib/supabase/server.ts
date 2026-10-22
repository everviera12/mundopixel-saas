import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { connection } from 'next/server'

{/**
    Crea un cliente de Supabase para utilizarlo desde el servidor de Next.js.
        1. Permite consultar datos y acceder a la sesión del usuario mediante las cookies.
        2. Obtiene las cookies de la petición actual.
        3. Se utiliza await porque cookies() es asíncrono en las versiones actuales de Next.js.
        4. Crea el cliente de Supabase y configura la gestión de cookies para mantener sincronizada la sesión del usuario.
*/}

export async function createServer() {
    // La sesión de Supabase Auth se valida con Date.now() y además leemos
    // cookies. Con cacheComponents, el prefetch intentaría prerenderizar esa
    // lectura y Next marca la hora como valor inestable: esperar una petición
    // real hace que toda lectura autenticada se resuelva en tiempo de request.
    await connection();

    const cookieStore = await cookies();

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) => {
                            cookieStore.set(name, value, options);
                        });
                    } catch {
                        // Las Server Components no pueden escribir cookies.
                        // El proxy debe encargarse de actualizar la sesión.
                    }
                },
            },
        },
    );
}