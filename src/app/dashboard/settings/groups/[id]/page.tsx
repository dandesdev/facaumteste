"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "~/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Separator } from "~/components/ui/separator";
import { toast } from "sonner";
import { api } from "~/trpc/react";
import { useParams } from "next/navigation";

const groupSettingsSchema = z.object({
  name: z.string().min(2, { message: "O nome deve ter pelo menos 2 caracteres." }),
  description: z.string().optional(),
});

type GroupSettingsValues = z.infer<typeof groupSettingsSchema>;

export default function GroupSettingsPage() {
  const params = useParams();
  const groupId = typeof params.id === 'string' ? params.id : '';
  
  const utils = api.useUtils();

  const { data: group, isLoading } = api.organization.getGroupById.useQuery(
    { id: groupId },
    { enabled: !!groupId }
  );

  const updateMutation = api.organization.updateGroup.useMutation({
    onSuccess: () => {
      toast.success("Turma atualizada!");
      utils.organization.getGroupById.invalidate({ id: groupId });
      utils.organization.listGroups.invalidate();
    },
    onError: (error) => {
      toast.error("Erro ao atualizar: " + error.message);
    },
  });

  const form = useForm<GroupSettingsValues>({
    resolver: zodResolver(groupSettingsSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  // Load data
  React.useEffect(() => {
    if (group) {
      form.reset({
        name: group.name,
        description: group.description ?? "",
      });
    }
  }, [group, form]);

  function onSubmit(data: GroupSettingsValues) {
    if (!groupId) return;
    updateMutation.mutate({
      id: groupId,
      name: data.name,
      description: data.description,
    });
  }

  if (isLoading) return <div>Carregando...</div>;
  if (!group) return <div>Turma não encontrada.</div>;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Turma: {group.name}</h3>
        <p className="text-sm text-muted-foreground">
          Configurações da turma.
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
                <FormLabel>Nome da Turma</FormLabel>
                <FormControl>
                  <Input placeholder="Matemática 101" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descrição</FormLabel>
                <FormControl>
                  <Input placeholder="Descrição opcional..." {...field} /> 
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit">Salvar Alterações</Button>
        </form>
      </Form>
    </div>
  );
}
