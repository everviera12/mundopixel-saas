"use client";

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from "@/components/ui/sidebar";
import { User } from "@supabase/supabase-js";
import { signOut } from "@/lib/actions/auth";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import Link from "next/link";
import { Organization } from "@/lib/actions/organizations";
import { isInventoryStaff } from "@/lib/inventory";

type UserProps = {
    data: User | null | undefined;
    organization: Organization | null | undefined;
    roleName: string | null;
};

export function AppSidebar({ data, organization, roleName }: UserProps) {
    const { isMobile } = useSidebar();

    const user = data?.user_metadata;
    const displayName = user?.first_name ?? "Usuario";
    const initial = displayName.charAt(0).toUpperCase();

    console.log(organization?.name);


    return (
        <Sidebar>
            <SidebarHeader className="shrink-0 border-b border-sidebar-border px-4 py-4">
                <div className="flex min-w-0 items-center gap-3">
                    <span className="truncate text-sm font-bold">
                        {organization?.name ?? "Mi organización"}
                    </span>
                </div>
            </SidebarHeader>

            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Sucursales</SidebarGroupLabel>
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton render={<Link href="/sucursales" className="w-full" />}>
                                Agregar sucursal
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarGroup>

                {isInventoryStaff(roleName) && (
                    <SidebarGroup>
                        <SidebarGroupLabel>Inventario</SidebarGroupLabel>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton render={<Link href="/productos" className="w-full" />}>
                                    Catálogo
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroup>
                )}

                <SidebarGroup>
                    <SidebarGroupLabel>Equipo</SidebarGroupLabel>
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton render={<Link href="/miembros" className="w-full" />}>
                                Miembros
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <DropdownMenu>
                            <DropdownMenuTrigger
                                render={
                                    <SidebarMenuButton
                                        size="lg"
                                        className="data-popup-open:bg-sidebar-accent data-popup-open:text-sidebar-accent-foreground"
                                    />
                                }
                            >
                                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-sm font-medium text-muted-foreground">
                                    {initial}
                                </div>
                                <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-medium">{displayName}</span>
                                    <span className="truncate text-xs text-muted-foreground">
                                        {data?.email ?? ""}
                                    </span>
                                </div>
                            </DropdownMenuTrigger>

                            <DropdownMenuContent
                                className="min-w-56"
                                side={isMobile ? "bottom" : "right"}
                                align="end"
                                sideOffset={8}
                            >
                                <DropdownMenuGroup>
                                    <DropdownMenuLabel className="p-0">
                                        <div className="flex items-center gap-2.5 px-3 py-2 text-left text-sm">
                                            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground">
                                                {initial}
                                            </div>
                                            <div className="grid min-w-0 flex-1 leading-tight">
                                                <span className="truncate font-medium text-foreground">{displayName}</span>
                                                <span className="truncate text-xs text-muted-foreground">
                                                    {data?.email ?? ""}
                                                </span>
                                            </div>
                                        </div>
                                    </DropdownMenuLabel>
                                </DropdownMenuGroup>

                                <DropdownMenuSeparator />

                                {/* <DropdownMenuGroup>
                                    <DropdownMenuItem>
                                        Upgrade to Pro
                                    </DropdownMenuItem>
                                </DropdownMenuGroup> */}

                                <DropdownMenuGroup>
                                    <DropdownMenuItem
                                        render={
                                            <Link href="/profile" className="w-full" />
                                        }
                                    >
                                        Mi cuenta
                                    </DropdownMenuItem>
                                    {/* <DropdownMenuItem>Billing</DropdownMenuItem>
                                    <DropdownMenuItem>Notifications</DropdownMenuItem> */}
                                </DropdownMenuGroup>

                                <DropdownMenuSeparator />

                                <form action={signOut}>
                                    <DropdownMenuItem
                                        variant="destructive"
                                        nativeButton
                                        render={<button type="submit" className="w-full" />}
                                    >
                                        Cerrar sesión
                                    </DropdownMenuItem>
                                </form>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    );
}
