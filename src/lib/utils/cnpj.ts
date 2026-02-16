/** Remove caracteres não numéricos do CNPJ */
export function limparCnpj(cnpj: string): string {
  return cnpj.replace(/\D/g, "");
}

/** Formata CNPJ: 00.000.000/0000-00 */
export function formatarCnpj(cnpj: string): string {
  const limpo = limparCnpj(cnpj);
  if (limpo.length !== 14) return cnpj;
  return limpo.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    "$1.$2.$3/$4-$5"
  );
}

/** Valida CNPJ com dígitos verificadores */
export function validarCnpj(cnpj: string): boolean {
  const limpo = limparCnpj(cnpj);
  if (limpo.length !== 14) return false;
  if (/^(\d)\1+$/.test(limpo)) return false;

  const calcDigito = (base: string, pesos: number[]) => {
    const soma = base
      .split("")
      .reduce((acc, dig, i) => acc + parseInt(dig) * pesos[i], 0);
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };

  const pesos1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const pesos2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  const dig1 = calcDigito(limpo.slice(0, 12), pesos1);
  const dig2 = calcDigito(limpo.slice(0, 13), pesos2);

  return parseInt(limpo[12]) === dig1 && parseInt(limpo[13]) === dig2;
}
