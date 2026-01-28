"use client";

/**
 * MCQ Single Editor
 * Editor for Multiple Choice Question with single correct answer
 */

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, ChevronUp, ChevronDown, Save, Send } from "lucide-react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Label } from "~/components/ui/label";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "~/components/ui/collapsible";
import { LexicalEditor } from "~/components/editor";
import { api } from "~/trpc/react";
import { useSpace } from "~/contexts/SpaceContext";
import type { SerializedEditorState } from "lexical";

interface Choice {
  id: string;
  content: SerializedEditorState | null;
  comment: SerializedEditorState | null;
}

interface MCQSingleFormData {
  baseText: SerializedEditorState | null;
  statement: SerializedEditorState | null;
  choices: Choice[];
  correctIndex: number;
  resolution: SerializedEditorState | null;
  difficulty: "easy" | "medium" | "hard";
  tags: string[];
}

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

export function MCQSingleEditor() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [showBaseText, setShowBaseText] = useState(false);
  const [showResolution, setShowResolution] = useState(false);
  const { activeSpace } = useSpace();

  const [formData, setFormData] = useState<MCQSingleFormData>({
    baseText: null,
    statement: null,
    choices: [
      { id: generateId(), content: null, comment: null },
      { id: generateId(), content: null, comment: null },
    ],
    correctIndex: 0,
    resolution: null,
    difficulty: "medium",
    tags: [],
  });

  const [tagInput, setTagInput] = useState("");
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);

  // Fetch existing tags for autocomplete
  const { data: existingTags } = api.item.getTags.useQuery(
    {
      organizationId: activeSpace?.kind === "organization" ? activeSpace.id : undefined,
    },
    { enabled: true }
  );

  // Filter suggestions based on input
  const tagSuggestions = useMemo(() => {
    if (!tagInput.trim() || !existingTags) return [];
    const input = tagInput.toLowerCase();
    return existingTags
      .filter((tag) => 
        tag.toLowerCase().includes(input) && 
        !formData.tags.includes(tag)
      )
      .slice(0, 5);
  }, [tagInput, existingTags, formData.tags]);

  const utils = api.useUtils();
  const createItem = api.item.create.useMutation({
    onSuccess: () => {
      // Invalidate item list cache so new item appears
      void utils.item.list.invalidate();
      void utils.item.getCount.invalidate();
      router.push("/dashboard/items");
    },
    onError: (error) => {
      alert(`Erro ao salvar: ${error.message}`);
      setIsSaving(false);
    },
  });

  // Handlers
  const updateStatement = useCallback((json: SerializedEditorState) => {
    setFormData((prev) => ({ ...prev, statement: json }));
  }, []);

  const updateBaseText = useCallback((json: SerializedEditorState) => {
    setFormData((prev) => ({ ...prev, baseText: json }));
  }, []);

  const updateResolution = useCallback((json: SerializedEditorState) => {
    setFormData((prev) => ({ ...prev, resolution: json }));
  }, []);

  const updateChoiceContent = useCallback((choiceId: string, json: SerializedEditorState) => {
    setFormData((prev) => ({
      ...prev,
      choices: prev.choices.map((c) =>
        c.id === choiceId ? { ...c, content: json } : c
      ),
    }));
  }, []);

  const addChoice = useCallback(() => {
    setFormData((prev) => ({
      ...prev,
      choices: [...prev.choices, { id: generateId(), content: null, comment: null }],
    }));
  }, []);

  const removeChoice = useCallback((choiceId: string) => {
    setFormData((prev) => {
      if (prev.choices.length <= 2) return prev;
      const index = prev.choices.findIndex((c) => c.id === choiceId);
      if (index === -1) return prev;
      
      const newChoices = prev.choices.filter((c) => c.id !== choiceId);
      let newCorrectIndex = prev.correctIndex;
      if (index === prev.correctIndex) {
        newCorrectIndex = 0;
      } else if (index < prev.correctIndex) {
        newCorrectIndex = prev.correctIndex - 1;
      }
      return { ...prev, choices: newChoices, correctIndex: newCorrectIndex };
    });
  }, []);

  const moveChoice = useCallback((index: number, direction: "up" | "down") => {
    setFormData((prev) => {
      const newIndex = direction === "up" ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= prev.choices.length) return prev;
      
      const newChoices = [...prev.choices];
      [newChoices[index], newChoices[newIndex]] = [newChoices[newIndex]!, newChoices[index]!];
      
      // Update correctIndex if affected
      let newCorrectIndex = prev.correctIndex;
      if (prev.correctIndex === index) {
        newCorrectIndex = newIndex;
      } else if (prev.correctIndex === newIndex) {
        newCorrectIndex = index;
      }
      
      return { ...prev, choices: newChoices, correctIndex: newCorrectIndex };
    });
  }, []);

  const setCorrectIndex = useCallback((index: number) => {
    setFormData((prev) => ({ ...prev, correctIndex: index }));
  }, []);

  const addTag = useCallback((tag?: string) => {
    const tagToAdd = (tag ?? tagInput).trim();
    if (tagToAdd && !formData.tags.includes(tagToAdd)) {
      setFormData((prev) => ({ ...prev, tags: [...prev.tags, tagToAdd] }));
      setTagInput("");
      setShowTagSuggestions(false);
    }
  }, [tagInput, formData.tags]);

  const removeTag = useCallback((tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tag),
    }));
  }, []);

  const handleSave = useCallback(
    (status: "draft" | "published") => {
      // Validate statement is present (TypeScript type narrowing)
      const statement = formData.statement;
      if (!statement) {
        alert("O enunciado é obrigatório");
        return;
      }

      const filledChoices = formData.choices.filter((c) => c.content !== null);
      if (filledChoices.length < 2) {
        alert("É necessário pelo menos 2 alternativas preenchidas");
        return;
      }

      setIsSaving(true);

      const organizationId = activeSpace?.kind === "organization" ? activeSpace.id : undefined;

      const structure = {
        baseText: formData.baseText,
        statement: statement,
        choices: formData.choices.map((c) => ({
          id: c.id,
          content: c.content,
          comment: c.comment,
        })),
        correctIndex: formData.correctIndex,
        resolution: formData.resolution,
      };

      createItem.mutate({
        type: "mcq_single",
        difficulty: formData.difficulty,
        organizationId,
        statement: statement,
        structure,
        resolution: formData.resolution,
        tags: formData.tags,
        status,
      });
    },
    [formData, createItem, activeSpace]
  );

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Base Text (Optional, Collapsible) */}
      <Collapsible open={showBaseText} onOpenChange={setShowBaseText}>
        <Card>
          <CardHeader className="pb-2">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="justify-start p-0 h-auto">
                <CardTitle className="text-base font-medium">
                  Texto Base {showBaseText ? "▼" : "▶"}
                </CardTitle>
              </Button>
            </CollapsibleTrigger>
            <p className="text-sm text-muted-foreground">
              Contexto opcional (texto, imagem, gráfico) compartilhado com a questão
            </p>
          </CardHeader>
          <CollapsibleContent>
            <CardContent>
              <LexicalEditor
                placeholder="Digite o texto base aqui..."
                onChange={updateBaseText}
              />
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Statement (Required) */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">
            Enunciado <span className="text-destructive">*</span>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            A pergunta ou problema a ser respondido
          </p>
        </CardHeader>
        <CardContent>
          <LexicalEditor
            placeholder="Digite o enunciado da questão..."
            onChange={updateStatement}
          />
        </CardContent>
      </Card>

      {/* Choices */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-medium">
                Alternativas <span className="text-destructive">*</span>
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Mínimo de 2 alternativas. Marque a correta.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={addChoice}>
              <Plus className="mr-1 h-4 w-4" />
              Adicionar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {formData.choices.map((choice, index) => (
            <div
              key={choice.id}
              className={`border rounded-lg p-4 ${
                formData.correctIndex === index
                  ? "border-green-500 bg-green-50 dark:bg-green-950/20"
                  : ""
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="flex flex-col items-center gap-1 pt-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => moveChoice(index, "up")}
                    disabled={index === 0}
                  >
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <input
                    type="radio"
                    name="correctAnswer"
                    checked={formData.correctIndex === index}
                    onChange={() => setCorrectIndex(index)}
                    className="h-4 w-4"
                    title="Marcar como correta"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => moveChoice(index, "down")}
                    disabled={index === formData.choices.length - 1}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm font-medium">
                      Alternativa {String.fromCharCode(65 + index)}
                      {formData.correctIndex === index && (
                        <span className="ml-2 text-green-600 text-xs">(Correta)</span>
                      )}
                    </Label>
                    {formData.choices.length > 2 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeChoice(choice.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <LexicalEditor
                    key={choice.id}
                    placeholder={`Digite a alternativa ${String.fromCharCode(65 + index)}...`}
                    onChange={(json) => updateChoiceContent(choice.id, json)}
                  />
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Resolution (Optional, Collapsible) */}
      <Collapsible open={showResolution} onOpenChange={setShowResolution}>
        <Card>
          <CardHeader className="pb-2">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="justify-start p-0 h-auto">
                <CardTitle className="text-base font-medium">
                  Resolução {showResolution ? "▼" : "▶"}
                </CardTitle>
              </Button>
            </CollapsibleTrigger>
            <p className="text-sm text-muted-foreground">
              Explicação da resposta correta (opcional)
            </p>
          </CardHeader>
          <CollapsibleContent>
            <CardContent>
              <LexicalEditor
                placeholder="Explique por que a alternativa marcada é a correta..."
                onChange={updateResolution}
              />
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Metadata */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">Metadados</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Difficulty */}
          <div className="flex items-center gap-4">
            <Label className="w-24">Dificuldade</Label>
            <Select
              value={formData.difficulty}
              onValueChange={(v) =>
                setFormData((prev) => ({
                  ...prev,
                  difficulty: v as "easy" | "medium" | "hard",
                }))
              }
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper">
                <SelectItem value="easy">Fácil</SelectItem>
                <SelectItem value="medium">Médio</SelectItem>
                <SelectItem value="hard">Difícil</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tags with autocomplete */}
          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="relative">
              <div className="flex gap-2">
                <Input
                  placeholder="Adicionar tag..."
                  value={tagInput}
                  onChange={(e) => {
                    setTagInput(e.target.value);
                    setShowTagSuggestions(true);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTag();
                    }
                    if (e.key === "Escape") {
                      setShowTagSuggestions(false);
                    }
                  }}
                  onFocus={() => setShowTagSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowTagSuggestions(false), 200)}
                  className="flex-1"
                />
                <Button variant="outline" onClick={() => addTag()}>
                  Adicionar
                </Button>
              </div>
              
              {/* Autocomplete dropdown */}
              {showTagSuggestions && tagSuggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-popover border rounded-md shadow-md">
                  {tagSuggestions.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      className="w-full px-3 py-2 text-left text-sm hover:bg-accent"
                      onMouseDown={() => addTag(tag)}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="gap-1"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="hover:text-destructive"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button
          variant="outline"
          onClick={() => handleSave("draft")}
          disabled={isSaving}
        >
          <Save className="mr-2 h-4 w-4" />
          Salvar Rascunho
        </Button>
        <Button onClick={() => handleSave("published")} disabled={isSaving}>
          <Send className="mr-2 h-4 w-4" />
          Publicar
        </Button>
      </div>
    </div>
  );
}
