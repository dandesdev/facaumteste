"use client";

import type {
  DOMConversionMap,
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
import { EquationComponent } from "./EquationComponent";

export type SerializedEquationNode = Spread<
  {
    equation: string;
    inline: boolean;
  },
  SerializedLexicalNode
>;

export class EquationNode extends DecoratorNode<React.JSX.Element> {
  __equation: string;
  __inline: boolean;

  static getType(): string {
    return "equation";
  }

  static clone(node: EquationNode): EquationNode {
    return new EquationNode(node.__equation, node.__inline, node.__key);
  }

  constructor(equation: string, inline: boolean, key?: NodeKey) {
    super(key);
    this.__equation = equation;
    this.__inline = inline;
  }

  // --- Serialization (how data is saved to/loaded from JSON) ---

  static importJSON(serializedNode: SerializedEquationNode): EquationNode {
    return $createEquationNode(serializedNode.equation, serializedNode.inline);
  }

  exportJSON(): SerializedEquationNode {
    return {
      equation: this.__equation,
      inline: this.__inline,
      type: "equation",
      version: 1,
    };
  }

  // --- DOM creation ---

  createDOM(_config: EditorConfig): HTMLElement {
    const element = this.__inline
      ? document.createElement("span")
      : document.createElement("div");
    element.className = this.__inline
      ? "editor-equation-inline"
      : "editor-equation-block";
    return element;
  }

  updateDOM(_prevNode: EquationNode): boolean {
    // Return true if the DOM needs to be recreated (e.g., inline changed)
    return this.__inline !== _prevNode.__inline;
  }

  // --- DOM export (for copy/paste, HTML export) ---

  exportDOM(): DOMExportOutput {
    const element = this.__inline
      ? document.createElement("span")
      : document.createElement("div");
    element.setAttribute("data-lexical-equation", this.__equation);
    element.setAttribute("data-lexical-inline", String(this.__inline));
    return { element };
  }

  static importDOM(): DOMConversionMap | null {
    return null;
  }

  // --- Getters & setters ---

  getEquation(): string {
    return this.__equation;
  }

  setEquation(equation: string): void {
    const writable = this.getWritable();
    writable.__equation = equation;
  }

  getInline(): boolean {
    return this.__inline;
  }

  // --- Layout ---

  isInline(): boolean {
    return this.__inline;
  }

  // --- Decorator (the React component to render) ---

  decorate(editor: LexicalEditor, _config: EditorConfig): React.JSX.Element {
    return (
      <EquationComponent
        equation={this.__equation}
        inline={this.__inline}
        nodeKey={this.__key}
      />
    );
  }
}

// --- Helper functions (Lexical convention: $-prefixed) ---

export function $createEquationNode(
  equation = "",
  inline = true,
): EquationNode {
  return new EquationNode(equation, inline);
}

export function $isEquationNode(
  node: LexicalNode | null | undefined,
): node is EquationNode {
  return node instanceof EquationNode;
}
