"use client";

/**
 * Image Plugin for Lexical Editor
 *
 * Handles inserting images via:
 * - Toolbar button (opens file picker)
 * - Drag and drop onto the editor
 * - Paste from clipboard
 *
 * Uploads to /api/upload and creates an ImageNode with the returned URL.
 */

import { useEffect, useRef, useCallback } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getSelection,
  $isRangeSelection,
  $isNodeSelection,
  $insertNodes,
  $createParagraphNode,
  $isElementNode,
  COMMAND_PRIORITY_EDITOR,
  COMMAND_PRIORITY_LOW,
  COMMAND_PRIORITY_HIGH,
  createCommand,
  type LexicalCommand,
  DROP_COMMAND,
  PASTE_COMMAND,
  KEY_BACKSPACE_COMMAND,
  KEY_DELETE_COMMAND,
  FORMAT_ELEMENT_COMMAND,
  type LexicalNode,
} from "lexical";
import {
  $createImageNode,
  $isImageNode,
  ImageNode,
  type ImageAlignment,
} from "../nodes/ImageNode";

export type InsertImagePayload = {
  src: string;
  altText: string;
};

export const INSERT_IMAGE_COMMAND: LexicalCommand<InsertImagePayload> =
  createCommand("INSERT_IMAGE_COMMAND");

async function uploadFile(
  file: File,
): Promise<{ url: string } | { error: string }> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const data = (await response.json()) as { error?: string };
    return { error: data.error ?? "Upload falhou" };
  }

  return response.json() as Promise<{ url: string }>;
}

function isImageFile(file: File): boolean {
  return file.type.startsWith("image/");
}

/**
 * Removes an image node and places cursor on the nearest neighbor.
 */
function removeImageNode(imageNode: LexicalNode) {
  if (!$isImageNode(imageNode)) return;
  const prev = imageNode.getPreviousSibling();
  const next = imageNode.getNextSibling();
  if (prev) {
    imageNode.remove();
    if ($isElementNode(prev)) {
      prev.selectEnd();
    }
  } else if (next) {
    imageNode.remove();
    if ($isElementNode(next)) {
      next.selectStart();
    }
  } else {
    const p = $createParagraphNode();
    imageNode.replace(p);
    p.select();
  }
}

export function ImagePlugin(): null {
  const [editor] = useLexicalComposerContext();
  const isUploadingRef = useRef(false);

  useEffect(() => {
    if (!editor.hasNodes([ImageNode])) {
      throw new Error(
        "ImagePlugin: ImageNode is not registered in the editor config",
      );
    }

    // Register the insert command
    const removeInsertCommand = editor.registerCommand(
      INSERT_IMAGE_COMMAND,
      (payload: InsertImagePayload) => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          const imageNode = $createImageNode({
            src: payload.src,
            altText: payload.altText,
          });
          $insertNodes([imageNode]);
        }
        return true;
      },
      COMMAND_PRIORITY_EDITOR,
    );

    // Handle drag-and-drop
    const removeDropCommand = editor.registerCommand(
      DROP_COMMAND,
      (event: DragEvent) => {
        const files = event.dataTransfer?.files;
        if (!files || files.length === 0) return false;

        const imageFiles = Array.from(files).filter(isImageFile);
        if (imageFiles.length === 0) return false;

        event.preventDefault();
        void handleFileUpload(imageFiles);
        return true;
      },
      COMMAND_PRIORITY_LOW,
    );

    // Handle paste
    const removePasteCommand = editor.registerCommand(
      PASTE_COMMAND,
      (event: ClipboardEvent) => {
        const files = event.clipboardData?.files;
        if (!files || files.length === 0) return false;

        const imageFiles = Array.from(files).filter(isImageFile);
        if (imageFiles.length === 0) return false;

        event.preventDefault();
        void handleFileUpload(imageFiles);
        return true;
      },
      COMMAND_PRIORITY_LOW,
    );

    // Cursor-adjacent deletion: Backspace at start of node removes previous ImageNode
    const removeBackspaceCommand = editor.registerCommand(
      KEY_BACKSPACE_COMMAND,
      () => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection) || !selection.isCollapsed())
          return false;

        const anchor = selection.anchor;
        if (anchor.offset !== 0) return false;

        // Get the top-level block containing the cursor
        const anchorNode = anchor.getNode();
        const topBlock = anchorNode.getTopLevelElement();
        if (!topBlock) return false;

        const prevSibling = topBlock.getPreviousSibling();
        if ($isImageNode(prevSibling)) {
          removeImageNode(prevSibling);
          return true;
        }
        return false;
      },
      COMMAND_PRIORITY_LOW,
    );

    // Cursor-adjacent deletion: Delete at end of node removes next ImageNode
    const removeDeleteCommand = editor.registerCommand(
      KEY_DELETE_COMMAND,
      () => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection) || !selection.isCollapsed())
          return false;

        const anchor = selection.anchor;
        const anchorNode = anchor.getNode();
        const topBlock = anchorNode.getTopLevelElement();
        if (!topBlock) return false;

        // Check if cursor is at the very end of the block
        const textLength = anchorNode.getTextContentSize();
        if (anchor.offset !== textLength) return false;

        // Also verify no next sibling within the block (cursor is truly at block end)
        const nextInBlock = anchorNode.getNextSibling();
        if (nextInBlock) return false;

        const nextSibling = topBlock.getNextSibling();
        if ($isImageNode(nextSibling)) {
          removeImageNode(nextSibling);
          return true;
        }
        return false;
      },
      COMMAND_PRIORITY_LOW,
    );

    // Alignment: intercept FORMAT_ELEMENT_COMMAND when an image is selected
    const ALIGNMENT_MAP: Record<string, ImageAlignment> = {
      left: "left",
      center: "center",
      right: "right",
      justify: "center", // justify maps to center for images
    };

    const removeFormatCommand = editor.registerCommand(
      FORMAT_ELEMENT_COMMAND,
      (formatType) => {
        const selection = $getSelection();

        if ($isNodeSelection(selection)) {
          const nodes = selection.getNodes();
          const imageNode = nodes.find((n) => $isImageNode(n));
          if (imageNode && $isImageNode(imageNode)) {
            const alignment = ALIGNMENT_MAP[formatType] ?? "center";

            editor.update(() => {
              const parent = imageNode.getParent();
              if (parent && $isElementNode(parent)) {
                // Paragraph and other element nodes support setFormat
                // This drives text-align on the block, which HTML export preserves.
                parent.setFormat(alignment);
              }
            });

            return true;
          }
        }

        return false;
      },
      COMMAND_PRIORITY_HIGH,
    );

    return () => {
      removeInsertCommand();
      removeDropCommand();
      removePasteCommand();
      removeBackspaceCommand();
      removeDeleteCommand();
      removeFormatCommand();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor]);

  const handleFileUpload = useCallback(
    async (files: File[]) => {
      if (isUploadingRef.current) return;
      isUploadingRef.current = true;

      try {
        for (const file of files) {
          const result = await uploadFile(file);

          if ("error" in result) {
            console.error("Upload failed:", result.error);
            continue;
          }

          editor.dispatchCommand(INSERT_IMAGE_COMMAND, {
            src: result.url,
            altText: file.name,
          });
        }
      } finally {
        isUploadingRef.current = false;
      }
    },
    [editor],
  );

  return null;
}

/**
 * Opens a file picker and uploads the selected images.
 * Call this from the toolbar button.
 */
export function openImageFilePicker(
  editor: ReturnType<typeof useLexicalComposerContext>[0],
) {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  input.multiple = true;

  input.onchange = async () => {
    const files = input.files;
    if (!files || files.length === 0) return;

    const imageFiles = Array.from(files).filter(isImageFile);

    for (const file of imageFiles) {
      const result = await uploadFile(file);

      if ("error" in result) {
        console.error("Upload failed:", result.error);
        continue;
      }

      editor.dispatchCommand(INSERT_IMAGE_COMMAND, {
        src: result.url,
        altText: file.name,
      });
    }
  };

  input.click();
}
