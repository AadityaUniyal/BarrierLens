import { NextResponse } from 'next/server';
import { supabaseServices } from '@/lib/supabase/services';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const report = await supabaseServices.runAllTests();
    const allHealthy = report.results.every((s) => s.status !== 'failed');

    return NextResponse.json(
      {
        status: allHealthy ? 'ok' : 'degraded',
        project: {
          url: supabaseServices.config.supabaseUrl,
        },
        services: report.results,
        timestamp: report.timestamp,
        allPassed: report.allPassed,
      },
      { status: allHealthy ? 200 : 503 }
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
