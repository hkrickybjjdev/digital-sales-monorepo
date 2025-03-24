import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { validateAuthToken } from "@/lib/auth"

export default async function Page() {
  // Validate auth token - this will redirect to login if the token is invalid
  const user = await validateAuthToken();
  
  // If there's no user, this page shouldn't render, but TypeScript doesn't know that
  if (!user) {
    // This should never happen as validateAuthToken should redirect if no valid user
    throw new Error("Authentication required");
  }
  
  // Get display name (use name if available, or email username)
  const displayName = user.name || user.email.split('@')[0];
  
  // Create user object for sidebar
  const sidebarUser = {
    name: displayName,
    email: user.email,
    // If user has an avatar use it, otherwise pass empty string
    // The NavUser component will show the AvatarFallback with the first letter
    avatar: user.avatar || "",
    // Pass first letter of name for avatar fallback
    initials: displayName.charAt(0).toUpperCase(),
  };
  
  return (
    <SidebarProvider>
      <AppSidebar variant="inset" user={sidebarUser} />
      <SidebarInset>
        <SiteHeader />
        <div className="container p-6">
          <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
          <p>Welcome, {displayName}!</p>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
