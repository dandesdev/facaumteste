"use client";

/**
 * Toolbar Plugin for Lexical Editor
 * 
 * TEACHING NOTE:
 * This plugin adds a formatting toolbar. Plugins in Lexical are just React
 * components that access the editor via useLexicalComposerContext().
 * 
 * To modify the editor, we dispatch COMMANDS. Commands are actions like
 * FORMAT_TEXT_COMMAND (bold, italic) or INSERT_ORDERED_LIST_COMMAND.
 * 
 * For HEADINGS: We use $setBlocksType to convert paragraphs to headings.
 * For ALIGNMENT: We use FORMAT_ELEMENT_COMMAND with "left", "center", "right", "justify".
 * 
 * IMPORTANT: When using dropdowns, we need to ensure the editor maintains focus
 * after the dropdown closes. We do this by calling editor.focus() after updates.
 */

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { 
  $getSelection, 
  $isRangeSelection,
  FORMAT_TEXT_COMMAND,
  FORMAT_ELEMENT_COMMAND,
  UNDO_COMMAND,
  REDO_COMMAND,
  $createParagraphNode,
} from "lexical";
import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
} from "@lexical/list";
import { $setBlocksType } from "@lexical/selection";
import { $createHeadingNode } from "@lexical/rich-text";
import type { HeadingTagType } from "@lexical/rich-text";
import { useCallback, useEffect, useState } from "react";
import { mergeRegister } from "@lexical/utils";
import { 
  Bold, 
  Italic, 
  Underline, 
  Strikethrough, 
  List, 
  ListOrdered,
  Undo,
  Redo,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Heading1,
  Heading2,
  Heading3,
  Type,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";

export function ToolbarPlugin() {
  const [editor] = useLexicalComposerContext();
  
  // Track which formats are active at cursor position
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);

  // Update toolbar state when selection changes
  const updateToolbar = useCallback(() => {
    editor.getEditorState().read(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        setIsBold(selection.hasFormat("bold"));
        setIsItalic(selection.hasFormat("italic"));
        setIsUnderline(selection.hasFormat("underline"));
        setIsStrikethrough(selection.hasFormat("strikethrough"));
      }
    });
  }, [editor]);

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          updateToolbar();
        });
      })
    );
  }, [editor, updateToolbar]);

  // Format handlers
  const formatBold = () => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold");
  };

  const formatItalic = () => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic");
  };

  const formatUnderline = () => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline");
  };

  const formatStrikethrough = () => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, "strikethrough");
  };

  // List handlers - dispatch commands that ListPlugin listens to
  const insertBulletList = () => {
    editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
    // Ensure focus returns to editor
    setTimeout(() => editor.focus(), 0);
  };

  const insertNumberedList = () => {
    editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
    // Ensure focus returns to editor
    setTimeout(() => editor.focus(), 0);
  };

  // Heading handlers - using editor.update for block-level changes
  const formatHeading = (headingSize: HeadingTagType) => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createHeadingNode(headingSize));
      }
    });
    // Ensure focus returns to editor after dropdown closes
    setTimeout(() => editor.focus(), 0);
  };

  const formatParagraph = () => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createParagraphNode());
      }
    });
    // Ensure focus returns to editor after dropdown closes
    setTimeout(() => editor.focus(), 0);
  };

  // Alignment handlers
  const formatAlign = (alignment: "left" | "center" | "right" | "justify") => {
    editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, alignment);
  };

  return (
    <div className="flex items-center gap-1 p-2 border-b bg-muted/30 flex-wrap">
      {/* Undo/Redo */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}
        className="h-8 w-8 p-0"
        title="Desfazer"
      >
        <Undo className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}
        className="h-8 w-8 p-0"
        title="Refazer"
      >
        <Redo className="h-4 w-4" />
      </Button>
      
      <Separator orientation="vertical" className="mx-1 h-6" />
      
      {/* Block type (headings) */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            type="button" 
            variant="ghost" 
            size="sm" 
            className="h-8 gap-1 px-2" 
            title="Tipo de bloco"
          >
            <Type className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onSelect={() => formatParagraph()}>
            <Type className="h-4 w-4 mr-2" />
            Parágrafo
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => formatHeading("h1")}>
            <Heading1 className="h-4 w-4 mr-2" />
            Título 1
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => formatHeading("h2")}>
            <Heading2 className="h-4 w-4 mr-2" />
            Título 2
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => formatHeading("h3")}>
            <Heading3 className="h-4 w-4 mr-2" />
            Título 3
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
      <Separator orientation="vertical" className="mx-1 h-6" />
      
      {/* Text formatting */}
      <Button
        type="button"
        variant={isBold ? "secondary" : "ghost"}
        size="sm"
        onClick={formatBold}
        className="h-8 w-8 p-0"
        title="Negrito (Ctrl+B)"
      >
        <Bold className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant={isItalic ? "secondary" : "ghost"}
        size="sm"
        onClick={formatItalic}
        className="h-8 w-8 p-0"
        title="Itálico (Ctrl+I)"
      >
        <Italic className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant={isUnderline ? "secondary" : "ghost"}
        size="sm"
        onClick={formatUnderline}
        className="h-8 w-8 p-0"
        title="Sublinhado (Ctrl+U)"
      >
        <Underline className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant={isStrikethrough ? "secondary" : "ghost"}
        size="sm"
        onClick={formatStrikethrough}
        className="h-8 w-8 p-0"
        title="Tachado"
      >
        <Strikethrough className="h-4 w-4" />
      </Button>
      
      <Separator orientation="vertical" className="mx-1 h-6" />
      
      {/* Alignment */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => formatAlign("left")}
        className="h-8 w-8 p-0"
        title="Alinhar à esquerda"
      >
        <AlignLeft className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => formatAlign("center")}
        className="h-8 w-8 p-0"
        title="Centralizar"
      >
        <AlignCenter className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => formatAlign("right")}
        className="h-8 w-8 p-0"
        title="Alinhar à direita"
      >
        <AlignRight className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => formatAlign("justify")}
        className="h-8 w-8 p-0"
        title="Justificar"
      >
        <AlignJustify className="h-4 w-4" />
      </Button>
      
      <Separator orientation="vertical" className="mx-1 h-6" />
      
      {/* Lists */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={insertBulletList}
        className="h-8 w-8 p-0"
        title="Lista com marcadores"
      >
        <List className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={insertNumberedList}
        className="h-8 w-8 p-0"
        title="Lista numerada"
      >
        <ListOrdered className="h-4 w-4" />
      </Button>
    </div>
  );
}
