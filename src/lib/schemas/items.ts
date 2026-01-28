/**
 * Item Types Registry
 *
 * Defines all item types with their structure and answer schemas.
 * Based on specifications from general_plan.md "Tipos de itens" section.
 * 
 * CHANGES FROM ORIGINAL:
 * - Uses relaxed LexicalEditorStateSchema that accepts any Lexical format
 * - Keeps strict validation for domain-specific fields (choices, correctIndex, etc.)
 */

import { z } from "zod";
import { RichContentSchema, OptionalRichContentSchema } from "./lexical";

// =============================================================================
// SHARED SCHEMAS
// =============================================================================

/**
 * Common fields present in all item types
 */
export const BaseItemFieldsSchema = z.object({
  baseText: OptionalRichContentSchema,
  statement: RichContentSchema,
  resolution: OptionalRichContentSchema,
});

/**
 * Single choice/option with optional comment/justification
 */
export const ChoiceSchema = z.object({
  id: z.string(),
  content: RichContentSchema,
  comment: OptionalRichContentSchema,
});

// =============================================================================
// 1. MCQ SINGLE - Múltipla Escolha de Resposta Única
// =============================================================================

export const MCQSingleStructureSchema = z.object({
  choices: z.array(ChoiceSchema).min(2),
  correctIndex: z.number().int().min(0),
});

export const MCQSingleAnswerSchema = z.object({
  selectedIndex: z.number().int(),
});

// =============================================================================
// 2. MCQ MULTIPLE - Múltipla Escolha de Respostas Múltiplas
// =============================================================================

export const MCQMultipleScoringModeSchema = z.enum([
  "all_correct_only",
  "at_least_x",
  "at_most_x",
]);

export const MCQMultipleStructureSchema = z.object({
  choices: z.array(ChoiceSchema).min(2),
  correctIndices: z.array(z.number().int().min(0)),
  scoringMode: MCQMultipleScoringModeSchema.default("all_correct_only"),
  scoringThreshold: z.number().int().min(1).optional(),
});

export const MCQMultipleAnswerSchema = z.object({
  selectedIndices: z.array(z.number().int()),
});

// =============================================================================
// 3. TRUE FALSE SIMPLE - Certo/Errado Simples
// =============================================================================

export const TrueFalseStructureSchema = z.object({
  correctAnswer: z.boolean(),
});

export const TrueFalseAnswerSchema = z.object({
  selected: z.boolean(),
});

// =============================================================================
// 4. TRUE FALSE MULTI - Múltiplo Certo/Errado
// =============================================================================

export const TrueFalseStatementSchema = z.object({
  id: z.string(),
  content: RichContentSchema,
  comment: OptionalRichContentSchema,
  isTrue: z.boolean(),
});

export const TrueFalseMultiStructureSchema = z.object({
  statements: z.array(TrueFalseStatementSchema).min(2),
  generalComment: OptionalRichContentSchema,
});

export const TrueFalseMultiAnswerSchema = z.object({
  answers: z.record(z.string(), z.boolean()),
});

// =============================================================================
// 5. FILL BLANK - Completar Lacunas
// =============================================================================

export const BlankSchema = z.object({
  id: z.string(),
  /** Position in text where blank appears */
  position: z.number().int(),
  /** Accepted correct answers for this blank */
  acceptedAnswers: z.array(z.string()).min(1),
  /** Whether to match case-sensitively */
  caseSensitive: z.boolean().default(false),
});

export const FillBlankStructureSchema = z.object({
  /** Template text with blank markers (e.g., "The {{blank_1}} is blue") */
  templateText: RichContentSchema,
  /** Definition of each blank */
  blanks: z.array(BlankSchema).min(1),
  wordBank: z.array(z.string()).optional(),
  showUsedWords: z.boolean().default(true),
  inputMode: z.enum(["click", "drag", "type"]).default("click"),
});

export const FillBlankAnswerSchema = z.object({
  answers: z.record(z.string(), z.string()),
});

// =============================================================================
// 6. MATCHING - Correspondência ("de ligar")
// =============================================================================

export const MatchingColumnItemSchema = z.object({
  id: z.string(),
  content: RichContentSchema,
});

export const MatchingColumnSchema = z.object({
  id: z.string(),
  items: z.array(MatchingColumnItemSchema),
});

export const MatchingConnectionSchema = z.object({
  leftId: z.string(),
  rightId: z.string(),
});

export const MatchingStructureSchema = z.object({
  leftColumn: MatchingColumnSchema,
  rightColumn: MatchingColumnSchema,
  correctConnections: z.array(MatchingConnectionSchema),
  orientation: z.enum(["horizontal", "vertical"]).default("horizontal"),
  inputMode: z.enum(["drag", "click"]).default("click"),
});

export const MatchingAnswerSchema = z.object({
  connections: z.array(MatchingConnectionSchema),
});

// =============================================================================
// UNIFIED SCHEMAS
// =============================================================================

/**
 * Item type enum matching database values
 */
export const ItemTypeSchema = z.enum([
  "mcq_single",
  "mcq_multiple",
  "true_false",
  "true_false_multi",
  "fill_blank",
  "matching",
]);

export type ItemType = z.infer<typeof ItemTypeSchema>;

/**
 * Maps item type to its structure schema
 * Used for validation in create/update mutations
 */
export const ItemStructureSchemas = {
  mcq_single: MCQSingleStructureSchema,
  mcq_multiple: MCQMultipleStructureSchema,
  true_false: TrueFalseStructureSchema,
  true_false_multi: TrueFalseMultiStructureSchema,
  fill_blank: FillBlankStructureSchema,
  matching: MatchingStructureSchema,
} as const;

/**
 * Maps item type to its answer schema
 * Used for validation in response submission
 */
export const ItemAnswerSchemas = {
  mcq_single: MCQSingleAnswerSchema,
  mcq_multiple: MCQMultipleAnswerSchema,
  true_false: TrueFalseAnswerSchema,
  true_false_multi: TrueFalseMultiAnswerSchema,
  fill_blank: FillBlankAnswerSchema,
  matching: MatchingAnswerSchema,
} as const;

// Type exports
export type MCQSingleStructure = z.infer<typeof MCQSingleStructureSchema>;
export type MCQMultipleStructure = z.infer<typeof MCQMultipleStructureSchema>;
export type TrueFalseStructure = z.infer<typeof TrueFalseStructureSchema>;
export type TrueFalseMultiStructure = z.infer<typeof TrueFalseMultiStructureSchema>;
export type FillBlankStructure = z.infer<typeof FillBlankStructureSchema>;
export type MatchingStructure = z.infer<typeof MatchingStructureSchema>;

export type MCQSingleAnswer = z.infer<typeof MCQSingleAnswerSchema>;
export type MCQMultipleAnswer = z.infer<typeof MCQMultipleAnswerSchema>;
export type TrueFalseAnswer = z.infer<typeof TrueFalseAnswerSchema>;
export type TrueFalseMultiAnswer = z.infer<typeof TrueFalseMultiAnswerSchema>;
export type FillBlankAnswer = z.infer<typeof FillBlankAnswerSchema>;
export type MatchingAnswer = z.infer<typeof MatchingAnswerSchema>;
