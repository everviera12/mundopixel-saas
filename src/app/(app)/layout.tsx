import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { getUserInfo } from "@/lib/actions/auth";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
    const response = await getUserInfo();
    const data = response.data;

    return (
        <SidebarProvider>
            <AppSidebar data={data} />

            <div className="w-full px-5 py-8">
                <div className="rounded-4xl px-5 py-8">
                    {children}
                </div>
                
                {/* <SidebarTrigger /> */}
            </div>
        </SidebarProvider>
    );
}
