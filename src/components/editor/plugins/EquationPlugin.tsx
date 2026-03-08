"use client";

import { useEffect } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getSelection,
  $isRangeSelection,
  $insertNodes,
  COMMAND_PRIORITY_EDITOR,
  createCommand,
  type LexicalCommand,
} from "lexical";
import { $createEquationNode, EquationNode } from "../nodes/EquationNode";

export type InsertEquationPayload = {
  equation: string;
  inline: boolean;
};

export const INSERT_EQUATION_COMMAND: LexicalCommand<InsertEquationPayload> =
  createCommand("INSERT_EQUATION_COMMAND");

export function EquationPlugin(): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    // Ensure the EquationNode is registered
    if (!editor.hasNodes([EquationNode])) {
      throw new Error(
        "EquationPlugin: EquationNode is not registered in the editor config",
      );
    }

    // Register the insert command
    const removeCommand = editor.registerCommand(
      INSERT_EQUATION_COMMAND,
      (payload: InsertEquationPayload) => {
        const selection = $getSelection();

        if ($isRangeSelection(selection)) {
          const equationNode = $createEquationNode(
            payload.equation,
            payload.inline,
          );
          $insertNodes([equationNode]);
        }

        return true;
      },
      COMMAND_PRIORITY_EDITOR,
    );

    return removeCommand;
  }, [editor]);

  // Register Ctrl+Shift+E keyboard shortcut for inline equations
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key === "E") {
        event.preventDefault();
        editor.dispatchCommand(INSERT_EQUATION_COMMAND, {
          equation: "",
          inline: true,
        });
      }
    };

    // Attach to the editor's root element
    const rootElement = editor.getRootElement();
    if (rootElement) {
      rootElement.addEventListener("keydown", handleKeyDown);
      return () => rootElement.removeEventListener("keydown", handleKeyDown);
    }
  }, [editor]);

  return null;
}
