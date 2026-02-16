import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { nome, email, senha } = await request.json();

  if (!nome || !email || !senha) {
    return NextResponse.json({ error: "Nome, email e senha são obrigatórios" }, { status: 400 });
  }

  if (senha.length < 6) {
    return NextResponse.json({ error: "A senha deve ter pelo menos 6 caracteres" }, { status: 400 });
  }

  // Verifica se email já existe
  const [existente] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existente) {
    return NextResponse.json({ error: "Email já cadastrado" }, { status: 409 });
  }

  const senha_hash = await hash(senha, 12);

  const [user] = await db
    .insert(users)
    .values({ nome, email, senha_hash })
    .returning({ id: users.id, email: users.email, nome: users.nome });

  return NextResponse.json(user, { status: 201 });
}
