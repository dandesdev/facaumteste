"use client";

/**
 * Item Preview Page
 * Read-only view of an item as it would look in an evaluation.
 */

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Pencil } from "lucide-react";
import { Button } from "~/components/ui/button";
import { api } from "~/trpc/react";
import { ItemPreviewContent } from "~/components/items/ItemPreviewContent";

export default function ItemPreviewPage() {
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
        <p className="text-muted-foreground">
          {error?.message ?? "O item não existe ou você não tem permissão para visualizá-lo."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/items">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Visualização do item</h1>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/dashboard/items/${item.id}`}>
            <Pencil className="mr-2 h-4 w-4" />
            Editar
          </Link>
        </Button>
      </div>
      <ItemPreviewContent item={item} />
    </div>
  );
}
