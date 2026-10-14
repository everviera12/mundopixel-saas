import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar";
import { User } from "@supabase/supabase-js";
import { Button } from "./ui/button";
import { signOut } from "@/lib/actions/auth";
import { useIsMobile } from "@/hooks/use-mobile";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "./ui/dropdown-menu";

type UserProps = {
    data: User | null | undefined;
};

export function AppSidebar({ data }: UserProps) {
    console.log("Users from app-sidebar", data);

    const user = data?.user_metadata;
    console.log("User Information:", user);

    return (
        <Sidebar className="h-svh">
            <SidebarHeader className="shrink-0 border-b border-sidebar-border px-4 py-4" />

            <SidebarContent className="min-h-0 flex-1 overflow-y-auto">
                <SidebarGroup />
                <SidebarGroup />
            </SidebarContent>

            <SidebarFooter>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <DropdownMenu>
                            <DropdownMenuTrigger>
                                <SidebarMenuButton>
                                    <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
                                        <span className="truncate font-medium">{user?.first_name ?? "Usuario"}</span>
                                        <span className="truncate text-xs">{data?.email ?? ""}</span>
                                    </div>
                                </SidebarMenuButton>
                            </DropdownMenuTrigger>

                            <DropdownMenuContent
                                // side={useIsMobile ? "bottom" : "right"}
                                side="right"
                                align="end"
                                sideOffset={8}
                            >
                                <DropdownMenuLabel className="p-0 font-normal">
                                    <div className="flex items-center gap-3 px-3 py-3">
                                        <div className="">
                                            {user?.first_name?.charAt(0)?.toUpperCase() ?? "U"}
                                        </div>

                                        <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
                                            <span className="truncate font-medium">{user?.first_name ?? "Usuario"}</span>
                                            <span className="truncate text-xs">{data?.email ?? ""}</span>
                                        </div>
                                    </div>
                                </DropdownMenuLabel>

                                <DropdownMenuSeparator className="bg-white/10" />

                                <DropdownMenuGroup>
                                    <DropdownMenuItem className="cursor-pointer rounded-md focus:bg-white/10 focus:text-white">
                                        Upgrade to Pro
                                    </DropdownMenuItem>
                                </DropdownMenuGroup>

                                <DropdownMenuSeparator className="bg-white/10" />

                                <DropdownMenuGroup>
                                    <DropdownMenuItem className="cursor-pointer rounded-md focus:bg-white/10 focus:text-white">
                                        Account
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="cursor-pointer rounded-md focus:bg-white/10 focus:text-white">
                                        Billing
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="cursor-pointer rounded-md focus:bg-white/10 focus:text-white">
                                        Notifications
                                    </DropdownMenuItem>
                                </DropdownMenuGroup>

                                <DropdownMenuSeparator className="bg-white/10" />

                                <DropdownMenuItem className="cursor-pointer rounded-md text-red-400 focus:bg-red-500/10 focus:text-red-400">
                                    Log out
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    );
}