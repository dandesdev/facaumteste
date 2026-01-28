/**
 * Schema Exports
 * 
 * Centralized exports for all Zod schemas used in the application.
 */

// Lexical rich text content schemas
export {
  LexicalEditorStateSchema,
  RichContentSchema,
  OptionalRichContentSchema,
  type LexicalEditorState,
  type RichContent,
} from "./lexical";

// Item type schemas
export {
  // Shared
  BaseItemFieldsSchema,
  ChoiceSchema,
  ItemTypeSchema,
  ItemStructureSchemas,
  ItemAnswerSchemas,
  
  // MCQ Single
  MCQSingleStructureSchema,
  MCQSingleAnswerSchema,
  
  // MCQ Multiple
  MCQMultipleScoringModeSchema,
  MCQMultipleStructureSchema,
  MCQMultipleAnswerSchema,
  
  // True/False
  TrueFalseStructureSchema,
  TrueFalseAnswerSchema,
  
  // True/False Multi
  TrueFalseStatementSchema,
  TrueFalseMultiStructureSchema,
  TrueFalseMultiAnswerSchema,
  
  // Fill Blank
  BlankSchema,
  FillBlankStructureSchema,
  FillBlankAnswerSchema,
  
  // Matching
  MatchingColumnSchema,
  MatchingConnectionSchema,
  MatchingStructureSchema,
  MatchingAnswerSchema,
  
  // Types
  type ItemType,
  type MCQSingleStructure,
  type MCQMultipleStructure,
  type TrueFalseStructure,
  type TrueFalseMultiStructure,
  type FillBlankStructure,
  type MatchingStructure,
  type MCQSingleAnswer,
  type MCQMultipleAnswer,
  type TrueFalseAnswer,
  type TrueFalseMultiAnswer,
  type FillBlankAnswer,
  type MatchingAnswer,
} from "./items";
