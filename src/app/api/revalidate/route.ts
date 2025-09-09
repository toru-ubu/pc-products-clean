import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';

export async function POST(request: NextRequest) {
  const auth = request.headers.get('authorization') || '';
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { path, tag } = body || {};

    if (tag) {
      revalidateTag(tag);
    }
    if (path) {
      revalidatePath(path);
    }

    // 既定: RTX4060ページを更新
    revalidatePath('/db/rtx4060');
    revalidateTag('rtx4060');

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true });
}



