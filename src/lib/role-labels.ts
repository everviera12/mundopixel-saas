const ROLE_LABELS: Record<string, string> = {
    owner: "Propietario",
    admin: "Administrador",
    manager: "Gerente",
    salesperson: "Vendedor",
};

export function getRoleLabel(roleName: string | null) {
    if (!roleName) {
        return "Sin rol";
    }

    return ROLE_LABELS[roleName] ?? roleName;
}
