/**
 * GET /api/migrate?secret=SETUP_SECRET
 * Aplica migrations de enum e colunas faltantes no banco.
 * Seguro para rodar múltiplas vezes (idempotente).
 */
import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");
  if (!secret || secret !== process.env.SETUP_SECRET) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const sql = neon(process.env.DATABASE_URL!);
  const resultados: string[] = [];

  const steps: { descricao: string; query: string }[] = [
    // Enum tipo_foto — novos valores
    {
      descricao: "ADD botao_emergencia",
      query: `ALTER TYPE tipo_foto ADD VALUE IF NOT EXISTS 'botao_emergencia'`,
    },
    {
      descricao: "ADD controle_remoto",
      query: `ALTER TYPE tipo_foto ADD VALUE IF NOT EXISTS 'controle_remoto'`,
    },
    {
      descricao: "ADD valvulas",
      query: `ALTER TYPE tipo_foto ADD VALUE IF NOT EXISTS 'valvulas'`,
    },
    {
      descricao: "ADD lateral_dianteira_esq",
      query: `ALTER TYPE tipo_foto ADD VALUE IF NOT EXISTS 'lateral_dianteira_esq'`,
    },
    {
      descricao: "ADD lateral_dianteira_dir",
      query: `ALTER TYPE tipo_foto ADD VALUE IF NOT EXISTS 'lateral_dianteira_dir'`,
    },
    {
      descricao: "ADD lateral_traseira_esq",
      query: `ALTER TYPE tipo_foto ADD VALUE IF NOT EXISTS 'lateral_traseira_esq'`,
    },
    {
      descricao: "ADD lateral_traseira_dir",
      query: `ALTER TYPE tipo_foto ADD VALUE IF NOT EXISTS 'lateral_traseira_dir'`,
    },
    {
      descricao: "ADD extra_1",
      query: `ALTER TYPE tipo_foto ADD VALUE IF NOT EXISTS 'extra_1'`,
    },
    {
      descricao: "ADD extra_2",
      query: `ALTER TYPE tipo_foto ADD VALUE IF NOT EXISTS 'extra_2'`,
    },
    {
      descricao: "ADD extra_3",
      query: `ALTER TYPE tipo_foto ADD VALUE IF NOT EXISTS 'extra_3'`,
    },
    // Coluna hodometro na tabela veiculos
    {
      descricao: "ADD COLUMN veiculos.hodometro",
      query: `ALTER TABLE veiculos ADD COLUMN IF NOT EXISTS hodometro TEXT`,
    },
  ];

  for (const step of steps) {
    try {
      await sql(step.query);
      resultados.push(`✅ ${step.descricao}`);
    } catch (err: any) {
      resultados.push(`❌ ${step.descricao}: ${err?.message}`);
    }
  }

  // Confirmar estado atual do enum
  try {
    const rows = await sql`
      SELECT enumlabel
      FROM pg_enum
      JOIN pg_type ON pg_enum.enumtypid = pg_type.oid
      WHERE pg_type.typname = 'tipo_foto'
      ORDER BY enumsortorder
    `;
    resultados.push("", "Valores atuais de tipo_foto:");
    rows.forEach((r: any) => resultados.push(`  • ${r.enumlabel}`));
  } catch (err: any) {
    resultados.push(`Erro ao verificar enum: ${err?.message}`);
  }

  return NextResponse.json({ ok: true, resultados }, { status: 200 });
}
