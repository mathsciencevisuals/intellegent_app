import { z } from 'zod';

export const membershipRoleSchema = z.enum([
  'OWNER',
  'ADMIN',
  'PRODUCT_MANAGER',
  'ANALYST',
  'REVIEWER',
  'VIEWER',
  'BILLING_ADMIN',
]);

export const sourceTypeSchema = z.enum([
  'JIRA',
  'AZURE_DEVOPS',
  'CONFLUENCE',
  'NOTION',
  'SHAREPOINT',
  'GOOGLE_DRIVE',
  'PDF_UPLOAD',
  'DOC_UPLOAD',
  'API',
  'CSV',
  'EMAIL',
]);

export const sourceStatusSchema = z.enum([
  'PENDING',
  'CONNECTED',
  'ACTIVE',
  'PAUSED',
  'ERROR',
  'DISCONNECTED',
]);

export const documentTypeSchema = z.enum([
  'PDF',
  'DOCX',
  'TXT',
  'HTML',
  'MARKDOWN',
  'JIRA_ISSUE',
  'ADO_WORK_ITEM',
  'CONFLUENCE_PAGE',
  'NOTION_PAGE',
  'SHAREPOINT_FILE',
  'EMAIL_MESSAGE',
  'API_PAYLOAD',
  'CSV_ROWSET',
]);

export const documentStatusSchema = z.enum([
  'UPLOADED',
  'INDEXED',
  'PROCESSING',
  'EXTRACTED',
  'REVIEW_REQUIRED',
  'FAILED',
  'ARCHIVED',
]);

export const extractionJobTypeSchema = z.enum([
  'INGEST',
  'PARSE',
  'EXTRACT_FEATURES',
  'DEDUPLICATE',
  'CLASSIFY',
  'EMBED',
  'REPROCESS',
  'GENERATE_REPORT',
]);

export const extractionJobStatusSchema = z.enum([
  'QUEUED',
  'RUNNING',
  'SUCCEEDED',
  'PARTIAL',
  'FAILED',
  'CANCELLED',
]);

export const featureStatusSchema = z.enum([
  'CANDIDATE',
  'IN_REVIEW',
  'APPROVED',
  'REJECTED',
  'MERGED',
  'ARCHIVED',
  'SHIPPED',
]);

export const featurePrioritySchema = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);
export const approvalStatusSchema = z.enum(['PENDING', 'APPROVED', 'REJECTED', 'CHANGES_REQUESTED']);
export const relationTypeSchema = z.enum([
  'DUPLICATE_OF',
  'RELATED_TO',
  'DEPENDS_ON',
  'BLOCKS',
  'PARENT_OF',
  'CHILD_OF',
  'SAME_THEME_AS',
  'DERIVED_FROM',
]);
export const commentVisibilitySchema = z.enum(['INTERNAL', 'WORKSPACE', 'PRIVATE']);
export const reportTypeSchema = z.enum([
  'DUPLICATE_EFFORT',
  'FEATURE_COVERAGE',
  'TREND',
  'TEAM_DISTRIBUTION',
  'GAP_ANALYSIS',
  'ROADMAP_CANDIDATES',
  'CUSTOM',
]);
export const reportStatusSchema = z.enum(['DRAFT', 'GENERATING', 'READY', 'FAILED', 'ARCHIVED']);
export const savedViewScopeSchema = z.enum(['PRIVATE', 'TEAM', 'WORKSPACE']);
export const billingPlanSchema = z.enum(['STARTER', 'GROWTH', 'ENTERPRISE', 'CUSTOM']);
