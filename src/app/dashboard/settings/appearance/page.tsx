"use client";

import { useState } from "react";
import { useSpace } from "~/contexts/SpaceContext";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";
import { toast } from "sonner";
import { HexColorPicker } from "react-colorful";
import { RefreshCcw } from "lucide-react";
import { hexToRgb, rgbToHex, getContrastingTextColor } from "~/lib/colors";

export default function AppearancePage() {
  const { activeSpace } = useSpace();
  const theme = activeSpace.theme;
  const utils = api.useUtils();

  // State for the color picker
  const [primaryColor, setPrimaryColor] = useState(
    theme?.primary ? rgbToHex(theme.primary) : "#171717"
  );

  // Mutations
  const updateOrg = api.organization.update.useMutation({
    onSuccess: () => {
      toast.success("Tema atualizado com sucesso!");
      utils.organization.list.invalidate(); // Refresh layout
      window.location.reload(); // Force reload to apply theme reliably if space context doesn't auto-refresh deep enough
    },
    onError: (err) => toast.error("Erro ao salvar tema: " + err.message),
  });

  const updateGroup = api.organization.updateGroup.useMutation({ // We might need a separate router or check
    onSuccess: () => {
      toast.success("Tema de turma atualizado!");
      window.location.reload();
    },
    onError: (err) => toast.error("Erro ao salvar: " + err.message),
  });
  
  // Create /Stub the user update mutation as it doesn't exist yet
  // const updateUser = api.user.update.useMutation(...) 

  const handleSave = () => {
    const rgb = hexToRgb(primaryColor);
    if (!rgb) return;

    // Use current settings structure
    const newSettings = {
      theme: {
        ...theme,
        primary: rgb,
      },
    };

    if (activeSpace.kind === "organization") {
      updateOrg.mutate({
        id: activeSpace.id,
        settings: newSettings,
      });
    } else if (activeSpace.kind === "group") {
         updateGroup.mutate({
            id: activeSpace.id,
            settings: newSettings
         });
    } else if (activeSpace.kind === "user") {
        toast.info("Tema pessoal em breve. (Falta API user.update)");
    }
  };

  const handleReset = () => {
    setPrimaryColor("#171717");
     // Logic to clear theme from DB would go here
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Aparência</h3>
        <p className="text-sm text-muted-foreground">
          Personalize as cores e o tema do seu espaço.
        </p>
      </div>
      <Separator />
      
      <div className="grid gap-8 md:grid-cols-2">
        <div className="space-y-4">
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            Cor Primária
          </label>
          <div className="p-4 border rounded-lg w-fit">
            <HexColorPicker color={primaryColor} onChange={setPrimaryColor} />
          </div>
          <div className="flex items-center gap-2">
             <div className="w-8 h-8 rounded border" style={{ backgroundColor: primaryColor }} />
             <span className="text-sm font-mono text-muted-foreground">{primaryColor}</span>
          </div>
        </div>

        <div className="space-y-4">
           <label className="text-sm font-medium">Pré-visualização</label>
           <div className="border rounded-xl p-6 space-y-4" style={{ 
               // Local preview override
               // @ts-expect-error custom prop
               "--primary": hexToRgb(primaryColor) ?? "0 0 0",
               "--primary-foreground": getContrastingTextColor(hexToRgb(primaryColor)),
           }}>
              <div className="flex gap-2">
                 <Button>Botão Primário</Button>
                 <Button variant="secondary">Secundário</Button>
                 <Button variant="outline">Outline</Button>
              </div>
              <div className="p-4 bg-primary text-primary-foreground rounded-md">
                 Bloco com cor primária
                 <br/><span className="text-xs opacity-75">Texto auto-ajustado: {getContrastingTextColor(hexToRgb(primaryColor))}</span>
              </div>
           </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Button onClick={handleSave}>Salvar Alterações</Button>
        <Button variant="ghost" onClick={handleReset} size="icon" title="Restaurar padrão">
            <RefreshCcw className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
