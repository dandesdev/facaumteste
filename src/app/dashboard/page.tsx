"use client";

import Link from "next/link";
import { api } from "~/trpc/react";
import { Plus, FileEdit, CheckCircle, Database, Clock } from "lucide-react";
import { Button } from "~/components/ui/button";

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Visão Geral</h1>
        <p className="text-muted-foreground">Bem-vindo ao seu painel de controle.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: New Evaluation */}
        <div className="rounded-xl border bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex flex-col h-full justify-between gap-4">
                <div className="space-y-2">
                    <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                        <Plus className="h-6 w-6" />
                    </div>
                    <h3 className="font-semibold text-lg">Nova Avaliação</h3>
                    <p className="text-sm text-gray-500">Crie uma avaliação do zero ou baseada em um modelo.</p>
                </div>
                <Button className="w-full" asChild>
                    <Link href="/dashboard/evaluations/new">Criar Agora</Link>
                </Button>
            </div>
        </div>

        {/* Card 2: Item Bank Stats */}
        <div className="rounded-xl border bg-white p-6 shadow-sm">
             <div className="flex flex-col h-full justify-between gap-4">
                <div className="space-y-2">
                    <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600">
                        <Database className="h-6 w-6" />
                    </div>
                    <h3 className="font-semibold text-lg">Banco de Itens</h3>
                    <p className="text-sm text-gray-500">Gerencie suas questões e itens reutilizáveis.</p>
                </div>
                 <Button variant="outline" className="w-full" asChild>
                    <Link href="/dashboard/items">Acessar Banco</Link>
                </Button>
            </div>
        </div>
        
        {/* Placeholder Stats */}
        <div className="rounded-xl border bg-white p-6 shadow-sm col-span-2">
            <h3 className="font-semibold text-lg mb-4">Atividade Recente</h3>
            <div className="flex items-center justify-center h-20 text-gray-400 text-sm border-2 border-dashed rounded-lg">
                Nenhuma atividade recente
            </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Section: Drafts */}
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                    <FileEdit className="h-5 w-5 text-gray-500" />
                    Em Criação
                </h2>
                <Link href="/dashboard/evaluations?status=draft" className="text-sm text-blue-600 hover:underline">Ver todas</Link>
            </div>
            
            {/* List would go here - Mock for now */}
            <div className="rounded-xl border bg-white divide-y">
                {/* <DashboardEvaluationList status="draft" /> */}
                <div className="p-4 text-center text-sm text-gray-500 py-8">
                    Nenhuma avaliação em rascunho.
                </div>
            </div>
        </div>

        {/* Section: Published */}
        <div className="space-y-4">
             <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    Aplicadas
                </h2>
                <Link href="/dashboard/evaluations?status=published" className="text-sm text-blue-600 hover:underline">Ver todas</Link>
            </div>

            <div className="rounded-xl border bg-white divide-y">
                 {/* <DashboardEvaluationList status="published" /> */}
                 <div className="p-4 text-center text-sm text-gray-500 py-8">
                    Nenhuma avaliação publicada.
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}