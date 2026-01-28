import { db } from "~/server/db";
import {
  organizations,
  organizationMembers,
  orgGroups,
  orgGroupMembers,
  users,
} from "~/server/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "~/server/supabaseServer";
import LogoutButton from "~/components/LogoutButton";
import { SpaceList } from "~/components/SpaceList";


export default async function SelectSpacePage() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data?.user) redirect("/");

  const user = data.user;

  // Fetch user details from our DB
  const dbUser = await db.query.users.findFirst({
    where: eq(users.id, user.id),
  });

  const userName = dbUser?.name ?? user.email?.split("@")[0] ?? "Usuário";
  const userEmail = user.email ?? "";

  // Busca organizações
  const orgs = await db
    .select({
      id: organizations.id,
      name: organizations.name,
      slug: organizations.slug,
      role: organizationMembers.role,
    })
    .from(organizationMembers)
    .innerJoin(
      organizations,
      eq(organizations.id, organizationMembers.organizationId),
    )
    .where(eq(organizationMembers.userId, user.id));

  // Busca grupos
  const groups = await db
    .select({
      id: orgGroups.id,
      name: orgGroups.name,
      organizationId: orgGroups.organizationId,
    })
    .from(orgGroupMembers)
    .innerJoin(orgGroups, eq(orgGroups.id, orgGroupMembers.groupId))
    .where(eq(orgGroupMembers.userId, user.id));

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      {/* Top navbar with user info */}
      <nav className="flex-none border-b bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-900">
                Faça Um Teste
              </span>
            </div>
            <div className="flex items-center gap-4">
              <div className="group relative">
                <span className="text-sm text-gray-700 cursor-default">
                  <span className="group-hover:hidden">{userName}</span>
                  <span className="hidden group-hover:inline text-gray-500">
                    {userEmail}
                  </span>
                </span>
              </div>
              <LogoutButton variant="ghost" />
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      {/* Main content */}
      <main className="flex-1 flex overflow-hidden items-center justify-center p-4">
        <div className="flex w-full max-w-md flex-col gap-6 rounded-xl border border-gray-100 bg-white p-8 shadow-xl">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Selecionar Espaço
            </h1>
            <p className="text-sm text-gray-500 mt-2">
              Escolha onde você quer trabalhar hoje
            </p>
          </div>

          <SpaceList
            userId={user.id}
            organizations={orgs}
            groups={groups}
          />
        </div>
      </main>
    </div>
  );
}