import { db } from "@/lib/db";
import { modelos_veiculo } from "@/lib/db/schema";
import { getSessionUserId } from "@/lib/auth-helpers";
import { or, ilike, asc } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const q = request.nextUrl.searchParams.get("q") || "";

  const conditions = q
    ? or(ilike(modelos_veiculo.marca, `%${q}%`), ilike(modelos_veiculo.modelo, `%${q}%`))
    : undefined;

  const data = await db
    .select()
    .from(modelos_veiculo)
    .where(conditions)
    .orderBy(asc(modelos_veiculo.marca))
    .limit(20);

  return NextResponse.json(data);
}
