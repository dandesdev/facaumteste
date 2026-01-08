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
import Link from "next/link";
import { Button } from "~/components/ui/button";
import { Plus } from "lucide-react";

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
      <div className="flex w-full max-w-md flex-col gap-8 rounded-xl border border-gray-100 bg-white p-8 shadow-xl">
        <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">
            Selecionar Espaço
            </h1>
            <p className="text-sm text-gray-500 mt-2">Escolha onde você quer trabalhar hoje</p>
        </div>

        <div className="space-y-6">
            {/* 1. Espaço Pessoal */}
            <div className="space-y-2">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest pl-1">
                Pessoal
            </h2>
            <SelectSpaceButton 
                kind="user" 
                id={user.id} 
                label="Meu Espaço Pessoal" 
            />
            </div>

            {/* 2. Organizações */}
            <div className="space-y-2">
                <h2 className="flex items-center justify-between text-xs font-semibold text-gray-400 uppercase tracking-widest pl-1">
                    <span>Organizações</span>
                    <Link href="/organization/new" className="text-blue-600 hover:text-blue-700">
                        <Plus className="h-4 w-4" />
                    </Link>
                </h2>
                
                {orgs.length > 0 ? (
                    orgs.map((org) => (
                    <SelectSpaceButton
                        key={org.id}
                        kind="organization"
                        id={org.id}
                        label={org.name}
                    />
                    ))
                ) : (
                    <div className="p-4 rounded-lg bg-gray-50 border border-dashed border-gray-200 text-center">
                        <p className="text-sm text-gray-500 mb-3">Nenhuma organização encontrada</p>
                        <Link href="/organization/new">
                            <Button variant="outline" size="sm" className="w-full">
                                <Plus className="mr-2 h-3 w-3" />
                                Criar Nova Organização
                            </Button>
                        </Link>
                    </div>
                )}
            </div>

            {/* 3. Grupos (Opcional, se houver) */}
            {groups.length > 0 && (
            <div className="space-y-2">
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest pl-1">
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
        </div>
      </div>
    </main>
  );
}