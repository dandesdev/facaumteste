"use client";

/**
 * Equation Component — the React UI rendered by EquationNode
 *
 * Two visual states:
 * - DISPLAY MODE: Renders equation using KaTeX. Click to edit.
 * - EDIT MODE: LaTeX text input. Enter commits, Escape cancels.
 *
 * Inline equations: auto-growing input that follows text flow.
 * Block equations: textarea with live preview + delete button.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useLexicalNodeSelection } from "@lexical/react/useLexicalNodeSelection";
import { mergeRegister } from "@lexical/utils";
import {
  $getNodeByKey,
  $createParagraphNode,
  CLICK_COMMAND,
  COMMAND_PRIORITY_LOW,
  KEY_DELETE_COMMAND,
  KEY_BACKSPACE_COMMAND,
  KEY_ESCAPE_COMMAND,
  COMMAND_PRIORITY_HIGH,
} from "lexical";
import katex from "katex";
import { Trash2 } from "lucide-react";
import { $isEquationNode } from "../nodes/EquationNode";

interface EquationComponentProps {
  equation: string;
  inline: boolean;
  nodeKey: string;
}

export function EquationComponent({
  equation,
  inline,
  nodeKey,
}: EquationComponentProps) {
  const [editor] = useLexicalComposerContext();
  // Auto-enter edit mode when equation is empty (freshly inserted)
  const [isEditing, setIsEditing] = useState(!equation);
  const [editValue, setEditValue] = useState(equation);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const katexRef = useRef<HTMLSpanElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);
  const [isSelected, setSelected, clearSelection] =
    useLexicalNodeSelection(nodeKey);

  // Track what the equation was when we entered edit mode (for cancel/revert)
  const originalEquationRef = useRef(equation);

  // Render KaTeX into the display element
  const renderKatex = useCallback(() => {
    if (katexRef.current && !isEditing && equation) {
      try {
        katex.render(equation, katexRef.current, {
          displayMode: !inline,
          throwOnError: false,
          strict: false,
          trust: true,
        });
      } catch {
        katexRef.current.textContent = equation;
      }
    }
  }, [equation, inline, isEditing]);

  useEffect(() => {
    renderKatex();
  }, [renderKatex]);

  // Auto-focus input when entering edit mode
  useEffect(() => {
    if (isEditing) {
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isEditing]);

  // --- Commit: save edits and advance cursor ---
  const commitAndAdvance = useCallback(() => {
    const value = editValue.trim();
    if (!value) {
      // Empty equation — remove the node entirely
      editor.update(() => {
        const node = $getNodeByKey(nodeKey);
        if ($isEquationNode(node)) {
          node.remove();
        }
      });
      return;
    }

    setIsEditing(false);
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if ($isEquationNode(node)) {
        node.setEquation(value);
        if (inline) {
          // Inline: move cursor right after the equation on the same line
          node.selectNext();
        } else {
          // Block: insert a new paragraph below and move cursor there
          const paragraph = $createParagraphNode();
          node.insertAfter(paragraph);
          paragraph.select();
        }
      }
    });
  }, [editor, editValue, nodeKey, inline]);

  // --- Cancel: revert or remove ---
  const cancelEdit = useCallback(() => {
    const original = originalEquationRef.current;
    if (!original) {
      // Was empty (first edit) — remove the node entirely
      editor.update(() => {
        const node = $getNodeByKey(nodeKey);
        if ($isEquationNode(node)) {
          node.remove();
        }
      });
    } else {
      // Revert to original
      setEditValue(original);
      setIsEditing(false);
      editor.update(() => {
        const node = $getNodeByKey(nodeKey);
        if ($isEquationNode(node)) {
          node.setEquation(original);
        }
      });
    }
    editor.focus();
  }, [editor, nodeKey]);

  // --- Delete: remove node cleanly ---
  const deleteNode = useCallback(() => {
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if ($isEquationNode(node)) {
        // For block equations, select a neighbor or replace with empty paragraph
        const prev = node.getPreviousSibling();
        const next = node.getNextSibling();
        if (prev) {
          node.remove();
          prev.selectEnd();
        } else if (next) {
          node.remove();
          next.selectStart();
        } else {
          // Only node — replace with empty paragraph
          const p = $createParagraphNode();
          node.replace(p);
          p.select();
        }
      }
    });
    editor.focus();
  }, [editor, nodeKey]);

  // Enter edit mode
  const startEditing = useCallback(() => {
    originalEquationRef.current = equation;
    setEditValue(equation);
    setIsEditing(true);
  }, [equation]);

  // Handle click on the equation (enter edit mode or select)
  useEffect(() => {
    return mergeRegister(
      editor.registerCommand(
        CLICK_COMMAND,
        (event: MouseEvent) => {
          const target = event.target as HTMLElement;
          if (katexRef.current?.contains(target)) {
            if (!isEditing) {
              startEditing();
            }
            return true;
          }
          return false;
        },
        COMMAND_PRIORITY_LOW,
      ),
      // Escape key cancels edit
      editor.registerCommand(
        KEY_ESCAPE_COMMAND,
        () => {
          if (isEditing) {
            cancelEdit();
            return true;
          }
          return false;
        },
        COMMAND_PRIORITY_HIGH,
      ),
      // Delete/Backspace removes selected equation node (when not editing)
      editor.registerCommand(
        KEY_DELETE_COMMAND,
        () => {
          if (isSelected && !isEditing) {
            deleteNode();
            return true;
          }
          return false;
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(
        KEY_BACKSPACE_COMMAND,
        () => {
          if (isSelected && !isEditing) {
            deleteNode();
            return true;
          }
          return false;
        },
        COMMAND_PRIORITY_LOW,
      ),
    );
  }, [
    editor,
    isEditing,
    isSelected,
    nodeKey,
    startEditing,
    cancelEdit,
    deleteNode,
  ]);

  // Handle input key events
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      cancelEdit();
    } else if (e.key === "Enter") {
      // Inline: Enter always commits
      // Block: Ctrl+Enter commits (plain Enter adds newline in textarea)
      if (inline || e.ctrlKey) {
        e.preventDefault();
        e.stopPropagation();
        commitAndAdvance();
      }
    }
  };

  // Prevent blur from firing when we explicitly commit or cancel
  const handleBlur = useCallback(() => {
    // On blur, commit if there's content, otherwise remove
    if (isEditing) {
      commitAndAdvance();
    }
  }, [isEditing, commitAndAdvance]);

  // --- INLINE: Auto-grow input width based on content ---
  const [inputWidth, setInputWidth] = useState("4rem");

  useEffect(() => {
    if (isEditing && inline && measureRef.current) {
      const measuredWidth = measureRef.current.scrollWidth;
      // Min width ~4rem (64px), grow with content
      const newWidth = Math.max(64, measuredWidth + 16);
      setInputWidth(`${newWidth}px`);
    }
  }, [editValue, isEditing, inline]);

  // --- EDIT MODE ---
  if (isEditing) {
    if (inline) {
      return (
        <span className="editor-equation-editing inline">
          {/* Hidden span to measure text width for auto-growing */}
          <span
            ref={measureRef}
            className="editor-equation-measure"
            aria-hidden="true"
          >
            {editValue || "x"}
          </span>
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            className="editor-equation-input"
            style={{ width: inputWidth }}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            placeholder="\\frac{a}{b}"
            spellCheck={false}
          />
        </span>
      );
    }

    // Block equation edit mode
    return (
      <div className="editor-equation-editing block">
        <div className="editor-equation-block-edit">
          <div className="editor-equation-block-edit-header">
            <span className="editor-equation-block-edit-hint">
              Ctrl+Enter para confirmar · Esc para cancelar
            </span>
            <button
              type="button"
              className="editor-equation-delete-btn"
              onMouseDown={(e) => e.preventDefault()}
              onClick={deleteNode}
              title="Remover equação"
            >
              <Trash2 size={14} />
            </button>
          </div>
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            className="editor-equation-textarea"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            placeholder="\\int_{0}^{\\infty} e^{-x} dx"
            rows={3}
            spellCheck={false}
          />
          <EquationPreview equation={editValue} />
        </div>
      </div>
    );
  }

  // --- DISPLAY MODE ---
  return (
    <span
      ref={katexRef}
      className={`editor-equation-display ${inline ? "inline" : "block"} ${isSelected ? "selected" : ""}`}
      role="button"
      tabIndex={-1}
      title="Clique para editar equação"
    />
  );
}

/**
 * Live preview shown below the textarea in block equation edit mode
 */
function EquationPreview({ equation }: { equation: string }) {
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (previewRef.current) {
      try {
        katex.render(
          equation || "\\text{pré-visualização}",
          previewRef.current,
          {
            displayMode: true,
            throwOnError: false,
            strict: false,
          },
        );
      } catch {
        if (previewRef.current) {
          previewRef.current.textContent = equation || "pré-visualização";
        }
      }
    }
  }, [equation]);

  return (
    <div className="editor-equation-preview">
      <span className="editor-equation-preview-label">Pré-visualização:</span>
      <div ref={previewRef} className="editor-equation-preview-content" />
    </div>
  );
}
