import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createSupabaseServerClient } from "~/server/supabaseServer";
import { db } from "~/server/db";
import { organizations, users } from "~/server/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { 
  LayoutDashboard, 
  FileText, 
  Database, 
  Settings, 
  LogOut,
  Building2,
  User
} from "lucide-react";
import LogoutButton from "~/components/LogoutButton"; // Assuming this handles the client side logout

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data?.user) {
    redirect("/");
  }

  const cookieStore = await cookies();
  const activeSpaceCookie = cookieStore.get("active_space");

  if (!activeSpaceCookie) {
    redirect("/select-space");
  }

  let activeSpace;
  try {
    activeSpace = JSON.parse(activeSpaceCookie.value);
  } catch (e) {
    redirect("/select-space");
  }

  // Fetch details about the space
  let spaceName = "Espaço Pessoal";
  let spaceIcon = <User className="h-5 w-5" />;
  let isPersonal = true;

  if (activeSpace.kind === "organization") {
    const org = await db.query.organizations.findFirst({
        where: eq(organizations.id, activeSpace.id)
    });
    if (org) {
        spaceName = org.name;
        isPersonal = false;
        spaceIcon = <Building2 className="h-5 w-5" />;
    } else {
        // Org cookie exists but org not found? strange.
        redirect("/select-space");
    }
  } else if (activeSpace.kind === "user") {
      // It's personal space
      const user = await db.query.users.findFirst({
          where: eq(users.id, activeSpace.id)
      });
      if (user) {
          spaceName = user.name || "Meu Espaço"; 
      }
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-10 w-64 border-r border-gray-200 bg-white">
        <div className="flex h-16 items-center border-b border-gray-100 px-6">
            <Link href="/select-space" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <div className="text-blue-600">
                    {spaceIcon}
                </div>
                <span className="font-semibold text-gray-900 truncate" title={spaceName}>
                    {spaceName}
                </span>
            </Link>
        </div>

        <nav className="flex-1 space-y-1 p-4">
            <Link href="/dashboard" className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900">
                <LayoutDashboard className="h-5 w-5 text-gray-400" />
                Início
            </Link>
            
            <Link href="/dashboard/evaluations" className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900">
                <FileText className="h-5 w-5 text-gray-400" />
                Avaliações
            </Link>
            
            <Link href="/dashboard/items" className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900">
                <Database className="h-5 w-5 text-gray-400" />
                Banco de Itens
            </Link>

            {!isPersonal && (
                <Link href="/dashboard/settings" className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900">
                    <Settings className="h-5 w-5 text-gray-400" />
                    Configurações
                </Link>
            )}
        </nav>

        <div className="border-t border-gray-100 p-4">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600">
                        {data.user.email?.charAt(0).toUpperCase()}
                    </div>
                    <div className="text-xs">
                        <p className="font-medium text-gray-700 truncate max-w-[100px]">{data.user.email}</p>
                    </div>
                </div>
                <LogoutButton />
             </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="pl-64 flex-1">
        <div className="container mx-auto p-8">
            {children}
        </div>
      </main>
    </div>
  );
}
