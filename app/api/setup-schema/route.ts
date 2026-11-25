import { NextRequest, NextResponse } from 'next/server';
import { initializeDatabaseSchema } from '@/lib/supabase/schema';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const workerSecret = process.env.WORKER_SECRET;
    const isWorker = Boolean(workerSecret && authHeader === `Bearer ${workerSecret}`);

    if (!isWorker) {
      const session = await auth.api.getSession({ headers: await headers() }).catch(() => null);
      if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized: Admin or worker authentication required' }, { status: 401 });
      }
    }

    const result = await initializeDatabaseSchema();
    return NextResponse.json(result);
  } catch (err: any) {
    console.error('[Setup Schema Error]:', err);
    return NextResponse.json(
      { error: err.message || 'Schema setup failed' },
      { status: 500 }
    );
  }
}
