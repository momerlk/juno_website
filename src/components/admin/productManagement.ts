export interface SellerProfile {
  id?: string;
  _id?: string;
  name?: string;
  business_name?: string;
  brand_name?: string;
  legal_name?: string;
  logo_url?: string;
  city?: string;
}

export type CatalogStatus = 'active' | 'embedding_pending' | 'needs_review' | 'queue';
export type BadgeKey = 'marketing_campaign' | 'best_seller' | 'thrifted';
export type ProductBadges = Record<BadgeKey, boolean>;

export interface CreateProductDraft {
  seller_id: string;
  title: string;
  description: string;
  image_url: string;
  product_type: string;
  price: string;
  compare_at_price: string;
  available_quantity: string;
  status: CatalogStatus;
  is_featured: boolean;
  tagsInput: string;
  badges: ProductBadges;
}

export const EMPTY_BADGES: ProductBadges = {
  marketing_campaign: false,
  best_seller: false,
  thrifted: false,
};

export const EMPTY_CREATE_DRAFT: CreateProductDraft = {
  seller_id: '',
  title: '',
  description: '',
  image_url: '',
  product_type: 'General',
  price: '',
  compare_at_price: '',
  available_quantity: '1',
  status: 'active',
  is_featured: false,
  tagsInput: '',
  badges: { ...EMPTY_BADGES },
};

export const BADGE_LABELS: Record<BadgeKey, string> = {
  marketing_campaign: 'Marketing campaign',
  best_seller: 'Best seller',
  thrifted: 'Thrifted',
};

export const asArray = (value: unknown): any[] => {
  if (Array.isArray(value)) return value;
  if (value && typeof value === 'object' && 'data' in value && Array.isArray((value as any).data)) return (value as any).data;
  if (value && typeof value === 'object' && 'products' in value && Array.isArray((value as any).products)) return (value as any).products;
  if (value && typeof value === 'object' && 'items' in value && Array.isArray((value as any).items)) return (value as any).items;
  return [];
};

export const getSellerId = (seller: SellerProfile): string => seller.id || seller._id || '';

export const getSellerName = (seller: SellerProfile): string =>
  seller.business_name || seller.brand_name || seller.name || seller.legal_name || 'Unnamed seller';

export const getImageUrl = (images?: any[]): string => {
  const first = images?.[0];
  if (!first) return '/images/misc/juno_app_icon.png';
  if (typeof first === 'string') return first;
  if (typeof first?.url === 'string') return first.url;
  if (typeof first?.src === 'string') return first.src;
  return '/images/misc/juno_app_icon.png';
};

export const parseTags = (value: string) => value.split(',').map((tag) => tag.trim()).filter(Boolean);

export const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

export const normalizeBadges = (value: any): ProductBadges => ({
  marketing_campaign: Boolean(value?.marketing_campaign),
  best_seller: Boolean(value?.best_seller),
  thrifted: Boolean(value?.thrifted),
});

export const formatCurrency = (value?: number, currency = 'PKR') => {
  if (typeof value !== 'number' || Number.isNaN(value)) return '-';
  return `${currency} ${new Intl.NumberFormat('en-PK', { maximumFractionDigits: 0 }).format(value)}`;
};

export const statusClass = (status?: string) => {
  switch ((status || '').toLowerCase()) {
    case 'active':
      return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300';
    case 'embedding_pending':
      return 'border-blue-500/30 bg-blue-500/10 text-blue-300';
    case 'needs_review':
      return 'border-amber-500/30 bg-amber-500/10 text-amber-300';
    case 'queue':
      return 'border-neutral-500/30 bg-neutral-500/10 text-neutral-300';
    default:
      return 'border-white/20 bg-white/5 text-neutral-300';
  }
};

export const badgeTone = (badge: BadgeKey) => {
  if (badge === 'best_seller') return 'border-amber-400/30 bg-amber-400/10 text-amber-200';
  if (badge === 'thrifted') return 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200';
  return 'border-fuchsia-400/25 bg-fuchsia-400/10 text-fuchsia-200';
};

export const buildAdminProductPayload = (draft: CreateProductDraft, seller?: SellerProfile) => {
  const price = Number(draft.price);
  const compareAtPrice = Number(draft.compare_at_price);
  const availableQuantity = Math.max(0, Number(draft.available_quantity));
  const discounted = Number.isFinite(compareAtPrice) && compareAtPrice > price;
  const effectiveCompareAtPrice = discounted ? compareAtPrice : undefined;
  const discountValue = discounted ? Number((((compareAtPrice - price) / compareAtPrice) * 100).toFixed(2)) : 0;
  const tags = parseTags(draft.tagsInput);
  const sellerName = seller ? getSellerName(seller) : '';
  const handleBase = slugify(draft.title) || `product-${Date.now()}`;

  return {
    id: '',
    raw_id: '',
    handle: handleBase,
    title: draft.title.trim(),
    description: draft.description.trim(),
    short_description: draft.description.trim().slice(0, 160),
    seller_id: draft.seller_id,
    seller_name: sellerName,
    seller_logo: seller?.logo_url || '',
    seller_city: seller?.city || '',
    categories: [],
    product_type: draft.product_type.trim() || 'General',
    pricing: {
      price,
      compare_at_price: effectiveCompareAtPrice,
      currency: 'PKR',
      discounted,
      discount_value: discountValue,
      discounted_price: discounted ? price : undefined,
      brand_price: price,
      shipping_included: false,
    },
    images: draft.image_url.trim() ? [draft.image_url.trim()] : [],
    variants: [
      {
        id: '',
        sku: '',
        title: 'Default',
        options: {},
        price,
        available: availableQuantity > 0,
        inventory: {
          available_quantity: availableQuantity,
          quantity: availableQuantity,
        },
      },
    ],
    options: [],
    tags,
    inventory: {
      in_stock: availableQuantity > 0,
      available_quantity: availableQuantity,
    },
    shipping_details: {
      free_shipping: false,
    },
    status: draft.status,
    is_featured: draft.is_featured,
    badges: draft.badges,
  };
};
