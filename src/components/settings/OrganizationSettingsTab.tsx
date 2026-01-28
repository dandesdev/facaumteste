"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { Button } from "~/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Separator } from "~/components/ui/separator";
import { toast } from "sonner";
import { api } from "~/trpc/react";
import { useEffect } from "react";

const orgSettingsSchema = z.object({
  name: z.string().min(2, { message: "O nome deve ter pelo menos 2 caracteres." }),
  slug: z.string().min(2, { message: "O slug deve ter pelo menos 2 caracteres." }),
});

type OrgSettingsValues = z.infer<typeof orgSettingsSchema>;

interface OrganizationSettingsTabProps {
  organizationId: string;
}

export function OrganizationSettingsTab({ organizationId }: OrganizationSettingsTabProps) {
  const utils = api.useUtils();
  const router = useRouter();

  const { data: org, isLoading, error } = api.organization.getById.useQuery(
    { id: organizationId ?? "" },
    { 
      enabled: !!organizationId && organizationId.length > 0,
      retry: false 
    }
  );

  const updateMutation = api.organization.update.useMutation({
    onSuccess: () => {
      toast.success("Configurações atualizadas com sucesso!");
      utils.organization.getById.invalidate({ id: organizationId });
      // Refresh server components (like DashboardLayout) to update the sidebar
      router.refresh();
    },
    onError: (error) => {
      toast.error("Erro ao atualizar: " + error.message);
    },
  });

  // ALL hooks must be called before any early returns
  const form = useForm<OrgSettingsValues>({
    resolver: zodResolver(orgSettingsSchema),
    defaultValues: {
      name: "",
      slug: "",
    },
  });

  useEffect(() => {
    if (org) {
      form.reset({
        name: org.name,
        slug: org.slug,
      });
    }
  }, [org, form]);

  function onSubmit(data: OrgSettingsValues) {
    if (!org) return;
    
    updateMutation.mutate({
      id: org.id,
      name: data.name,
      slug: data.slug,
    });
  }

  // Early returns AFTER all hooks
  if (error) {
    console.error("OrganizationSettingsTab Error:", error);
    return (
      <div className="p-4 border border-destructive/50 rounded-md bg-destructive/10 text-destructive">
        <p className="font-semibold">Erro ao carregar organização</p>
        <p className="text-sm">{error.message || "Erro desconhecido"}</p>
        <p className="text-xs text-muted-foreground mt-2">ID: {organizationId}</p>
      </div>
    );
  }

  if (isLoading) {
    return <div className="animate-pulse">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Organização</h3>
        <p className="text-sm text-muted-foreground">
          Atualize os detalhes e configurações da sua organização.
        </p>
      </div>
      <Separator />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome da Organização</FormLabel>
                <FormControl>
                  <Input placeholder="Minha Escola" {...field} />
                </FormControl>
                <FormDescription>
                  Este é o nome visível da sua organização.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="slug"
            render={({ field }) => (
              <FormItem>
                <FormLabel>URL (Slug)</FormLabel>
                <FormControl>
                  <Input placeholder="minha-escola" {...field} />
                </FormControl>
                <FormDescription>
                  Identificador único usado na URL do seu espaço.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? "Salvando..." : "Atualizar configurações"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
