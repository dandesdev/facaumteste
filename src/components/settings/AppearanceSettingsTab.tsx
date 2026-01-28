"use client";

import { useState } from "react";
import { useSpace } from "~/contexts/SpaceContext";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";
import { Label } from "~/components/ui/label";
import { Slider } from "~/components/ui/slider";
import { toast } from "sonner";
import { RefreshCcw, Save } from "lucide-react";
import { ColorInput } from "~/components/theme/ColorInput";
import { ThemePreview } from "~/components/theme/ThemePreview";

// Default values - Blue-based primary per documentation
const DEFAULTS = {
  primary: "59 130 246",    // Blue-500 - Main brand identity
  accent: "245 158 11",     // Amber-500 - CTAs and key interactions
  secondary: "139 92 246",  // Violet-500 - Supporting color
  radius: 0.625,
};

interface AppearanceSettingsTabProps {
  organizationId?: string;
  groupId?: string;
  userId?: string;
}

export function AppearanceSettingsTab({ organizationId, groupId, userId }: AppearanceSettingsTabProps) {
  const { activeSpace } = useSpace();
  const theme = activeSpace.theme;

  // Client-side state - no server dependency for preview
  const [primary, setPrimary] = useState(theme?.primary ?? DEFAULTS.primary);
  const [accent, setAccent] = useState(theme?.accent ?? DEFAULTS.accent);
  const [secondary, setSecondary] = useState(theme?.secondary ?? DEFAULTS.secondary);
  const [radius, setRadius] = useState(theme?.radius ?? DEFAULTS.radius);
  const [isSaving, setIsSaving] = useState(false);

  // Mutations
  const updateOrg = api.organization.update.useMutation();
  const updateGroup = api.organization.updateGroup.useMutation();
  const updateUser = api.user.update.useMutation();

  const handleSave = async () => {
    setIsSaving(true);
    
    const newSettings = {
      theme: { primary, accent, secondary, radius },
    };

    try {
      if (activeSpace.kind === "organization" && organizationId) {
        await updateOrg.mutateAsync({ id: organizationId, settings: newSettings });
      } else if (activeSpace.kind === "group" && groupId) {
        await updateGroup.mutateAsync({ id: groupId, settings: newSettings });
      } else if (activeSpace.kind === "user" && userId) {
        await updateUser.mutateAsync({ settings: newSettings });
      }
      
      toast.success("Tema salvo com sucesso!");
      // Reload to apply theme globally via ThemeProvider
      window.location.reload();
    } catch (error) {
      toast.error("Erro ao salvar tema");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setPrimary(DEFAULTS.primary);
    setAccent(DEFAULTS.accent);
    setSecondary(DEFAULTS.secondary);
    setRadius(DEFAULTS.radius);
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
      
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Color Pickers Column */}
        <div className="space-y-6">
          <ColorInput label="Cor Primária (navegação, links)" value={primary} onChange={setPrimary} />
          <ColorInput label="Cor Accent (CTAs, ações principais)" value={accent} onChange={setAccent} />
          <ColorInput label="Cor Secundária (categorias, destaques)" value={secondary} onChange={setSecondary} />
          
          <div className="space-y-3">
            <Label className="text-sm font-medium">Border Radius ({radius.toFixed(2)} rem)</Label>
            <Slider
              value={[radius]}
              onValueChange={([v]: number[]) => setRadius(v ?? DEFAULTS.radius)}
              min={0}
              max={1.5}
              step={0.125}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Retângular</span>
              <span>Arredondado</span>
            </div>
          </div>
        </div>

        {/* Preview Column */}
        <div className="space-y-4">
          <Label className="text-sm font-medium">Pré-visualização</Label>
          <ThemePreview
            primary={primary}
            accent={accent}
            secondary={secondary}
            radius={radius}
          />
        </div>
      </div>

      <div className="flex items-center gap-4 pt-4">
        <Button onClick={handleSave} disabled={isSaving}>
          <Save className="mr-2 h-4 w-4" />
          {isSaving ? "Salvando..." : "Salvar Alterações"}
        </Button>
        <Button variant="ghost" onClick={handleReset} title="Restaurar padrão">
          <RefreshCcw className="mr-2 h-4 w-4" />
          Restaurar Padrão
        </Button>
      </div>
    </div>
  );
}
