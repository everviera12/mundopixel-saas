'use server'

import { createServer } from "../supabase/server";

type AuthStateProps = {
    error: string | null;
    success: string | null;
};


export async function insertUserInfo(_prevState: AuthStateProps, formData: FormData,): Promise<AuthStateProps> {
    const first_name = String(formData.get("first_name") ?? "");
    const last_name = String(formData.get("last_name") ?? "");

    const supabase = await createServer()

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return {
            error: "Debes iniciar sesión antes de crear tu perfil.",
            success: null,
        };
    }

    const { error } = await supabase
        .from("profiles")
        .insert({
            id: user.id,
            first_name,
            last_name,
        });


    if (error) {
        return {
            error: error.message,
            success: null
        };
    }

    return {
        error: null,
        success: "Datos insertados correctamente",
    };
}