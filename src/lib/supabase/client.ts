import { createBrowserClient } from '@supabase/ssr'

{/**
    Crea un cliente de Supabase para utilizarlo desde el navegador. 
    Permite consultar y modificar datos, así como gestionar la sesión del usuario desde componentes de cliente de Next.js.
*/}

export function createClient() {
    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
    )
}