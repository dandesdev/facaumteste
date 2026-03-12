"use client";

/**
 * Item Edit Page
 * Loads item by id and renders the appropriate editor (mcq_single) or "coming soon" for other types
 */

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { api } from "~/trpc/react";
import { MCQSingleEditor } from "~/components/items/editors/MCQSingleEditor";

export default function ItemEditPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : undefined;

  const { data: item, isLoading, error, isError } = api.item.getById.useQuery(
    { id: id! },
    { enabled: !!id }
  );

  if (!id) {
    return (
      <div className="space-y-6">
        <p className="text-muted-foreground">ID inválido.</p>
        <Button variant="outline" asChild>
          <Link href="/dashboard/items">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar ao banco de itens
          </Link>
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" disabled>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <h1 className="text-2xl font-bold">Carregando...</h1>
        </div>
      </div>
    );
  }

  if (isError || !item) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/items">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Item não encontrado</h1>
        </div>
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            {error?.message ?? "O item não existe ou você não tem permissão para editá-lo."}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (item.type === "mcq_single") {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/items">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Editar Item: Múltipla Escolha</h1>
        </div>
        <MCQSingleEditor itemId={item.id} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/items">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Editar Item</h1>
      </div>
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">
            A edição para este tipo de item estará disponível em breve.
          </p>
          <Button variant="outline" className="mt-4" asChild>
            <Link href="/dashboard/items">Voltar ao banco de itens</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
