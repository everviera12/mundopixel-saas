'use server'

import { revalidatePath } from "next/cache";
import { createSlug } from "../slug";
import { createServer } from "../supabase/server";

type Organization = {
    name: string;
    slug: string;
};

type OrganizationProps = {
    error: string | null;
    success: string | null;
    data: Organization | null;
};

type OrganizationFormState = {
    error: string | null;
    success: string | null;
};

export async function getOrganization(): Promise<OrganizationProps> {
    const supabase = await createServer()

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return {
            error: authError?.message ?? "No se encontró un usuario autenticado.",
            success: null,
            data: null,
        };
    }

    const { data: organization, error } = await supabase
        .from("organizations")
        .select("name, slug")
        .eq("owner_user_id", user.id)
        .maybeSingle();

    if (error) {
        return {
            error: error.message,
            success: null,
            data: null,
        };
    }

    return {
        error: null,
        success: "Organización obtenida correctamente.",
        data: organization,
    };
}

export async function insertOrganization(_prevState: OrganizationFormState, formData: FormData): Promise<OrganizationFormState> {
    const name = String(formData.get("name") ?? "").trim();
    const slug = createSlug(name);

    const supabase = await createServer()

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return {
            error: "Debes iniciar sesión antes de crear tu organización.",
            success: null,
        };
    }

    const { data: existing } = await supabase
        .from("organizations")
        .select("id")
        .eq("owner_user_id", user.id)
        .maybeSingle();

    if (existing) {
        return {
            error: "Ya tienes una organización registrada.",
            success: null,
        };
    }

    const { error } = await supabase
        .from("organizations")
        .insert({ name, slug, owner_user_id: user.id, });

    if (error) {
        return {
            error: error.message,
            success: null,
        };
    }

    revalidatePath("/profile");

    return {
        error: null,
        success: "Organización creada correctamente",
    };
}
