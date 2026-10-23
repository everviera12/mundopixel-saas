export type InventoryKind = "product" | "supply";

export type MovementType = "initial" | "adjustment_in" | "adjustment_out";

export const INVENTORY_UNITS = [
    "Pieza",
    "Hoja",
    "Pliego",
    "Resma",
    "Rollo",
    "Metro",
    "Caja",
    "Juego",
    "Litro",
    "Mililitro",
    "Kilogramo",
    "Gramo",
] as const;

export const INVENTORY_STAFF_ROLES = ["owner", "admin", "manager"] as const;

export const KIND_LABELS: Record<InventoryKind, string> = {
    product: "Producto",
    supply: "Insumo",
};

export const MOVEMENT_LABELS: Record<MovementType, string> = {
    initial: "Stock inicial",
    adjustment_in: "Entrada",
    adjustment_out: "Salida",
};

export type BranchOption = {
    id: string;
    name: string;
};

export type SupplyOption = {
    id: string;
    name: string;
    unit: string;
    status: boolean;
};

export type InventoryStock = {
    branchId: string;
    branchName: string;
    quantity: number;
};

export type InventoryRecipeLine = {
    supplyItemId: string;
    supplyName: string;
    supplyUnit: string;
    quantityPerUnit: number;
    supplyCost: number | null;
    supplyStockTotal: number;
    supplyTrackStock: boolean;
};

export type InventoryItem = {
    id: string;
    name: string;
    description: string | null;
    kind: InventoryKind;
    trackStock: boolean;
    unit: string;
    sku: string | null;
    category: string | null;
    cost: number | null;
    salePrice: number | null;
    lowStockThreshold: number | null;
    status: boolean;
    createdAt: string;
    stockTotal: number;
    stocks: InventoryStock[];
    recipes: InventoryRecipeLine[];
    estimatedCost: number | null;
    effectiveCost: number | null;
    marginAmount: number | null;
    marginPercent: number | null;
    capacity: number | null;
};

export type InventoryCatalog = {
    organizationName: string | null;
    roleName: string | null;
    items: InventoryItem[];
    branches: BranchOption[];
    categories: string[];
};

export type InventoryCatalogState = {
    error: string | null;
    success: string | null;
    data: InventoryCatalog | null;
};

export type InventoryFormState = {
    error: string | null;
    success: string | null;
    warning: string | null;
    data: { id: string } | null;
};

export type InventoryStatusState = {
    error: string | null;
    success: string | null;
};

export function isInventoryStaff(roleName: string | null | undefined) {
    return roleName
        ? (INVENTORY_STAFF_ROLES as readonly string[]).includes(roleName)
        : false;
}

const quantityFormatter = new Intl.NumberFormat("es-MX", {
    maximumFractionDigits: 3,
});

const recipeQuantityFormatter = new Intl.NumberFormat("es-MX", {
    maximumFractionDigits: 6,
});

const currencyFormatter = new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
});

const percentFormatter = new Intl.NumberFormat("es-MX", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
});

export function formatQuantity(value: number) {
    return quantityFormatter.format(value);
}

export function formatRecipeQuantity(value: number) {
    return recipeQuantityFormatter.format(value);
}

export function formatCurrency(value: number) {
    return currencyFormatter.format(value);
}

export function formatPercent(value: number) {
    return `${percentFormatter.format(value)}%`;
}
