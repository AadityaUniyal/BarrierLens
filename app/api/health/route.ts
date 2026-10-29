import { NextResponse } from 'next/server';
import { neonServices } from '@/lib/neon/services';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const report = await neonServices.runFullDiagnostics();
    const allHealthy = report.services.every((s) => s.status !== 'failed');

    return NextResponse.json(
      {
        status: allHealthy ? 'ok' : 'degraded',
        project: {
          id: neonServices.config.projectId,
          org: neonServices.config.orgId,
          branch: neonServices.config.branch,
        },
        ...report,
      },
      { status: allHealthy ? 200 : 207 }
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        status: 'error',
        error: err.message,
      },
      { status: 500 }
    );
  }
}
