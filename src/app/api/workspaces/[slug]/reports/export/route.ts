import { NextRequest, NextResponse } from "next/server";

import { buildWorkspaceReports } from "@/lib/reports/workspace-reports";
import {
  getSingleSearchParam,
  getWorkspaceReportData,
} from "@/lib/reports/workspace-report-query";
import { getWorkspaceAccess } from "@/lib/workspaces";

function csvEscape(value: string | number) {
  const stringValue = String(value);

  if (
    stringValue.includes(",") ||
    stringValue.includes('"') ||
    stringValue.includes("\n")
  ) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

function buildCsv(sections: Array<{ title: string; headers: string[]; rows: string[][] }>) {
  const lines: string[] = [];

  for (const [index, section] of sections.entries()) {
    lines.push(section.title);
    lines.push(section.headers.map(csvEscape).join(","));

    for (const row of section.rows) {
      lines.push(row.map(csvEscape).join(","));
    }

    if (index < sections.length - 1) {
      lines.push("");
    }
  }

  return lines.join("\n");
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    const access = await getWorkspaceAccess(slug);

    if (!access?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!access.workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    const status = getSingleSearchParam(req.nextUrl.searchParams.getAll("status"));
    const moduleName = getSingleSearchParam(req.nextUrl.searchParams.getAll("module"));
    const sourceId = getSingleSearchParam(req.nextUrl.searchParams.getAll("sourceId"));

    const reportData = await getWorkspaceReportData({
      slug,
      userId: access.user.id,
      filters: {
        status,
        module: moduleName,
        sourceId,
      },
    });

    if (!reportData) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    const reports = buildWorkspaceReports({
      features: reportData.filteredFeatures,
      sources: reportData.filteredSources,
    });

    const csv = buildCsv([
      {
        title: "Summary",
        headers: ["Metric", "Value"],
        rows: [
          ["Total features", String(reportData.filteredFeatures.length)],
          [
            "Approved features",
            String(
              reports.statusDistribution.find((item) => item.status === "APPROVED")?.count ?? 0
            ),
          ],
          ["Duplicate rows", String(reports.duplicateRows.length)],
          [
            "Sources with coverage",
            String(reports.sourceCoverage.filter((item) => item.featureCount > 0).length),
          ],
          ["Modules represented", String(reports.moduleDistribution.length)],
        ],
      },
      {
        title: "Duplicate Candidates",
        headers: ["Feature", "Possible Duplicate", "Match Score", "Module"],
        rows: reports.duplicateRows.map((row) => [
          row.featureTitle,
          row.candidateTitle,
          String(row.score),
          row.module,
        ]),
      },
      {
        title: "Status Distribution",
        headers: ["Status", "Count"],
        rows: reports.statusDistribution.map((row) => [row.status, String(row.count)]),
      },
      {
        title: "Source Coverage",
        headers: ["Source", "Type", "Documents", "Features", "Approved"],
        rows: reports.sourceCoverage.map((row) => [
          row.sourceName,
          row.sourceType,
          String(row.documentCount),
          String(row.featureCount),
          String(row.approvedCount),
        ]),
      },
      {
        title: "Module Distribution",
        headers: ["Module", "Total", "Approved", "Rejected"],
        rows: reports.moduleDistribution.map((row) => [
          row.module,
          String(row.total),
          String(row.approved),
          String(row.rejected),
        ]),
      },
    ]);

    const fileName = `${reportData.workspace.slug}-reports.csv`;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("GET /api/workspaces/[slug]/reports/export failed:", error);
    return NextResponse.json({ error: "Failed to export reports" }, { status: 500 });
  }
}
