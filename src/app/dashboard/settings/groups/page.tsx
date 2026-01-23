"use client";

import Link from "next/link";
import { Plus, Users } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Separator } from "~/components/ui/separator";
import { api } from "~/trpc/react";
import { useSpace } from "~/contexts/SpaceContext";
import { Skeleton } from "~/components/ui/skeleton";

export default function GroupsSettingsPage() {
  const { activeSpace } = useSpace();
  
  // Only valid for organizations
  if (activeSpace.kind !== "organization") {
    return <div>Esta página é apenas para organizações.</div>;
  }

  const { data: groups, isLoading } = api.organization.listGroups.useQuery(
    { organizationId: activeSpace.id },
    { enabled: !!activeSpace.id }
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Turmas e Grupos</h3>
          <p className="text-sm text-muted-foreground">
            Gerencie as turmas pertencentes a esta organização.
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nova Turma
        </Button>
      </div>
      <Separator />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
             <Skeleton key={i} className="h-[120px] w-full rounded-xl" />
          ))
        ) : groups?.length === 0 ? (
          <div className="col-span-full py-10 text-center text-muted-foreground">
            Nenhuma turma encontrada. Crie uma para começar via Dashboard &gt; Configurações &gt; Turmas.
            <br />(Ops, o botão Nova Turma ainda não está funcional)
          </div>
        ) : (
          groups?.map((group) => (
            <Link key={group.id} href={`/dashboard/settings/groups/${group.id}`}>
              <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    {group.name}
                  </CardTitle>
                  <CardDescription className="line-clamp-2">
                    {group.description || "Sem descrição"}
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
