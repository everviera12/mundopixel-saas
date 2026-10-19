'use server'

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
