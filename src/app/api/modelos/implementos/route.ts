import { db } from "@/lib/db";
import { modelos_implemento } from "@/lib/db/schema";
import { getSessionUserId } from "@/lib/auth-helpers";
import { or, ilike, asc } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const q = request.nextUrl.searchParams.get("q") || "";

  const conditions = q
    ? or(ilike(modelos_implemento.fabricante, `%${q}%`), ilike(modelos_implemento.modelo, `%${q}%`))
    : undefined;

  const data = await db
    .select()
    .from(modelos_implemento)
    .where(conditions)
    .orderBy(asc(modelos_implemento.fabricante))
    .limit(20);

  return NextResponse.json(data);
}
