import type { User } from "@supabase/supabase-js";

import type { createServer } from "./supabase/server";

type ServerSupabase = Awaited<ReturnType<typeof createServer>>;

/**
 * Crea la fila de `profiles` si todavía no existe. Las FK de
 * `organizations.owner_user_id` y `organization_members.user_id` apuntan a
 * `profiles(id)`, así que sin esta fila el alta de la organización o del
 * miembro falla. El trigger `on_auth_user_created` ya la crea al registrarse;
 * esta función es el respaldo para cuentas anteriores al trigger o para
 * entornos donde todavía no exista.
 */
export async function ensureProfile(supabase: ServerSupabase, user: User) {
    const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();

    if (profileError) {
        return profileError.message;
    }

    if (profile) {
        return null;
    }

    const firstName = typeof user.user_metadata?.first_name === "string"
        ? user.user_metadata.first_name
        : null;
    const lastName = typeof user.user_metadata?.last_name === "string"
        ? user.user_metadata.last_name
        : null;

    const { error } = await supabase
        .from("profiles")
        .insert({
            id: user.id,
            first_name: firstName,
            last_name: lastName,
        });

    // Si otra petición (o el trigger) creó el perfil al mismo tiempo, la fila
    // ya existe y no es un error.
    if (error && error.code !== "23505") {
        return error.message;
    }

    return null;
}
