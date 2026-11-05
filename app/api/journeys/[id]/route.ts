import { NextResponse } from 'next/server';
import { sql } from '@/lib/neon/db';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    }).catch(() => null);

    const userId = session?.user?.id || 'sample_user';
    const { id } = await params;

    const [journey] = await sql`
      SELECT id, website_id, user_id, name, description, starting_url, steps, criticality, version, created_at, updated_at
      FROM journeys
      WHERE id = ${id} AND (user_id = ${userId} OR ${userId} = 'sample_user')
    `;

    if (!journey) {
      return NextResponse.json({ error: 'Journey not found' }, { status: 404 });
    }

    return NextResponse.json({ journey });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    }).catch(() => null);

    const userId = session?.user?.id || 'sample_user';
    const { id } = await params;

    await sql`
      DELETE FROM journeys
      WHERE id = ${id} AND (user_id = ${userId} OR ${userId} = 'sample_user')
    `;

    return NextResponse.json({ success: true, id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
