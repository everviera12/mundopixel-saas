'use server'

import { revalidatePath } from "next/cache";
import { requireUser } from "../auth";
import {
    INVENTORY_UNITS,
    isInventoryStaff,
    type BranchOption,
    type InventoryCatalog,
    type InventoryCatalogState,
    type InventoryFormState,
    type InventoryItem,
    type InventoryKind,
    type InventoryRecipeLine,
    type InventoryStatusState,
    type InventoryStock,
    type MovementType,
} from "../inventory";
import { createSku } from "../sku";

type InventoryActor = {
    organizationId: string;
    organizationName: string | null;
    roleName: string | null;
};

type ServerSession = NonNullable<Awaited<ReturnType<typeof requireUser>>>;
type ServerSupabase = ServerSession["supabase"];

type ItemFields = {
    name: string;
    description: string | null;
    unit: string;
    category: string | null;
    cost: number | null;
    salePrice: number | null;
    lowStockThreshold: number | null;
};

type RecipeInput = {
    supplyItemId: string;
    quantity: number;
};

type BaseItem = {
    id: string;
    name: string;
    unit: string;
    kind: InventoryKind;
    cost: number | null;
    trackStock: boolean;
    stockTotal: number;
    stocks: InventoryStock[];
};

const INVENTORY_ERROR_MESSAGES: Array<[string, string]> = [
    ["invalid_movement_type", "El tipo de movimiento no es válido."],
    ["invalid_quantity", "La cantidad debe ser mayor que cero."],
    ["item_not_found", "El ítem no existe o no pertenece a tu organización."],
    ["item_inactive", "El ítem está inactivo. Actívalo antes de ajustar su stock."],
    ["stock_not_tracked", "Este producto se maneja por encargo y no lleva stock."],
    ["not_authorized", "No tienes permiso para ajustar el stock."],
    ["branch_not_in_org", "La sucursal no pertenece a tu organización."],
    ["initial_already_set", "Ya hay un stock inicial registrado en esta sucursal; usa una entrada o una salida."],
    ["insufficient_stock", "No hay stock suficiente para registrar esa salida."],
];

/**
 * PostgREST devuelve un objeto cuando la relación es de muchos a uno, pero el
 * cliente sin tipos generados la declara como arreglo. Normalizamos ambos casos.
 */
function normalizeRelated<T>(value: unknown): T | null {
    if (Array.isArray(value)) {
        return (value[0] as T | undefined) ?? null;
    }

    return (value as T | null) ?? null;
}

function toNumber(value: unknown) {
    const parsed = Number(value ?? 0);

    return Number.isFinite(parsed) ? parsed : 0;
}

function toNullableNumber(value: unknown) {
    if (value === null || value === undefined || value === "") {
        return null;
    }

    const parsed = Number(value);

    return Number.isFinite(parsed) ? parsed : null;
}

function fail(error: string): InventoryFormState {
    return {
        error,
        success: null,
        warning: null,
        data: null,
    };
}

function parseKind(value: FormDataEntryValue | null): InventoryKind | null {
    return value === "product" || value === "supply" ? value : null;
}

function isMovementType(value: string): value is MovementType {
    return value === "initial" || value === "adjustment_in" || value === "adjustment_out";
}

function mapInventoryError(message: string) {
    const normalized = message.toLowerCase();

    for (const [code, label] of INVENTORY_ERROR_MESSAGES) {
        if (normalized.includes(code)) {
            return label;
        }
    }

    return message;
}

function sanitizeCategory(value: string) {
    const normalized = value
        .trim()
        .replace(/\s+/g, " ")
        .toLocaleLowerCase("es-MX");

    if (!normalized) {
        return null;
    }

    return normalized.charAt(0).toLocaleUpperCase("es-MX") + normalized.slice(1);
}

function parseOptionalNumber(
    value: FormDataEntryValue | null,
    label: string,
    options?: { positive?: boolean },
) {
    const raw = String(value ?? "").trim().replace(",", ".");

    if (!raw) {
        return { value: null, error: null };
    }

    const parsed = Number(raw);

    if (!Number.isFinite(parsed) || parsed < 0 || (options?.positive && parsed === 0)) {
        return {
            value: null,
            error: `${label} debe ser un número ${options?.positive ? "mayor que cero" : "mayor o igual a cero"}.`,
        };
    }

    return { value: parsed, error: null };
}

function buildItemFields(
    formData: FormData,
    kind: InventoryKind,
    trackStock: boolean,
): { fields: ItemFields } | { error: string } {
    const name = String(formData.get("name") ?? "").trim();

    if (!name) {
        return { error: "El nombre del ítem es obligatorio." };
    }

    const description = String(formData.get("description") ?? "").trim() || null;
    const unit = String(formData.get("unit") ?? "").trim();

    if (!(INVENTORY_UNITS as readonly string[]).includes(unit)) {
        return { error: "Selecciona una unidad válida." };
    }

    const category = sanitizeCategory(String(formData.get("category") ?? ""));
    const cost = parseOptionalNumber(formData.get("cost"), "El costo");

    if (cost.error) {
        return { error: cost.error };
    }

    const salePrice = kind === "product"
        ? parseOptionalNumber(formData.get("sale_price"), "El precio de venta")
        : { value: null, error: null };

    if (salePrice.error) {
        return { error: salePrice.error };
    }

    const lowStockThreshold = trackStock
        ? parseOptionalNumber(formData.get("low_stock_threshold"), "El mínimo de stock")
        : { value: null, error: null };

    if (lowStockThreshold.error) {
        return { error: lowStockThreshold.error };
    }

    return {
        fields: {
            name,
            description,
            unit,
            category,
            cost: cost.value,
            salePrice: salePrice.value,
            lowStockThreshold: lowStockThreshold.value,
        },
    };
}

function parseRecipeInputs(formData: FormData): { rows: RecipeInput[]; error: string | null } {
    const supplyIds = formData.getAll("recipeSupplyId").map((value) => String(value).trim());
    const quantities = formData.getAll("recipeQuantity").map((value) => String(value).trim());

    if (supplyIds.length !== quantities.length) {
        return { rows: [], error: "La receta no es válida." };
    }

    const rows: RecipeInput[] = [];
    const seen = new Set<string>();

    for (let index = 0; index < supplyIds.length; index += 1) {
        const supplyItemId = supplyIds[index];
        const rawQuantity = quantities[index];

        if (!supplyItemId && !rawQuantity) {
            continue;
        }

        if (!supplyItemId) {
            return { rows: [], error: "Selecciona un insumo en cada fila de la receta." };
        }

        const quantity = Number(rawQuantity.replace(",", "."));

        if (!Number.isFinite(quantity) || quantity <= 0) {
            return { rows: [], error: "Las cantidades de la receta deben ser mayores que cero." };
        }

        if (seen.has(supplyItemId)) {
            return { rows: [], error: "No puedes repetir un insumo en la receta." };
        }

        seen.add(supplyItemId);
        rows.push({ supplyItemId, quantity });
    }

    return { rows, error: null };
}

function getEstimatedCost(recipes: InventoryRecipeLine[]) {
    if (recipes.length === 0 || recipes.some((recipe) => recipe.supplyCost === null)) {
        return null;
    }

    return recipes.reduce(
        (total, recipe) => total + recipe.quantityPerUnit * (recipe.supplyCost ?? 0),
        0,
    );
}

function getEstimatedCapacity(recipes: InventoryRecipeLine[]) {
    if (recipes.length === 0 || recipes.some((recipe) => !recipe.supplyTrackStock || recipe.quantityPerUnit <= 0)) {
        return null;
    }

    return Math.floor(
        Math.min(...recipes.map((recipe) => recipe.supplyStockTotal / recipe.quantityPerUnit)),
    );
}

/**
 * Resuelve la organización y el rol del usuario con la misma prioridad que el
 * resto de la app: primero la organización propia; si no tiene, la primera
 * membresía aceptada.
 */
async function getInventoryActor(
    supabase: ServerSupabase,
    userId: string,
): Promise<InventoryActor | null> {
    const { data: organization } = await supabase
        .from("organizations")
        .select("id, name")
        .eq("owner_user_id", userId)
        .maybeSingle();

    if (organization) {
        return {
            organizationId: organization.id as string,
            organizationName: organization.name as string | null,
            roleName: "owner",
        };
    }

    const { data: membership } = await supabase
        .from("organization_members")
        .select("organization_id, roles(name), organizations(name)")
        .eq("user_id", userId)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();

    if (!membership) {
        return null;
    }

    const role = normalizeRelated<{ name: string | null }>(membership.roles);
    const memberOrganization = normalizeRelated<{ name: string | null }>(membership.organizations);

    return {
        organizationId: membership.organization_id as string,
        organizationName: memberOrganization?.name ?? null,
        roleName: role?.name ?? null,
    };
}

async function validateRecipeSupplies(
    supabase: ServerSupabase,
    organizationId: string,
    rows: RecipeInput[],
) {
    if (rows.length === 0) {
        return null;
    }

    const ids = rows.map((row) => row.supplyItemId);

    const { data, error } = await supabase
        .from("inventory_items")
        .select("id")
        .eq("organization_id", organizationId)
        .eq("kind", "supply")
        .in("id", ids);

    if (error) {
        return error.message;
    }

    if ((data ?? []).length !== ids.length) {
        return "Uno de los insumos de la receta no pertenece a tu organización.";
    }

    return null;
}

async function insertRecipeRows(
    supabase: ServerSupabase,
    productItemId: string,
    rows: RecipeInput[],
) {
    if (rows.length === 0) {
        return null;
    }

    const { error } = await supabase
        .from("item_recipes")
        .insert(
            rows.map((row) => ({
                product_item_id: productItemId,
                supply_item_id: row.supplyItemId,
                quantity_per_unit: row.quantity,
            })),
        );

    return error?.message ?? null;
}

export async function getInventoryCatalog(): Promise<InventoryCatalogState> {
    const session = await requireUser();

    if (!session) {
        return {
            error: "No se encontró un usuario autenticado.",
            success: null,
            data: null,
        };
    }

    const { supabase, user } = session;
    const actor = await getInventoryActor(supabase, user.id);

    if (!actor) {
        return {
            error: "No perteneces a ninguna organización.",
            success: null,
            data: null,
        };
    }

    if (!isInventoryStaff(actor.roleName)) {
        return {
            error: "No tienes permiso para administrar el inventario.",
            success: null,
            data: null,
        };
    }

    const [itemsResponse, branchesResponse] = await Promise.all([
        supabase
            .from("inventory_items")
            .select("*")
            .eq("organization_id", actor.organizationId)
            .order("name", { ascending: true }),
        supabase
            .from("organizations_branches")
            .select("id, name")
            .eq("organization_id", actor.organizationId)
            .order("created_at", { ascending: true }),
    ]);

    if (itemsResponse.error) {
        return {
            error: itemsResponse.error.message,
            success: null,
            data: null,
        };
    }

    if (branchesResponse.error) {
        return {
            error: branchesResponse.error.message,
            success: null,
            data: null,
        };
    }

    const itemRows = itemsResponse.data ?? [];
    const branches: BranchOption[] = (branchesResponse.data ?? []).map((branch) => ({
        id: branch.id as string,
        name: (branch.name as string | null) ?? "Sin nombre",
    }));
    const branchNameById = new Map(branches.map((branch) => [branch.id, branch.name]));
    const itemIds = itemRows.map((row) => row.id as string);

    let stockRows: Array<{ item_id: string; branch_id: string; quantity: unknown }> = [];
    let recipeRows: Array<{ product_item_id: string; supply_item_id: string; quantity_per_unit: unknown }> = [];

    if (itemIds.length > 0) {
        const [stocksResponse, recipesResponse] = await Promise.all([
            supabase
                .from("item_stocks")
                .select("item_id, branch_id, quantity")
                .in("item_id", itemIds),
            supabase
                .from("item_recipes")
                .select("product_item_id, supply_item_id, quantity_per_unit")
                .in("product_item_id", itemIds),
        ]);

        if (stocksResponse.error) {
            return {
                error: stocksResponse.error.message,
                success: null,
                data: null,
            };
        }

        if (recipesResponse.error) {
            return {
                error: recipesResponse.error.message,
                success: null,
                data: null,
            };
        }

        stockRows = stocksResponse.data ?? [];
        recipeRows = recipesResponse.data ?? [];
    }

    const stocksByItem = new Map<string, InventoryStock[]>();

    for (const row of stockRows) {
        const itemId = row.item_id as string;
        const branchId = row.branch_id as string;
        const stocks = stocksByItem.get(itemId) ?? [];

        stocks.push({
            branchId,
            branchName: branchNameById.get(branchId) ?? "Sucursal",
            quantity: toNumber(row.quantity),
        });
        stocksByItem.set(itemId, stocks);
    }

    const baseById = new Map<string, BaseItem>();

    for (const row of itemRows) {
        const id = row.id as string;
        const stocks = (stocksByItem.get(id) ?? []).sort(
            (left, right) => left.branchName.localeCompare(right.branchName, "es"),
        );

        baseById.set(id, {
            id,
            name: row.name as string,
            unit: row.unit as string,
            kind: row.kind as InventoryKind,
            cost: toNullableNumber(row.cost),
            trackStock: Boolean(row.track_stock),
            stockTotal: stocks.reduce((total, stock) => total + stock.quantity, 0),
            stocks,
        });
    }

    const recipesByProduct = new Map<string, InventoryRecipeLine[]>();

    for (const row of recipeRows) {
        const productId = row.product_item_id as string;
        const supply = baseById.get(row.supply_item_id as string);

        if (!supply) {
            continue;
        }

        const recipes = recipesByProduct.get(productId) ?? [];

        recipes.push({
            supplyItemId: supply.id,
            supplyName: supply.name,
            supplyUnit: supply.unit,
            quantityPerUnit: toNumber(row.quantity_per_unit),
            supplyCost: supply.cost,
            supplyStockTotal: supply.stockTotal,
            supplyTrackStock: supply.trackStock,
        });
        recipesByProduct.set(productId, recipes);
    }

    const items: InventoryItem[] = itemRows.map((row) => {
        const id = row.id as string;
        const base = baseById.get(id)!;
        const kind = base.kind;
        const recipes = kind === "product" ? (recipesByProduct.get(id) ?? []) : [];
        const estimatedCost = getEstimatedCost(recipes);
        const cost = toNullableNumber(row.cost);
        const salePrice = toNullableNumber(row.sale_price);
        const effectiveCost = kind === "product" ? (cost ?? estimatedCost) : cost;
        const marginAmount = kind === "product" && salePrice !== null && effectiveCost !== null
            ? salePrice - effectiveCost
            : null;
        const marginPercent = marginAmount !== null && effectiveCost !== null && effectiveCost > 0
            ? (marginAmount / effectiveCost) * 100
            : null;

        return {
            id,
            name: row.name as string,
            description: (row.description as string | null) ?? null,
            kind,
            trackStock: Boolean(row.track_stock),
            unit: row.unit as string,
            sku: (row.sku as string | null) ?? null,
            category: (row.category as string | null) ?? null,
            cost,
            salePrice,
            lowStockThreshold: toNullableNumber(row.low_stock_threshold),
            status: Boolean(row.status),
            createdAt: row.created_at as string,
            stockTotal: base.stockTotal,
            stocks: base.stocks,
            recipes,
            estimatedCost,
            effectiveCost,
            marginAmount,
            marginPercent,
            capacity: getEstimatedCapacity(recipes),
        };
    });

    const categories = Array.from(
        new Set(
            items
                .map((item) => item.category)
                .filter((category): category is string => Boolean(category)),
        ),
    ).sort((left, right) => left.localeCompare(right, "es"));

    const catalog: InventoryCatalog = {
        organizationName: actor.organizationName,
        roleName: actor.roleName,
        items,
        branches,
        categories,
    };

    return {
        error: null,
        success: "Catálogo obtenido correctamente.",
        data: catalog,
    };
}

export async function createItem(
    _prevState: InventoryFormState,
    formData: FormData,
): Promise<InventoryFormState> {
    const session = await requireUser();

    if (!session) {
        return fail("Debes iniciar sesión antes de crear un ítem.");
    }

    const { supabase, user } = session;
    const actor = await getInventoryActor(supabase, user.id);

    if (!actor) {
        return fail("No perteneces a ninguna organización.");
    }

    if (!isInventoryStaff(actor.roleName)) {
        return fail("No tienes permiso para administrar el inventario.");
    }

    const kind = parseKind(formData.get("kind"));

    if (!kind) {
        return fail("Selecciona el tipo de ítem.");
    }

    const trackStock = kind === "supply"
        ? true
        : String(formData.get("track_stock") ?? "") === "true";

    const parsedFields = buildItemFields(formData, kind, trackStock);

    if ("error" in parsedFields) {
        return fail(parsedFields.error);
    }

    const fields = parsedFields.fields;

    const parsedRecipe: { rows: RecipeInput[]; error: string | null } = kind === "product"
        ? parseRecipeInputs(formData)
        : { rows: [], error: null };

    if (parsedRecipe.error) {
        return fail(parsedRecipe.error);
    }

    const suppliesError = await validateRecipeSupplies(
        supabase,
        actor.organizationId,
        parsedRecipe.rows,
    );

    if (suppliesError) {
        return fail(suppliesError);
    }

    const branchId = String(formData.get("branchId") ?? "").trim();
    const initialStockParse = trackStock
        ? parseOptionalNumber(formData.get("initialStock"), "El stock inicial")
        : { value: null, error: null };

    if (initialStockParse.error) {
        return fail(initialStockParse.error);
    }

    const initialStock = initialStockParse.value !== null && initialStockParse.value > 0
        ? initialStockParse.value
        : null;

    if (initialStock !== null && !branchId) {
        return fail("Selecciona la sucursal donde se registrará el stock inicial.");
    }

    let createdId: string | null = null;
    let lastError: string | null = null;

    for (let attempt = 0; attempt < 5; attempt += 1) {
        const { data, error } = await supabase
            .from("inventory_items")
            .insert({
                organization_id: actor.organizationId,
                name: fields.name,
                description: fields.description,
                kind,
                track_stock: trackStock,
                unit: fields.unit,
                sku: createSku(kind),
                category: fields.category,
                cost: fields.cost,
                sale_price: fields.salePrice,
                low_stock_threshold: fields.lowStockThreshold,
                status: true,
            })
            .select("id")
            .single();

        if (!error && data) {
            createdId = data.id as string;
            break;
        }

        lastError = error?.message ?? null;

        if (error?.code !== "23505") {
            return fail(error?.message ?? "No se pudo crear el ítem.");
        }
    }

    if (!createdId) {
        return fail(lastError ?? "No se pudo generar un SKU único para el ítem. Intenta de nuevo.");
    }

    const warnings: string[] = [];

    if (parsedRecipe.rows.length > 0) {
        const recipeError = await insertRecipeRows(supabase, createdId, parsedRecipe.rows);

        if (recipeError) {
            warnings.push("El ítem se creó, pero la receta no se pudo guardar.");
        }
    }

    if (initialStock !== null) {
        const { error: stockError } = await supabase.rpc("register_inventory_movement", {
            p_item_id: createdId,
            p_branch_id: branchId,
            p_type: "initial",
            p_quantity: initialStock,
            p_note: null,
        });

        if (stockError) {
            warnings.push(
                `El ítem se creó, pero no se pudo registrar el stock inicial: ${mapInventoryError(stockError.message)}`,
            );
        }
    }

    revalidatePath("/productos");

    return {
        error: null,
        success: "Ítem creado correctamente.",
        warning: warnings.length > 0 ? warnings.join(" ") : null,
        data: { id: createdId },
    };
}

export async function updateItem(
    _prevState: InventoryFormState,
    formData: FormData,
): Promise<InventoryFormState> {
    const itemId = String(formData.get("itemId") ?? "").trim();

    if (!itemId) {
        return fail("No se encontró el ítem que quieres actualizar.");
    }

    const session = await requireUser();

    if (!session) {
        return fail("Debes iniciar sesión antes de actualizar un ítem.");
    }

    const { supabase, user } = session;
    const actor = await getInventoryActor(supabase, user.id);

    if (!actor) {
        return fail("No perteneces a ninguna organización.");
    }

    if (!isInventoryStaff(actor.roleName)) {
        return fail("No tienes permiso para administrar el inventario.");
    }

    const { data: target, error: targetError } = await supabase
        .from("inventory_items")
        .select("id, organization_id, kind")
        .eq("id", itemId)
        .maybeSingle();

    if (targetError) {
        return fail(targetError.message);
    }

    if (!target) {
        return fail("El ítem no existe o no tienes permiso para editarlo.");
    }

    if (target.organization_id !== actor.organizationId) {
        return fail("El ítem no pertenece a tu organización.");
    }

    // El tipo no se puede cambiar después de crear el ítem: las recetas y la
    // semántica de stock dependen de él.
    const kind = target.kind as InventoryKind;
    const trackStock = kind === "supply"
        ? true
        : String(formData.get("track_stock") ?? "") === "true";

    const parsedFields = buildItemFields(formData, kind, trackStock);

    if ("error" in parsedFields) {
        return fail(parsedFields.error);
    }

    const fields = parsedFields.fields;

    const parsedRecipe: { rows: RecipeInput[]; error: string | null } = kind === "product"
        ? parseRecipeInputs(formData)
        : { rows: [], error: null };

    if (parsedRecipe.error) {
        return fail(parsedRecipe.error);
    }

    const suppliesError = await validateRecipeSupplies(
        supabase,
        actor.organizationId,
        parsedRecipe.rows,
    );

    if (suppliesError) {
        return fail(suppliesError);
    }

    const { data: updated, error } = await supabase
        .from("inventory_items")
        .update({
            name: fields.name,
            description: fields.description,
            track_stock: trackStock,
            unit: fields.unit,
            category: fields.category,
            cost: fields.cost,
            sale_price: fields.salePrice,
            low_stock_threshold: fields.lowStockThreshold,
            updated_at: new Date().toISOString(),
        })
        .eq("id", itemId)
        .eq("organization_id", actor.organizationId)
        .select("id");

    if (error) {
        return fail(error.message);
    }

    if (!updated || updated.length === 0) {
        return fail("El ítem no existe en tu organización.");
    }

    const warnings: string[] = [];

    // Las recetas se reemplazan completas: borrar + insertar es el mismo patrón
    // que usa la app para invitation_branches y evita cálculos de diferencias.
    if (kind === "product") {
        const { error: deleteError } = await supabase
            .from("item_recipes")
            .delete()
            .eq("product_item_id", itemId);

        if (deleteError) {
            warnings.push("El ítem se actualizó, pero la receta anterior no se pudo reemplazar.");
        } else if (parsedRecipe.rows.length > 0) {
            const recipeError = await insertRecipeRows(supabase, itemId, parsedRecipe.rows);

            if (recipeError) {
                warnings.push("El ítem se actualizó, pero la receta no se pudo guardar.");
            }
        }
    }

    revalidatePath("/productos");

    return {
        error: null,
        success: "Ítem actualizado correctamente.",
        warning: warnings.length > 0 ? warnings.join(" ") : null,
        data: { id: itemId },
    };
}

export async function adjustStock(
    _prevState: InventoryStatusState,
    formData: FormData,
): Promise<InventoryStatusState> {
    const itemId = String(formData.get("itemId") ?? "").trim();
    const branchId = String(formData.get("branchId") ?? "").trim();
    const movementType = String(formData.get("movementType") ?? "").trim();
    const note = String(formData.get("note") ?? "").trim() || null;
    const parsedQuantity = parseOptionalNumber(formData.get("quantity"), "La cantidad", { positive: true });

    if (!itemId) {
        return {
            error: "No se encontró el ítem que quieres ajustar.",
            success: null,
        };
    }

    if (!branchId) {
        return {
            error: "Selecciona la sucursal del movimiento.",
            success: null,
        };
    }

    if (!isMovementType(movementType)) {
        return {
            error: "Selecciona el tipo de movimiento.",
            success: null,
        };
    }

    if (parsedQuantity.error || parsedQuantity.value === null) {
        return {
            error: parsedQuantity.error ?? "La cantidad debe ser mayor que cero.",
            success: null,
        };
    }

    const session = await requireUser();

    if (!session) {
        return {
            error: "Debes iniciar sesión antes de ajustar el stock.",
            success: null,
        };
    }

    const { supabase, user } = session;
    const actor = await getInventoryActor(supabase, user.id);

    if (!actor) {
        return {
            error: "No perteneces a ninguna organización.",
            success: null,
        };
    }

    if (!isInventoryStaff(actor.roleName)) {
        return {
            error: "No tienes permiso para ajustar el stock.",
            success: null,
        };
    }

    const { data: target, error: targetError } = await supabase
        .from("inventory_items")
        .select("id, organization_id, track_stock, status")
        .eq("id", itemId)
        .maybeSingle();

    if (targetError) {
        return {
            error: targetError.message,
            success: null,
        };
    }

    if (!target || target.organization_id !== actor.organizationId) {
        return {
            error: "El ítem no existe o no pertenece a tu organización.",
            success: null,
        };
    }

    if (!target.track_stock) {
        return {
            error: "Este producto se maneja por encargo y no lleva stock.",
            success: null,
        };
    }

    if (!target.status) {
        return {
            error: "El ítem está inactivo. Actívalo antes de ajustar su stock.",
            success: null,
        };
    }

    const { error } = await supabase.rpc("register_inventory_movement", {
        p_item_id: itemId,
        p_branch_id: branchId,
        p_type: movementType,
        p_quantity: parsedQuantity.value,
        p_note: note,
    });

    if (error) {
        return {
            error: mapInventoryError(error.message),
            success: null,
        };
    }

    revalidatePath("/productos");

    return {
        error: null,
        success: "Stock actualizado correctamente.",
    };
}

export async function toggleItemStatus(itemId: string): Promise<InventoryStatusState> {
    const targetItemId = itemId.trim();

    if (!targetItemId) {
        return {
            error: "No se encontró el ítem que quieres actualizar.",
            success: null,
        };
    }

    const session = await requireUser();

    if (!session) {
        return {
            error: "Debes iniciar sesión antes de actualizar un ítem.",
            success: null,
        };
    }

    const { supabase, user } = session;
    const actor = await getInventoryActor(supabase, user.id);

    if (!actor) {
        return {
            error: "No perteneces a ninguna organización.",
            success: null,
        };
    }

    if (!isInventoryStaff(actor.roleName)) {
        return {
            error: "No tienes permiso para administrar el inventario.",
            success: null,
        };
    }

    const { data: target, error: targetError } = await supabase
        .from("inventory_items")
        .select("id, organization_id, status")
        .eq("id", targetItemId)
        .maybeSingle();

    if (targetError) {
        return {
            error: targetError.message,
            success: null,
        };
    }

    if (!target || target.organization_id !== actor.organizationId) {
        return {
            error: "El ítem no existe o no pertenece a tu organización.",
            success: null,
        };
    }

    const { data: updated, error } = await supabase
        .from("inventory_items")
        .update({
            status: !target.status,
            updated_at: new Date().toISOString(),
        })
        .eq("id", targetItemId)
        .eq("organization_id", actor.organizationId)
        .select("id");

    if (error) {
        return {
            error: error.message,
            success: null,
        };
    }

    if (!updated || updated.length === 0) {
        return {
            error: "El ítem no existe en tu organización.",
            success: null,
        };
    }

    revalidatePath("/productos");

    return {
        error: null,
        success: target.status ? "Ítem desactivado correctamente." : "Ítem activado correctamente.",
    };
}
