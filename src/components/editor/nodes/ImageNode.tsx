"use client";

/**
 * Image Node for Lexical Editor
 *
 * A DecoratorNode that displays an image in the editor.
 * Stores: src, altText, width, height, alignment.
 * Block-level node (images get their own line).
 * Includes importDOM() so <img> tags survive HTML round-trips.
 */

import type {
  DOMConversionMap,
  DOMConversionOutput,
  DOMExportOutput,
  EditorConfig,
  LexicalEditor,
  LexicalNode,
  NodeKey,
  SerializedLexicalNode,
  Spread,
} from "lexical";
import { DecoratorNode } from "lexical";
import type React from "react";
import { ImageComponent } from "./ImageComponent";

export type ImageAlignment = "left" | "center" | "right";

export type SerializedImageNode = Spread<
  {
    src: string;
    altText: string;
    width?: number;
    height?: number;
    alignment?: ImageAlignment;
  },
  SerializedLexicalNode
>;

function convertImageElement(domNode: HTMLElement): DOMConversionOutput | null {
  const img = domNode as HTMLImageElement;
  const src = img.getAttribute("src");
  if (!src) return null;

  const altText = img.getAttribute("alt") ?? "";
  const width = img.getAttribute("width");
  const height = img.getAttribute("height");

  const node = $createImageNode({
    src,
    altText,
    width: width ? Number(width) : undefined,
    height: height ? Number(height) : undefined,
  });

  return { node };
}

function convertImageWrapperElement(
  domNode: HTMLElement,
): DOMConversionOutput | null {
  if (!domNode.classList.contains("editor-image-wrapper")) return null;

  const img = domNode.querySelector("img");
  if (!img) return null;

  const src = img.getAttribute("src");
  if (!src) return null;

  const altText = img.getAttribute("alt") ?? "";
  const width = img.getAttribute("width");
  const height = img.getAttribute("height");

  const node = $createImageNode({
    src,
    altText,
    width: width ? Number(width) : undefined,
    height: height ? Number(height) : undefined,
  });

  return { node };
}

export class ImageNode extends DecoratorNode<React.JSX.Element> {
  __src: string;
  __altText: string;
  __width: number | undefined;
  __height: number | undefined;
  __alignment: ImageAlignment;

  static getType(): string {
    return "image";
  }

  static clone(node: ImageNode): ImageNode {
    return new ImageNode(
      node.__src,
      node.__altText,
      node.__width,
      node.__height,
      node.__alignment,
      node.__key,
    );
  }

  constructor(
    src: string,
    altText: string,
    width?: number,
    height?: number,
    alignment: ImageAlignment = "center",
    key?: NodeKey,
  ) {
    super(key);
    this.__src = src;
    this.__altText = altText;
    this.__width = width;
    this.__height = height;
    this.__alignment = alignment;
  }

  // --- Serialization ---

  static importJSON(serializedNode: SerializedImageNode): ImageNode {
    return $createImageNode({
      src: serializedNode.src,
      altText: serializedNode.altText,
      width: serializedNode.width,
      height: serializedNode.height,
      alignment: serializedNode.alignment,
    });
  }

  exportJSON(): SerializedImageNode {
    return {
      src: this.__src,
      altText: this.__altText,
      width: this.__width,
      height: this.__height,
      alignment: this.__alignment,
      type: "image",
      version: 1,
    };
  }

  // --- DOM import/export ---

  static importDOM(): DOMConversionMap | null {
    return {
      img: () => ({
        conversion: convertImageElement,
        priority: 0,
      }),
      div: (domNode: HTMLElement) => {
        if (!domNode.classList.contains("editor-image-wrapper")) {
          return null;
        }
        return {
          conversion: convertImageWrapperElement,
          priority: 1,
        };
      },
      span: (domNode: HTMLElement) => {
        if (!domNode.classList.contains("editor-image-wrapper")) {
          return null;
        }
        return {
          conversion: convertImageWrapperElement,
          priority: 1,
        };
      },
    };
  }

  createDOM(_config: EditorConfig): HTMLElement {
    const span = document.createElement("span");
    span.className = "editor-image-wrapper";
    return span;
  }

  updateDOM(prevNode: ImageNode, dom: HTMLElement): boolean {
    return false;
  }

  exportDOM(): DOMExportOutput {
    const wrapper = document.createElement("span");
    wrapper.className = "editor-image-wrapper";

    const img = document.createElement("img");
    img.setAttribute("src", this.__src);
    img.setAttribute("alt", this.__altText);
    if (this.__width) img.setAttribute("width", String(this.__width));
    if (this.__height) img.setAttribute("height", String(this.__height));

    wrapper.appendChild(img);

    return { element: wrapper };
  }

  // --- Getters & setters ---

  getSrc(): string {
    return this.__src;
  }

  getAltText(): string {
    return this.__altText;
  }

  getAlignment(): ImageAlignment {
    return this.__alignment;
  }

  setAlignment(alignment: ImageAlignment): void {
    const writable = this.getWritable();
    writable.__alignment = alignment;
  }

  setWidthAndHeight(width?: number, height?: number): void {
    const writable = this.getWritable();
    writable.__width = width;
    writable.__height = height;
  }

  // Block-level node
  isInline(): boolean {
    return true;
  }

  // --- Decorator ---

  decorate(_editor: LexicalEditor, _config: EditorConfig): React.JSX.Element {
    return (
      <ImageComponent
        src={this.__src}
        altText={this.__altText}
        width={this.__width}
        height={this.__height}
        nodeKey={this.__key}
      />
    );
  }
}

// --- Helpers ---

export function $createImageNode({
  src,
  altText,
  width,
  height,
  alignment,
}: {
  src: string;
  altText: string;
  width?: number;
  height?: number;
  alignment?: ImageAlignment;
}): ImageNode {
  return new ImageNode(src, altText, width, height, alignment ?? "center");
}

export function $isImageNode(
  node: LexicalNode | null | undefined,
): node is ImageNode {
  return node instanceof ImageNode;
}
