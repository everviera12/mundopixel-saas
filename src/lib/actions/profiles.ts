'use server'

import { revalidatePath } from "next/cache";
import { User } from "@supabase/supabase-js";
import { createServer } from "../supabase/server";

type Profile = {
    id: string;
    first_name: string | null;
    last_name: string | null;
    created_at: string;
};

type AuthStateProps = {
    error: string | null;
    success: string | null;
    data: {
        user: User;
        profile: Profile;
    } | null;
};


export async function insertUserInfo(_prevState: AuthStateProps, formData: FormData,): Promise<AuthStateProps> {
    const first_name = String(formData.get("first_name") ?? "");
    const last_name = String(formData.get("last_name") ?? "");

    const supabase = await createServer()

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return {
            error: "Debes iniciar sesión antes de guardar tu perfil.",
            success: null,
            data: null,
        };
    }

    const { data: profile, error } = await supabase
        .from("profiles")
        .upsert({
            id: user.id,
            first_name,
            last_name,
        })
        .select()
        .single();


    if (error) {
        return {
            error: error.message,
            success: null,
            data: null
        };
    }

    revalidatePath("/profile");

    return {
        error: null,
        success: "Datos guardados correctamente",
        data: {
            user,
            profile: profile!,
        },
    };
}

export async function getProfile(): Promise<{
    user: User | null;
    profile: Profile | null;
    emailVerified: boolean;
}> {
    const supabase = await createServer();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { user: null, profile: null, emailVerified: false };
    }

    const { data: profile } = await supabase
        .from("profiles")
        .select()
        .eq("id", user.id)
        .single();

    return {
        user,
        profile: profile ?? null,
        emailVerified: Boolean(user.email_confirmed_at),
    };
}
