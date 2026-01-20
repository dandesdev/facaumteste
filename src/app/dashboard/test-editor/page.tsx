"use client";

/**
 * Test page for the Lexical Editor
 * 
 * This page lets you test the editor and see how it saves/loads content.
 */

import { useState } from "react";
import type { SerializedEditorState } from "lexical";
import { LexicalEditor } from "~/components/editor";
import { Button } from "~/components/ui/button";

export default function TestEditorPage() {
  const [savedContent, setSavedContent] = useState<SerializedEditorState | null>(null);
  const [currentContent, setCurrentContent] = useState<SerializedEditorState | null>(null);

  const handleChange = (json: SerializedEditorState) => {
    setCurrentContent(json);
  };

  const handleSave = () => {
    if (currentContent) {
      setSavedContent(currentContent);
      console.log("Saved content:", JSON.stringify(currentContent, null, 2));
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Teste do Editor Lexical</h1>
      
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">
            Editor de Rich Text
          </label>
          <LexicalEditor
            onChange={handleChange}
            placeholder="Digite seu texto aqui..."
          />
        </div>
        
        <div className="flex gap-2">
          <Button onClick={handleSave}>
            Salvar Conteúdo
          </Button>
        </div>
        
        {savedContent && (
          <div className="mt-6">
            <h2 className="text-lg font-semibold mb-2">Conteúdo Salvo (JSON)</h2>
            <pre className="bg-muted p-4 rounded-md text-xs overflow-auto max-h-64">
              {JSON.stringify(savedContent, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
