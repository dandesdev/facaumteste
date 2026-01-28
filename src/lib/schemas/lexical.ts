/**
 * Lexical Editor Schema (Relaxed)
 *
 * Provides type safety for Lexical rich text content without strict validation
 * of internal node structure. This allows Lexical to evolve without breaking tRPC.
 * 
 * RATIONALE: Lexical's internal format changes with plugins and versions.
 * We validate the top-level shape but accept any valid Lexical state.
 */

import { z } from "zod";
import type { SerializedEditorState } from "lexical";

/**
 * Relaxed Lexical Editor State Schema
 * 
 * Uses z.custom() to be compatible with Lexical's SerializedEditorState type
 * while still performing runtime validation of the expected structure.
 * 
 * This approach avoids TypeScript errors from index signature incompatibilities
 * between Zod's inferred types and Lexical's SerializedEditorState.
 */
export const LexicalEditorStateSchema = z.custom<SerializedEditorState>(
  (val): val is SerializedEditorState => {
    // Runtime validation: must be an object with a root property
    if (typeof val !== "object" || val === null) return false;
    const obj = val as Record<string, unknown>;
    if (!obj.root || typeof obj.root !== "object") return false;
    const root = obj.root as Record<string, unknown>;
    // Root must have children array
    if (!Array.isArray(root.children)) return false;
    return true;
  },
  { message: "Invalid Lexical editor state - must have root.children array" }
);

/**
 * Rich content field - can be Lexical state or simple text fallback
 * 
 * Usage in item schemas:
 * - statement: RichContentSchema (required)
 * - resolution: OptionalRichContentSchema (optional)
 * - choice.content: RichContentSchema
 */
export const RichContentSchema = z.union([
  LexicalEditorStateSchema,
  z.string(), // Simple text fallback for testing/migration
]);

/**
 * Optional rich content (nullable)
 */
export const OptionalRichContentSchema = RichContentSchema.nullable().optional();

// Type exports - use Lexical's native type for best compatibility
export type LexicalEditorState = SerializedEditorState;
export type RichContent = z.infer<typeof RichContentSchema>;

