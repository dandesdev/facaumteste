"use client";

/**
 * New Item Page
 * Type selector that routes to the appropriate editor
 */

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "~/components/ui/card";
import { ITEM_TYPE_CONFIG, ITEM_TYPES } from "~/components/items";
import { MCQSingleEditor } from "~/components/items/editors/MCQSingleEditor";

type EditorMode = "select" | "mcq_single" | "mcq_multiple" | "true_false" | "true_false_multi" | "fill_blank" | "matching";

export default function NewItemPage() {
  const [mode, setMode] = useState<EditorMode>("select");

  // If a type is selected, show the appropriate editor
  if (mode === "mcq_single") {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => setMode("select")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <h1 className="text-2xl font-bold">Novo Item: Múltipla Escolha</h1>
        </div>
        <MCQSingleEditor />
      </div>
    );
  }

  // For other types, show "coming soon" message
  if (mode !== "select") {
    const config = ITEM_TYPE_CONFIG[mode];
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => setMode("select")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <h1 className="text-2xl font-bold">Novo Item: {config.label}</h1>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              Editor para {config.label} em desenvolvimento.
            </p>
            <Button variant="outline" className="mt-4" onClick={() => setMode("select")}>
              Escolher outro tipo
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Type selector
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/items">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Novo Item</h1>
          <p className="text-muted-foreground">Escolha o tipo de item que deseja criar</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ITEM_TYPES.map((type) => {
          const config = ITEM_TYPE_CONFIG[type];
          const Icon = config.icon;
          const isAvailable = type === "mcq_single"; // Only MCQ Single is available for now

          return (
            <Card
              key={type}
              className={`cursor-pointer transition-all ${
                isAvailable
                  ? "hover:shadow-md hover:border-primary"
                  : "opacity-60"
              }`}
              onClick={() => setMode(type)}
            >
              <CardHeader>
                <div className={`h-10 w-10 rounded-lg ${config.color} bg-muted flex items-center justify-center mb-2`}>
                  <Icon className="h-5 w-5" />
                </div>
                <CardTitle className="text-lg">{config.label}</CardTitle>
                <CardDescription>
                  {type === "mcq_single" && "Questão com uma única resposta correta"}
                  {type === "mcq_multiple" && "Questão com múltiplas respostas corretas"}
                  {type === "true_false" && "Afirmação verdadeira ou falsa"}
                  {type === "true_false_multi" && "Múltiplas afirmações V/F"}
                  {type === "fill_blank" && "Complete as lacunas no texto"}
                  {type === "matching" && "Conecte itens de duas colunas"}
                </CardDescription>
              </CardHeader>
              {!isAvailable && (
                <CardContent className="pt-0">
                  <span className="text-xs text-muted-foreground">Em breve</span>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
