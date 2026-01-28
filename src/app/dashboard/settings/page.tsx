"use client";

import { useSpace } from "~/contexts/SpaceContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { OrganizationSettingsTab } from "~/components/settings/OrganizationSettingsTab";
import { PersonalSettingsTab } from "~/components/settings/PersonalSettingsTab";
import { AppearanceSettingsTab } from "~/components/settings/AppearanceSettingsTab";
import { api } from "~/trpc/react";

export default function SettingsPage() {
  const { activeSpace } = useSpace();
  
  // Determine which tabs to show based on space type
  const isOrg = activeSpace.kind === "organization";
  const isUser = activeSpace.kind === "user";
  const isGroup = activeSpace.kind === "group";

  // Get current user ID for user updates
  const { data: currentUser } = api.user.getMe.useQuery();

  // Determine default tab
  const defaultTab = isOrg ? "organization" : isUser ? "profile" : "appearance";

  return (
    <div className="space-y-6 p-10 pb-16">
      <div className="space-y-0.5">
        <h2 className="text-2xl font-bold tracking-tight">Configurações</h2>
        <p className="text-muted-foreground">
          Gerencie as configurações do seu espaço, aparência e notificações.
        </p>
      </div>

      <Tabs defaultValue={defaultTab} className="space-y-6">
        <TabsList>
          {isOrg && <TabsTrigger value="organization">Organização</TabsTrigger>}
          {isUser && <TabsTrigger value="profile">Perfil</TabsTrigger>}
          {isGroup && <TabsTrigger value="group">Turma</TabsTrigger>}
          <TabsTrigger value="appearance">Aparência</TabsTrigger>
        </TabsList>

        {isOrg && (
          <TabsContent value="organization" className="space-y-4">
            <OrganizationSettingsTab organizationId={activeSpace.id} />
          </TabsContent>
        )}

        {isUser && (
          <TabsContent value="profile" className="space-y-4">
            <PersonalSettingsTab userName={activeSpace.name} />
          </TabsContent>
        )}

        {isGroup && (
          <TabsContent value="group" className="space-y-4">
            <div className="p-4 border rounded-md bg-muted/20">
              <p className="text-sm text-muted-foreground">
                Configurações de turma (em breve)
              </p>
            </div>
          </TabsContent>
        )}

        <TabsContent value="appearance" className="space-y-4">
          <AppearanceSettingsTab
            organizationId={isOrg ? activeSpace.id : undefined}
            groupId={isGroup ? activeSpace.id : undefined}
            userId={isUser ? currentUser?.id : undefined}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
