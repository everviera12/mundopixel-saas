"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
    KIND_LABELS,
    formatCurrency,
    formatPercent,
    formatQuantity,
    formatRecipeQuantity,
    type InventoryItem,
} from "@/lib/inventory";

type ItemDetailDialogProps = {
    item: InventoryItem;
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

type DetailFactProps = {
    label: string;
    value: string;
    highlight?: "bad";
};

export function ItemDetailDialog({ item, open, onOpenChange }: ItemDetailDialogProps) {
    const stockLabel = item.trackStock
        ? `${formatQuantity(item.stockTotal)} ${item.unit}`
        : "Por encargo";
    const marginLabel = item.marginAmount === null || item.marginPercent === null
        ? "—"
        : `${formatPercent(item.marginPercent)} · ${formatCurrency(item.marginAmount)}`;
    const capacityLabel = item.capacity !== null
        ? `${formatQuantity(item.capacity)} ${item.unit}`
        : item.recipes.length === 0
            ? "—"
            : "Sin datos";

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{item.name}</DialogTitle>
                    <DialogDescription>
                        {item.sku ?? "Sin SKU"}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={item.kind === "product" ? "default" : "outline"}>
                        {KIND_LABELS[item.kind]}
                    </Badge>
                    <Badge variant="outline">
                        {item.trackStock ? "Con inventario" : "Por encargo"}
                    </Badge>
                    {!item.status && <Badge variant="destructive">Inactivo</Badge>}
                </div>

                {item.description && (
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                )}

                <div className="grid gap-3 sm:grid-cols-3">
                    <DetailFact label="Categoría" value={item.category ?? "—"} />
                    <DetailFact label="Unidad" value={item.unit} />
                    <DetailFact
                        label={item.cost === null && item.estimatedCost !== null ? "Costo estimado" : "Costo"}
                        value={item.effectiveCost !== null ? formatCurrency(item.effectiveCost) : "—"}
                    />
                    <DetailFact
                        label="Precio de venta"
                        value={item.salePrice !== null ? formatCurrency(item.salePrice) : "—"}
                    />
                    <DetailFact
                        label="Margen"
                        value={marginLabel}
                        highlight={item.marginAmount !== null && item.marginAmount < 0 ? "bad" : undefined}
                    />
                    <DetailFact label="Stock total" value={stockLabel} />
                </div>

                {item.trackStock && (
                    <>
                        <Separator />

                        <section className="space-y-2">
                            <h3 className="text-sm font-medium">Stock por sucursal</h3>

                            {item.stocks.length > 0 ? (
                                <div className="space-y-2">
                                    {item.stocks.map((stock) => (
                                        <div
                                            key={stock.branchId}
                                            className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-muted/50 px-3 py-2 text-sm"
                                        >
                                            <span>{stock.branchName}</span>
                                            <span className="font-medium">
                                                {formatQuantity(stock.quantity)} {item.unit}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">
                                    Sin stock registrado en las sucursales.
                                </p>
                            )}
                        </section>
                    </>
                )}

                {item.kind === "product" && (
                    <>
                        <Separator />

                        <section className="space-y-3">
                            <div>
                                <h3 className="text-sm font-medium">Receta</h3>
                                <p className="text-sm text-muted-foreground">
                                    Insumos que consume cada unidad.
                                </p>
                            </div>

                            {item.recipes.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="text-left text-xs text-muted-foreground">
                                                <th className="pb-2 font-medium">Insumo</th>
                                                <th className="pb-2 font-medium">Por unidad</th>
                                                <th className="pb-2 font-medium">Stock</th>
                                                <th className="pb-2 text-right font-medium">Alcanza para</th>
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {item.recipes.map((recipe) => (
                                                <tr key={recipe.supplyItemId} className="border-t border-border/60">
                                                    <td className="py-2 pr-3">{recipe.supplyName}</td>
                                                    <td className="py-2 pr-3">
                                                        {formatRecipeQuantity(recipe.quantityPerUnit)} {recipe.supplyUnit}
                                                    </td>
                                                    <td className="py-2 pr-3">
                                                        {recipe.supplyTrackStock
                                                            ? `${formatQuantity(recipe.supplyStockTotal)} ${recipe.supplyUnit}`
                                                            : "Por encargo"}
                                                    </td>
                                                    <td className="py-2 text-right">
                                                        {recipe.supplyTrackStock && recipe.quantityPerUnit > 0
                                                            ? formatQuantity(Math.floor(recipe.supplyStockTotal / recipe.quantityPerUnit))
                                                            : "—"}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">
                                    Sin receta registrada.
                                </p>
                            )}

                            <div className="grid gap-3 sm:grid-cols-2">
                                <DetailFact
                                    label="Costo estimado por unidad"
                                    value={item.estimatedCost !== null ? formatCurrency(item.estimatedCost) : "—"}
                                />
                                <DetailFact label="Capacidad estimada" value={capacityLabel} />
                            </div>
                        </section>
                    </>
                )}

                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                        Cerrar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function DetailFact({ label, value, highlight }: DetailFactProps) {
    return (
        <div className="rounded-2xl border border-border bg-muted/50 px-3 py-2">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className={highlight === "bad" ? "text-sm font-medium text-red-600" : "text-sm font-medium"}>
                {value}
            </p>
        </div>
    );
}
