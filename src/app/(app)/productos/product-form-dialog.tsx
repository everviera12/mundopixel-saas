"use client";

import { useActionState, useEffect, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon, Delete02Icon } from "@hugeicons/core-free-icons";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { createItem, updateItem } from "@/lib/actions/inventory";
import {
    INVENTORY_UNITS,
    KIND_LABELS,
    type BranchOption,
    type InventoryItem,
    type InventoryKind,
    type SupplyOption,
} from "@/lib/inventory";

type ProductFormDialogProps = {
    mode: "create" | "edit";
    item?: InventoryItem;
    supplies: SupplyOption[];
    branches: BranchOption[];
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
};

type ProductFormFieldsProps = {
    mode: "create" | "edit";
    item?: InventoryItem;
    supplies: SupplyOption[];
    branches: BranchOption[];
    onCancel: () => void;
    onSuccess: () => void;
};

type RecipeRow = {
    key: string;
    supplyItemId: string;
    quantity: string;
};

const ITEM_TYPE_OPTIONS = [
    { value: "product_stock", label: "Producto con inventario" },
    { value: "product_order", label: "Producto por encargo" },
    { value: "supply", label: "Insumo" },
];

const STOCK_CONTROL_OPTIONS = [
    { value: "true", label: "Con inventario" },
    { value: "false", label: "Por encargo" },
];

const UNIT_OPTIONS = INVENTORY_UNITS.map((unit) => ({
    value: unit,
    label: unit,
}));

export function ProductFormDialog({
    mode,
    item,
    supplies,
    branches,
    open: controlledOpen,
    onOpenChange,
}: ProductFormDialogProps) {
    const isCreate = mode === "create";
    const [internalOpen, setInternalOpen] = useState(false);
    const open = isCreate ? internalOpen : controlledOpen ?? false;

    function handleOpenChange(nextOpen: boolean) {
        if (isCreate) {
            setInternalOpen(nextOpen);
            return;
        }

        onOpenChange?.(nextOpen);
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            {isCreate && (
                <DialogTrigger
                    render={
                        <Button>
                            <HugeiconsIcon icon={Add01Icon} strokeWidth={2} />
                            Nuevo ítem
                        </Button>
                    }
                />
            )}

            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>{isCreate ? "Nuevo ítem" : "Editar ítem"}</DialogTitle>
                    <DialogDescription>
                        {isCreate
                            ? "Agrega un producto o insumo al catálogo de tu organización."
                            : `Actualiza los datos de ${item?.name ?? "este ítem"}.`}
                    </DialogDescription>
                </DialogHeader>

                {open && (
                    <ProductFormFields
                        mode={mode}
                        item={item}
                        supplies={supplies}
                        branches={branches}
                        onCancel={() => handleOpenChange(false)}
                        onSuccess={() => handleOpenChange(false)}
                    />
                )}
            </DialogContent>
        </Dialog>
    );
}

function ProductFormFields({
    mode,
    item,
    supplies,
    branches,
    onCancel,
    onSuccess,
}: ProductFormFieldsProps) {
    const action = mode === "create" ? createItem : updateItem;
    const [state, formAction, isPending] = useActionState(action, {
        error: null,
        success: null,
        warning: null,
        data: null,
    });
    const [kind, setKind] = useState<InventoryKind>(item?.kind ?? "product");
    const [trackStock, setTrackStock] = useState(item?.trackStock ?? true);
    const [recipeRows, setRecipeRows] = useState<RecipeRow[]>(() =>
        (item?.recipes ?? []).map((recipe, index) => ({
            key: `${recipe.supplyItemId}-${index}`,
            supplyItemId: recipe.supplyItemId,
            quantity: String(recipe.quantityPerUnit),
        })),
    );

    useEffect(() => {
        if (state.success && !state.warning) {
            onSuccess();
        }
    }, [state.success, state.warning, onSuccess]);

    if (state.success && state.warning) {
        return (
            <div className="space-y-4">
                <Alert className="border-none p-0">
                    <AlertDescription className="font-medium text-amber-600">
                        {state.warning}
                    </AlertDescription>
                </Alert>

                <DialogFooter>
                    <Button type="button" onClick={onSuccess}>Cerrar</Button>
                </DialogFooter>
            </div>
        );
    }

    const itemType = kind === "supply"
        ? "supply"
        : trackStock
            ? "product_stock"
            : "product_order";

    const supplyItems = supplies.map((supply) => ({
        value: supply.id,
        label: `${supply.name} (${supply.unit})${supply.status ? "" : " · Inactivo"}`,
    }));

    const branchItems = branches.map((branch) => ({
        value: branch.id,
        label: branch.name,
    }));

    function handleItemTypeChange(value: string | null) {
        if (value === "supply") {
            setKind("supply");
            setTrackStock(true);
            return;
        }

        setKind("product");
        setTrackStock(value !== "product_order");
    }

    function addRecipeRow() {
        setRecipeRows((current) => [
            ...current,
            {
                key: crypto.randomUUID(),
                supplyItemId: "",
                quantity: "1",
            },
        ]);
    }

    function removeRecipeRow(key: string) {
        setRecipeRows((current) => current.filter((row) => row.key !== key));
    }

    function handleRecipeSupplyChange(key: string, supplyItemId: string) {
        setRecipeRows((current) => current.map((row) => (
            row.key === key ? { ...row, supplyItemId } : row
        )));
    }

    function handleRecipeQuantityChange(key: string, quantity: string) {
        setRecipeRows((current) => current.map((row) => (
            row.key === key ? { ...row, quantity } : row
        )));
    }

    return (
        <form action={formAction}>
            {mode === "edit" && item && (
                <input type="hidden" name="itemId" value={item.id} />
            )}
            <input type="hidden" name="kind" value={kind} />
            <input type="hidden" name="track_stock" value={trackStock ? "true" : "false"} />

            <FieldGroup className="gap-5">
                <Field>
                    <FieldLabel htmlFor="item-name">Nombre</FieldLabel>
                    <Input
                        id="item-name"
                        name="name"
                        defaultValue={item?.name ?? ""}
                        placeholder="Ej. Playera personalizada"
                        required
                    />
                </Field>

                <Field>
                    <FieldLabel htmlFor="item-description">Descripción (opcional)</FieldLabel>
                    <textarea
                        id="item-description"
                        name="description"
                        defaultValue={item?.description ?? ""}
                        rows={2}
                        placeholder="Detalles del producto o insumo"
                        className="w-full min-w-0 rounded-2xl border border-input bg-input/30 px-3 py-2 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                    />
                </Field>

                {mode === "create" ? (
                    <Field>
                        <FieldLabel htmlFor="item-type">Tipo de ítem</FieldLabel>

                        <Select
                            value={itemType}
                            onValueChange={handleItemTypeChange}
                            items={ITEM_TYPE_OPTIONS}
                        >
                            <SelectTrigger id="item-type" className="w-full">
                                <SelectValue />
                            </SelectTrigger>

                            <SelectContent>
                                {ITEM_TYPE_OPTIONS.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <FieldDescription>
                            Los insumos siempre llevan inventario. Los productos pueden manejarse por encargo.
                        </FieldDescription>
                    </Field>
                ) : (
                    <Field>
                        <FieldLabel>Tipo de ítem</FieldLabel>

                        <div className="flex flex-wrap items-center gap-2">
                            <Badge>{KIND_LABELS[kind]}</Badge>
                            {item?.sku && (
                                <span className="text-sm text-muted-foreground">SKU {item.sku}</span>
                            )}
                        </div>

                        <FieldDescription>
                            El tipo y el SKU no se pueden cambiar después de crear el ítem.
                        </FieldDescription>
                    </Field>
                )}

                {mode === "edit" && kind === "product" && (
                    <Field>
                        <FieldLabel htmlFor="item-stock-control">Control de stock</FieldLabel>

                        <Select
                            value={trackStock ? "true" : "false"}
                            onValueChange={(value) => setTrackStock(value === "true")}
                            items={STOCK_CONTROL_OPTIONS}
                        >
                            <SelectTrigger id="item-stock-control" className="w-full">
                                <SelectValue />
                            </SelectTrigger>

                            <SelectContent>
                                {STOCK_CONTROL_OPTIONS.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <FieldDescription>
                            Si lo cambias a “Por encargo”, el stock registrado se conserva pero deja de mostrarse.
                        </FieldDescription>
                    </Field>
                )}

                {mode === "edit" && kind === "supply" && (
                    <FieldDescription>
                        Los insumos siempre llevan control de inventario.
                    </FieldDescription>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                    <Field>
                        <FieldLabel htmlFor="item-category">Categoría (opcional)</FieldLabel>
                        <Input
                            id="item-category"
                            name="category"
                            defaultValue={item?.category ?? ""}
                            placeholder="Ej. Papelería"
                        />
                    </Field>

                    <Field>
                        <FieldLabel htmlFor="item-unit">Unidad</FieldLabel>

                        <Select
                            name="unit"
                            defaultValue={item?.unit ?? "Pieza"}
                            items={UNIT_OPTIONS}
                            required
                        >
                            <SelectTrigger id="item-unit" className="w-full">
                                <SelectValue placeholder="Selecciona una unidad" />
                            </SelectTrigger>

                            <SelectContent>
                                {UNIT_OPTIONS.map((unit) => (
                                    <SelectItem key={unit.value} value={unit.value}>
                                        {unit.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </Field>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <Field>
                        <FieldLabel htmlFor="item-cost">Costo por unidad (opcional)</FieldLabel>
                        <Input
                            id="item-cost"
                            name="cost"
                            type="number"
                            min="0"
                            step="0.01"
                            inputMode="decimal"
                            defaultValue={item?.cost ?? ""}
                            placeholder="0.00"
                        />

                        {kind === "product" && (
                            <FieldDescription>
                                Si lo dejas vacío, se estima con la receta.
                            </FieldDescription>
                        )}
                    </Field>

                    {kind === "product" && (
                        <Field>
                            <FieldLabel htmlFor="item-sale-price">Precio de venta (opcional)</FieldLabel>
                            <Input
                                id="item-sale-price"
                                name="sale_price"
                                type="number"
                                min="0"
                                step="0.01"
                                inputMode="decimal"
                                defaultValue={item?.salePrice ?? ""}
                                placeholder="0.00"
                            />
                        </Field>
                    )}
                </div>

                {trackStock && (
                    <Field>
                        <FieldLabel htmlFor="item-low-stock">Mínimo de stock (opcional)</FieldLabel>
                        <Input
                            id="item-low-stock"
                            name="low_stock_threshold"
                            type="number"
                            min="0"
                            step="any"
                            inputMode="decimal"
                            defaultValue={item?.lowStockThreshold ?? ""}
                            placeholder="Ej. 10"
                        />
                        <FieldDescription>
                            El stock se marca en rojo cuando llega a este número.
                        </FieldDescription>
                    </Field>
                )}

                {mode === "create" && trackStock && branches.length > 0 && (
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field>
                            <FieldLabel htmlFor="item-initial-stock">Stock inicial (opcional)</FieldLabel>
                            <Input
                                id="item-initial-stock"
                                name="initialStock"
                                type="number"
                                min="0"
                                step="any"
                                inputMode="decimal"
                                placeholder="0"
                            />
                        </Field>

                        <Field>
                            <FieldLabel htmlFor="item-branch">Sucursal</FieldLabel>

                            {branches.length === 1 ? (
                                <>
                                    <input type="hidden" name="branchId" value={branches[0].id} />
                                    <div className="flex h-9 items-center rounded-4xl border border-input bg-input/30 px-3 text-sm text-muted-foreground">
                                        {branches[0].name}
                                    </div>
                                </>
                            ) : (
                                <Select
                                    name="branchId"
                                    defaultValue={branches[0].id}
                                    items={branchItems}
                                    required
                                >
                                    <SelectTrigger id="item-branch" className="w-full">
                                        <SelectValue />
                                    </SelectTrigger>

                                    <SelectContent>
                                        {branches.map((branch) => (
                                            <SelectItem key={branch.id} value={branch.id}>
                                                {branch.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </Field>
                    </div>
                )}

                {mode === "create" && trackStock && branches.length === 0 && (
                    <FieldDescription>
                        No hay sucursales disponibles, así que no puedes registrar stock inicial todavía.
                    </FieldDescription>
                )}

                {kind === "product" && (
                    <Field>
                        <FieldLabel>Receta (opcional)</FieldLabel>

                        <FieldDescription>
                            Indica cuánto insumo consume cada unidad del producto. El costo estimado y la
                            capacidad se calculan con estas cantidades y el stock de los insumos.
                        </FieldDescription>

                        {recipeRows.length > 0 && (
                            <div className="space-y-3">
                                {recipeRows.map((row) => (
                                    <div
                                        key={row.key}
                                        className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_110px_auto] sm:items-end"
                                    >
                                        <Select
                                            name="recipeSupplyId"
                                            value={row.supplyItemId || null}
                                            onValueChange={(value) => handleRecipeSupplyChange(row.key, String(value ?? ""))}
                                            items={supplyItems}
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Selecciona un insumo" />
                                            </SelectTrigger>

                                            <SelectContent>
                                                {supplies.map((supply) => (
                                                    <SelectItem key={supply.id} value={supply.id}>
                                                        {supply.name} ({supply.unit}){supply.status ? "" : " · Inactivo"}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>

                                        <Input
                                            name="recipeQuantity"
                                            type="number"
                                            min="0"
                                            step="any"
                                            inputMode="decimal"
                                            placeholder="1"
                                            value={row.quantity}
                                            onChange={(event) => handleRecipeQuantityChange(row.key, event.target.value)}
                                            aria-label="Cantidad por unidad"
                                            required
                                        />

                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon-sm"
                                            aria-label="Quitar insumo de la receta"
                                            onClick={() => removeRecipeRow(row.key)}
                                        >
                                            <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={addRecipeRow}
                                disabled={supplies.length === 0}
                            >
                                <HugeiconsIcon icon={Add01Icon} strokeWidth={2} />
                                Agregar insumo
                            </Button>
                        </div>

                        {supplies.length === 0 && (
                            <FieldDescription>
                                No hay insumos registrados. Crea primero un ítem de tipo Insumo para armar la receta.
                            </FieldDescription>
                        )}
                    </Field>
                )}

                {state.error && (
                    <Alert className="border-none p-0">
                        <AlertDescription className="font-medium text-red-600">
                            {state.error}
                        </AlertDescription>
                    </Alert>
                )}

                <DialogFooter>
                    <Button type="button" variant="outline" disabled={isPending} onClick={onCancel}>
                        Cancelar
                    </Button>

                    <Button type="submit" disabled={isPending}>
                        {isPending && <span className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent" />}
                        {isPending ? "Guardando..." : mode === "create" ? "Crear ítem" : "Guardar cambios"}
                    </Button>
                </DialogFooter>
            </FieldGroup>
        </form>
    );
}
