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
  $insertNodes,
  COMMAND_PRIORITY_EDITOR,
  COMMAND_PRIORITY_LOW,
  createCommand,
  type LexicalCommand,
  DROP_COMMAND,
  PASTE_COMMAND,
} from "lexical";
import { $createImageNode, ImageNode } from "../nodes/ImageNode";

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
        handleFileUpload(imageFiles);
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
        handleFileUpload(imageFiles);
        return true;
      },
      COMMAND_PRIORITY_LOW,
    );

    return () => {
      removeInsertCommand();
      removeDropCommand();
      removePasteCommand();
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
