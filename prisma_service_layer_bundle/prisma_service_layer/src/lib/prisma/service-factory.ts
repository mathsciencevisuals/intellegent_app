import { prisma } from './client';
import { DocumentService, FeatureService, PipelineService, ReportService, SourceService, WorkspaceService } from './services';

export const services = {
  workspace: new WorkspaceService(prisma),
  source: new SourceService(prisma),
  document: new DocumentService(prisma),
  pipeline: new PipelineService(prisma),
  feature: new FeatureService(prisma),
  report: new ReportService(prisma),
};
