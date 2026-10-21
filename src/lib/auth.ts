import { createServer } from "./supabase/server";

{/**
    Obtiene el usuario autenticado junto con un cliente de Supabase listo para usar en el servidor.
        1. Crea el cliente de servidor, que lee la sesión desde las cookies de la petición.
        2. Valida el token contra Supabase Auth con getUser().
        3. Devuelve null si no hay sesión o el token no es válido.
    Se utiliza al inicio de las server actions para no repetir la validación en cada una.
*/}

export async function requireUser() {
    const supabase = await createServer();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return null;
    }

    return { supabase, user };
}
