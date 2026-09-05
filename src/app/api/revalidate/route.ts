import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const tag = body?.tag as string | undefined;
    const secret = body?.secret as string | undefined;

    // Optional secret check: if REVALIDATE_SECRET is set, require it
    const expected = process.env.REVALIDATE_SECRET;
    if (expected && secret !== expected) {
      return NextResponse.json({ ok: false, error: "Invalid secret" }, { status: 401 });
    }

    const targetTag = tag || "config";
    // @ts-expect-error Next 16 revalidateTag expects profile arg in some builds
    revalidateTag(targetTag);
    return NextResponse.json({ ok: true, tag: targetTag, revalidated: true }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}

// Allow GET for manual testing
export async function GET() {
  // @ts-expect-error Next 16 revalidateTag expects profile arg in some builds
  revalidateTag("config");
  return NextResponse.json({ ok: true, tag: "config" }, { status: 200 });
}
