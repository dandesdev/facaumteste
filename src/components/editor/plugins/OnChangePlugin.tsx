"use client";

/**
 * OnChange Plugin for Lexical Editor
 * 
 * TEACHING NOTE:
 * This plugin calls a callback whenever the editor state changes.
 * We use it to save the content (as JSON) to parent components.
 * 
 * The editor state is IMMUTABLE. Each change creates a new state.
 * We serialize it to JSON for storage in the database.
 */

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useEffect } from "react";
import type { EditorState } from "lexical";

interface OnChangePluginProps {
  onChange: (editorState: EditorState) => void;
}

export function OnChangePlugin({ onChange }: OnChangePluginProps) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    // registerUpdateListener is called on every state change
    return editor.registerUpdateListener(({ editorState }) => {
      onChange(editorState);
    });
  }, [editor, onChange]);

  return null; // This plugin renders nothing
}
