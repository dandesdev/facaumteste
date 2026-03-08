"use client";

/**
 * Image Component — the React UI rendered by ImageNode
 *
 * Displays the uploaded image. When selected, shows a highlight border.
 * Supports Delete/Backspace to remove.
 */

import { useCallback, useEffect, useRef } from "react";
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
} from "lexical";
import { $isImageNode } from "./ImageNode";

interface ImageComponentProps {
  src: string;
  altText: string;
  width?: number;
  height?: number;
  nodeKey: string;
}

export function ImageComponent({
  src,
  altText,
  width,
  height,
  nodeKey,
}: ImageComponentProps) {
  const [editor] = useLexicalComposerContext();
  const imageRef = useRef<HTMLImageElement>(null);
  const [isSelected, setSelected, clearSelection] =
    useLexicalNodeSelection(nodeKey);

  const deleteNode = useCallback(() => {
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if ($isImageNode(node)) {
        const prev = node.getPreviousSibling();
        const next = node.getNextSibling();
        if (prev) {
          node.remove();
          prev.selectEnd();
        } else if (next) {
          node.remove();
          next.selectStart();
        } else {
          const p = $createParagraphNode();
          node.replace(p);
          p.select();
        }
      }
    });
  }, [editor, nodeKey]);

  useEffect(() => {
    return mergeRegister(
      editor.registerCommand(
        CLICK_COMMAND,
        (event: MouseEvent) => {
          if (imageRef.current?.contains(event.target as HTMLElement)) {
            clearSelection();
            setSelected(true);
            return true;
          }
          return false;
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(
        KEY_DELETE_COMMAND,
        () => {
          if (isSelected) {
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
          if (isSelected) {
            deleteNode();
            return true;
          }
          return false;
        },
        COMMAND_PRIORITY_LOW,
      ),
    );
  }, [editor, isSelected, clearSelection, setSelected, deleteNode]);

  return (
    <div className={`editor-image ${isSelected ? "selected" : ""}`}>
      <img
        ref={imageRef}
        src={src}
        alt={altText}
        width={width}
        height={height}
        className="editor-image-element"
        draggable={false}
      />
    </div>
  );
}
