import { NextResponse } from 'next/server';
import { sql } from '@/lib/supabase/db';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

import { getAuthenticatedContext, unauthorizedResponse } from '@/lib/barrierlens/security/auth-guard';

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
    const isSample = !session?.user || userId === 'sample_user';
    const { id } = await params;

    const [journey] = isSample
      ? await sql`
          SELECT id, website_id, user_id, name, description, starting_url, steps, criticality, version, created_at, updated_at
          FROM journeys
          WHERE id = ${id} AND user_id = 'sample_user'
        `
      : await sql`
          SELECT id, website_id, user_id, name, description, starting_url, steps, criticality, version, created_at, updated_at
          FROM journeys
          WHERE id = ${id} AND user_id = ${userId}
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
    const authCtx = await getAuthenticatedContext(req);
    if (!authCtx) return unauthorizedResponse('Sign in to delete journeys');
    const userId = authCtx.userId;
    const { id } = await params;

    if (id.startsWith('journey_sample_')) {
      return NextResponse.json({ error: 'Cannot delete read-only showcase journey' }, { status: 403 });
    }

    await sql`
      DELETE FROM journeys
      WHERE id = ${id} AND user_id = ${userId}
    `;

    return NextResponse.json({ success: true, id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
