"use client";

/**
 * Lexical Rich Text Editor Component
 * 
 * TEACHING NOTE:
 * This is the main editor component. Here's how it works:
 * 
 * 1. LexicalComposer provides the editor context (like React.Context)
 * 2. RichTextPlugin adds the ContentEditable and handles rich text
 * 3. HistoryPlugin adds undo/redo support
 * 4. ListPlugin enables bullet and numbered lists
 * 5. LinkPlugin enables clickable links
 * 6. Our ToolbarPlugin adds the formatting buttons
 * 7. Our OnChangePlugin saves content when it changes
 * 
 * The initialConfig sets up:
 * - namespace: unique ID for this editor instance
 * - theme: CSS class mappings (see theme.ts)
 * - nodes: which node types are allowed
 * - onError: error handler
 * - editorState: initial content (JSON or undefined)
 */

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
import type { EditorState, SerializedEditorState } from "lexical";

import { editorTheme } from "./theme";
import { ToolbarPlugin } from "./plugins/ToolbarPlugin";
import { OnChangePlugin } from "./plugins/OnChangePlugin";

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
}

export function LexicalEditor({
  initialContent,
  onChange,
  placeholder = "Digite aqui...",
  editable = true,
  className = "",
}: LexicalEditorProps) {
  
  // Handle editor state changes
  const handleChange = (editorState: EditorState) => {
    if (onChange) {
      // Convert EditorState to JSON for storage
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
    // If it's already an object, stringify it for Lexical
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
    // Register node types we want to support
    nodes: [
      HeadingNode,
      QuoteNode,
      ListNode,
      ListItemNode,
      LinkNode,
    ],
  };

  return (
    <div className={`border rounded-md bg-background overflow-hidden ${className}`}>
      <LexicalComposer initialConfig={initialConfig}>
        {/* Toolbar with formatting buttons */}
        <ToolbarPlugin />
        
        {/* Main editor area */}
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
        
        {/* Plugins that add functionality */}
        <HistoryPlugin />
        <ListPlugin />
        <LinkPlugin />
        <OnChangePlugin onChange={handleChange} />
      </LexicalComposer>
    </div>
  );
}
