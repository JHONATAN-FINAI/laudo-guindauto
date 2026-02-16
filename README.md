# Inspeção Guindauto - Sistema de Laudos

PWA para inspeção e geração de laudos técnicos de guindautos (guindastes articulados veiculares).

## Stack

- **Next.js 15** (App Router, React 19)
- **Neon PostgreSQL** + **Drizzle ORM**
- **NextAuth.js v5** (autenticação credentials)
- **Vercel Blob** (upload de fotos)
- **Puppeteer** (geração PDF)
- **Zustand** (estado do wizard)
- **Tailwind CSS**

## Setup

```bash
# 1. Instalar dependências
npm install

# 2. Configurar variáveis de ambiente
cp .env.example .env.local
# Editar .env.local com suas credenciais

# 3. Criar tabelas no Neon
npm run db:push

# 4. Popular textos padrão
npm run db:seed

# 5. Rodar em desenvolvimento
npm run dev
```

## Variáveis de Ambiente

| Variável | Descrição |
|----------|-----------|
| `DATABASE_URL` | Connection string do Neon PostgreSQL |
| `AUTH_SECRET` | Secret do NextAuth (gerar com `openssl rand -base64 32`) |
| `AUTH_URL` | URL da aplicação (http://localhost:3000 em dev) |
| `BLOB_READ_WRITE_TOKEN` | Token do Vercel Blob para upload de fotos |

## Estrutura do Wizard

O laudo é criado em 7 etapas:

1. **Proprietário** - CNPJ, razão social, endereço (busca automática via CNPJ)
2. **Implemento** - Dados do guindauto (fabricante, modelo, capacidades)
3. **Veículo** - Dados do caminhão (placa, chassi, marca)
4. **Características** - Dimensões e dados técnicos do veículo
5. **Inspeções** - 36 itens de verificação conforme NBR 14768
6. **Fotos** - 9 fotos obrigatórias + 5 extras
7. **Conclusão** - Parecer técnico (apto/não apto) + ART

## Scripts

- `npm run dev` - Desenvolvimento
- `npm run build` - Build de produção
- `npm run db:push` - Sincronizar schema com banco
- `npm run db:generate` - Gerar migration
- `npm run db:migrate` - Rodar migrations
- `npm run db:studio` - Drizzle Studio (interface visual)
- `npm run db:seed` - Popular textos padrão
