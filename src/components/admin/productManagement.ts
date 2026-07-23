import type { Option, SizingGuide, Variant } from '../../constants/types';

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
  short_description: string;
  images: string[];
  video_url: string;
  product_type: string;
  gender: string;
  price: string;
  compare_at_price: string;
  unit_price: string;
  cost_price: string;
  shipping_included: boolean;
  available_quantity: string;
  weight: string;
  status: CatalogStatus;
  is_featured: boolean;
  tagsInput: string;
  options: Option[];
  variants: Variant[];
  sizing_guide: SizingGuide;
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
  short_description: '',
  images: [],
  video_url: '',
  product_type: '',
  gender: '',
  price: '',
  compare_at_price: '',
  unit_price: '',
  cost_price: '',
  shipping_included: false,
  available_quantity: '1',
  weight: '',
  status: 'queue',
  is_featured: false,
  tagsInput: '',
  options: [],
  variants: [],
  sizing_guide: { size_chart: {}, size_fit: '', measurement_unit: 'inch' },
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
  const unitPrice = Number(draft.unit_price);
  const costPrice = Number(draft.cost_price);
  const weight = Number(draft.weight);
  const fallbackQuantity = Math.max(0, Number(draft.available_quantity));
  const discounted = Number.isFinite(compareAtPrice) && compareAtPrice > price;
  const effectiveCompareAtPrice = discounted ? compareAtPrice : undefined;
  const discountValue = discounted ? Number((((compareAtPrice - price) / compareAtPrice) * 100).toFixed(2)) : 0;
  const tags = Array.from(new Set([draft.gender.trim().toLowerCase(), ...parseTags(draft.tagsInput)].filter(Boolean)));
  const sellerName = seller ? getSellerName(seller) : '';
  const handleBase = slugify(draft.title) || `product-${Date.now()}`;
  const normalizedOptions = (draft.options || [])
    .map((option) => ({
      ...option,
      name: option.name.trim(),
      values: option.values.map((value) => value.trim()).filter(Boolean),
      required: option.required !== false,
    }))
    .filter((option) => option.name && option.values.length > 0);
  const normalizedVariants = (draft.variants || [])
    .map((variant, index) => {
      const variantPrice = Number(variant.price);
      const quantity = Math.max(0, Number(variant.inventory?.quantity ?? variant.inventory?.available_quantity ?? 0));
      const variantCompareAt = Number(variant.compare_at_price);
      return {
        id: variant.id || '',
        sku: variant.sku || '',
        title: variant.title || `Variant ${index + 1}`,
        options: variant.options || {},
        price: Number.isFinite(variantPrice) && variantPrice > 0 ? variantPrice : price,
        compare_at_price: Number.isFinite(variantCompareAt) && variantCompareAt > 0 ? variantCompareAt : undefined,
        inventory: {
          quantity,
          available_quantity: quantity,
        },
        position: typeof variant.position === 'number' ? variant.position : index,
        is_default: Boolean(variant.is_default ?? index === 0),
        available: quantity > 0,
      };
    })
    .filter((variant) => variant.title.trim().length > 0);
  const variants = normalizedVariants.length > 0
    ? normalizedVariants
    : [
        {
          id: '',
          sku: '',
          title: 'Default',
          options: {},
          price,
          available: fallbackQuantity > 0,
          inventory: {
            available_quantity: fallbackQuantity,
            quantity: fallbackQuantity,
          },
          position: 0,
          is_default: true,
        },
      ];
  const inventoryQuantity = variants.reduce(
    (sum, variant) => sum + Math.max(0, Number(variant.inventory?.quantity ?? variant.inventory?.available_quantity ?? 0)),
    0,
  );
  const sizingGuide =
    draft.sizing_guide && (Object.keys(draft.sizing_guide.size_chart || {}).length > 0 || draft.sizing_guide.size_fit?.trim() || draft.sizing_guide.image_url?.trim() || draft.sizing_guide.html_table?.trim())
      ? draft.sizing_guide
      : undefined;

  return {
    id: '',
    raw_id: '',
    handle: handleBase,
    title: draft.title.trim(),
    description: draft.description.trim(),
    short_description: (draft.short_description.trim() || draft.description.trim().slice(0, 160)).slice(0, 160),
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
      shipping_included: draft.shipping_included,
      unit_price: Number.isFinite(unitPrice) && unitPrice > 0 ? unitPrice : undefined,
      cost_price: Number.isFinite(costPrice) && costPrice >= 0 ? costPrice : undefined,
    },
    images: draft.images.filter((image) => image.trim().length > 0),
    video_url: draft.video_url.trim() || undefined,
    variants,
    options: normalizedOptions,
    tags,
    inventory: {
      quantity: inventoryQuantity,
      available_quantity: inventoryQuantity,
      in_stock: inventoryQuantity > 0,
      allow_out_of_stock: false,
      low_stock_threshold: 0,
      track_inventory: true,
      inventory_policy: 'deny',
      inventory_management: 'manual',
      reserved_quantity: 0,
      committed_quantity: 0,
    },
    shipping_details: {
      weight: Number.isFinite(weight) && weight > 0 ? weight : 0,
      weight_unit: 'grams',
      shipping_class: 'Standard',
      free_shipping: false,
      shipping_zones: [],
      handling_time: 0,
      requires_shipping: true,
      shipping_methods: [],
    },
    status: 'queue',
    is_featured: draft.is_featured,
    badges: draft.badges,
    collections: [],
    rating: 0,
    review_count: 0,
    is_customizable: false,
    is_ready_to_wear: true,
    return_eligibility: false,
    view_count: 0,
    purchase_count: 0,
    is_trending: false,
    sizing_guide: sizingGuide,
  };
};
