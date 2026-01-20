/**
 * Lexical Editor Schema
 * 
 * Base schema for Lexical rich text content with LaTeX and image support.
 * Used across all item content fields (statement, options, resolution, etc.)
 */

import { z } from "zod";

const LexicalTextNodeSchema = z.object({
  type: z.literal("text"),
  text: z.string(),
  format: z.number().optional(),
  style: z.string().optional(),
  detail: z.number().optional(),
  mode: z.string().optional(),
});

const LexicalLineBreakNodeSchema = z.object({
  type: z.literal("linebreak"),
});

const LexicalImageNodeSchema = z.object({
  type: z.literal("image"),
  src: z.string(),
  altText: z.string().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  caption: z.string().optional(),
});

const LexicalEquationNodeSchema = z.object({
  type: z.literal("equation"),
  equation: z.string(), // LaTeX string
  inline: z.boolean().optional(),
});


const LexicalChildNodeSchema: z.ZodType<unknown> = z.lazy(() =>
  z.union([
    LexicalTextNodeSchema,
    LexicalLineBreakNodeSchema,
    LexicalImageNodeSchema,
    LexicalEquationNodeSchema,
    LexicalParagraphNodeSchema,
    LexicalHeadingNodeSchema,
    LexicalListNodeSchema,
    LexicalListItemNodeSchema,
    LexicalLinkNodeSchema,
  ])
);

const LexicalParagraphNodeSchema = z.object({
  type: z.literal("paragraph"),
  children: z.array(LexicalChildNodeSchema),
  format: z.string().optional(),
  indent: z.number().optional(),
  direction: z.enum(["ltr", "rtl"]).nullable().optional(),
});

const LexicalHeadingNodeSchema = z.object({
  type: z.literal("heading"),
  tag: z.enum(["h1", "h2", "h3", "h4", "h5", "h6"]),
  children: z.array(LexicalChildNodeSchema),
  format: z.string().optional(),
  indent: z.number().optional(),
  direction: z.enum(["ltr", "rtl"]).nullable().optional(),
});

const LexicalListItemNodeSchema = z.object({
  type: z.literal("listitem"),
  value: z.number(),
  children: z.array(LexicalChildNodeSchema),
  checked: z.boolean().optional(),
});

const LexicalListNodeSchema = z.object({
  type: z.literal("list"),
  listType: z.enum(["bullet", "number", "check"]),
  start: z.number(),
  children: z.array(LexicalListItemNodeSchema),
});

const LexicalLinkNodeSchema = z.object({
  type: z.literal("link"),
  url: z.string(),
  children: z.array(LexicalChildNodeSchema),
  target: z.string().optional(),
  rel: z.string().optional(),
});

const LexicalRootNodeSchema = z.object({
  type: z.literal("root"),
  children: z.array(LexicalChildNodeSchema),
  format: z.string().optional(),
  indent: z.number().optional(),
  direction: z.enum(["ltr", "rtl"]).nullable().optional(),
});

/**
 * Complete Lexical Editor State Schema
 * This is what gets stored in JSONB fields
 */
export const LexicalEditorStateSchema = z.object({
  root: LexicalRootNodeSchema,
});

/**
 * Rich content field - can be Lexical state or simple text fallback
 */
export const RichContentSchema = z.union([
  LexicalEditorStateSchema,
  z.string(), // Simple text fallback
]);

/**
 * Optional rich content (nullable)
 */
export const OptionalRichContentSchema = RichContentSchema.nullable().optional();

export type LexicalEditorState = z.infer<typeof LexicalEditorStateSchema>;
export type RichContent = z.infer<typeof RichContentSchema>;
