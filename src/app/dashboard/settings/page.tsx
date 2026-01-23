"use client";

import { redirect } from "next/navigation";
import { useSpace } from "~/contexts/SpaceContext";

export default function SettingsPage() {
  const { activeSpace } = useSpace();

  // Redirect to the most relevant settings page based on context
  if (activeSpace.kind === "organization") {
    redirect("/dashboard/settings/organization");
  } else if (activeSpace.kind === "group") {
    // redirect("/dashboard/settings/group"); // TODO: Implement
    return <div>Configurações de turma (em breve)</div>;
  } else if (activeSpace.kind === "user") {
    redirect("/dashboard/settings/personal");
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Geral</h3>
        <p className="text-sm text-muted-foreground">
          Configurações gerais do espaço.
        </p>
      </div>
      <div className="p-4 border rounded-md bg-muted/20">
        <p className="text-sm">Selecione uma categoria no menu lateral.</p>
      </div>
    </div>
  );
}
