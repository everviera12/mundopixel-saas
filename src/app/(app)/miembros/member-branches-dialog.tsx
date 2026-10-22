"use client";

import { useEffect, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { getMemberBranchIds, setMemberBranches } from "@/lib/actions/members";

type BranchOption = {
    id: string;
    name: string;
};

type MemberBranchesDialogProps = {
    memberId: string;
    memberName: string;
    branches: BranchOption[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

export function MemberBranchesDialog({
    memberId,
    memberName,
    branches,
    open,
    onOpenChange,
}: MemberBranchesDialogProps) {
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!open) {
            return;
        }

        let cancelled = false;

        async function load() {
            setLoading(true);
            setError(null);

            const response = await getMemberBranchIds(memberId);

            if (cancelled) {
                return;
            }

            if (response.error) {
                setError(response.error);
                setSelectedIds([]);
            } else {
                setSelectedIds(response.data ?? []);
            }

            setLoading(false);
        }

        load();

        return () => {
            cancelled = true;
        };
    }, [open, memberId]);

    function handleCheckedChange(branchId: string, checked: boolean) {
        setSelectedIds((current) => {
            if (checked) {
                return current.includes(branchId) ? current : [...current, branchId];
            }

            return current.filter((id) => id !== branchId);
        });
    }

    async function handleSave() {
        setSaving(true);
        setError(null);

        const response = await setMemberBranches(memberId, selectedIds);

        if (response.error) {
            setError(response.error);
            setSaving(false);
            return;
        }

        setSaving(false);
        onOpenChange(false);
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Asignar sucursales</DialogTitle>
                    <DialogDescription>
                        Selecciona las sucursales a las que{" "}
                        <span className="font-medium text-foreground">{memberName}</span> tendrá acceso.
                    </DialogDescription>
                </DialogHeader>

                {loading ? (
                    <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
                        <span className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
                        Cargando sucursales...
                    </div>
                ) : branches.length > 0 ? (
                    <div className="space-y-2">
                        {branches.map((branch) => (
                            <label
                                key={branch.id}
                                className="flex cursor-pointer items-center gap-3 rounded-2xl border border-border px-3 py-2.5 text-sm"
                            >
                                <Checkbox
                                    checked={selectedIds.includes(branch.id)}
                                    onCheckedChange={(checked) => handleCheckedChange(branch.id, checked)}
                                    disabled={saving}
                                />
                                <span>{branch.name}</span>
                            </label>
                        ))}
                    </div>
                ) : (
                    <p className="py-4 text-sm text-muted-foreground">
                        No hay sucursales registradas en tu organización.
                    </p>
                )}

                {error && (
                    <Alert className="border-none p-0">
                        <AlertDescription className="font-medium text-red-600">{error}</AlertDescription>
                    </Alert>
                )}

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        disabled={saving}
                        onClick={() => onOpenChange(false)}
                    >
                        Cancelar
                    </Button>

                    <Button
                        type="button"
                        disabled={saving || loading || branches.length === 0}
                        onClick={handleSave}
                    >
                        {saving && <span className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent" />}
                        {saving ? "Guardando..." : "Guardar cambios"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
