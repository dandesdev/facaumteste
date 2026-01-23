"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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
import { useSpace } from "~/contexts/SpaceContext";
import { useEffect } from "react";

const orgSettingsSchema = z.object({
  name: z.string().min(2, { message: "O nome deve ter pelo menos 2 caracteres." }),
  slug: z.string().min(2, { message: "O slug deve ter pelo menos 2 caracteres." }),
});

type OrgSettingsValues = z.infer<typeof orgSettingsSchema>;

export default function OrganizationSettingsPage() {
  const { activeSpace } = useSpace();
  const utils = api.useUtils();

  // Ensure we are in an organization context
  if (activeSpace.kind !== "organization") {
    return <div>Este painel é apenas para organizações.</div>;
  }

  const { data: org, isLoading } = api.organization.getById.useQuery(
    { id: activeSpace.id },
    { enabled: !!activeSpace.id }
  );

  const updateMutation = api.organization.update.useMutation({
    onSuccess: () => {
      toast.success("Configurações atualizadas com sucesso!");
      utils.organization.getById.invalidate({ id: activeSpace.id });
    },
    onError: (error) => {
      toast.error("Erro ao atualizar: " + error.message);
    },
  });

  const form = useForm<OrgSettingsValues>({
    resolver: zodResolver(orgSettingsSchema),
    defaultValues: {
      name: "",
      slug: "",
    },
  });

  // Update form when data loads
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
          <Button type="submit">Atualizar configurações</Button>
        </form>
      </Form>
    </div>
  );
}
