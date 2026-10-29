import { NextResponse } from 'next/server';
import { initializeDatabaseSchema } from '@/lib/neon/schema';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const result = await initializeDatabaseSchema();
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message, stack: err.stack },
      { status: 500 }
    );
  }
}
