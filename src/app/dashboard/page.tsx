"use client";

import Link from "next/link";
import { Plus, FileEdit, CheckCircle, Database } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Visão Geral</h1>
        <p className="text-muted-foreground">Bem-vindo ao seu painel de controle.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: New Evaluation */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 mb-2">
              <Plus className="h-6 w-6" />
            </div>
            <CardTitle>Novo Teste</CardTitle>
            <CardDescription>
              Crie um teste do zero ou baseado em um modelo.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button className="w-full" asChild>
              <Link href="/dashboard/evaluations/new">Criar Agora</Link>
            </Button>
          </CardFooter>
        </Card>

        {/* Card 2: Item Bank Stats */}
        <Card>
          <CardHeader className="pb-2">
            <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600 mb-2">
              <Database className="h-6 w-6" />
            </div>
            <CardTitle>Banco de Itens</CardTitle>
            <CardDescription>
              Gerencie suas questões e itens reutilizáveis.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button variant="outline" className="w-full" asChild>
              <Link href="/dashboard/items">Acessar Banco</Link>
            </Button>
          </CardFooter>
        </Card>

        {/* Placeholder Stats */}
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Atividade Recente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-20 text-muted-foreground text-sm border-2 border-dashed rounded-lg">
              Nenhuma atividade recente
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Section: Drafts */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <FileEdit className="h-5 w-5 text-muted-foreground" />
              Em Criação
            </h2>
            <Link
              href="/dashboard/evaluations?status=draft"
              className="text-sm text-primary hover:underline"
            >
              Ver todas
            </Link>
          </div>

          <Card>
            <CardContent className="py-8">
              <p className="text-center text-sm text-muted-foreground">
                Nenhum teste em rascunho.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Section: Published */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Aplicados
            </h2>
            <Link
              href="/dashboard/evaluations?status=published"
              className="text-sm text-primary hover:underline"
            >
              Ver todas
            </Link>
          </div>

          <Card>
            <CardContent className="py-8">
              <p className="text-center text-sm text-muted-foreground">
                Nenhum teste publicado.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}