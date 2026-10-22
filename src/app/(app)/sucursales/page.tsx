import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { getMyMembership } from "@/lib/actions/members";
import { getOrganization, getOrganizationBranches } from "@/lib/actions/organizations";
import { BranchForm } from "./branch-form";
import { BranchRowMenu } from "./branch-row-menu";
import { MembershipBanner } from "./membership-banner";

const ROLE_LABELS: Record<string, string> = {
    owner: "Propietario",
    admin: "Administrador",
    manager: "Gerente",
    salesperson: "Vendedor",
};

function getRoleLabel(roleName: string | null) {
    if (!roleName) {
        return "Sin rol";
    }

    return ROLE_LABELS[roleName] ?? roleName;
}

export default async function TenantsPage() {
    const organizationResponse = await getOrganization();
    const organization = organizationResponse.data;
    const membership = organization ? null : await getMyMembership();

    if (!organization && membership?.organizationName) {
        return (
            <div className="space-y-6">
                <h1 className="text-2xl font-semibold tracking-tight">Nuestras sucursales</h1>
                <MembershipBanner
                    organizationName={membership.organizationName}
                    roleLabel={getRoleLabel(membership.roleName)}
                />
            </div>
        );
    }

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
    const organizationName = organization?.name ?? "tu organización";

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">
                        Nuestras sucursales
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Administra las sucursales de tu organización.
                    </p>
                </div>

                <BranchForm organizationName={organizationName} />
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
                                    <BranchRowMenu
                                        branchId={branch.id}
                                        branchName={branch.name ?? ""}
                                    />
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