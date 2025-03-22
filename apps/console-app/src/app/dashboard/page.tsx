import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { validateAuthToken } from "@/lib/auth"

export default async function Page() {
  // Validate auth token - this will redirect to login if the token is invalid
  const user = await validateAuthToken();
  
  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="container p-6">
          <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
          <p>Welcome, {user?.email}!</p>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
