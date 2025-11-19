import { db } from "~/server/db";
import {
  organizations,
  organizationMembers,
  orgGroups,
  orgGroupMembers,
} from "~/server/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "~/server/supabaseServer";
import { SelectSpaceButton } from "~/components/SelectSpaceButton";

export default async function SelectSpacePage() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data?.user) redirect("/");

  const user = data.user;

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
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <div className="flex w-full max-w-md flex-col gap-6 rounded-lg border bg-white p-8 shadow-sm">
        <h1 className="text-center text-2xl font-bold text-gray-800">
          Espaços
        </h1>

        {/* 1. Espaço Pessoal */}
        <div className="flex flex-col gap-2">
          <SelectSpaceButton 
            kind="user" 
            id={user.id} 
            label="Pessoal" 
          />
        </div>

        {/* 2. Organizações */}
        {orgs.length > 0 && (
          <div className="flex flex-col gap-2">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
              Organizações
            </h2>
            {orgs.map((org) => (
              <SelectSpaceButton
                key={org.id}
                kind="organization"
                id={org.id}
                label={org.name}
              />
            ))}
          </div>
        )}

        {/* 3. Grupos */}
        {groups.length > 0 && (
          <div className="flex flex-col gap-2">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
              Grupos
            </h2>
            {groups.map((group) => (
              <SelectSpaceButton
                key={group.id}
                kind="group"
                id={group.id}
                label={group.name}
              />
            ))}
          </div>
        )}
        
        {orgs.length === 0 && groups.length === 0 && (
           <p className="text-center text-sm text-gray-400">Você ainda não participa de nenhuma organização.</p>
        )}
      </div>
    </main>
  );
}