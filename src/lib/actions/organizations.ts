'use server'

import { revalidatePath } from "next/cache";
import { createSlug } from "../slug";
import { createServer } from "../supabase/server";

type Organization = {
    id: string;
    name: string;
    slug: string;
};

type Branch = {
    id: string;
    organization_id: string;
    name: string | null;
    slug: string | null;
    status: boolean | null;
    created_at: string;
    updated_at: string | null;
};

type OrganizationProps = {
    error: string | null;
    success: string | null;
    data: Organization | null;
};

type OrganizationBranchesProps = {
    error: string | null;
    success: string | null;
    data: Branch[] | null;
};

type OrganizationFormState = {
    error: string | null;
    success: string | null;
};

export async function getOrganization(): Promise<OrganizationProps> {
    const supabase = await createServer();

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
        .select("id, name, slug")
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

export async function getOrganizationBranches(): Promise<OrganizationBranchesProps> {
    const supabase = await createServer();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return {
            error: authError?.message ?? "No se encontró un usuario autenticado.",
            success: null,
            data: null,
        };
    }

    const { data: organization, error: organizationError } = await supabase
        .from("organizations")
        .select("id")
        .eq("owner_user_id", user.id)
        .maybeSingle();

    if (organizationError) {
        return {
            error: organizationError.message,
            success: null,
            data: null,
        };
    }

    if (!organization) {
        return {
            error: "No tienes una organización registrada.",
            success: null,
            data: null,
        };
    }

    const { data: branches, error } = await supabase
        .from("organizations_branches")
        .select("*")
        .eq("organization_id", organization.id)
        .order("created_at", { ascending: true });

    if (error) {
        return {
            error: error.message,
            success: null,
            data: null,
        };
    }

    return {
        error: null,
        success: "Sucursales obtenidas correctamente.",
        data: branches,
    };
}