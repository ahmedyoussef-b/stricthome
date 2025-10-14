// src/app/(dashboard)/layout.tsx
import { SidebarProvider, Sidebar, SidebarContent } from "@/components/ui/sidebar"
import { getServerSession } from "@/lib/auth-utils"
import { redirect } from "next/navigation"
import Menu from "@/components/Menu"
import Navbar from "@/components/Navbar"
import { Role } from "@/types"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession()

  if (!session?.user?.id) {
    redirect('/login')
  }
  
  const userRole = session.user.role as Role;
  
  return (
    <SidebarProvider>
      <div className="flex h-screen flex-col bg-background overflow-hidden w-full">
        {/* Sidebar en position fixed au-dessus du header */}
        <aside className="hidden md:block fixed top-0 left-0 h-screen w-64 bg-background overflow-y-auto border-r z-[60] pt-16">
          <Sidebar>
            <SidebarContent className="h-[calc(100vh-4rem)]">
              <Menu role={userRole} />
            </SidebarContent>
          </Sidebar>
        </aside>
  
        {/* Header avec z-index inférieur */}
        <header className=" ">
          <Navbar user={session.user} />
        </header>
        
        {/* Contenu principal décalé */}
        <div className="flex flex-1 overflow-hidden md:pl-64">
          <main className="flex-1 overflow-y-auto p-4 bg-muted/10">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}
