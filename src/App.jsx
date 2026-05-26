import { useState, useEffect } from 'react';
import {
  ShoppingBag, Menu, X, Search, ChevronRight, Plus, Minus,
  Trash2, Edit3, LogOut, BarChart3, Package, Image, Lock,
  DollarSign, TrendingUp, Users, ShoppingCart, Star, Heart,
  Palette, ChevronDown, Check, AlertCircle, Save,
  FileText, Eye, EyeOff
} from 'lucide-react';
import {
  supabase,
  storageUrl,
  fetchProducts, createProduct, updateProduct, deleteProduct,
  fetchSales, createSale,
  fetchCashFlow, createCashFlowEntry,
  fetchSettings, updateSettings,
  fetchAdminCreds, updateAdminPassword,
  checkConnection
} from './supabase.js';

function imgUrl(path) {
  if (!path) return path;
  if (path.startsWith('http')) return path;
  const filename = path.startsWith('/') ? path.slice(1) : path;
  return storageUrl(filename);
}

const COLORS = {
  terracotta: '#AC5B3D',
  terracottaDark: '#93492D',
  terracottaLight: '#F8F4F0',
  caqui: '#DFBEA1',
  caquiDark: '#C8A383',
  caquiLight: '#FAF3EC',
  brancosol: '#FCFBF7',
  pureWhite: '#FFFFFF',
  brancosolDark: '#F5F2EB',
  verdeagua: '#A6D3C4',
  verdeaguaDark: '#85BEAD',
  rosaclaro: '#F4CDD2',
  rosaclaroDark: '#E29FA7',
  deepblack: '#121212',
  deepblackLight: '#1E1E1E',
  deepblackCard: '#242424',
};

const DEFAULT_SETTINGS = {
  heroImage: '/alu-modelo.png',
  heroTitle: 'Essência do Sol',
  heroSubtitle: 'Moda praia que celebra sua beleza natural. Conforto, estilo e sustentabilidade em cada peça.',
  aboutImage: '/prazer alu.png',
  aboutTitle: 'Prazer, Alu!',
  aboutText: 'Somos uma marca de beachwear que nasceu do amor pelo mar e pela moda. Cada peça é pensada para valorizar sua beleza única, com tecidos sustentáveis e design exclusivo. Acreditamos que toda mulher merece se sentir confiante e deslumbrante à beira-mar.',
};

function loadState(key, fallback) {
  try {
    const saved = localStorage.getItem(`alu_${key}`);
    if (saved) return JSON.parse(saved);
  } catch {}
  return fallback;
}

function saveState(key, data) {
  try {
    localStorage.setItem(`alu_${key}`, JSON.stringify(data));
  } catch {}
}

function formatCurrency(value) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('pt-BR');
}

function generateId() {
  return Date.now() + Math.floor(Math.random() * 1000);
}

function SimpleBar({ data, color = '#AC5B3D', height = 160 }) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data.map(d => d.value), 1);
  const w = Math.min(40, Math.floor(600 / data.length));
  return (
    <div className="flex items-end gap-1" style={{ height }}>
      {data.map((d, i) => (
        <div key={i} className="flex flex-col items-center flex-1">
          <span className="text-[10px] text-deepblack/50 mb-1">{d.label}</span>
          <div
            className="w-full rounded-t transition-all duration-300 hover:opacity-80"
            style={{
              height: `${Math.max(4, (d.value / max) * (height - 24))}px`,
              backgroundColor: d.color || color,
            }}
          />
        </div>
      ))}
    </div>
  );
}

function MiniPie({ data, size = 120 }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  let cumulative = 0;
  const segments = data.map(d => {
    const start = cumulative;
    cumulative += (d.value / total) * 360;
    const angle = (d.value / total) * 360;
    return { ...d, start, angle, pct: (d.value / total) * 100 };
  });

  return (
    <div className="flex items-center gap-3">
      <svg width={size} height={size} viewBox="0 0 42 42">
        {segments.map((seg, i) => {
          const r = 15.915;
          const circum = 2 * Math.PI * r;
          const offset = circum - (seg.angle / 360) * circum;
          const dashOffset = -((seg.start / 360) * circum);
          return (
            <circle
              key={i}
              cx="21" cy="21" r={r}
              fill="none"
              stroke={seg.color}
              strokeWidth="3"
              strokeDasharray={`${(seg.angle / 360) * circum} ${circum}`}
              strokeDashoffset={dashOffset}
              transform="rotate(-90 21 21)"
              className="transition-all duration-300"
            />
          );
        })}
      </svg>
      <div className="space-y-1">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
            <span className="text-deepblack/70">{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Measure({ label, value, icon: Icon, color, trend }) {
  return (
    <div className="bg-pureWhite rounded-2xl p-4 shadow-sm border border-caqui/20 hover:shadow-md transition-all">
      <div className="flex items-center justify-between mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: color + '15' }}>
          <Icon size={20} style={{ color }} />
        </div>
        {trend !== undefined && (
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${trend >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
            {trend >= 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-deepblack font-serif">{value}</p>
      <p className="text-xs text-deepblack/50 mt-1">{label}</p>
    </div>
  );
}

function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div className={`fixed top-6 right-6 z-[9999] px-5 py-3 rounded-xl shadow-lg flex items-center gap-3 text-sm font-medium animate-slide-in ${type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}
      style={{ animation: 'slideIn 0.3s ease-out' }}>
      <div className={`w-2 h-2 rounded-full ${type === 'success' ? 'bg-green-500' : 'bg-red-500'}`} />
      {message}
    </div>
  );
}

const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes scaleIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
  .animate-fade-in { animation: fadeIn 0.3s ease-out; }
  .animate-scale-in { animation: scaleIn 0.2s ease-out; }
  .scrollbar-thin::-webkit-scrollbar { width: 4px; }
  .scrollbar-thin::-webkit-scrollbar-thumb { background: #DFBEA1; border-radius: 4px; }
`;
document.head.appendChild(styleSheet);

function Header({ cartCount, onCartOpen, onAdminClick, onSearch }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const tc = scrolled ? 'text-deepblack/70 hover:text-deepblack' : 'text-white/80 hover:text-white';
  const tci = scrolled ? 'text-deepblack/70' : 'text-white/70';
  const hbg = scrolled ? 'hover:bg-caqui/20' : 'hover:bg-white/20';

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-pureWhite/95 backdrop-blur-md shadow-sm' : 'bg-transparent'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 sm:h-20">
          <button onClick={() => setMenuOpen(!menuOpen)} className={`lg:hidden p-2 rounded-xl transition-colors ${hbg}`}>
            {menuOpen ? <X size={22} className={tci} /> : <Menu size={22} className={tci} />}
          </button>

          <div className="flex items-center gap-2">
            <img src={imgUrl('/logo.png')} alt="Alu Beachwear" className="h-8 sm:h-10 w-auto" />
          </div>

          <nav className="hidden lg:flex items-center gap-8">
            <a href="#colecao" className={`text-sm font-medium transition-colors ${tc}`}>Coleção</a>
            <a href="#sobre" className={`text-sm font-medium transition-colors ${tc}`}>Sobre</a>
            <a href="#galeria" className={`text-sm font-medium transition-colors ${tc}`}>Galeria</a>
            <a href="#contato" className={`text-sm font-medium transition-colors ${tc}`}>Contato</a>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <button onClick={onSearch} className={`p-2 rounded-xl transition-colors ${hbg}`}>
              <Search size={20} className={tci} />
            </button>
            <button onClick={onCartOpen} className={`relative p-2 rounded-xl transition-colors ${hbg}`}>
              <ShoppingBag size={20} className={tci} />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-terracotta text-pureWhite text-[10px] font-bold rounded-full flex items-center justify-center">
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </button>
            <button onClick={onAdminClick} className={`hidden sm:flex text-xs transition-colors items-center gap-1 ml-1 ${scrolled ? 'text-deepblack/40 hover:text-deepblack/70' : 'text-white/50 hover:text-white/80'}`}>
              <Lock size={12} /> Admin
            </button>
          </div>
        </div>
      </div>

      {menuOpen && (
      <div className={`lg:hidden border-t animate-fade-in ${scrolled ? 'bg-pureWhite border-caqui/20' : 'bg-deepblack/90 backdrop-blur-md border-white/10'}`}>
        <div className="px-4 py-4 space-y-3">
          <a href="#colecao" onClick={() => setMenuOpen(false)} className={`block text-sm font-medium py-2 ${scrolled ? 'text-deepblack/70' : 'text-white/80'}`}>Coleção</a>
          <a href="#sobre" onClick={() => setMenuOpen(false)} className={`block text-sm font-medium py-2 ${scrolled ? 'text-deepblack/70' : 'text-white/80'}`}>Sobre</a>
          <a href="#galeria" onClick={() => setMenuOpen(false)} className={`block text-sm font-medium py-2 ${scrolled ? 'text-deepblack/70' : 'text-white/80'}`}>Galeria</a>
          <a href="#contato" onClick={() => setMenuOpen(false)} className={`block text-sm font-medium py-2 ${scrolled ? 'text-deepblack/70' : 'text-white/80'}`}>Contato</a>
          <button onClick={() => { setMenuOpen(false); onAdminClick(); }} className={`flex items-center gap-2 text-sm py-2 ${scrolled ? 'text-deepblack/40' : 'text-white/50'}`}>
            <Lock size={14} /> Painel Administrativo
          </button>
        </div>
      </div>
      )}
    </header>
  );
}

function HeroSection({ settings, onAddToCart }) {
  return (
    <section className="relative min-h-screen flex items-end overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-deepblack/70" />
      <img
        src={settings.heroImage}
        alt="Hero"
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-deepblack/50 via-deepblack/20 to-transparent" />
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 w-full pb-12 sm:pb-20">
        <div className="max-w-lg">
          <span className="inline-block px-4 py-1.5 bg-terracotta/80 text-white text-xs font-medium rounded-full mb-4 backdrop-blur-sm">
            Nova Coleção 2026
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-serif font-bold text-white mb-3 leading-tight">
            {settings.heroTitle}
          </h1>
          <p className="text-base sm:text-lg text-white/80 mb-6 max-w-md leading-relaxed">
            {settings.heroSubtitle}
          </p>
          <div className="flex flex-wrap gap-3">
            <a href="#colecao" className="inline-flex items-center gap-2 bg-terracotta hover:bg-terracottaDark text-white px-6 py-3 rounded-xl text-sm font-medium transition-all hover:shadow-lg hover:shadow-terracotta/30">
              Ver Coleção <ChevronRight size={18} />
            </a>
            <a href="#sobre" className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/30 text-white px-6 py-3 rounded-xl text-sm font-medium transition-all hover:bg-white/20">
              Conhecer Mais
            </a>
          </div>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-white/40 rounded-full flex items-start justify-center p-1.5">
          <div className="w-1.5 h-1.5 bg-white/60 rounded-full" />
        </div>
      </div>
    </section>
  );
}

function ProductCard({ product, onQuickView, onAddToCart }) {
  return (
    <div onClick={() => onQuickView(product)} className="cursor-pointer group bg-pureWhite rounded-2xl overflow-hidden shadow-sm border border-caqui/10 hover:shadow-lg hover:border-caqui/30 transition-all duration-300">
      <div className="relative aspect-[3/4] overflow-hidden bg-caquiLight/50">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-deepblack/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {product.featured && (
            <span className="px-2.5 py-1 bg-verdeagua/90 text-pureWhite text-[10px] font-medium rounded-full backdrop-blur-sm">
              Destaque
            </span>
          )}
        </div>
      </div>
      <div className="p-4">
        <p className="text-xs text-deepblack/40 uppercase tracking-wider mb-1">{product.collection}</p>
        <h3 className="font-medium text-deepblack mb-1 truncate">{product.name}</h3>
        <p className="text-terracotta font-bold text-lg font-serif">{formatCurrency(product.price)}</p>
      </div>
    </div>
  );
}

function ProductModal({ product, onClose, onAddToCart }) {
  const [selectedColor, setSelectedColor] = useState(product.colors[0]);
  const [selectedSize, setSelectedSize] = useState(product.sizes[0]);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    onAddToCart({
      ...product,
      color: selectedColor,
      size: selectedSize,
      quantity,
    });
    setAdded(true);
    setTimeout(() => { setAdded(false); onClose(); }, 1200);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-slate-100" />
      <div className="relative bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl border border-slate-200 animate-scale-in" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 z-10 w-10 h-10 bg-white rounded-xl flex items-center justify-center hover:bg-slate-100 transition-colors shadow-md">
          <X size={18} />
        </button>
        <div className="grid grid-cols-1 md:grid-cols-2">
          <div className="aspect-square bg-caquiLight">
            <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
          </div>
          <div className="p-6 sm:p-8 flex flex-col">
            <span className="text-xs text-deepblack/40 uppercase tracking-wider mb-1">{product.collection}</span>
            <h2 className="text-2xl font-serif font-bold text-deepblack mb-2">{product.name}</h2>
            <p className="text-3xl font-bold text-terracotta mb-4">{formatCurrency(product.price)}</p>
            <p className="text-sm text-deepblack/60 leading-relaxed mb-6">{product.description}</p>

            <div className="mb-4">
              <p className="text-xs font-medium text-deepblack/50 uppercase tracking-wider mb-2">Cor: {selectedColor}</p>
              <div className="flex flex-wrap gap-2">
                {product.colors.map(c => (
                  <button key={c} onClick={() => setSelectedColor(c)}
                    className={`px-3 py-1.5 text-xs rounded-lg border transition-all ${selectedColor === c ? 'border-terracotta bg-terracotta text-pureWhite' : 'border-caqui/30 text-deepblack/60 hover:border-caqui'}`}>
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <p className="text-xs font-medium text-deepblack/50 uppercase tracking-wider mb-2">Tamanho: {selectedSize}</p>
              <div className="flex gap-2">
                {product.sizes.map(s => (
                  <button key={s} onClick={() => setSelectedSize(s)}
                    className={`w-10 h-10 text-xs font-medium rounded-lg border transition-all ${selectedSize === s ? 'border-terracotta bg-terracotta text-pureWhite' : 'border-caqui/30 text-deepblack/60 hover:border-caqui'}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3 mb-6">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-9 h-9 rounded-xl border border-caqui/30 flex items-center justify-center hover:bg-caqui/20 transition-colors">
                <Minus size={14} />
              </button>
              <span className="w-8 text-center font-medium">{quantity}</span>
              <button onClick={() => setQuantity(quantity + 1)}
                className="w-9 h-9 rounded-xl border border-caqui/30 flex items-center justify-center hover:bg-caqui/20 transition-colors">
                <Plus size={14} />
              </button>
            </div>

            <button onClick={handleAdd} disabled={added}
              className={`w-full py-3 rounded-xl font-medium text-sm transition-all ${added ? 'bg-green-500 text-pureWhite' : 'bg-terracotta hover:bg-terracottaDark text-pureWhite hover:shadow-lg hover:shadow-terracotta/30'}`}>
              {added ? 'Adicionado!' : 'Adicionar ao Carrinho'}
            </button>

            <div className="flex items-center gap-2 mt-4 text-xs text-deepblack/40">
              <Check size={12} />
              <span>Entrega em 5-10 dias úteis</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CartDrawer({ open, onClose, cart, onUpdateQuantity, onRemove, onCheckout }) {
  const total = cart.reduce((s, item) => s + item.price * item.quantity, 0);

  return (
    <div className={`fixed inset-0 z-[100] ${open ? '' : 'pointer-events-none'}`}>
      <div className={`absolute inset-0 bg-deepblack/40 backdrop-blur-sm transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'}`} onClick={onClose} />
      <div className={`absolute right-0 top-0 bottom-0 w-full max-w-md bg-pureWhite shadow-2xl transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-caqui/20">
          <h2 className="text-lg font-serif font-bold flex items-center gap-2">
            <ShoppingBag size={20} className="text-terracotta" />
            Carrinho ({cart.length})
          </h2>
          <button onClick={onClose} className="w-9 h-9 rounded-xl hover:bg-caqui/20 flex items-center justify-center transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto" style={{ height: 'calc(100% - 140px)' }}>
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-deepblack/30 gap-4">
              <ShoppingBag size={48} />
              <p className="text-sm">Seu carrinho está vazio</p>
            </div>
          ) : (
            <div className="p-4 sm:p-6 space-y-3">
              {cart.map((item, idx) => (
                <div key={idx} className="flex gap-3 bg-caquiLight/30 rounded-xl p-3">
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-caquiLight/50 flex-shrink-0">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.name}</p>
                    <p className="text-xs text-deepblack/50">{item.color} / {item.size}</p>
                    <p className="text-sm font-bold text-terracotta mt-1">{formatCurrency(item.price)}</p>
                  </div>
                  <div className="flex flex-col items-end justify-between">
                    <button onClick={() => onRemove(idx)} className="p-1 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 size={14} className="text-red-400" />
                    </button>
                    <div className="flex items-center gap-1">
                      <button onClick={() => onUpdateQuantity(idx, -1)} disabled={item.quantity <= 1}
                        className="w-6 h-6 rounded-md border border-caqui/30 flex items-center justify-center hover:bg-caqui/20 transition-colors disabled:opacity-30">
                        <Minus size={10} />
                      </button>
                      <span className="w-5 text-center text-xs font-medium">{item.quantity}</span>
                      <button onClick={() => onUpdateQuantity(idx, 1)}
                        className="w-6 h-6 rounded-md border border-caqui/30 flex items-center justify-center hover:bg-caqui/20 transition-colors">
                        <Plus size={10} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {cart.length > 0 && (
          <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 border-t border-caqui/20 bg-pureWhite">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-deepblack/60">Total</span>
              <span className="text-2xl font-bold font-serif text-terracotta">{formatCurrency(total)}</span>
            </div>
            <button onClick={onCheckout}
              className="w-full bg-terracotta hover:bg-terracottaDark text-pureWhite py-3 rounded-xl font-medium text-sm transition-all hover:shadow-lg hover:shadow-terracotta/30">
              Finalizar Pedido
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function AboutSection({ settings }) {
  return (
    <section id="sobre" className="py-16 sm:py-24 bg-brancosol">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <div className="relative">
            <div className="aspect-[4/5] rounded-3xl overflow-hidden shadow-xl">
              <img src={settings.aboutImage} alt="Sobre Alu" className="w-full h-full object-cover" />
            </div>
            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-terracotta/10 rounded-2xl -z-10" />
            <div className="absolute -top-4 -left-4 w-24 h-24 bg-verdeagua/20 rounded-2xl -z-10" />
          </div>
          <div>
            <span className="text-xs text-terracotta font-medium uppercase tracking-widest mb-3 block">Nossa História</span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-deepblack mb-6 leading-tight">
              {settings.aboutTitle}
            </h2>
            <p className="text-deepblack/60 leading-relaxed mb-8 text-base sm:text-lg">
              {settings.aboutText}
            </p>
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-pureWhite rounded-xl p-4 border border-caqui/10">
                <p className="text-2xl font-bold text-terracotta font-serif">50+</p>
                <p className="text-xs text-deepblack/50">Clientes Felizes</p>
              </div>
              <div className="bg-pureWhite rounded-xl p-4 border border-caqui/10">
                <p className="text-2xl font-bold text-terracotta font-serif">4</p>
                <p className="text-xs text-deepblack/50">Coleções Exclusivas</p>
              </div>
            </div>
            <a href="#colecao" className="inline-flex items-center gap-2 bg-terracotta hover:bg-terracottaDark text-pureWhite px-6 py-3 rounded-xl text-sm font-medium transition-all">
              Ver Produtos <ChevronRight size={16} />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function GallerySection() {
  const images = [
    { src: '/biquini-1.png', alt: 'Look 1' },
    { src: '/biquini-2.png', alt: 'Look 2' },
    { src: '/alu-modelo.png', alt: 'Look 3' },
    { src: '/foto_inicio.png', alt: 'Look 4' },
    { src: '/biquini-1.png', alt: 'Look 5' },
    { src: '/biquini-2.png', alt: 'Look 6' },
  ];

  return (
    <section id="galeria" className="py-16 sm:py-24 bg-caquiLight/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <span className="text-xs text-terracotta font-medium uppercase tracking-widest">Galeria</span>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold mt-2 mb-4">Looks que Inspiram</h2>
          <p className="text-deepblack/50 max-w-md mx-auto">Veja como nossas peças se transformam em estilo.</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
          {images.map((img, i) => (
            <div key={i} className={`group relative overflow-hidden rounded-2xl ${i === 0 ? 'row-span-2' : ''}`}>
              <img src={img.src} alt={img.alt} className="w-full h-full object-cover aspect-square group-hover:scale-110 transition-transform duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-deepblack/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer id="contato" className="bg-deepblack text-white/80 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          <div className="lg:col-span-2">
                        <img src={imgUrl('/logo.png')} alt="Alu Beachwear" className="h-10 w-auto mb-4 brightness-0 invert" />
            <p className="text-sm text-white/50 max-w-sm leading-relaxed">
              Moda praia que celebra sua beleza natural. Conforto, estilo e sustentabilidade em cada peça.
            </p>
          </div>
          <div>
            <h4 className="text-white font-medium mb-4 text-sm uppercase tracking-wider">Links</h4>
            <div className="space-y-2.5">
              <a href="#colecao" className="block text-sm text-white/50 hover:text-white transition-colors">Coleção</a>
              <a href="#sobre" className="block text-sm text-white/50 hover:text-white transition-colors">Sobre</a>
              <a href="#galeria" className="block text-sm text-white/50 hover:text-white transition-colors">Galeria</a>
            </div>
          </div>
          <div>
            <h4 className="text-white font-medium mb-4 text-sm uppercase tracking-wider">Contato</h4>
            <div className="space-y-2.5 text-sm text-white/50">
              <p>contato@alubeachwear.com</p>
              <p>(11) 99999-8888</p>
              <p>@alubeachwear</p>
            </div>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/30">© 2026 Alu Beachwear. Todos os direitos reservados.</p>
          <div className="flex gap-4">
            <a href="#" className="text-white/30 hover:text-white transition-colors text-sm">Instagram</a>
            <a href="#" className="text-white/30 hover:text-white transition-colors text-sm">WhatsApp</a>
            <a href="#" className="text-white/30 hover:text-white transition-colors text-sm">TikTok</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

function LoginScreen({ onLogin, error }) {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin(email, pass);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-caquiLight via-brancosol to-rosaclaro/20 p-4">
      <div className="bg-pureWhite rounded-3xl shadow-xl max-w-md w-full p-8 sm:p-10 animate-scale-in">
        <div className="text-center mb-8">
                    <img src={imgUrl('/logo.png')} alt="Alu Beachwear" className="h-12 mx-auto mb-4" />
          <h1 className="text-2xl font-serif font-bold">Painel Administrativo</h1>
          <p className="text-sm text-deepblack/50 mt-1">Faça login para gerenciar sua loja</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-deepblack/60 mb-1.5">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="alu@admin.com"
              className="w-full px-4 py-3 rounded-xl border border-caqui/30 bg-brancosol text-sm focus:outline-none focus:border-terracotta focus:ring-1 focus:ring-terracotta/30 transition-all" />
          </div>
          <div>
            <label className="block text-xs font-medium text-deepblack/60 mb-1.5">Senha</label>
            <div className="relative">
              <input type={showPass ? 'text' : 'password'} value={pass} onChange={e => setPass(e.target.value)} placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl border border-caqui/30 bg-brancosol text-sm focus:outline-none focus:border-terracotta focus:ring-1 focus:ring-terracotta/30 transition-all pr-10" />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-deepblack/30 hover:text-deepblack/60 transition-colors">
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          {error && (
            <div className="flex items-center gap-2 text-xs text-red-500 bg-red-50 p-3 rounded-xl">
              <AlertCircle size={14} />
              {error}
            </div>
          )}
          <button type="submit"
            className="w-full bg-terracotta hover:bg-terracottaDark text-pureWhite py-3 rounded-xl font-medium text-sm transition-all hover:shadow-lg hover:shadow-terracotta/30">
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
}

function CRMTab({ sales, cashFlow }) {
  const [period, setPeriod] = useState('all');
  const [activeTab, setActiveTab] = useState('dashboard');

  const filteredSales = period === 'all' ? sales : sales.filter(s => {
    const days = period === '7' ? 7 : period === '30' ? 30 : 90;
    const d = new Date();
    d.setDate(d.getDate() - days);
    return new Date(s.date + 'T00:00:00') >= d;
  });

  const totalRevenue = filteredSales.reduce((s, sale) => s + sale.total, 0);
  const totalOrders = filteredSales.length;
  const avgTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  const filteredFlow = period === 'all' ? cashFlow : cashFlow.filter(f => {
    const days = period === '7' ? 7 : period === '30' ? 30 : 90;
    const d = new Date();
    d.setDate(d.getDate() - days);
    return new Date(f.date + 'T00:00:00') >= d;
  });

  const totalIn = filteredFlow.filter(f => f.type === 'entrada').reduce((s, f) => s + f.amount, 0);
  const totalOut = filteredFlow.filter(f => f.type === 'saida').reduce((s, f) => s + f.amount, 0);
  const balance = totalIn - totalOut;

  const dailyData = {};
  filteredSales.forEach(s => {
    dailyData[s.date] = dailyData[s.date] || { date: s.date, total: 0, count: 0 };
    dailyData[s.date].total += s.total;
    dailyData[s.date].count += 1;
  });
  const chartData = Object.values(dailyData).sort((a, b) => a.date.localeCompare(b.date));
  const barData = chartData.length > 0 ? chartData.map(d => ({
    label: d.date.slice(5),
    value: d.total,
    color: COLORS.terracotta,
  })) : [{ label: 'Sem dados', value: 1, color: COLORS.caqui }];

  const paymentMethods = [
    { label: 'Online', value: filteredSales.filter(s => s.type === 'online').length, color: COLORS.terracotta },
    { label: 'Presencial', value: filteredSales.filter(s => s.type === 'presencial').length, color: COLORS.verdeagua },
  ];

  const [newTransaction, setNewTransaction] = useState({ description: '', amount: '', type: 'entrada', category: 'Outros', date: new Date().toISOString().slice(0, 10) });
  const [cashEntries, setCashEntries] = useState(cashFlow);

  const addTransaction = async () => {
    if (!newTransaction.description || !newTransaction.amount) return;
    const entry = {
      id: generateId(),
      description: newTransaction.description,
      amount: parseFloat(newTransaction.amount),
      type: newTransaction.type,
      category: newTransaction.category,
      date: newTransaction.date,
    };
    try {
      await createCashFlowEntry(entry);
      const updated = [entry, ...cashEntries];
      setCashEntries(updated);
    } catch (e) {
      console.error('Error adding transaction:', e);
    }
    setNewTransaction({ description: '', amount: '', type: 'entrada', category: 'Outros', date: new Date().toISOString().slice(0, 10) });
  };

  const cf = period === 'all' ? cashEntries : cashEntries.filter(f => {
    const days = period === '7' ? 7 : period === '30' ? 30 : 90;
    const d = new Date();
    d.setDate(d.getDate() - days);
    return new Date(f.date + 'T00:00:00') >= d;
  });

  const cfIn = cf.filter(f => f.type === 'entrada').reduce((s, f) => s + f.amount, 0);
  const cfOut = cf.filter(f => f.type === 'saida').reduce((s, f) => s + f.amount, 0);
  const cfBal = cfIn - cfOut;

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'sales', label: 'Vendas', icon: TrendingUp },
    { id: 'cashflow', label: 'Fluxo de Caixa', icon: DollarSign },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-serif font-bold">CRM Financeiro</h2>
          <p className="text-sm text-deepblack/50">Gerencie suas finanças e acompanhe resultados</p>
        </div>
        <div className="flex gap-1 bg-caquiLight/50 rounded-xl p-1">
          {[
            { value: '7', label: '7D' },
            { value: '30', label: '30D' },
            { value: '90', label: '90D' },
            { value: 'all', label: 'Tudo' },
          ].map(p => (
            <button key={p.value} onClick={() => setPeriod(p.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${period === p.value ? 'bg-pureWhite text-terracotta shadow-sm' : 'text-deepblack/40 hover:text-deepblack/70'}`}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-1 bg-caquiLight/30 rounded-xl p-1 overflow-x-auto">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-pureWhite text-terracotta shadow-sm' : 'text-deepblack/40 hover:text-deepblack/70'}`}>
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Measure label="Receita Total" value={formatCurrency(totalRevenue)} icon={DollarSign} color={COLORS.terracotta} />
            <Measure label="Pedidos" value={totalOrders} icon={ShoppingCart} color={COLORS.verdeagua} />
            <Measure label="Ticket Médio" value={formatCurrency(avgTicket)} icon={TrendingUp} color={COLORS.caqui} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-pureWhite rounded-2xl p-6 shadow-sm border border-caqui/10">
              <h3 className="text-sm font-medium text-deepblack/60 mb-4">Receita por Período</h3>
              <SimpleBar data={barData} />
            </div>
            <div className="bg-pureWhite rounded-2xl p-6 shadow-sm border border-caqui/10">
              <h3 className="text-sm font-medium text-deepblack/60 mb-4">Vendas Online vs Presencial</h3>
              <MiniPie data={paymentMethods} />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'sales' && (
        <div className="bg-pureWhite rounded-2xl shadow-sm border border-caqui/10 overflow-hidden">
          <div className="p-6 border-b border-caqui/10">
            <h3 className="text-sm font-medium">Histórico de Vendas</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-caqui/10 text-left">
                  <th className="p-4 text-xs font-medium text-deepblack/40 uppercase">Cliente</th>
                  <th className="p-4 text-xs font-medium text-deepblack/40 uppercase">Itens</th>
                  <th className="p-4 text-xs font-medium text-deepblack/40 uppercase">Total</th>
                  <th className="p-4 text-xs font-medium text-deepblack/40 uppercase">Data</th>
                  <th className="p-4 text-xs font-medium text-deepblack/40 uppercase">Tipo</th>
                  <th className="p-4 text-xs font-medium text-deepblack/40 uppercase">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredSales.length === 0 ? (
                  <tr><td colSpan={6} className="p-8 text-center text-deepblack/30">Nenhuma venda encontrada</td></tr>
                ) : filteredSales.map(sale => (
                  <tr key={sale.id} className="border-b border-caqui/5 hover:bg-caquiLight/20 transition-colors">
                    <td className="p-4">
                      <p className="font-medium">{sale.customerName}</p>
                      <p className="text-xs text-deepblack/40">{sale.customerEmail}</p>
                    </td>
                    <td className="p-4">
                      {sale.items.map((item, i) => (
                        <p key={i} className="text-xs">{item.productName} x{item.quantity} ({item.color}, {item.size})</p>
                      ))}
                    </td>
                    <td className="p-4 font-bold text-terracotta">{formatCurrency(sale.total)}</td>
                    <td className="p-4 text-deepblack/60">{formatDate(sale.date)}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${sale.type === 'online' ? 'bg-terracotta/10 text-terracotta' : 'bg-verdeagua/10 text-verdeaguaDark'}`}>
                        {sale.type === 'online' ? 'Online' : 'Presencial'}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-50 text-green-600">Concluído</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'cashflow' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Measure label="Entradas" value={formatCurrency(cfIn)} icon={TrendingUp} color={COLORS.verdeagua} />
            <Measure label="Saídas" value={formatCurrency(cfOut)} icon={TrendingUp} color={COLORS.rosaclaro} />
            <Measure label="Saldo" value={formatCurrency(cfBal)} icon={DollarSign} color={cfBal >= 0 ? COLORS.verdeaguaDark : '#EF4444'} />
          </div>

          <div className="bg-pureWhite rounded-2xl p-6 shadow-sm border border-caqui/10">
            <h3 className="text-sm font-medium mb-4">Nova Transação</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <input value={newTransaction.description} onChange={e => setNewTransaction({ ...newTransaction, description: e.target.value })} placeholder="Descrição" className="px-3 py-2 text-sm border border-caqui/30 rounded-xl bg-brancosol focus:outline-none focus:border-terracotta" />
              <input type="number" value={newTransaction.amount} onChange={e => setNewTransaction({ ...newTransaction, amount: e.target.value })} placeholder="Valor" className="px-3 py-2 text-sm border border-caqui/30 rounded-xl bg-brancosol focus:outline-none focus:border-terracotta" />
              <select value={newTransaction.type} onChange={e => setNewTransaction({ ...newTransaction, type: e.target.value })} className="px-3 py-2 text-sm border border-caqui/30 rounded-xl bg-brancosol focus:outline-none focus:border-terracotta">
                <option value="entrada">Entrada</option>
                <option value="saida">Saída</option>
              </select>
              <select value={newTransaction.category} onChange={e => setNewTransaction({ ...newTransaction, category: e.target.value })} className="px-3 py-2 text-sm border border-caqui/30 rounded-xl bg-brancosol focus:outline-none focus:border-terracotta">
                <option value="Vendas">Vendas</option>
                <option value="Insumos">Insumos</option>
                <option value="Embalagem">Embalagem</option>
                <option value="Frete">Frete</option>
                <option value="Marketing">Marketing</option>
                <option value="Fixo">Fixo</option>
                <option value="Outros">Outros</option>
              </select>
              <button onClick={addTransaction} className="bg-terracotta hover:bg-terracottaDark text-pureWhite px-4 py-2 rounded-xl text-sm font-medium transition-all">
                + Adicionar
              </button>
            </div>
          </div>

          <div className="bg-pureWhite rounded-2xl shadow-sm border border-caqui/10 overflow-hidden">
            <div className="p-6 border-b border-caqui/10">
              <h3 className="text-sm font-medium">Extrato</h3>
            </div>
            <div className="overflow-x-auto max-h-80 overflow-y-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-caqui/10 text-left">
                    <th className="p-4 text-xs font-medium text-deepblack/40 uppercase">Data</th>
                    <th className="p-4 text-xs font-medium text-deepblack/40 uppercase">Descrição</th>
                    <th className="p-4 text-xs font-medium text-deepblack/40 uppercase">Categoria</th>
                    <th className="p-4 text-xs font-medium text-deepblack/40 uppercase">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {cf.map(entry => (
                    <tr key={entry.id} className="border-b border-caqui/5 hover:bg-caquiLight/20 transition-colors">
                      <td className="p-4 text-deepblack/60">{formatDate(entry.date)}</td>
                      <td className="p-4 font-medium">{entry.description}</td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 bg-caquiLight/50 rounded-full text-[10px]">{entry.category}</span>
                      </td>
                      <td className={`p-4 font-bold ${entry.type === 'entrada' ? 'text-green-600' : 'text-red-500'}`}>
                        {entry.type === 'entrada' ? '+' : '-'}{formatCurrency(entry.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StockTab({ products, onUpdateProducts, onDeleteProduct }) {
  const [search, setSearch] = useState('');
  const [filterSize, setFilterSize] = useState('');
  const [filterColor, setFilterColor] = useState('');
  const [filterCollection, setFilterCollection] = useState('');
  const [editingProduct, setEditingProduct] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const allSizes = [...new Set(products.flatMap(p => p.sizes))];
  const allColors = [...new Set(products.flatMap(p => p.colors))];
  const allCollections = [...new Set(products.map(p => p.collection))];

  const filtered = products.filter(p => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.description.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterSize && !p.sizes.includes(filterSize)) return false;
    if (filterColor && !p.colors.includes(filterColor)) return false;
    if (filterCollection && p.collection !== filterCollection) return false;
    return true;
  });

  const saveProduct = (product) => {
    let updated;
    if (product.id) {
      updated = products.map(p => p.id === product.id ? product : p);
    } else {
      product.id = generateId();
      updated = [...products, product];
    }
    onUpdateProducts(updated);
    setEditingProduct(null);
    setShowForm(false);
  };

  const deleteProduct = (id) => {
    if (onDeleteProduct) onDeleteProduct(id);
  };

  const openNew = () => {
    setEditingProduct({ name: '', price: 0, description: '', image: '/biquini-1.png', colors: [''], sizes: [''], collection: '', stock: { total: 0, P: 0, M: 0, G: 0 }, featured: false });
    setShowForm(true);
  };

  const openEdit = (product) => {
    setEditingProduct({ ...product, stock: { ...product.stock } });
    setShowForm(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-serif font-bold">Estoque</h2>
          <p className="text-sm text-deepblack/50">Gerencie seus produtos e estoque</p>
        </div>
        <button onClick={openNew} className="bg-terracotta hover:bg-terracottaDark text-pureWhite px-5 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2">
          <Plus size={16} /> Novo Produto
        </button>
      </div>

      <div className="bg-pureWhite rounded-2xl p-4 sm:p-6 shadow-sm border border-caqui/10 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar produtos..."
            className="px-4 py-2.5 text-sm border border-caqui/30 rounded-xl bg-brancosol focus:outline-none focus:border-terracotta" />
          <select value={filterSize} onChange={e => setFilterSize(e.target.value)} className="px-4 py-2.5 text-sm border border-caqui/30 rounded-xl bg-brancosol focus:outline-none focus:border-terracotta">
            <option value="">Todos os Tamanhos</option>
            {allSizes.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={filterColor} onChange={e => setFilterColor(e.target.value)} className="px-4 py-2.5 text-sm border border-caqui/30 rounded-xl bg-brancosol focus:outline-none focus:border-terracotta">
            <option value="">Todas as Cores</option>
            {allColors.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={filterCollection} onChange={e => setFilterCollection(e.target.value)} className="px-4 py-2.5 text-sm border border-caqui/30 rounded-xl bg-brancosol focus:outline-none focus:border-terracotta">
            <option value="">Todas as Coleções</option>
            {allCollections.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-full py-12 text-center text-deepblack/30">
            <Package size={40} className="mx-auto mb-3 opacity-40" />
            <p className="text-sm">Nenhum produto encontrado</p>
          </div>
        ) : filtered.map(product => (
          <div key={product.id} className="bg-pureWhite rounded-2xl overflow-hidden shadow-sm border border-caqui/10 hover:shadow-md transition-all">
            <div className="aspect-square bg-caquiLight/50">
              <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
            </div>
            <div className="p-4 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] text-deepblack/40 uppercase tracking-wider">{product.collection}</p>
                  <h3 className="font-medium text-sm">{product.name}</h3>
                </div>
                <span className="text-terracotta font-bold font-serif">{formatCurrency(product.price)}</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {product.colors.map(c => <span key={c} className="text-[10px] px-2 py-0.5 bg-caquiLight/50 rounded-full">{c}</span>)}
                {product.sizes.map(s => <span key={s} className="text-[10px] px-2 py-0.5 bg-terracotta/10 rounded-full">{s}</span>)}
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-caqui/10">
                <span className={`text-xs font-medium ${product.stock.total > 10 ? 'text-green-600' : product.stock.total > 0 ? 'text-yellow-600' : 'text-red-500'}`}>
                  Estoque: {product.stock.total}
                </span>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(product)} className="p-1.5 hover:bg-caquiLight/50 rounded-lg transition-colors">
                    <Edit3 size={14} className="text-deepblack/40" />
                  </button>
                  <button onClick={() => deleteProduct(product.id)} className="p-1.5 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 size={14} className="text-red-400" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showForm && editingProduct && (
        <ProductForm product={editingProduct} onSave={saveProduct} onCancel={() => { setShowForm(false); setEditingProduct(null); }} />
      )}
    </div>
  );
}

function ProductForm({ product, onSave, onCancel }) {
  const [form, setForm] = useState(product);

  const update = (key, value) => setForm({ ...form, [key]: value });

  const addColor = () => update('colors', [...form.colors, '']);
  const updateColor = (i, val) => {
    const c = [...form.colors];
    c[i] = val;
    update('colors', c);
  };
  const removeColor = (i) => update('colors', form.colors.filter((_, idx) => idx !== i));

  const addSize = () => update('sizes', [...form.sizes, '']);
  const updateSize = (i, val) => {
    const s = [...form.sizes];
    s[i] = val;
    update('sizes', s);
  };
  const removeSize = (i) => update('sizes', form.sizes.filter((_, idx) => idx !== i));

  const handleStockChange = (size, value) => {
    const stock = { ...form.stock, [size]: parseInt(value) || 0 };
    stock.total = (form.sizes || []).reduce((s, sz) => s + (parseInt(stock[sz]) || 0), 0);
    update('stock', stock);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...form,
      stock: {
        ...form.stock,
        total: (form.sizes || []).reduce((s, sz) => s + (parseInt(form.stock[sz]) || 0), 0),
      },
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onCancel}>
      <div className="absolute inset-0 bg-deepblack/40 backdrop-blur-sm" />
      <div className="relative bg-pureWhite rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-scale-in scrollbar-thin" onClick={e => e.stopPropagation()}>
        <div className="p-6 sm:p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-serif font-bold">{form.id ? 'Editar Produto' : 'Novo Produto'}</h3>
            <button onClick={onCancel} className="p-2 hover:bg-caqui/20 rounded-xl transition-colors"><X size={18} /></button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-deepblack/50 mb-1">Nome</label>
              <input value={form.name} onChange={e => update('name', e.target.value)} className="w-full px-4 py-2.5 text-sm border border-caqui/30 rounded-xl bg-brancosol focus:outline-none focus:border-terracotta" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-deepblack/50 mb-1">Preço (R$)</label>
                <input type="number" step="0.01" value={form.price} onChange={e => update('price', parseFloat(e.target.value) || 0)} className="w-full px-4 py-2.5 text-sm border border-caqui/30 rounded-xl bg-brancosol focus:outline-none focus:border-terracotta" />
              </div>
              <div>
                <label className="block text-xs font-medium text-deepblack/50 mb-1">Coleção</label>
                <input value={form.collection} onChange={e => update('collection', e.target.value)} className="w-full px-4 py-2.5 text-sm border border-caqui/30 rounded-xl bg-brancosol focus:outline-none focus:border-terracotta" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-deepblack/50 mb-1">Descrição</label>
              <textarea value={form.description} onChange={e => update('description', e.target.value)} rows={3} className="w-full px-4 py-2.5 text-sm border border-caqui/30 rounded-xl bg-brancosol focus:outline-none focus:border-terracotta resize-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-deepblack/50 mb-1">URL da Imagem</label>
              <input value={form.image} onChange={e => update('image', e.target.value)} className="w-full px-4 py-2.5 text-sm border border-caqui/30 rounded-xl bg-brancosol focus:outline-none focus:border-terracotta" />
              <div className="mt-2 w-16 h-16 rounded-lg overflow-hidden bg-caquiLight/50">
                <img src={form.image} alt="" className="w-full h-full object-cover" onError={e => e.target.style.display = 'none'} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-deepblack/50 mb-1">Cores</label>
              <div className="space-y-2">
                {form.colors.map((c, i) => (
                  <div key={i} className="flex gap-2">
                    <input value={c} onChange={e => updateColor(i, e.target.value)} className="flex-1 px-3 py-2 text-sm border border-caqui/30 rounded-xl bg-brancosol focus:outline-none focus:border-terracotta" />
                    <button type="button" onClick={() => removeColor(i)} className="p-2 hover:bg-red-50 rounded-xl transition-colors"><X size={14} className="text-red-400" /></button>
                  </div>
                ))}
                <button type="button" onClick={addColor} className="text-xs text-terracotta hover:text-terracottaDark transition-colors">+ Adicionar cor</button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-deepblack/50 mb-1">Tamanhos e Estoque</label>
              <div className="space-y-2">
                {form.sizes.map((s, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <input value={s} onChange={e => updateSize(i, e.target.value)} className="w-16 px-3 py-2 text-sm border border-caqui/30 rounded-xl bg-brancosol focus:outline-none focus:border-terracotta" />
                    <input type="number" value={form.stock[s] || 0} onChange={e => handleStockChange(s, e.target.value)} className="w-20 px-3 py-2 text-sm border border-caqui/30 rounded-xl bg-brancosol focus:outline-none focus:border-terracotta" placeholder="Qtd" />
                    <span className="text-xs text-deepblack/40">unidades</span>
                    <button type="button" onClick={() => removeSize(i)} className="p-2 hover:bg-red-50 rounded-xl transition-colors"><X size={14} className="text-red-400" /></button>
                  </div>
                ))}
                <button type="button" onClick={addSize} className="text-xs text-terracotta hover:text-terracottaDark transition-colors">+ Adicionar tamanho</button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={form.featured || false} onChange={e => update('featured', e.target.checked)} id="featured" className="rounded border-caqui/30" />
              <label htmlFor="featured" className="text-xs text-deepblack/60">Produto em destaque</label>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onCancel} className="flex-1 py-2.5 border border-caqui/30 rounded-xl text-sm font-medium hover:bg-caqui/20 transition-colors">Cancelar</button>
              <button type="submit" className="flex-1 bg-terracotta hover:bg-terracottaDark text-pureWhite py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2">
                <Save size={16} /> Salvar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function HomepageEditor({ settings, onUpdateSettings }) {
  const [form, setForm] = useState(settings);
  const [saved, setSaved] = useState(false);

  useEffect(() => { setForm(settings); }, [settings]);

  const update = (key, value) => setForm({ ...form, [key]: value });

  const save = () => {
    onUpdateSettings(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-serif font-bold">Personalizar Homepage</h2>
        <p className="text-sm text-deepblack/50">Edite as imagens e textos da tela inicial</p>
      </div>

      <div className="bg-pureWhite rounded-2xl p-6 shadow-sm border border-caqui/10 space-y-6">
        <h3 className="text-sm font-medium flex items-center gap-2">
          <Image size={16} className="text-terracotta" />
          Seção Hero (Banner Principal)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-medium text-deepblack/50 mb-2">Imagem de Fundo</label>
            <div className="aspect-video rounded-xl overflow-hidden bg-caquiLight/50 mb-3">
              <img src={form.heroImage} alt="Hero" className="w-full h-full object-cover" />
            </div>
            <input value={form.heroImage} onChange={e => update('heroImage', e.target.value)} className="w-full px-4 py-2.5 text-sm border border-caqui/30 rounded-xl bg-brancosol focus:outline-none focus:border-terracotta" />
            <p className="text-[10px] text-deepblack/30 mt-1">Caminho da imagem (ex: /foto_inicio.png)</p>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-deepblack/50 mb-1">Título Principal</label>
              <input value={form.heroTitle} onChange={e => update('heroTitle', e.target.value)} className="w-full px-4 py-2.5 text-sm border border-caqui/30 rounded-xl bg-brancosol focus:outline-none focus:border-terracotta" />
            </div>
            <div>
              <label className="block text-xs font-medium text-deepblack/50 mb-1">Subtítulo</label>
              <textarea value={form.heroSubtitle} onChange={e => update('heroSubtitle', e.target.value)} rows={4} className="w-full px-4 py-2.5 text-sm border border-caqui/30 rounded-xl bg-brancosol focus:outline-none focus:border-terracotta resize-none" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-pureWhite rounded-2xl p-6 shadow-sm border border-caqui/10 space-y-6">
        <h3 className="text-sm font-medium flex items-center gap-2">
          <FileText size={16} className="text-terracotta" />
          Seção Sobre (About)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-medium text-deepblack/50 mb-2">Imagem Lateral</label>
            <div className="aspect-[4/5] rounded-xl overflow-hidden bg-caquiLight/50 mb-3 max-w-xs">
              <img src={form.aboutImage} alt="About" className="w-full h-full object-cover" />
            </div>
            <input value={form.aboutImage} onChange={e => update('aboutImage', e.target.value)} className="w-full px-4 py-2.5 text-sm border border-caqui/30 rounded-xl bg-brancosol focus:outline-none focus:border-terracotta" />
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-deepblack/50 mb-1">Título</label>
              <input value={form.aboutTitle} onChange={e => update('aboutTitle', e.target.value)} className="w-full px-4 py-2.5 text-sm border border-caqui/30 rounded-xl bg-brancosol focus:outline-none focus:border-terracotta" />
            </div>
            <div>
              <label className="block text-xs font-medium text-deepblack/50 mb-1">Texto</label>
              <textarea value={form.aboutText} onChange={e => update('aboutText', e.target.value)} rows={6} className="w-full px-4 py-2.5 text-sm border border-caqui/30 rounded-xl bg-brancosol focus:outline-none focus:border-terracotta resize-none" />
            </div>
          </div>
        </div>
      </div>

      <button onClick={save} disabled={saved}
        className={`w-full py-3 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 ${saved ? 'bg-green-500 text-pureWhite' : 'bg-terracotta hover:bg-terracottaDark text-pureWhite hover:shadow-lg'}`}>
        {saved ? <><Check size={18} /> Alterações Salvas!</> : <><Save size={18} /> Salvar Alterações</>}
      </button>
    </div>
  );
}

function PasswordTab() {
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [status, setStatus] = useState('');

  const handleChange = async () => {
    if (!currentPass || !newPass || !confirmPass) { setStatus('error'); return; }
    try {
      const saved = await fetchAdminCreds();
      if (currentPass !== saved.password) { setStatus('wrong'); return; }
      if (newPass.length < 6) { setStatus('short'); return; }
      if (newPass !== confirmPass) { setStatus('mismatch'); return; }
      await updateAdminPassword(newPass);
      setStatus('success');
      setCurrentPass('');
      setNewPass('');
      setConfirmPass('');
      setTimeout(() => setStatus(''), 3000);
    } catch {
      setStatus('error');
    }
  };

  const statusMessages = {
    error: { message: 'Preencha todos os campos', type: 'error' },
    wrong: { message: 'Senha atual incorreta', type: 'error' },
    short: { message: 'Nova senha deve ter no mínimo 6 caracteres', type: 'error' },
    mismatch: { message: 'Nova senha e confirmação não conferem', type: 'error' },
    success: { message: 'Senha alterada com sucesso!', type: 'success' },
  };

  const currentStatus = statusMessages[status] || null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-serif font-bold">Alterar Senha</h2>
        <p className="text-sm text-deepblack/50">Altere a senha de acesso ao painel administrativo</p>
      </div>

      <div className="bg-pureWhite rounded-2xl p-6 sm:p-8 shadow-sm border border-caqui/10 max-w-md">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-caqui/10">
          <div className="w-12 h-12 rounded-full bg-terracotta/10 flex items-center justify-center">
            <Lock size={22} className="text-terracotta" />
          </div>
          <div>
            <p className="text-sm font-medium">alu@admin.com</p>
            <p className="text-xs text-deepblack/40">Email administrativo</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-deepblack/50 mb-1">Senha Atual</label>
            <input type={showPasswords ? 'text' : 'password'} value={currentPass} onChange={e => setCurrentPass(e.target.value)}
              className="w-full px-4 py-2.5 text-sm border border-caqui/30 rounded-xl bg-brancosol focus:outline-none focus:border-terracotta" />
          </div>
          <div>
            <label className="block text-xs font-medium text-deepblack/50 mb-1">Nova Senha</label>
            <input type={showPasswords ? 'text' : 'password'} value={newPass} onChange={e => setNewPass(e.target.value)}
              className="w-full px-4 py-2.5 text-sm border border-caqui/30 rounded-xl bg-brancosol focus:outline-none focus:border-terracotta" />
          </div>
          <div>
            <label className="block text-xs font-medium text-deepblack/50 mb-1">Confirmar Nova Senha</label>
            <input type={showPasswords ? 'text' : 'password'} value={confirmPass} onChange={e => setConfirmPass(e.target.value)}
              className="w-full px-4 py-2.5 text-sm border border-caqui/30 rounded-xl bg-brancosol focus:outline-none focus:border-terracotta" />
          </div>

          <label className="flex items-center gap-2 text-xs text-deepblack/50 cursor-pointer">
            <input type="checkbox" checked={showPasswords} onChange={e => setShowPasswords(e.target.checked)} className="rounded border-caqui/30" />
            Mostrar senhas
          </label>

          {currentStatus && (
            <div className={`flex items-center gap-2 text-xs p-3 rounded-xl ${currentStatus.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
              {currentStatus.type === 'success' ? <Check size={14} /> : <AlertCircle size={14} />}
              {currentStatus.message}
            </div>
          )}

          <button onClick={handleChange}
            className="w-full bg-terracotta hover:bg-terracottaDark text-pureWhite py-2.5 rounded-xl text-sm font-medium transition-all">
            Alterar Senha
          </button>
        </div>
      </div>
    </div>
  );
}

function AdminDashboard({ activeTab, setActiveTab, onLogout, products, sales, cashFlow, settings, onUpdateProducts, onUpdateSettings, onDeleteProduct }) {
  const tabs = [
    { id: 'crm', label: 'CRM Financeiro', icon: BarChart3 },
    { id: 'stock', label: 'Estoque', icon: Package },
    { id: 'homepage', label: 'Personalizar', icon: Image },
    { id: 'password', label: 'Alterar Senha', icon: Lock },
  ];

  return (
    <div className="min-h-screen bg-brancosol">
      <div className="sticky top-0 z-50 bg-pureWhite/95 backdrop-blur-md border-b border-caqui/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
                            <img src={imgUrl('/logo.png')} alt="Alu" className="h-8 w-auto" />
              <span className="hidden sm:block text-sm font-medium text-deepblack/50">| Painel Admin</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-deepblack/40 hidden sm:block">alu@admin.com</span>
              <button onClick={onLogout} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-deepblack/50 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                <LogOut size={14} /> Sair
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex gap-1 bg-caquiLight/30 rounded-xl p-1 mb-6 overflow-x-auto">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-pureWhite text-terracotta shadow-sm' : 'text-deepblack/40 hover:text-deepblack/70'}`}>
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'crm' && <CRMTab sales={sales} cashFlow={cashFlow} />}
        {activeTab === 'stock' && <StockTab products={products} onUpdateProducts={onUpdateProducts} onDeleteProduct={onDeleteProduct} />}
        {activeTab === 'homepage' && <HomepageEditor settings={settings} onUpdateSettings={onUpdateSettings} />}
        {activeTab === 'password' && <PasswordTab />}
      </div>
    </div>
  );
}

export default function App() {
  const [view, setView] = useState('store');
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [cashFlow, setCashFlow] = useState([]);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [cart, setCart] = useState(() => loadState('cart', []));
  const [cartOpen, setCartOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [loginError, setLoginError] = useState('');
  const [adminTab, setAdminTab] = useState('crm');
  const [loggedIn, setLoggedIn] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [collectionFilter, setCollectionFilter] = useState('');
  const [checkoutModal, setCheckoutModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load all data from Supabase on mount
  useEffect(() => {
    async function loadData() {
      try {
        const [p, s, c, st] = await Promise.all([
          fetchProducts(),
          fetchSales(),
          fetchCashFlow(),
          fetchSettings(),
        ]);
        if (p.length > 0) setProducts(p.map(prod => ({ ...prod, image: imgUrl(prod.image) })));
        if (s.length > 0) setSales(s);
        if (c.length > 0) setCashFlow(c);
        if (st) setSettings({
          ...st,
          heroImage: imgUrl(st.heroImage),
          aboutImage: imgUrl(st.aboutImage),
        });
      } catch (err) {
        console.error('Error loading from Supabase:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Persist cart locally only
  useEffect(() => { saveState('cart', cart); }, [cart]);

  const handleLogin = async (email, pass) => {
    try {
      const creds = await fetchAdminCreds();
      if (email === creds.email && pass === creds.password) {
        setLoggedIn(true);
        setLoginError('');
        setView('admin');
        setAdminTab('crm');
      } else {
        setLoginError('Email ou senha incorretos');
      }
    } catch {
      setLoginError('Erro ao verificar credenciais');
    }
  };

  const handleLogout = () => {
    setLoggedIn(false);
    setView('store');
  };

  const addToCart = (item) => {
    const exists = cart.findIndex(i => i.id === item.id && i.color === item.color && i.size === item.size);
    if (exists >= 0) {
      const updated = [...cart];
      updated[exists] = { ...updated[exists], quantity: updated[exists].quantity + item.quantity };
      setCart(updated);
    } else {
      setCart([...cart, item]);
    }
    setCartOpen(true);
  };

  const updateCartQuantity = (idx, delta) => {
    const updated = [...cart];
    updated[idx] = { ...updated[idx], quantity: Math.max(1, updated[idx].quantity + delta) };
    setCart(updated);
  };

  const removeFromCart = (idx) => setCart(cart.filter((_, i) => i !== idx));

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    const id = generateId();
    const now = new Date().toISOString().slice(0, 10);
    const newSale = {
      id,
      customerName: 'Cliente Alu',
      customerEmail: 'cliente@email.com',
      items: cart.map(item => ({
        productId: item.id,
        productName: item.name,
        quantity: item.quantity,
        price: item.price,
        color: item.color,
        size: item.size,
      })),
      total: cart.reduce((s, i) => s + i.price * i.quantity, 0),
      date: now,
      status: 'Concluído',
      type: 'online',
    };
    const newCashFlow = {
      id: generateId(),
      description: `Venda #${id} - Cliente Alu`,
      amount: newSale.total,
      type: 'entrada',
      category: 'Vendas',
      date: now,
    };
    try {
      await createSale(newSale);
      await createCashFlowEntry(newCashFlow);
      for (const item of cart) {
        const prod = products.find(p => p.id === item.id);
        if (!prod) continue;
        const stock = { ...prod.stock };
        stock.total = Math.max(0, stock.total - item.quantity);
        if (stock[item.size] !== undefined) stock[item.size] = Math.max(0, stock[item.size] - item.quantity);
        await updateProduct({ ...prod, stock });
      }
      const [p, s, c] = await Promise.all([fetchProducts(), fetchSales(), fetchCashFlow()]);
      if (p.length > 0) setProducts(p);
      if (s.length > 0) setSales(s);
      if (c.length > 0) setCashFlow(c);
      setCart([]);
      setCartOpen(false);
      setCheckoutModal(true);
      setTimeout(() => setCheckoutModal(false), 4000);
    } catch (err) {
      console.error('Checkout error:', err);
      alert('Erro ao processar pedido. Tente novamente.');
    }
  };

  const collections = [...new Set(products.map(p => p.collection))];
  const filteredProducts = products.filter(p => !collectionFilter || p.collection === collectionFilter);
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    return filteredProducts.filter(p => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || p.collection.toLowerCase().includes(q));
  }

  const handleUpdateProducts = async (updatedProducts) => {
    setProducts(updatedProducts);
    // Check what changed - try to get existing IDs to know if create or update
    const existingIds = new Set(products.map(p => p.id));
    for (const p of updatedProducts) {
      try {
        if (existingIds.has(p.id)) {
          await updateProduct(p);
        } else {
          await createProduct(p);
        }
      } catch (e) {
        console.error('Error saving product', p.id, e);
      }
    }
  };

  const handleUpdateSettings = async (newSettings) => {
    setSettings(newSettings);
    try { await updateSettings(newSettings); } catch (e) { console.error('Error saving settings', e); }
  };

  const handleDeleteProduct = async (id) => {
    try {
      await deleteProduct(id);
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch (e) {
      console.error('Error deleting product', e);
    }
  };

  if (view === 'admin') {
    if (!loggedIn) {
      return <LoginScreen onLogin={handleLogin} error={loginError} />;
    }
    return (
      <AdminDashboard
        activeTab={adminTab}
        setActiveTab={setAdminTab}
        onLogout={handleLogout}
        products={products}
        sales={sales}
        cashFlow={cashFlow}
        settings={settings}
        onUpdateProducts={handleUpdateProducts}
        onUpdateSettings={handleUpdateSettings}
        onDeleteProduct={handleDeleteProduct}
      />
    );
  }

  return (
    <div className="min-h-screen bg-brancosol">
      <Header
        cartCount={cart.length}
        onCartOpen={() => setCartOpen(true)}
        onAdminClick={() => { setView('admin'); setLoggedIn(false); }}
        onSearch={() => setSearchOpen(!searchOpen)}
      />

      <HeroSection settings={settings} onAddToCart={addToCart} />

      <section id="colecao" className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <span className="text-xs text-terracotta font-medium uppercase tracking-widest">Coleção 2026</span>
              <h2 className="text-3xl sm:text-4xl font-serif font-bold mt-2">Nossos Produtos</h2>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              <button onClick={() => setCollectionFilter('')}
                className={`px-4 py-2 text-xs font-medium rounded-xl whitespace-nowrap transition-all ${!collectionFilter ? 'bg-terracotta text-pureWhite shadow-sm' : 'bg-caquiLight/50 text-deepblack/60 hover:bg-caquiLight'}`}>
                Todas
              </button>
              {collections.map(c => (
                <button key={c} onClick={() => setCollectionFilter(c)}
                  className={`px-4 py-2 text-xs font-medium rounded-xl whitespace-nowrap transition-all ${collectionFilter === c ? 'bg-terracotta text-pureWhite shadow-sm' : 'bg-caquiLight/50 text-deepblack/60 hover:bg-caquiLight'}`}>
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {filteredProducts.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                onQuickView={setQuickViewProduct}
                onAddToCart={addToCart}
              />
            ))}
          </div>
        </div>
      </section>

      <AboutSection settings={settings} />
      <GallerySection />
      <Footer />

      {quickViewProduct && (
        <ProductModal
          product={quickViewProduct}
          onClose={() => setQuickViewProduct(null)}
          onAddToCart={addToCart}
        />
      )}

      {searchOpen && (
        <div className="fixed inset-0 z-[90] bg-deepblack/40 backdrop-blur-sm" onClick={() => setSearchOpen(false)}>
          <div className="bg-pureWhite max-w-2xl mx-auto mt-20 rounded-2xl shadow-2xl p-6 animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <Search size={18} className="text-deepblack/30" />
              <input autoFocus value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                placeholder="Buscar produtos..."
                className="flex-1 text-sm bg-transparent border-none outline-none" />
              <button onClick={() => setSearchOpen(false)}><X size={18} className="text-deepblack/30" /></button>
            </div>
            {searchQuery && (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())).map(p => (
                  <div key={p.id} className="flex items-center gap-3 p-2 hover:bg-caquiLight/30 rounded-xl cursor-pointer"
                    onClick={() => { setQuickViewProduct(p); setSearchOpen(false); setSearchQuery(''); }}>
                    <div className="w-10 h-10 rounded-lg bg-caquiLight/50 overflow-hidden">
                      <img src={p.image} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{p.name}</p>
                      <p className="text-xs text-terracotta font-medium">{formatCurrency(p.price)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        cart={cart}
        onUpdateQuantity={updateCartQuantity}
        onRemove={removeFromCart}
        onCheckout={handleCheckout}
      />

      {checkoutModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-deepblack/40 backdrop-blur-sm" onClick={() => setCheckoutModal(false)} />
          <div className="relative bg-pureWhite rounded-3xl p-8 sm:p-10 max-w-sm w-full text-center animate-scale-in shadow-2xl">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check size={32} className="text-green-600" />
            </div>
            <h2 className="text-xl font-serif font-bold mb-2">Pedido Confirmado!</h2>
            <p className="text-sm text-deepblack/50 mb-4">Seu pedido foi processado com sucesso.</p>
            <button onClick={() => setCheckoutModal(false)}
              className="bg-terracotta hover:bg-terracottaDark text-pureWhite px-6 py-2.5 rounded-xl text-sm font-medium transition-all">
              Continuar Comprando
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
