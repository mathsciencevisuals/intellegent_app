import { SourceType } from "@/generated/prisma/client";

export const SOURCE_TYPE_LABELS: Record<SourceType, string> = {
  MANUAL_UPLOAD: "Manual Upload",
  JIRA: "Jira",
  AZURE_DEVOPS: "Azure DevOps",
  CONFLUENCE: "Confluence",
  NOTION: "Notion",
  SHAREPOINT: "SharePoint",
};

export const SYNC_FREQUENCY_LABELS = {
  MANUAL: "Manual",
  DAILY: "Daily",
  WEEKLY: "Weekly",
} as const;
