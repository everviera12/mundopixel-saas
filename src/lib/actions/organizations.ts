'use server'

import { revalidatePath } from "next/cache";
import { requireUser } from "../auth";
import { ensureProfile } from "../profiles";
import { createSlug } from "../slug";

export type Organization = {
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
    const session = await requireUser();

    if (!session) {
        return {
            error: "No se encontró un usuario autenticado.",
            success: null,
            data: null,
        };
    }

    const { supabase, user } = session;

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

    const session = await requireUser();

    if (!session) {
        return {
            error: "Debes iniciar sesión antes de crear tu organización.",
            success: null,
        };
    }

    const { supabase, user } = session;

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

    // `owner_user_id` es FK a `profiles(id)`: si la cuenta todavía no tiene su
    // fila de perfil, el insert fallaría. El trigger de `auth.users` la crea al
    // registrarse; esto cubre cuentas anteriores o entornos sin trigger.
    const profileError = await ensureProfile(supabase, user);

    if (profileError) {
        return {
            error: profileError,
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
    const session = await requireUser();

    if (!session) {
        return {
            error: "No se encontró un usuario autenticado.",
            success: null,
            data: null,
        };
    }

    const { supabase, user } = session;

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

export async function insertOrganizationBranch(_prevState: OrganizationFormState, formData: FormData): Promise<OrganizationFormState> {
    const name = String(formData.get("name") ?? "").trim();

    if (!name) {
        return {
            error: "El nombre de la sucursal es obligatorio.",
            success: null,
        };
    }

    const session = await requireUser();

    if (!session) {
        return {
            error: "Debes iniciar sesión antes de crear una sucursal.",
            success: null,
        };
    }

    const { supabase, user } = session;

    const { data: organization, error: organizationError } = await supabase
        .from("organizations")
        .select("id")
        .eq("owner_user_id", user.id)
        .maybeSingle();

    if (organizationError) {
        return {
            error: organizationError.message,
            success: null,
        };
    }

    if (!organization) {
        return {
            error: "No tienes una organización registrada.",
            success: null,
        };
    }

    const slug = createSlug(name);

    const { data: duplicate, error: duplicateError } = await supabase
        .from("organizations_branches")
        .select("id")
        .eq("organization_id", organization.id)
        .eq("slug", slug)
        .limit(1)
        .maybeSingle();

    if (duplicateError) {
        return {
            error: duplicateError.message,
            success: null,
        };
    }

    if (duplicate) {
        return {
            error: `Ya existe una sucursal con el nombre "${name}" en tu organización.`,
            success: null,
        };
    }

    const { error } = await supabase
        .from("organizations_branches")
        .insert({ organization_id: organization.id, name, slug });

    if (error) {
        return {
            error: error.message,
            success: null,
        };
    }

    revalidatePath("/sucursales");

    return {
        error: null,
        success: "Sucursal creada correctamente.",
    };
}

export async function deleteOrganizationBranch(_prevState: OrganizationFormState, formData: FormData): Promise<OrganizationFormState> {
    const branchId = String(formData.get("branchId") ?? "").trim();

    if (!branchId) {
        return {
            error: "No se encontró la sucursal que quieres eliminar.",
            success: null,
        };
    }

    const session = await requireUser();

    if (!session) {
        return {
            error: "Debes iniciar sesión antes de eliminar una sucursal.",
            success: null,
        };
    }

    const { supabase, user } = session;

    const { data: organization, error: organizationError } = await supabase
        .from("organizations")
        .select("id")
        .eq("owner_user_id", user.id)
        .maybeSingle();

    if (organizationError) {
        return {
            error: organizationError.message,
            success: null,
        };
    }

    if (!organization) {
        return {
            error: "No tienes una organización registrada.",
            success: null,
        };
    }

    const { data: deleted, error } = await supabase
        .from("organizations_branches")
        .delete()
        .eq("id", branchId)
        .eq("organization_id", organization.id)
        .select("id");

    if (error) {
        return {
            error: error.message,
            success: null,
        };
    }

    if (!deleted || deleted.length === 0) {
        return {
            error: "La sucursal no existe o ya fue eliminada.",
            success: null,
        };
    }

    revalidatePath("/sucursales");

    return {
        error: null,
        success: "Sucursal eliminada correctamente.",
    };
}

export async function updateOrganizationBranch(_prevState: OrganizationFormState, formData: FormData): Promise<OrganizationFormState> {
    const branchId = String(formData.get("branchId") ?? "").trim();
    const name = String(formData.get("name") ?? "").trim();

    if (!branchId) {
        return {
            error: "No se encontró la sucursal que quieres actualizar.",
            success: null,
        };
    }

    if (!name) {
        return {
            error: "El nombre de la sucursal es obligatorio.",
            success: null,
        };
    }

    const session = await requireUser();

    if (!session) {
        return {
            error: "Debes iniciar sesión antes de actualizar una sucursal.",
            success: null,
        };
    }

    const { supabase, user } = session;

    const { data: organization, error: organizationError } = await supabase
        .from("organizations")
        .select("id")
        .eq("owner_user_id", user.id)
        .maybeSingle();

    if (organizationError) {
        return {
            error: organizationError.message,
            success: null,
        };
    }

    if (!organization) {
        return {
            error: "No tienes una organización registrada.",
            success: null,
        };
    }

    const slug = createSlug(name);

    const { data: duplicate, error: duplicateError } = await supabase
        .from("organizations_branches")
        .select("id")
        .eq("organization_id", organization.id)
        .eq("slug", slug)
        .neq("id", branchId)
        .limit(1)
        .maybeSingle();

    if (duplicateError) {
        return {
            error: duplicateError.message,
            success: null,
        };
    }

    if (duplicate) {
        return {
            error: `Ya existe una sucursal con el nombre "${name}" en tu organización.`,
            success: null,
        };
    }

    const { data: updated, error } = await supabase
        .from("organizations_branches")
        .update({ name, slug, updated_at: new Date().toISOString() })
        .eq("id", branchId)
        .eq("organization_id", organization.id)
        .select("id");

    if (error) {
        return {
            error: error.message,
            success: null,
        };
    }

    if (!updated || updated.length === 0) {
        return {
            error: "La sucursal no existe o ya fue eliminada.",
            success: null,
        };
    }

    revalidatePath("/sucursales");

    return {
        error: null,
        success: "Sucursal actualizada correctamente.",
    };
}