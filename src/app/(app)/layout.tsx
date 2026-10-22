import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { getUserInfo } from "@/lib/actions/auth";
import { getOrganization } from "@/lib/actions/organizations";

// La zona autenticada lee la sesión y los datos en tiempo de request
// (connection() en createServer) y todavía no envuelve esos datos en Suspense.
// Optamos este segmento fuera de la validación de navegación instantánea:
// bloquear es el comportamiento esperado por ahora.
export const instant = false;

export default async function AppLayout({ children }: { children: React.ReactNode }) {
    const response = await getUserInfo();
    const responseOrganization = await getOrganization();

    const { data } = response;
    const { data: organization } = responseOrganization;

    console.log(data);


    return (
        <SidebarProvider>
            <AppSidebar data={data} organization={organization} />

            <div className="w-full px-5 py-8">
                <div className="rounded-4xl px-5 py-8">
                    {children}
                </div>

                {/* <SidebarTrigger /> */}
            </div>
        </SidebarProvider>
    );
}
