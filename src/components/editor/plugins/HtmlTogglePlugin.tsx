"use client";

/**
 * HTML Toggle Plugin for Lexical Editor
 *
 * Seamless toggle between visual (WYSIWYG) and HTML code modes.
 * - When entering HTML mode: extracts and prettifies the HTML
 * - When leaving HTML mode: parses the HTML back into Lexical nodes
 * - No explicit apply/cancel — the switch is automatic and seamless
 */

import { useEffect, useState, useRef, useCallback } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $generateHtmlFromNodes, $generateNodesFromDOM } from "@lexical/html";
import { $getRoot, $insertNodes } from "lexical";

// Block-level HTML tags that should start on their own line
const BLOCK_TAGS = new Set([
  "p",
  "div",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "ul",
  "ol",
  "li",
  "blockquote",
  "table",
  "tr",
  "td",
  "th",
  "thead",
  "tbody",
  "hr",
  "br",
  "img",
  "pre",
  "figure",
  "figcaption",
  "section",
  "article",
  "header",
  "footer",
  "nav",
]);

/**
 * Prettifies HTML by placing block-level tags on their own lines
 * and adding indentation for readability.
 */
function prettifyHtml(html: string): string {
  // First, normalize — remove existing unnecessary whitespace between tags
  let result = html.replace(/>\s+</g, "><");

  // Insert newlines before and after block-level opening/closing tags
  for (const tag of BLOCK_TAGS) {
    // Before opening tags: <p, <div, etc.
    result = result.replace(
      new RegExp(`<${tag}(\\s|>|/)`, "gi"),
      `\n<${tag}$1`,
    );
    // After closing tags: </p>, </div>, etc.
    result = result.replace(new RegExp(`</${tag}>`, "gi"), `</${tag}>\n`);
  }

  // Handle self-closing tags like <img ... /> and <br />
  result = result.replace(/<(img|br|hr)([^>]*)\/?>/gi, "\n<$1$2/>\n");

  // Clean up: remove multiple consecutive newlines, trim
  result = result.replace(/\n{2,}/g, "\n");
  result = result.trim();

  // Simple indentation based on nesting depth
  const lines = result.split("\n");
  let indent = 0;
  const indented: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Decrease indent for closing tags
    if (trimmed.startsWith("</")) {
      indent = Math.max(0, indent - 1);
    }

    indented.push("  ".repeat(indent) + trimmed);

    // Increase indent for opening tags (not self-closing, not void)
    if (
      /^<[a-z][^/]*>$/i.test(trimmed) &&
      !/^<(br|hr|img|input|meta|link)\b/i.test(trimmed)
    ) {
      indent += 1;
    }
  }

  return indented.join("\n");
}

interface HtmlTogglePluginProps {
  isHtmlMode: boolean;
  onToggle: (isHtml: boolean) => void;
}

export function HtmlTogglePlugin({
  isHtmlMode,
  onToggle,
}: HtmlTogglePluginProps) {
  const [editor] = useLexicalComposerContext();
  const [htmlValue, setHtmlValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const htmlValueRef = useRef(htmlValue);

  // Keep ref in sync for the cleanup callback
  useEffect(() => {
    htmlValueRef.current = htmlValue;
  }, [htmlValue]);

  // When entering HTML mode: extract and prettify HTML
  useEffect(() => {
    if (isHtmlMode) {
      editor.getEditorState().read(() => {
        const rawHtml = $generateHtmlFromNodes(editor);
        setHtmlValue(prettifyHtml(rawHtml));
      });
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  }, [isHtmlMode, editor]);

  // When leaving HTML mode: parse HTML back into Lexical nodes
  const applyHtmlToEditor = useCallback(() => {
    const currentHtml = htmlValueRef.current;
    const schedule =
      typeof queueMicrotask === "function"
        ? queueMicrotask
        : (cb: () => void) => Promise.resolve().then(cb);

    schedule(() => {
      editor.update(() => {
        const parser = new DOMParser();
        const dom = parser.parseFromString(currentHtml, "text/html");
        const nodes = $generateNodesFromDOM(editor, dom);

        const root = $getRoot();
        root.clear();
        $insertNodes(nodes);
      });
    });
  }, [editor]);

  // Listen for toggle-off to auto-apply
  const prevModeRef = useRef(isHtmlMode);
  useEffect(() => {
    if (prevModeRef.current && !isHtmlMode) {
      // Was HTML mode, now switching to visual — apply changes
      applyHtmlToEditor();
    }
    prevModeRef.current = isHtmlMode;
  }, [isHtmlMode, applyHtmlToEditor]);

  if (!isHtmlMode) return null;

  return (
    <div className="editor-html-mode">
      <textarea
        ref={textareaRef}
        className="editor-html-textarea"
        value={htmlValue}
        onChange={(e) => setHtmlValue(e.target.value)}
        spellCheck={false}
      />
    </div>
  );
}
