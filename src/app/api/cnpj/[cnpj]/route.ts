import { NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ cnpj: string }> };

export async function GET(_: NextRequest, { params }: Params) {
  const { cnpj } = await params;
  const cnpjLimpo = cnpj.replace(/\D/g, "");

  if (cnpjLimpo.length !== 14) {
    return NextResponse.json({ error: "CNPJ inválido" }, { status: 400 });
  }

  try {
    const response = await fetch(
      `https://receitaws.com.br/v1/cnpj/${cnpjLimpo}`,
      {
        cache: "no-store",
        headers: { Accept: "application/json" },
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: "CNPJ não encontrado" },
        { status: 404 }
      );
    }

    const dados = await response.json();

    if (dados.status === "ERROR") {
      return NextResponse.json(
        { error: dados.message || "CNPJ não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      cnpj: cnpjLimpo,
      razao_social: dados.nome,
      endereco: [
        dados.logradouro,
        dados.numero,
        dados.complemento,
        dados.bairro,
        `${dados.municipio}/${dados.uf}`,
        dados.cep,
      ]
        .filter(Boolean)
        .join(", "),
      email: dados.email || null,
      telefone: dados.telefone || null,
    });
  } catch {
    return NextResponse.json(
      { error: "Erro ao consultar CNPJ" },
      { status: 500 }
    );
  }
}