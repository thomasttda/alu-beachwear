-- ============================================
-- Alu Beachwear - Supabase Database Setup
-- Execute tudo no SQL Editor do Supabase
-- ============================================

-- 1. TABELA DE PRODUTOS
CREATE TABLE IF NOT EXISTS public.products (
  id BIGINT PRIMARY KEY,
  name TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  description TEXT DEFAULT '',
  image TEXT DEFAULT '/biquini-1.png',
  colors TEXT[] DEFAULT '{}',
  sizes TEXT[] DEFAULT '{}',
  collection TEXT DEFAULT '',
  stock JSONB DEFAULT '{"total": 0}',
  featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABELA DE VENDAS
CREATE TABLE IF NOT EXISTS public.sales (
  id BIGINT PRIMARY KEY,
  customer_name TEXT DEFAULT 'Cliente',
  customer_email TEXT DEFAULT '',
  items JSONB DEFAULT '[]',
  total NUMERIC(10,2) DEFAULT 0,
  date DATE DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'Concluído',
  type TEXT DEFAULT 'online',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABELA DE FLUXO DE CAIXA
CREATE TABLE IF NOT EXISTS public.cash_flow (
  id BIGINT PRIMARY KEY,
  description TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('entrada', 'saida')),
  category TEXT DEFAULT 'Outros',
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABELA DE CONFIGURAÇÕES (homepage)
CREATE TABLE IF NOT EXISTS public.settings (
  id BIGINT PRIMARY KEY DEFAULT 1,
  hero_image TEXT DEFAULT '/foto_inicio.png',
  hero_title TEXT DEFAULT 'Essência do Sol',
  hero_subtitle TEXT DEFAULT 'Moda praia que celebra sua beleza natural.',
  about_image TEXT DEFAULT '/prazer alu.png',
  about_title TEXT DEFAULT 'Prazer, Alu!',
  about_text TEXT DEFAULT 'Somos uma marca de beachwear.',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TABELA DE CREDENCIAIS ADMIN
CREATE TABLE IF NOT EXISTS public.admin_creds (
  id BIGINT PRIMARY KEY DEFAULT 1,
  email TEXT NOT NULL DEFAULT 'alu@admin.com',
  password TEXT NOT NULL DEFAULT 'admin@alu',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SEED DATA (dados iniciais)
-- ============================================

-- Inserir configurações padrão (apenas se vazio)
INSERT INTO public.settings (id, hero_image, hero_title, hero_subtitle, about_image, about_title, about_text)
SELECT 1, '/foto_inicio.png', 'Essência do Sol', 'Moda praia que celebra sua beleza natural. Conforto, estilo e sustentabilidade em cada peça.', '/prazer alu.png', 'Prazer, Alu!', 'Somos uma marca de beachwear que nasceu do amor pelo mar e pela moda. Cada peça é pensada para valorizar sua beleza única, com tecidos sustentáveis e design exclusivo. Acreditamos que toda mulher merece se sentir confiante e deslumbrante à beira-mar.'
WHERE NOT EXISTS (SELECT 1 FROM public.settings WHERE id = 1);

-- Inserir credenciais admin padrão
INSERT INTO public.admin_creds (id, email, password)
SELECT 1, 'alu@admin.com', 'admin@alu'
WHERE NOT EXISTS (SELECT 1 FROM public.admin_creds WHERE id = 1);

-- Inserir produtos iniciais
INSERT INTO public.products (id, name, price, description, image, colors, sizes, collection, stock, featured)
VALUES
  (1, 'Vermelho Pôr do Sol', 129.90, 'Biquini vermelho vibrante com detalhes em dourado. Tecido de alta durabilidade com proteção UV.', '/alu-modelo.png', ARRAY['Vermelho','Dourado'], ARRAY['P','M','G'], 'Verão', '{"total": 30, "P": 10, "M": 12, "G": 8}', true),
  (2, 'Preto com Branco', 119.90, 'Clássico biquini preto com detalhes em branco. Elegância e conforto para o dia a dia.', '/biquini-1.png', ARRAY['Preto','Branco'], ARRAY['P','M','G'], 'Clássica', '{"total": 25, "P": 8, "M": 10, "G": 7}', true),
  (3, 'Turquesa Ouro', 139.90, 'Biquini turquesa com detalhes dourados. Perfeito para dias de sol na praia.', '/biquini-2.png', ARRAY['Turquesa','Dourado'], ARRAY['P','M','G'], 'Verão', '{"total": 20, "P": 5, "M": 8, "G": 7}', true),
  (4, 'Amarelo Solares', 124.90, 'Biquini amarelo ensolarado com estampa tropical. Frescor e estilo em um só produto.', '/alu-modelo.png', ARRAY['Amarelo','Verde'], ARRAY['P','M','G'], 'Tropical', '{"total": 18, "P": 6, "M": 7, "G": 5}', false)
ON CONFLICT (id) DO NOTHING;

-- Inserir vendas iniciais
INSERT INTO public.sales (id, customer_name, customer_email, items, total, date, status, type)
VALUES
  (1, 'Ana Oliveira', 'ana@email.com', '[{"productId":1,"productName":"Vermelho Pôr do Sol","quantity":1,"price":129.90,"color":"Vermelho","size":"M"}]', 129.90, '2026-05-20', 'Concluído', 'online'),
  (2, 'Beatriz Santos', 'bia@email.com', '[{"productId":2,"productName":"Preto com Branco","quantity":2,"price":119.90,"color":"Preto","size":"P"}]', 239.80, '2026-05-18', 'Concluído', 'online'),
  (3, 'Carla Lima', 'carla@email.com', '[{"productId":3,"productName":"Turquesa Ouro","quantity":1,"price":139.90,"color":"Turquesa","size":"G"}]', 139.90, '2026-05-15', 'Concluído', 'presencial'),
  (4, 'Daniela Costa', 'dani@email.com', '[{"productId":4,"productName":"Amarelo Solares","quantity":1,"price":124.90,"color":"Amarelo","size":"M"}]', 124.90, '2026-05-12', 'Concluído', 'online'),
  (5, 'Eduarda Martins', 'duda@email.com', '[{"productId":1,"productName":"Vermelho Pôr do Sol","quantity":1,"price":129.90,"color":"Dourado","size":"P"}]', 129.90, '2026-05-10', 'Concluído', 'presencial')
ON CONFLICT (id) DO NOTHING;

-- Inserir fluxo de caixa inicial
INSERT INTO public.cash_flow (id, description, amount, type, category, date)
VALUES
  (1, 'Venda #1 - Ana Oliveira', 129.90, 'entrada', 'Vendas', '2026-05-20'),
  (2, 'Venda #2 - Beatriz Santos', 239.80, 'entrada', 'Vendas', '2026-05-18'),
  (3, 'Compra de Tecidos', 350.00, 'saida', 'Insumos', '2026-05-16'),
  (4, 'Venda #3 - Carla Lima', 139.90, 'entrada', 'Vendas', '2026-05-15'),
  (5, 'Embalagens', 85.50, 'saida', 'Embalagem', '2026-05-14'),
  (6, 'Frete Correios', 45.00, 'saida', 'Frete', '2026-05-13'),
  (7, 'Venda #4 - Daniela Costa', 124.90, 'entrada', 'Vendas', '2026-05-12'),
  (8, 'Venda #5 - Eduarda Martins', 129.90, 'entrada', 'Vendas', '2026-05-10'),
  (9, 'Marketing Digital', 200.00, 'saida', 'Marketing', '2026-05-08'),
  (10, 'Aluguel', 1200.00, 'saida', 'Fixo', '2026-05-05')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- HABILITAR RLS (segurança)
-- ============================================
-- POLÍTICAS PARA STORAGE (bucket 'images')
-- Primeiro, execute APENAS este bloco no SQL Editor:
-- ============================================
BEGIN;
  -- Garantir permissão para upload anônimo no bucket 'images'
  DROP POLICY IF EXISTS "Allow public access images" ON storage.objects;
  CREATE POLICY "Allow public access images" ON storage.objects
    FOR ALL USING (bucket_id = 'images') WITH CHECK (bucket_id = 'images');
COMMIT;

-- ============================================
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_flow ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_creds ENABLE ROW LEVEL SECURITY;

-- Criar políticas permitindo tudo com a anon key (para uso interno)
CREATE POLICY "Allow all on products" ON public.products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on sales" ON public.sales FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on cash_flow" ON public.cash_flow FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on settings" ON public.settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on admin_creds" ON public.admin_creds FOR ALL USING (true) WITH CHECK (true);
