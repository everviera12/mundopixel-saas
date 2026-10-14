import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { getUserInfo } from "@/lib/actions/auth";

export default async function HomePage() {
    const response = await getUserInfo()
    const data = response.data

    return (
        <SidebarProvider>
            <AppSidebar data={data} />

            <div className="p-5 grif gap-6">
                {/* <SidebarTrigger /> */}
                <h1>{data?.user_metadata?.first_name}</h1>
            </div>
        </SidebarProvider>
    );
}