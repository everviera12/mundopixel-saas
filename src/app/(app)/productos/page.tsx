import Link from "next/link";
import { redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { getInventoryCatalog } from "@/lib/actions/inventory";
import { getMyMembership } from "@/lib/actions/members";
import {
    KIND_LABELS,
    formatCurrency,
    formatPercent,
    formatQuantity,
    isInventoryStaff,
} from "@/lib/inventory";
import { cn } from "@/lib/utils";
import { ProductFormDialog } from "./product-form-dialog";
import { ProductRowMenu } from "./product-row-menu";

export default async function ProductsPage({ searchParams }: PageProps<"/productos">) {
    const membership = await getMyMembership();

    if (!membership || !isInventoryStaff(membership.roleName)) {
        redirect("/");
    }

    const response = await getInventoryCatalog();

    if (response.error || !response.data) {
        return (
            <div className="p-6">
                <h1 className="text-xl font-semibold">Catálogo</h1>
                <p className="mt-4 text-sm text-destructive">
                    {response.error ?? "No se pudo cargar el catálogo."}
                </p>
            </div>
        );
    }

    const { items, branches, organizationName } = response.data;
    const params = await searchParams;
    const requestedKind = params.kind === "product" || params.kind === "supply"
        ? params.kind
        : null;
    const filteredItems = requestedKind
        ? items.filter((item) => item.kind === requestedKind)
        : items;

    const supplies = items
        .filter((item) => item.kind === "supply")
        .map((item) => ({
            id: item.id,
            name: item.name,
            unit: item.unit,
            status: item.status,
        }));

    const filters: Array<{ label: string; kind: "product" | "supply" | null; count: number }> = [
        { label: "Todos", kind: null, count: items.length },
        {
            label: "Productos",
            kind: "product",
            count: items.filter((item) => item.kind === "product").length,
        },
        {
            label: "Insumos",
            kind: "supply",
            count: items.filter((item) => item.kind === "supply").length,
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">Catálogo</h1>
                    <p className="text-sm text-muted-foreground">
                        Administra los productos e insumos de {organizationName ?? "tu organización"}.
                    </p>
                </div>

                <ProductFormDialog mode="create" supplies={supplies} branches={branches} />
            </div>

            <nav className="flex flex-wrap items-center gap-2" aria-label="Filtrar por tipo de ítem">
                {filters.map((filter) => {
                    const isActive = requestedKind === filter.kind;

                    return (
                        <Link
                            key={filter.label}
                            href={filter.kind
                                ? { pathname: "/productos", query: { kind: filter.kind } }
                                : "/productos"}
                            aria-current={isActive ? "page" : undefined}
                            className={cn(
                                "rounded-4xl border px-3 py-1.5 text-sm font-medium transition-colors",
                                isActive
                                    ? "border-primary bg-primary text-primary-foreground"
                                    : "border-border bg-muted/50 text-muted-foreground hover:text-foreground",
                            )}
                        >
                            {filter.label}
                            <span className="ml-2 text-xs opacity-70">{filter.count}</span>
                        </Link>
                    );
                })}
            </nav>

            {branches.length === 0 && (
                <p className="text-sm text-muted-foreground">
                    No se encontraron sucursales para tu usuario, así que el stock no se puede registrar desde aquí.{" "}
                    {membership.roleName === "owner" || membership.roleName === "admin"
                        ? "Crea una sucursal para empezar."
                        : "Pide a un propietario o administrador que cree una sucursal."}
                </p>
            )}

            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Ítem</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Unidad</TableHead>
                        <TableHead>Costo</TableHead>
                        <TableHead>Precio</TableHead>
                        <TableHead>Margen</TableHead>
                        <TableHead>Stock</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                </TableHeader>

                <TableBody>
                    {filteredItems.length > 0 ? (
                        filteredItems.map((item) => {
                            const isLowStock = item.trackStock
                                && item.lowStockThreshold !== null
                                && item.stockTotal <= item.lowStockThreshold;

                            return (
                                <TableRow key={item.id}>
                                    <TableCell>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="font-medium">{item.name}</span>
                                            {!item.status && (
                                                <Badge variant="outline">Inactivo</Badge>
                                            )}
                                        </div>

                                        <div className="text-xs text-muted-foreground">
                                            {[item.sku, item.category].filter(Boolean).join(" · ") || "Sin categoría"}
                                        </div>
                                    </TableCell>

                                    <TableCell>
                                        <Badge variant={item.kind === "product" ? "default" : "outline"}>
                                            {KIND_LABELS[item.kind]}
                                        </Badge>
                                    </TableCell>

                                    <TableCell>{item.unit}</TableCell>

                                    <TableCell>
                                        <span
                                            title={item.cost === null && item.estimatedCost !== null
                                                ? "Costo estimado con la receta"
                                                : undefined}
                                        >
                                            {item.effectiveCost !== null ? formatCurrency(item.effectiveCost) : "—"}
                                        </span>

                                        {item.cost === null && item.estimatedCost !== null && (
                                            <span className="block text-xs text-muted-foreground">Receta</span>
                                        )}
                                    </TableCell>

                                    <TableCell>
                                        {item.kind === "product" && item.salePrice !== null
                                            ? formatCurrency(item.salePrice)
                                            : "—"}
                                    </TableCell>

                                    <TableCell className={item.marginAmount !== null && item.marginAmount < 0 ? "text-red-600" : undefined}>
                                        {item.kind === "product" && item.marginPercent !== null && item.marginAmount !== null ? (
                                            <>
                                                <span>{formatPercent(item.marginPercent)}</span>
                                                <span className="block text-xs text-muted-foreground">
                                                    {formatCurrency(item.marginAmount)}
                                                </span>
                                            </>
                                        ) : "—"}
                                    </TableCell>

                                    <TableCell className={isLowStock ? "text-red-600" : undefined}>
                                        {item.trackStock
                                            ? `${formatQuantity(item.stockTotal)} ${item.unit}`
                                            : "Por encargo"}

                                        {isLowStock && (
                                            <span className="block text-xs">Stock bajo</span>
                                        )}
                                    </TableCell>

                                    <TableCell className="text-right">
                                        <ProductRowMenu
                                            item={item}
                                            supplies={supplies}
                                            branches={branches}
                                        />
                                    </TableCell>
                                </TableRow>
                            );
                        })
                    ) : (
                        <TableRow>
                            <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                                {items.length === 0
                                    ? "Todavía no hay productos ni insumos. Crea el primero con \"Nuevo ítem\"."
                                    : "No hay ítems de este tipo."}
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
