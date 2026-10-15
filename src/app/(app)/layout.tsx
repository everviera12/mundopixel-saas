import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { getUserInfo } from "@/lib/actions/auth";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
    const response = await getUserInfo();
    const data = response.data;

    return (
        <SidebarProvider>
            <AppSidebar data={data} />

            <div className="p-5 grid gap-6">
                {/* <SidebarTrigger /> */}
                {children}
            </div>
        </SidebarProvider>
    );
}
