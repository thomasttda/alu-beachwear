import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://ncpjplavdfozyuxpkcyy.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jcGpwbGF2ZGZvenl1eHBrY3l5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3Mzc2OTUsImV4cCI6MjA5NTMxMzY5NX0.CgaQTjMWsiozMERxNbukn79jf-hLKCCLlk0BVd7H7Jw';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const STORAGE_BUCKET = 'images';

/** Retorna a URL pública de uma imagem no Storage do Supabase */
export function storageUrl(filename) {
  return supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filename).data.publicUrl;
}

// --- PRODUCTS ---
export async function fetchProducts() {
  const { data, error } = await supabase.from('products').select('*').order('id');
  if (error) throw error;
  return data.map(normalizeProduct);
}

export async function createProduct(product) {
  const { data, error } = await supabase.from('products').insert([denormalizeProduct(product)]).select();
  if (error) throw error;
  return normalizeProduct(data[0]);
}

export async function updateProduct(product) {
  const { data, error } = await supabase.from('products').update(denormalizeProduct(product)).eq('id', product.id).select();
  if (error) throw error;
  return normalizeProduct(data[0]);
}

export async function deleteProduct(id) {
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) throw error;
}

function normalizeProduct(row) {
  return {
    id: row.id,
    name: row.name,
    price: parseFloat(row.price),
    description: row.description || '',
    image: row.image,
    colors: row.colors || [],
    sizes: row.sizes || [],
    collection: row.collection || '',
    stock: typeof row.stock === 'string' ? JSON.parse(row.stock) : (row.stock || { total: 0 }),
    featured: row.featured || false,
  };
}

function denormalizeProduct(p) {
  return {
    id: p.id,
    name: p.name,
    price: p.price,
    description: p.description,
    image: p.image,
    colors: p.colors,
    sizes: p.sizes,
    collection: p.collection,
    stock: p.stock,
    featured: p.featured,
  };
}

// --- SALES ---
function normalizeSale(row) {
  return {
    id: row.id,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    items: typeof row.items === 'string' ? JSON.parse(row.items) : (row.items || []),
    total: parseFloat(row.total),
    date: row.date,
    status: row.status,
    type: row.type,
  };
}

export async function fetchSales() {
  const { data, error } = await supabase.from('sales').select('*').order('id', { ascending: false });
  if (error) throw error;
  return data.map(normalizeSale);
}

export async function createSale(sale) {
  const { data, error } = await supabase.from('sales').insert([{
    id: sale.id,
    customer_name: sale.customerName,
    customer_email: sale.customerEmail,
    items: sale.items,
    total: sale.total,
    date: sale.date,
    status: sale.status || 'Concluído',
    type: sale.type || 'online',
  }]).select();
  if (error) throw error;
  return normalizeSale(data[0]);
}

// --- CASH FLOW ---
function normalizeCashFlow(row) {
  return {
    id: row.id,
    description: row.description,
    amount: parseFloat(row.amount),
    type: row.type,
    category: row.category,
    date: row.date,
  };
}

export async function fetchCashFlow() {
  const { data, error } = await supabase.from('cash_flow').select('*').order('id', { ascending: false });
  if (error) throw error;
  return data.map(normalizeCashFlow);
}

export async function createCashFlowEntry(entry) {
  const { data, error } = await supabase.from('cash_flow').insert([{
    id: entry.id,
    description: entry.description,
    amount: entry.amount,
    type: entry.type,
    category: entry.category,
    date: entry.date,
  }]).select();
  if (error) throw error;
  return normalizeCashFlow(data[0]);
}

// --- SETTINGS ---
function normalizeSettings(row) {
  return {
    heroImage: row.hero_image,
    heroTitle: row.hero_title,
    heroSubtitle: row.hero_subtitle,
    aboutImage: row.about_image,
    aboutTitle: row.about_title,
    aboutText: row.about_text,
  };
}

export async function fetchSettings() {
  const { data, error } = await supabase.from('settings').select('*').eq('id', 1).single();
  if (error && error.code === 'PGRST116') return null;
  if (error) throw error;
  return normalizeSettings(data);
}

export async function updateSettings(settings) {
  const { data, error } = await supabase.from('settings').update({
    hero_image: settings.heroImage,
    hero_title: settings.heroTitle,
    hero_subtitle: settings.heroSubtitle,
    about_image: settings.aboutImage,
    about_title: settings.aboutTitle,
    about_text: settings.aboutText,
  }).eq('id', 1).select();
  if (error) throw error;
  return normalizeSettings(data[0]);
}

// --- ADMIN CREDS ---
export async function fetchAdminCreds() {
  const { data, error } = await supabase.from('admin_creds').select('*').eq('id', 1).single();
  if (error) return { email: 'alu@admin.com', password: 'admin@alu' };
  return { email: data.email, password: data.password };
}

export async function updateAdminPassword(newPassword) {
  const { error } = await supabase.from('admin_creds').update({ password: newPassword }).eq('id', 1);
  if (error) throw error;
}

// --- CHECK CONNECTION ---
export async function checkConnection() {
  try {
    const { data } = await supabase.from('products').select('id').limit(1);
    return !!(data);
  } catch {
    return false;
  }
}
