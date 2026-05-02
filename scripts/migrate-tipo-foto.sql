-- Migration: adiciona valores faltantes ao enum tipo_foto
-- Execute UMA VEZ no banco de produção (Neon console ou psql)
-- Cada ADD VALUE é idempotente no Postgres 9.6+

ALTER TYPE tipo_foto ADD VALUE IF NOT EXISTS 'botao_emergencia';
ALTER TYPE tipo_foto ADD VALUE IF NOT EXISTS 'controle_remoto';
ALTER TYPE tipo_foto ADD VALUE IF NOT EXISTS 'valvulas';
ALTER TYPE tipo_foto ADD VALUE IF NOT EXISTS 'lateral_dianteira_esq';
ALTER TYPE tipo_foto ADD VALUE IF NOT EXISTS 'lateral_dianteira_dir';
ALTER TYPE tipo_foto ADD VALUE IF NOT EXISTS 'lateral_traseira_esq';
ALTER TYPE tipo_foto ADD VALUE IF NOT EXISTS 'lateral_traseira_dir';
ALTER TYPE tipo_foto ADD VALUE IF NOT EXISTS 'extra_1';
ALTER TYPE tipo_foto ADD VALUE IF NOT EXISTS 'extra_2';
ALTER TYPE tipo_foto ADD VALUE IF NOT EXISTS 'extra_3';

-- Adicionar hodometro na tabela veiculos se ainda nao existir
ALTER TABLE veiculos ADD COLUMN IF NOT EXISTS hodometro TEXT;

-- Confirmar valores atuais do enum
SELECT enumlabel FROM pg_enum
JOIN pg_type ON pg_enum.enumtypid = pg_type.oid
WHERE pg_type.typname = 'tipo_foto'
ORDER BY enumsortorder;
