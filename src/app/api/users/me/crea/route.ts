import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { getSessionUserId } from "@/lib/auth-helpers";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const [data] = await db
    .select({ crea_numero: users.crea_numero, crea_estado: users.crea_estado })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return NextResponse.json(data);
}

export async function PUT(request: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { crea_numero, crea_estado } = await request.json();

  const [data] = await db
    .update(users)
    .set({ crea_numero, crea_estado })
    .where(eq(users.id, userId))
    .returning({ crea_numero: users.crea_numero, crea_estado: users.crea_estado });

  return NextResponse.json(data);
}
