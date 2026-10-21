import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { HugeiconsIcon } from "@hugeicons/react";
import { EllipsisVerticalIcon } from "@hugeicons/core-free-icons";
import { getOrganizationBranches } from "@/lib/actions/organizations";

export default async function TenantsPage() {
    const response = await getOrganizationBranches();

    if (response.error) {
        return (
            <div className="p-6">
                <h1 className="text-xl font-semibold">Nuestras sucursales</h1>
                <p className="mt-4 text-sm text-destructive">{response.error}</p>
            </div>
        );
    }

    const branches = response.data ?? [];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold tracking-tight">
                    Nuestras sucursales
                </h1>
                <p className="text-sm text-muted-foreground">
                    Administra las sucursales de tu organización.
                </p>
            </div>

            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Fecha de creación</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                </TableHeader>

                <TableBody>
                    {branches.length > 0 ? (
                        branches.map((branch) => (
                            <TableRow key={branch.id}>
                                <TableCell className="font-medium">{branch.name ?? "Sin nombre"}</TableCell>
                                <TableCell>{branch.status ? "Activa" : "Inactiva"}</TableCell>
                                <TableCell>{new Date(branch.created_at).toLocaleDateString("es-MX")}</TableCell>
                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger
                                            render={
                                                <Button variant="ghost" size="icon" className="size-8">
                                                    <HugeiconsIcon icon={EllipsisVerticalIcon} />
                                                </Button>
                                            }
                                        />

                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem>
                                                Editar
                                            </DropdownMenuItem>

                                            <DropdownMenuSeparator />

                                            <DropdownMenuItem variant="destructive">
                                                Eliminar
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                No tienes sucursales registradas.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
}