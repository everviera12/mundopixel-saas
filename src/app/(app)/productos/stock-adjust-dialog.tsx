"use client";

import { useActionState, useEffect, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
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
import { adjustStock } from "@/lib/actions/inventory";
import {
    formatQuantity,
    type BranchOption,
    type InventoryItem,
    type MovementType,
} from "@/lib/inventory";

type StockAdjustDialogProps = {
    item: InventoryItem;
    branches: BranchOption[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

type StockAdjustFormProps = {
    item: InventoryItem;
    branches: BranchOption[];
    onCancel: () => void;
    onSuccess: () => void;
};

const MOVEMENT_OPTIONS = [
    { value: "adjustment_in", label: "Entrada (suma al stock)" },
    { value: "adjustment_out", label: "Salida (resta del stock)" },
];

export function StockAdjustDialog({
    item,
    branches,
    open,
    onOpenChange,
}: StockAdjustDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Ajustar stock</DialogTitle>
                    <DialogDescription>{item.name}</DialogDescription>
                </DialogHeader>

                {open && (
                    <StockAdjustForm
                        item={item}
                        branches={branches}
                        onCancel={() => onOpenChange(false)}
                        onSuccess={() => onOpenChange(false)}
                    />
                )}
            </DialogContent>
        </Dialog>
    );
}

function StockAdjustForm({
    item,
    branches,
    onCancel,
    onSuccess,
}: StockAdjustFormProps) {
    const [state, formAction, isPending] = useActionState(adjustStock, {
        error: null,
        success: null,
    });
    const [branchId, setBranchId] = useState(
        () => item.stocks[0]?.branchId ?? branches[0]?.id ?? "",
    );
    const [movement, setMovement] = useState<MovementType>("adjustment_in");
    const [quantity, setQuantity] = useState("");

    useEffect(() => {
        if (state.success) {
            onSuccess();
        }
    }, [state.success, onSuccess]);

    if (branches.length === 0) {
        return (
            <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                    No hay sucursales disponibles para tu usuario.
                </p>

                <DialogFooter>
                    <Button type="button" variant="outline" onClick={onCancel}>
                        Cerrar
                    </Button>
                </DialogFooter>
            </div>
        );
    }

    const currentStock = item.stocks.find((stock) => stock.branchId === branchId)?.quantity ?? null;
    const hasStock = currentStock !== null;
    const effectiveMovement: MovementType = hasStock ? movement : "initial";
    const parsedQuantity = Number(quantity.replace(",", "."));
    const canSubmit = branchId !== "" && Number.isFinite(parsedQuantity) && parsedQuantity > 0 && !isPending;

    const branchItems = branches.map((branch) => ({
        value: branch.id,
        label: branch.name,
    }));

    const movementLabel = effectiveMovement === "initial"
        ? "Registrar stock"
        : effectiveMovement === "adjustment_in"
            ? "Registrar entrada"
            : "Registrar salida";

    return (
        <form action={formAction}>
            <input type="hidden" name="itemId" value={item.id} />
            <input type="hidden" name="movementType" value={effectiveMovement} />

            <FieldGroup className="gap-5">
                <Field>
                    <FieldLabel htmlFor="stock-branch">Sucursal</FieldLabel>

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
                            value={branchId}
                            onValueChange={(value) => setBranchId(String(value ?? ""))}
                            items={branchItems}
                            required
                        >
                            <SelectTrigger id="stock-branch" className="w-full">
                                <SelectValue placeholder="Selecciona una sucursal" />
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

                    <FieldDescription>
                        {hasStock
                            ? `Stock actual: ${formatQuantity(currentStock ?? 0)} ${item.unit}.`
                            : "Esta sucursal todavía no tiene stock registrado; captura el stock inicial."}
                    </FieldDescription>
                </Field>

                {hasStock && (
                    <Field>
                        <FieldLabel htmlFor="stock-movement">Movimiento</FieldLabel>

                        <Select
                            value={movement}
                            onValueChange={(value) => {
                                if (value === "adjustment_in" || value === "adjustment_out") {
                                    setMovement(value);
                                }
                            }}
                            items={MOVEMENT_OPTIONS}
                        >
                            <SelectTrigger id="stock-movement" className="w-full">
                                <SelectValue />
                            </SelectTrigger>

                            <SelectContent>
                                {MOVEMENT_OPTIONS.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </Field>
                )}

                <Field>
                    <FieldLabel htmlFor="stock-quantity">
                        {effectiveMovement === "initial" ? "Stock inicial" : "Cantidad"}
                    </FieldLabel>

                    <Input
                        id="stock-quantity"
                        name="quantity"
                        type="number"
                        min="0"
                        step="any"
                        inputMode="decimal"
                        placeholder="0"
                        value={quantity}
                        onChange={(event) => setQuantity(event.target.value)}
                        required
                    />

                    <FieldDescription>
                        {effectiveMovement === "initial"
                            ? "El stock inicial solo se puede registrar una vez por sucursal."
                            : effectiveMovement === "adjustment_in"
                                ? "La cantidad se suma al stock actual."
                                : "La cantidad se resta del stock actual; no se permite stock negativo."}
                    </FieldDescription>
                </Field>

                <Field>
                    <FieldLabel htmlFor="stock-note">Nota (opcional)</FieldLabel>
                    <Input
                        id="stock-note"
                        name="note"
                        placeholder="Ej. Compra de material"
                    />
                </Field>

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

                    <Button type="submit" disabled={!canSubmit}>
                        {isPending && <span className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent" />}
                        {isPending ? "Guardando..." : movementLabel}
                    </Button>
                </DialogFooter>
            </FieldGroup>
        </form>
    );
}
