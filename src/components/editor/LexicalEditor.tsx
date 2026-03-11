"use client";

/**
 * Lexical Rich Text Editor Component
 *
 * Core editor with toolbar, rich text, history, lists, links,
 * equations (inline + block), images (with resize), and HTML toggle.
 */

import { useState } from "react";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { ListItemNode, ListNode } from "@lexical/list";
import { LinkNode } from "@lexical/link";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import "katex/dist/katex.min.css";
import type { EditorState, SerializedEditorState } from "lexical";

import { editorTheme } from "./theme";
import { ToolbarPlugin } from "./plugins/ToolbarPlugin";
import { OnChangePlugin } from "./plugins/OnChangePlugin";
import { EquationPlugin } from "./plugins/EquationPlugin";
import { EquationNode } from "./nodes/EquationNode";
import { ImagePlugin } from "./plugins/ImagePlugin";
import { ImageNode } from "./nodes/ImageNode";
import { HtmlTogglePlugin } from "./plugins/HtmlTogglePlugin";

interface LexicalEditorProps {
  /** Initial content as serialized JSON */
  initialContent?: SerializedEditorState | string;
  /** Called when content changes, with serialized JSON */
  onChange?: (json: SerializedEditorState) => void;
  /** Placeholder text when empty */
  placeholder?: string;
  /** Whether the editor is read-only */
  editable?: boolean;
  /** Optional CSS class for the container */
  className?: string;
  /** Optional item ID for image picker context (future) */
  itemId?: string;
}

export function LexicalEditor({
  initialContent,
  onChange,
  placeholder = "Digite aqui...",
  editable = true,
  className = "",
}: LexicalEditorProps) {
  const [isHtmlMode, setIsHtmlMode] = useState(false);

  // Handle editor state changes
  const handleChange = (editorState: EditorState) => {
    if (onChange) {
      const json = editorState.toJSON();
      onChange(json);
    }
  };

  // Parse initial content if it's a string
  const getInitialState = () => {
    if (!initialContent) return undefined;
    if (typeof initialContent === "string") {
      try {
        return initialContent;
      } catch {
        return undefined;
      }
    }
    return JSON.stringify(initialContent);
  };

  const initialConfig = {
    namespace: "LexicalEditor",
    theme: editorTheme,
    onError: (error: Error) => {
      console.error("Lexical error:", error);
    },
    editable,
    editorState: getInitialState(),
    nodes: [
      HeadingNode,
      QuoteNode,
      ListNode,
      ListItemNode,
      LinkNode,
      EquationNode,
      ImageNode,
    ],
  };

  return (
    <div
      className={`bg-background overflow-hidden rounded-md border ${className}`}
    >
      <LexicalComposer initialConfig={initialConfig}>
        {/* Toolbar with formatting buttons + HTML toggle */}
        <ToolbarPlugin
          isHtmlMode={isHtmlMode}
          onToggleHtml={() => setIsHtmlMode(!isHtmlMode)}
        />

        {/* Visual editor — hidden when in HTML mode */}
        {!isHtmlMode && (
          <div className="relative">
            <RichTextPlugin
              contentEditable={
                <ContentEditable className="lexical-content-editable" />
              }
              placeholder={
                <div className="lexical-placeholder">{placeholder}</div>
              }
              ErrorBoundary={LexicalErrorBoundary}
            />
          </div>
        )}

        {/* HTML code view — shown when in HTML mode */}
        <HtmlTogglePlugin isHtmlMode={isHtmlMode} onToggle={setIsHtmlMode} />

        {/* Plugins */}
        <HistoryPlugin />
        <ListPlugin />
        <LinkPlugin />
        <EquationPlugin />
        <ImagePlugin />
        <OnChangePlugin onChange={handleChange} />
      </LexicalComposer>
    </div>
  );
}
