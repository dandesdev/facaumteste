"use client";

/**
 * Item Preview Content
 * Read-only mockup of an item as it would appear in an evaluation.
 * For mcq_single: statement, choices with correct one marked, optional resolution.
 */

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "~/components/ui/collapsible";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader } from "~/components/ui/card";
import { LexicalEditor } from "~/components/editor";
import type { SerializedEditorState } from "lexical";

interface MCQSingleStructure {
  baseText?: SerializedEditorState | null;
  choices?: Array<{
    id: string;
    content: SerializedEditorState | null;
    comment?: SerializedEditorState | null;
  }>;
  correctIndex?: number;
}

interface ItemPreviewContentProps {
  item: {
    type: string;
    statement: unknown;
    structure: unknown;
    resolution?: unknown;
  };
}

function LexicalReadOnly({ content }: { content: SerializedEditorState | null }) {
  if (!content) return <span className="text-muted-foreground">—</span>;
  return (
    <LexicalEditor
      initialContent={content}
      editable={false}
      className="min-h-[44px] border-0 bg-transparent"
    />
  );
}

export function ItemPreviewContent({ item }: ItemPreviewContentProps) {
  if (item.type !== "mcq_single") {
    return (
      <p className="text-muted-foreground">
        Visualização para este tipo de item em breve.
      </p>
    );
  }

  const st = item.structure as MCQSingleStructure | null;
  const choices = st?.choices ?? [];
  const correctIndex = typeof st?.correctIndex === "number" ? st.correctIndex : 0;
  const resolution = item.resolution as SerializedEditorState | null | undefined;

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Base text (if present) */}
      {st?.baseText && (
        <Card>
          <CardHeader className="pb-2">
            <span className="text-sm font-medium text-muted-foreground">Texto base</span>
          </CardHeader>
          <CardContent>
            <LexicalReadOnly content={st.baseText} />
          </CardContent>
        </Card>
      )}

      {/* Statement */}
      <Card>
        <CardHeader className="pb-2">
          <span className="text-sm font-medium text-muted-foreground">Enunciado</span>
        </CardHeader>
        <CardContent>
          <LexicalReadOnly content={item.statement as SerializedEditorState} />
        </CardContent>
      </Card>

      {/* Choices */}
      <Card>
        <CardHeader className="pb-2">
          <span className="text-sm font-medium text-muted-foreground">Alternativas</span>
        </CardHeader>
        <CardContent className="space-y-3">
          {choices.map((choice, index) => (
            <div
              key={choice.id}
              className={`flex items-start gap-2 rounded-lg border p-3 ${
                index === correctIndex
                  ? "border-green-500 bg-green-50 dark:bg-green-950/20"
                  : ""
              }`}
            >
              <span className="text-sm font-medium shrink-0">
                {String.fromCharCode(65 + index)}.
              </span>
              <div className="flex-1 min-w-0">
                <LexicalReadOnly content={choice.content ?? null} />
              </div>
              {index === correctIndex && (
                <span className="text-xs font-medium text-green-600 dark:text-green-400 shrink-0">
                  (correta)
                </span>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Resolution (collapsible) */}
      {(resolution !== undefined && resolution !== null) && (
        <Collapsible>
          <Card>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-start p-4 h-auto">
                <span className="text-sm font-medium">Resolução</span>
                <span className="ml-2 text-muted-foreground">▼</span>
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0">
                <LexicalReadOnly content={resolution} />
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}
    </div>
  );
}
