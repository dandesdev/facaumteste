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
// import { api } from "~/trpc/react"; 
// Note: We need a router to update user profile. 
// Assuming one doesn't exist yet for updating 'me'. I'll stub the mutation.
import { useSpace } from "~/contexts/SpaceContext";

const userSettingsSchema = z.object({
  name: z.string().min(2, { message: "O nome deve ter pelo menos 2 caracteres." }),
});

type UserSettingsValues = z.infer<typeof userSettingsSchema>;

export default function PersonalSettingsPage() {
  const { activeSpace } = useSpace();

  if (activeSpace.kind !== "user") {
    return <div>Esta página é apenas para espaços pessoais.</div>;
  }

  const form = useForm<UserSettingsValues>({
    resolver: zodResolver(userSettingsSchema),
    defaultValues: {
      name: activeSpace.name || "",
    },
  });

  function onSubmit(data: UserSettingsValues) {
    toast.info("Em breve: Atualizar perfil do usuário: " + JSON.stringify(data));
    // TODO: Implement user.update procedure
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Meu Perfil</h3>
        <p className="text-sm text-muted-foreground">
          Gerencie suas informações pessoais.
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
                <FormLabel>Nome Exibido</FormLabel>
                <FormControl>
                  <Input placeholder="Seu nome" {...field} />
                </FormControl>
                <FormDescription>
                  Este é o nome que aparecerá para outros usuários.
                </FormDescription>
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
