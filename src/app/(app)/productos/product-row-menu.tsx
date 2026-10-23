"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { EllipsisVerticalIcon } from "@hugeicons/core-free-icons";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toggleItemStatus } from "@/lib/actions/inventory";
import type { BranchOption, InventoryItem, SupplyOption } from "@/lib/inventory";
import { ItemDetailDialog } from "./item-detail-dialog";
import { ProductFormDialog } from "./product-form-dialog";
import { StockAdjustDialog } from "./stock-adjust-dialog";

type ProductRowMenuProps = {
    item: InventoryItem;
    supplies: SupplyOption[];
    branches: BranchOption[];
};

export function ProductRowMenu({ item, supplies, branches }: ProductRowMenuProps) {
    const [detailOpen, setDetailOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [stockOpen, setStockOpen] = useState(false);
    const [statusOpen, setStatusOpen] = useState(false);
    const [statusPending, setStatusPending] = useState(false);
    const [statusError, setStatusError] = useState<string | null>(null);
    const canAdjustStock = item.trackStock && item.status && branches.length > 0;

    async function handleToggleStatus() {
        setStatusPending(true);
        setStatusError(null);

        const response = await toggleItemStatus(item.id);

        setStatusPending(false);

        if (response.error) {
            setStatusError(response.error);
            return;
        }

        setStatusOpen(false);
    }

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger
                    render={
                        <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            aria-label={`Acciones para ${item.name}`}
                        >
                            <HugeiconsIcon icon={EllipsisVerticalIcon} />
                        </Button>
                    }
                />

                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setDetailOpen(true)}>
                        Ver detalle
                    </DropdownMenuItem>

                    <DropdownMenuItem onClick={() => setEditOpen(true)}>
                        Editar
                    </DropdownMenuItem>

                    {canAdjustStock && (
                        <DropdownMenuItem onClick={() => setStockOpen(true)}>
                            Ajustar stock
                        </DropdownMenuItem>
                    )}

                    <DropdownMenuSeparator />

                    <DropdownMenuItem
                        variant={item.status ? "destructive" : "default"}
                        onClick={() => {
                            setStatusError(null);
                            setStatusOpen(true);
                        }}
                    >
                        {item.status ? "Desactivar" : "Activar"}
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <ItemDetailDialog
                item={item}
                open={detailOpen}
                onOpenChange={setDetailOpen}
            />

            <ProductFormDialog
                mode="edit"
                item={item}
                supplies={supplies}
                branches={branches}
                open={editOpen}
                onOpenChange={setEditOpen}
            />

            <StockAdjustDialog
                item={item}
                branches={branches}
                open={stockOpen}
                onOpenChange={setStockOpen}
            />

            <AlertDialog open={statusOpen} onOpenChange={setStatusOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {item.status ? "¿Desactivar ítem?" : "¿Activar ítem?"}
                        </AlertDialogTitle>

                        <AlertDialogDescription>
                            {item.status
                                ? `Vas a desactivar "${item.name}". Dejará de estar disponible para nuevas operaciones; su historial y stock se conservan.`
                                : `Vas a activar "${item.name}". Volverá a estar disponible para nuevas operaciones.`}
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    {statusError && (
                        <Alert className="border-none p-0">
                            <AlertDescription className="font-medium text-red-600">
                                {statusError}
                            </AlertDescription>
                        </Alert>
                    )}

                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={statusPending}>
                            Cancelar
                        </AlertDialogCancel>

                        <Button
                            type="button"
                            variant={item.status ? "destructive" : "default"}
                            disabled={statusPending}
                            onClick={handleToggleStatus}
                        >
                            {statusPending && <span className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent" />}
                            {statusPending ? "Guardando..." : item.status ? "Desactivar" : "Activar"}
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
