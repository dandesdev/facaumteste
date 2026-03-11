"use client";

/**
 * Image Component — the React UI rendered by ImageNode
 *
 * Features:
 * - Click to select (blue border)
 * - 4 corner resize handles when selected (aspect ratio always preserved)
 * - Resize starts from rendered size so constrained images shrink in one drag
 * - Max stored dimension 2048px; upload limit 5MB (see api/upload)
 * - Delete/Backspace to remove when selected
 * - Resize commits to ImageNode (undoable via Ctrl+Z)
 */

const MAX_IMAGE_DIMENSION = 2048;

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
} from "lexical";
import { $isImageNode } from "./ImageNode";

interface ImageComponentProps {
  src: string;
  altText: string;
  width?: number;
  height?: number;
  nodeKey: string;
}

type HandlePosition = "nw" | "ne" | "se" | "sw";

export function ImageComponent({
  src,
  altText,
  width,
  height,
  nodeKey,
}: ImageComponentProps) {
  const [editor] = useLexicalComposerContext();
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isSelected, setSelected, clearSelection] =
    useLexicalNodeSelection(nodeKey);

  // Resize state — local for immediate visual feedback
  const [isResizing, setIsResizing] = useState(false);
  const [displayWidth, setDisplayWidth] = useState<number | undefined>(width);
  const [displayHeight, setDisplayHeight] = useState<number | undefined>(
    height,
  );

  // Sync node props → display state (e.g., after undo)
  useEffect(() => {
    if (!isResizing) {
      setDisplayWidth(width);
      setDisplayHeight(height);
    }
  }, [width, height, isResizing]);

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

  // Commit resize to Lexical (creates undoable history entry). Clamp to max dimension.
  const commitResize = useCallback(
    (w: number, h: number) => {
      const clampedW = Math.min(MAX_IMAGE_DIMENSION, Math.round(w));
      const clampedH = Math.min(MAX_IMAGE_DIMENSION, Math.round(h));
      editor.update(() => {
        const node = $getNodeByKey(nodeKey);
        if ($isImageNode(node)) {
          node.setWidthAndHeight(clampedW, clampedH);
        }
      });
    },
    [editor, nodeKey],
  );

  // --- Resize: aspect-ratio locked; start from rendered size so constrained images shrink in one drag ---
  const onResizeStart = useCallback(
    (e: React.MouseEvent, handle: HandlePosition) => {
      e.preventDefault();
      e.stopPropagation();

      const img = imageRef.current;
      if (!img) return;

      // Use rendered size (what the user sees) so resize-from-constrained works in one drag
      const rect = img.getBoundingClientRect();
      const startWidth = rect.width;
      const startHeight = rect.height;
      const aspectRatio = startWidth / startHeight;
      const startX = e.clientX;
      const startY = e.clientY;

      setIsResizing(true);

      let latestW = startWidth;
      let latestH = startHeight;

      const onMouseMove = (moveEvent: MouseEvent) => {
        const deltaX = moveEvent.clientX - startX;
        const deltaY = moveEvent.clientY - startY;

        let newWidth = startWidth;
        switch (handle) {
          case "ne":
          case "se":
            newWidth = startWidth + deltaX;
            break;
          case "nw":
          case "sw":
            newWidth = startWidth - deltaX;
            break;
        }

        newWidth = Math.max(48, Math.min(MAX_IMAGE_DIMENSION, newWidth));
        const newHeight = newWidth / aspectRatio;

        latestW = newWidth;
        latestH = newHeight;
        setDisplayWidth(newWidth);
        setDisplayHeight(newHeight);
      };

      const onMouseUp = () => {
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
        setIsResizing(false);
        commitResize(latestW, latestH);
      };

      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    },
    [commitResize],
  );

  // Click and keyboard commands
  useEffect(() => {
    return mergeRegister(
      editor.registerCommand(
        CLICK_COMMAND,
        (event: MouseEvent) => {
          if (containerRef.current?.contains(event.target as HTMLElement)) {
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
          if (isSelected && !isResizing) {
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
          if (isSelected && !isResizing) {
            deleteNode();
            return true;
          }
          return false;
        },
        COMMAND_PRIORITY_LOW,
      ),
    );
  }, [editor, isSelected, isResizing, clearSelection, setSelected, deleteNode]);

  const handles: HandlePosition[] = ["nw", "ne", "se", "sw"];

  return (
    <div
      ref={containerRef}
      className={`editor-image ${isSelected ? "selected" : ""} ${isResizing ? "resizing" : ""}`}
    >
      <img
        ref={imageRef}
        src={src}
        alt={altText}
        width={displayWidth}
        height={displayHeight}
        className="editor-image-element"
        draggable={false}
      />
      {isSelected && (
        <>
          {handles.map((pos) => (
            <div
              key={pos}
              className={`editor-image-handle editor-image-handle-${pos}`}
              onMouseDown={(e) => onResizeStart(e, pos)}
            />
          ))}
        </>
      )}
    </div>
  );
}
