-- Remove o valor padrão 'SAO PAULO' da coluna pix_cidade
ALTER TABLE condos ALTER COLUMN pix_cidade DROP DEFAULT;

-- Opcional: Limpar 'SAO PAULO' de registros existentes onde pode ter sido inserido automaticamente e não desejado?
-- Melhor não alterar dados existentes sem certeza, apenas evitar novos.
