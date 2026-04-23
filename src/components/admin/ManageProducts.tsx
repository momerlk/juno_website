import React, { useEffect, useMemo, useState } from 'react';
import { Globe, Package, RefreshCw, Search, Trash2 } from 'lucide-react';
import {
  deleteProductQueueItem,
  enrichProductQueueItem,
  getAllSellers,
  getProductQueue,
  promoteProductQueueItem,
  scrapeSellerProducts,
} from '../../api/adminApi';
import { AdminCatalog, Catalog } from '../../api/catalogApi';

type TabKey = 'catalog' | 'queue';

interface SellerProfile {
  id?: string;
  _id?: string;
  name?: string;
  business_name?: string;
  brand_name?: string;
  legal_name?: string;
}

interface QueueItem {
  id: string;
  seller_id: string;
  product?: {
    id?: string;
    title?: string;
    description?: string;
    body_html?: string;
    short_description?: string;
    seller_name?: string;
    product_type?: string;
    sizing_guide?: Record<string, any>;
    tags?: string[];
    images?: any[];
    pricing?: { price?: number; brand_price?: number; currency?: string };
    inventory?: { quantity?: number; available_quantity?: number };
  };
  enrichment?: {
    product_type?: string;
    gender?: string;
    sizing_guide?: Record<string, any>;
  };
  source?: string;
  status?: string;
  errors?: string[];
  created_at?: string;
  updated_at?: string;
}

interface QueueEditDraft {
  product_type: string;
  gender: string;
}

type ReferenceTab = 'images' | 'description' | 'body_html';

interface SizingGridDraft {
  rows: string[];
  cols: string[];
  cells: Record<string, Record<string, string>>;
  hasSizeChartWrapper: boolean;
  measurementUnit: string;
  sizeFit: string;
}

interface CatalogEditDraft {
  title: string;
  description: string;
  status: 'active' | 'draft' | 'archived';
  is_featured: boolean;
  tagsInput: string;
}

type QueueSortKey = 'updated_desc' | 'updated_asc' | 'price_desc' | 'price_asc' | 'stock_desc' | 'stock_asc';

const PRODUCT_TYPES = ['Eastern', 'Western', 'Fusion', 'Modest', 'Footwear', 'Accessories'];
const GENDERS = ['female', 'male', 'unisex'];
const PAGE_SIZE = 25;
const SIZE_ROW_PRESET = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'];

const asArray = (value: unknown): any[] => {
  if (Array.isArray(value)) return value;
  if (value && typeof value === 'object' && 'data' in value && Array.isArray((value as any).data)) return (value as any).data;
  if (value && typeof value === 'object' && 'products' in value && Array.isArray((value as any).products)) return (value as any).products;
  return [];
};

const getSellerId = (seller: SellerProfile): string => seller.id || seller._id || '';

const getSellerName = (seller: SellerProfile): string =>
  seller.business_name || seller.brand_name || seller.name || seller.legal_name || 'Unnamed Seller';

const getImageUrl = (images?: any[]): string => {
  const first = images?.[0];
  if (!first) return '/juno_app_icon.png';
  if (typeof first === 'string') return first;
  if (typeof first?.url === 'string') return first.url;
  if (typeof first?.src === 'string') return first.src;
  return '/juno_app_icon.png';
};

const normalizeGender = (value?: string): string => {
  const lower = (value || '').toLowerCase();
  if (lower.includes('female') || lower.includes('women') || lower.includes('woman')) return 'female';
  if (lower.includes('male') || lower.includes('men') || lower.includes('man')) return 'male';
  if (lower.includes('unisex')) return 'unisex';
  return '';
};

const inferGender = (item: QueueItem): string => {
  const fromEnrichment = normalizeGender(item.enrichment?.gender);
  if (fromEnrichment) return fromEnrichment;
  const tag = item.product?.tags?.find((t) => normalizeGender(t));
  return normalizeGender(tag);
};

const formatCurrency = (value?: number, currency = 'PKR') => {
  if (typeof value !== 'number') return '-';
  return `${currency} ${new Intl.NumberFormat('en-PK', { maximumFractionDigits: 0 }).format(value)}`;
};

const statusPillClass = (status?: string) => {
  switch ((status || '').toLowerCase()) {
    case 'ready':
    case 'active':
      return 'border-green-500/35 bg-green-500/10 text-green-300';
    case 'promoted':
      return 'border-blue-500/35 bg-blue-500/10 text-blue-300';
    case 'failed':
    case 'rejected':
    case 'archived':
      return 'border-red-500/35 bg-red-500/10 text-red-300';
    case 'queued':
    case 'draft':
      return 'border-yellow-500/35 bg-yellow-500/10 text-yellow-300';
    default:
      return 'border-white/20 bg-white/5 text-neutral-300';
  }
};

const getPageSlice = <T,>(items: T[], page: number, pageSize: number): T[] => {
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
};

const getQueueItemPrice = (item: QueueItem): number => {
  const value = item.product?.pricing?.price ?? item.product?.pricing?.brand_price;
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
};

const getQueueItemStock = (item: QueueItem): number => {
  const value = item.product?.inventory?.available_quantity ?? item.product?.inventory?.quantity;
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, value) : 0;
};

const getQueueItemUpdatedTs = (item: QueueItem): number => {
  const ts = Date.parse(item.updated_at || item.created_at || '');
  return Number.isFinite(ts) ? ts : 0;
};

const hasSizingGuideData = (item: QueueItem): boolean => {
  const guide = item.enrichment?.sizing_guide || item.product?.sizing_guide;
  if (!guide || typeof guide !== 'object') return false;
  const chart = (guide as any).size_chart && typeof (guide as any).size_chart === 'object'
    ? (guide as any).size_chart
    : guide;
  return typeof chart === 'object' && Object.keys(chart).length > 0;
};

const hasQueueBodyHtmlTable = (item: QueueItem): boolean => !!extractFirstTableHtml(item.product?.body_html);

const getVariantAvailability = (product: any): { available: string[]; unavailable: string[] } => {
  const variants = asArray(product?.variants);
  const available: string[] = [];
  const unavailable: string[] = [];
  variants.forEach((variant: any, index: number) => {
    const title = String(variant?.title || variant?.id || `Variant ${index + 1}`);
    const qty = variant?.inventory?.available_quantity ?? variant?.inventory?.quantity;
    const hasQty = typeof qty === 'number' && Number.isFinite(qty);
    const isAvailable = variant?.available !== false && (!hasQty || qty > 0);
    if (isAvailable) available.push(title);
    else unavailable.push(title);
  });
  return { available, unavailable };
};

const sanitizeHtml = (html?: string): string => {
  if (!html) return '';
  return html.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '');
};

const extractFirstTableHtml = (html?: string): string => {
  const safe = sanitizeHtml(html);
  if (!safe) return '';
  const match = safe.match(/<table[\s\S]*?<\/table>/i);
  return match?.[0] || '';
};

const stripHtml = (html?: string): string => {
  if (!html) return '';
  return sanitizeHtml(html).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
};

const normalizeCellValue = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  return String(value);
};

const parseSizingGuideDraft = (sizingGuide?: Record<string, any>): SizingGridDraft => {
  const rawGuide = sizingGuide && typeof sizingGuide === 'object' ? sizingGuide : {};
  const chartCandidate = rawGuide.size_chart && typeof rawGuide.size_chart === 'object' ? rawGuide.size_chart : rawGuide;
  const chart = chartCandidate && typeof chartCandidate === 'object' ? chartCandidate : {};

  const rows = Object.keys(chart);
  const colSet = new Set<string>();
  rows.forEach((row) => {
    const rowObj = chart[row];
    if (rowObj && typeof rowObj === 'object') {
      Object.keys(rowObj).forEach((col) => colSet.add(col));
    }
  });

  const resolvedRows = rows.length > 0 ? rows : ['S', 'M', 'L'];
  const resolvedCols = colSet.size > 0 ? Array.from(colSet) : ['shoulder', 'chest', 'length'];
  const cells: Record<string, Record<string, string>> = {};

  resolvedRows.forEach((row) => {
    cells[row] = {};
    resolvedCols.forEach((col) => {
      const value = chart?.[row]?.[col];
      cells[row][col] = normalizeCellValue(value);
    });
  });

  return {
    rows: resolvedRows,
    cols: resolvedCols,
    cells,
    hasSizeChartWrapper: !!(rawGuide.size_chart && typeof rawGuide.size_chart === 'object'),
    measurementUnit: String(rawGuide.measurement_unit || 'inch'),
    sizeFit: String(rawGuide.size_fit || ''),
  };
};

const maybeNumeric = (value: string): number | string => {
  const trimmed = value.trim();
  if (!trimmed) return '';
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : trimmed;
};

const buildSizingGuidePayload = (draft: SizingGridDraft): Record<string, any> => {
  const chart: Record<string, Record<string, number | string>> = {};
  draft.rows.forEach((row) => {
    const rowName = row.trim();
    if (!rowName) return;
    const rowValues: Record<string, number | string> = {};
    draft.cols.forEach((col) => {
      const colName = col.trim();
      if (!colName) return;
      const raw = draft.cells[row]?.[col] ?? '';
      const cast = maybeNumeric(raw);
      if (cast !== '') rowValues[colName] = cast;
    });
    if (Object.keys(rowValues).length > 0) chart[rowName] = rowValues;
  });

  if (draft.hasSizeChartWrapper) {
    return {
      size_chart: chart,
      measurement_unit: draft.measurementUnit || 'inch',
      size_fit: draft.sizeFit || '',
    };
  }

  return chart;
};

const ManageProducts: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('queue');
  const [products, setProducts] = useState<any[]>([]);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [sellers, setSellers] = useState<SellerProfile[]>([]);
  const [selectedSellerId, setSelectedSellerId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [actionKey, setActionKey] = useState('');

  const [scrapeShopUrl, setScrapeShopUrl] = useState('');
  const [scrapeFeedback, setScrapeFeedback] = useState('');
  const [scrapeError, setScrapeError] = useState('');
  const [queueBrandFilter, setQueueBrandFilter] = useState('all');
  const [queueSort, setQueueSort] = useState<QueueSortKey>('updated_desc');
  const [queueFlagFilters, setQueueFlagFilters] = useState({
    noSizingGuide: false,
    hasBodyTable: false,
    outOfStock: false,
    hasErrors: false,
    hasImages: false,
  });

  const [queueEditId, setQueueEditId] = useState('');
  const [queueEditDraft, setQueueEditDraft] = useState<QueueEditDraft>({
    product_type: '',
    gender: '',
  });
  const [queueEditError, setQueueEditError] = useState('');
  const [referenceTab, setReferenceTab] = useState<ReferenceTab>('images');
  const [referenceImageIndex, setReferenceImageIndex] = useState(0);
  const [sizingDraft, setSizingDraft] = useState<SizingGridDraft>(parseSizingGuideDraft({}));
  const [incrementBaseSize, setIncrementBaseSize] = useState('');
  const [incrementStep, setIncrementStep] = useState('0.5');
  const [incrementStepsByCol, setIncrementStepsByCol] = useState<Record<string, string>>({});

  const [catalogEditId, setCatalogEditId] = useState('');
  const [catalogEditDraft, setCatalogEditDraft] = useState<CatalogEditDraft>({
    title: '',
    description: '',
    status: 'active',
    is_featured: false,
    tagsInput: '',
  });
  const [catalogEditError, setCatalogEditError] = useState('');

  const [queuePage, setQueuePage] = useState(1);
  const [catalogPage, setCatalogPage] = useState(1);

  const fetchQueueData = async () => {
    const [queueResp, sellersResp] = await Promise.all([getProductQueue(), getAllSellers()]);
    setQueue(asArray(queueResp.body) as QueueItem[]);
    const sellerList = asArray(sellersResp.body) as SellerProfile[];
    setSellers(sellerList);
    if (!selectedSellerId && sellerList.length > 0) setSelectedSellerId(getSellerId(sellerList[0]));
  };

  const fetchCatalogData = async () => {
    const catalogResp = await Catalog.getProducts({ limit: 500 });
    setProducts(asArray(catalogResp.body));
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'queue') await fetchQueueData();
      else await fetchCatalogData();
    } catch (error) {
      console.error('Failed to fetch products data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  useEffect(() => {
    setQueuePage(1);
    setCatalogPage(1);
  }, [searchTerm, statusFilter, activeTab, queueSort, queueFlagFilters, queueBrandFilter]);

  useEffect(() => {
    setIncrementStepsByCol((prev) => {
      const next: Record<string, string> = {};
      sizingDraft.cols.forEach((col) => {
        next[col] = prev[col] ?? '0.5';
      });
      return next;
    });
  }, [sizingDraft.cols]);

  const filteredCatalog = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => {
      const title = String(p.title || '').toLowerCase();
      const seller = String(p.seller_name || p.seller_id || '').toLowerCase();
      const status = String(p.status || '').toLowerCase();
      const productId = String(p.id || '').toLowerCase();
      return title.includes(q) || seller.includes(q) || status.includes(q) || productId.includes(q);
    });
  }, [products, searchTerm]);

  const queueBrandOptions = useMemo(() => {
    const seen = new Set<string>();
    const options: string[] = [];
    queue.forEach((item) => {
      const name = String(item.product?.seller_name || item.seller_id || '').trim();
      if (!name || seen.has(name)) return;
      seen.add(name);
      options.push(name);
    });
    return options.sort((a, b) => a.localeCompare(b));
  }, [queue]);

  const filteredQueue = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    const tokens = q ? q.split(/\s+/).filter(Boolean) : [];
    const termTokens: string[] = [];
    const fieldFilters: Record<string, string[]> = {};
    const priceOps: Array<{ op: '>' | '<' | '>=' | '<='; value: number }> = [];

    tokens.forEach((token) => {
      const priceMatch = token.match(/^price(<=|>=|<|>)(\d+(?:\.\d+)?)$/);
      if (priceMatch) {
        priceOps.push({ op: priceMatch[1] as '>' | '<' | '>=' | '<=', value: Number(priceMatch[2]) });
        return;
      }
      const splitIdx = token.indexOf(':');
      if (splitIdx > 0) {
        const key = token.slice(0, splitIdx);
        const value = token.slice(splitIdx + 1);
        if (value) fieldFilters[key] = [...(fieldFilters[key] || []), value];
      } else {
        termTokens.push(token);
      }
    });

    const filtered = queue.filter((item) => {
      const title = String(item.product?.title || '').toLowerCase();
      const seller = String(item.product?.seller_name || item.seller_id || '').toLowerCase();
      const sellerExact = String(item.product?.seller_name || item.seller_id || '').trim();
      const status = String(item.status || '').toLowerCase();
      const source = String(item.source || '').toLowerCase();
      const queueId = String(item.id || '').toLowerCase();
      const productType = String(item.enrichment?.product_type || item.product?.product_type || '').toLowerCase();
      const gender = String(item.enrichment?.gender || inferGender(item) || '').toLowerCase();
      const hasTable = hasQueueBodyHtmlTable(item);
      const hasImages = asArray(item.product?.images).length > 0;
      const hasSizing = hasSizingGuideData(item);
      const hasErrors = asArray(item.errors).length > 0;
      const stock = getQueueItemStock(item);
      const price = getQueueItemPrice(item);

      const matchesTerms = termTokens.every((term) =>
        title.includes(term) ||
        seller.includes(term) ||
        status.includes(term) ||
        source.includes(term) ||
        queueId.includes(term) ||
        productType.includes(term)
      );
      const matchesSearch = tokens.length === 0 || matchesTerms;
      const matchesStatus = statusFilter === 'all' || status === statusFilter;
      const matchesBrand = queueBrandFilter === 'all' || sellerExact === queueBrandFilter;
      const matchesSmartFields = Object.entries(fieldFilters).every(([key, values]) => {
        if (values.length === 0) return true;
        if (key === 'status') return values.some((v) => status.includes(v));
        if (key === 'seller') return values.some((v) => seller.includes(v));
        if (key === 'source') return values.some((v) => source.includes(v));
        if (key === 'id') return values.some((v) => queueId.includes(v));
        if (key === 'title') return values.some((v) => title.includes(v));
        if (key === 'type') return values.some((v) => productType.includes(v));
        if (key === 'gender') return values.some((v) => gender.includes(v));
        if (key === 'has') {
          return values.every((v) => {
            if (v === 'table') return hasTable;
            if (v === 'image' || v === 'images') return hasImages;
            if (v === 'sizing' || v === 'sizeguide') return hasSizing;
            if (v === 'error' || v === 'errors') return hasErrors;
            return true;
          });
        }
        if (key === 'stock') {
          return values.every((v) => {
            if (v === 'out') return stock <= 0;
            if (v === 'low') return stock > 0 && stock <= 5;
            if (v === 'in') return stock > 0;
            return true;
          });
        }
        return true;
      });
      const matchesPrice = priceOps.every(({ op, value }) => {
        if (op === '>') return price > value;
        if (op === '<') return price < value;
        if (op === '>=') return price >= value;
        return price <= value;
      });
      const matchesFlags =
        (!queueFlagFilters.noSizingGuide || !hasSizing) &&
        (!queueFlagFilters.hasBodyTable || hasTable) &&
        (!queueFlagFilters.outOfStock || stock <= 0) &&
        (!queueFlagFilters.hasErrors || hasErrors) &&
        (!queueFlagFilters.hasImages || hasImages);
      return matchesSearch && matchesStatus && matchesBrand && matchesSmartFields && matchesPrice && matchesFlags;
    });

    return filtered.sort((a, b) => {
      if (queueSort === 'updated_asc') return getQueueItemUpdatedTs(a) - getQueueItemUpdatedTs(b);
      if (queueSort === 'updated_desc') return getQueueItemUpdatedTs(b) - getQueueItemUpdatedTs(a);
      if (queueSort === 'price_asc') return getQueueItemPrice(a) - getQueueItemPrice(b);
      if (queueSort === 'price_desc') return getQueueItemPrice(b) - getQueueItemPrice(a);
      if (queueSort === 'stock_asc') return getQueueItemStock(a) - getQueueItemStock(b);
      return getQueueItemStock(b) - getQueueItemStock(a);
    });
  }, [queue, searchTerm, statusFilter, queueSort, queueFlagFilters, queueBrandFilter]);

  const queueTotalPages = Math.max(1, Math.ceil(filteredQueue.length / PAGE_SIZE));
  const catalogTotalPages = Math.max(1, Math.ceil(filteredCatalog.length / PAGE_SIZE));

  const queuePageItems = useMemo(
    () => getPageSlice(filteredQueue, Math.min(queuePage, queueTotalPages), PAGE_SIZE),
    [filteredQueue, queuePage, queueTotalPages]
  );
  const catalogPageItems = useMemo(
    () => getPageSlice(filteredCatalog, Math.min(catalogPage, catalogTotalPages), PAGE_SIZE),
    [filteredCatalog, catalogPage, catalogTotalPages]
  );

  const handleRefresh = async () => {
    await fetchData();
  };

  const handleScrapeForSeller = async () => {
    if (!selectedSellerId) return;
    setActionKey('scrape');
    setScrapeError('');
    setScrapeFeedback('');
    try {
      const website = scrapeShopUrl.trim();
      const resp = await scrapeSellerProducts(selectedSellerId, website || undefined);
      if (!resp.ok) {
        const msg = typeof resp.body === 'object' && resp.body && 'message' in resp.body ? String((resp.body as any).message) : 'Failed to start scrape';
        throw new Error(msg);
      }
      await fetchQueueData();
      const seller = sellers.find((s) => getSellerId(s) === selectedSellerId);
      setScrapeFeedback(`Scrape started for ${getSellerName(seller || {})}${website ? ` using ${website}` : ''}.`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to start scrape';
      setScrapeError(msg);
    } finally {
      setActionKey('');
    }
  };

  const openQueueEdit = (item: QueueItem) => {
    setQueueEditId(item.id);
    setQueueEditError('');
    const guideSeed = item.enrichment?.sizing_guide || item.product?.sizing_guide || {};
    setQueueEditDraft({
      product_type: item.enrichment?.product_type || item.product?.product_type || '',
      gender: inferGender(item),
    });
    const parsed = parseSizingGuideDraft(guideSeed);
    setSizingDraft(parsed);
    const hasBodyTable = !!extractFirstTableHtml(item.product?.body_html);
    setReferenceTab(hasBodyTable ? 'body_html' : item.product?.images?.length ? 'images' : item.product?.body_html ? 'body_html' : 'description');
    setReferenceImageIndex(0);
    setIncrementBaseSize(parsed.rows[0] || '');
    setIncrementStep('0.5');
    setIncrementStepsByCol(
      parsed.cols.reduce((acc, col) => {
        acc[col] = '0.5';
        return acc;
      }, {} as Record<string, string>)
    );
  };

  const cancelQueueEdit = () => {
    setQueueEditId('');
    setQueueEditError('');
  };

  const updateGuideCell = (row: string, col: string, value: string) => {
    setSizingDraft((prev) => ({
      ...prev,
      cells: {
        ...prev.cells,
        [row]: {
          ...(prev.cells[row] || {}),
          [col]: value,
        },
      },
    }));
  };

  const updateGuideRowName = (oldName: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed || trimmed === oldName) return;
    setSizingDraft((prev) => {
      if (prev.rows.includes(trimmed)) return prev;
      const nextRows = prev.rows.map((row) => (row === oldName ? trimmed : row));
      const nextCells = { ...prev.cells, [trimmed]: { ...(prev.cells[oldName] || {}) } };
      delete nextCells[oldName];
      return { ...prev, rows: nextRows, cells: nextCells };
    });
    setIncrementBaseSize((prev) => (prev === oldName ? trimmed : prev));
  };

  const updateGuideColName = (oldName: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed || trimmed === oldName) return;
    setSizingDraft((prev) => {
      if (prev.cols.includes(trimmed)) return prev;
      const nextCols = prev.cols.map((col) => (col === oldName ? trimmed : col));
      const nextCells: Record<string, Record<string, string>> = {};
      prev.rows.forEach((row) => {
        const rowCells = { ...(prev.cells[row] || {}) };
        rowCells[trimmed] = rowCells[oldName] || '';
        delete rowCells[oldName];
        nextCells[row] = rowCells;
      });
      return { ...prev, cols: nextCols, cells: nextCells };
    });
    setIncrementStepsByCol((prev) => {
      const next = { ...prev, [trimmed]: prev[oldName] || prev[trimmed] || '0.5' };
      delete next[oldName];
      return next;
    });
  };

  const addGuideRow = () => {
    setSizingDraft((prev) => {
      const suggested = SIZE_ROW_PRESET.find((name) => !prev.rows.includes(name)) || `Size ${prev.rows.length + 1}`;
      const nextRows = [...prev.rows, suggested];
      const nextCells = { ...prev.cells, [suggested]: {} as Record<string, string> };
      prev.cols.forEach((col) => {
        nextCells[suggested][col] = '';
      });
      return { ...prev, rows: nextRows, cells: nextCells };
    });
  };

  const addGuideCol = () => {
    setSizingDraft((prev) => {
      const suggested = `measurement_${prev.cols.length + 1}`;
      const nextCols = [...prev.cols, suggested];
      const nextCells: Record<string, Record<string, string>> = {};
      prev.rows.forEach((row) => {
        nextCells[row] = { ...(prev.cells[row] || {}), [suggested]: '' };
      });
      return { ...prev, cols: nextCols, cells: nextCells };
    });
  };

  const removeGuideRow = (rowName: string) => {
    setSizingDraft((prev) => {
      if (prev.rows.length <= 1) return prev;
      const nextRows = prev.rows.filter((row) => row !== rowName);
      const nextCells = { ...prev.cells };
      delete nextCells[rowName];
      return { ...prev, rows: nextRows, cells: nextCells };
    });
    setIncrementBaseSize((prev) => (prev === rowName ? '' : prev));
  };

  const removeGuideCol = (colName: string) => {
    setSizingDraft((prev) => {
      if (prev.cols.length <= 1) return prev;
      const nextCols = prev.cols.filter((col) => col !== colName);
      const nextCells: Record<string, Record<string, string>> = {};
      prev.rows.forEach((row) => {
        const rowCells = { ...(prev.cells[row] || {}) };
        delete rowCells[colName];
        nextCells[row] = rowCells;
      });
      return { ...prev, cols: nextCols, cells: nextCells };
    });
    setIncrementStepsByCol((prev) => {
      const next = { ...prev };
      delete next[colName];
      return next;
    });
  };

  const transposeGuide = () => {
    setSizingDraft((prev) => {
      const nextRows = [...prev.cols];
      const nextCols = [...prev.rows];
      const nextCells: Record<string, Record<string, string>> = {};
      nextRows.forEach((row) => {
        nextCells[row] = {};
        nextCols.forEach((col) => {
          nextCells[row][col] = prev.cells[col]?.[row] || '';
        });
      });
      return { ...prev, rows: nextRows, cols: nextCols, cells: nextCells };
    });
    setIncrementBaseSize('');
    setIncrementStepsByCol({});
  };

  const applyStepIncrement = () => {
    const stepValue = Number(incrementStep);
    if (!incrementBaseSize || !Number.isFinite(stepValue)) {
      setQueueEditError('Choose a base size and valid increment step.');
      return;
    }
    setQueueEditError('');
    setSizingDraft((prev) => {
      const baseIndex = prev.rows.indexOf(incrementBaseSize);
      if (baseIndex === -1) return prev;
      const baseCells = prev.cells[incrementBaseSize] || {};
      const nextCells: Record<string, Record<string, string>> = {};
      prev.rows.forEach((row, rowIndex) => {
        const offset = rowIndex - baseIndex;
        nextCells[row] = { ...(prev.cells[row] || {}) };
        prev.cols.forEach((col) => {
          const baseRaw = baseCells[col];
          const baseNumber = Number(baseRaw);
          if (!Number.isFinite(baseNumber)) return;
          const nextValue = baseNumber + (offset * stepValue);
          nextCells[row][col] = String(Number(nextValue.toFixed(3)));
        });
      });
      return { ...prev, cells: nextCells };
    });
  };

  const applyColumnStepIncrement = () => {
    if (!incrementBaseSize) {
      setQueueEditError('Choose a base size first.');
      return;
    }
    setQueueEditError('');
    setSizingDraft((prev) => {
      const baseIndex = prev.rows.indexOf(incrementBaseSize);
      if (baseIndex === -1) return prev;
      const baseCells = prev.cells[incrementBaseSize] || {};
      const nextCells: Record<string, Record<string, string>> = {};
      prev.rows.forEach((row, rowIndex) => {
        const offset = rowIndex - baseIndex;
        nextCells[row] = { ...(prev.cells[row] || {}) };
        prev.cols.forEach((col) => {
          const step = Number(incrementStepsByCol[col] || incrementStep);
          const baseNumber = Number(baseCells[col]);
          if (!Number.isFinite(step) || !Number.isFinite(baseNumber)) return;
          const nextValue = baseNumber + (offset * step);
          nextCells[row][col] = String(Number(nextValue.toFixed(3)));
        });
      });
      return { ...prev, cells: nextCells };
    });
  };

  const focusGuideCell = (queueId: string, rowIndex: number, colIndex: number, rowCount: number, colCount: number) => {
    const boundedRow = Math.max(0, Math.min(rowCount - 1, rowIndex));
    const boundedCol = Math.max(0, Math.min(colCount - 1, colIndex));
    const id = `sg-cell-${queueId}-${boundedRow}-${boundedCol}`;
    const el = document.getElementById(id) as HTMLInputElement | null;
    if (el) {
      el.focus();
      el.select();
    }
  };

  const onGuideCellKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>,
    queueId: string,
    rowIndex: number,
    colIndex: number,
    rowCount: number,
    colCount: number
  ) => {
    switch (event.key) {
      case 'ArrowUp':
        event.preventDefault();
        focusGuideCell(queueId, rowIndex - 1, colIndex, rowCount, colCount);
        break;
      case 'ArrowDown':
        event.preventDefault();
        focusGuideCell(queueId, rowIndex + 1, colIndex, rowCount, colCount);
        break;
      case 'ArrowLeft':
        event.preventDefault();
        focusGuideCell(queueId, rowIndex, colIndex - 1, rowCount, colCount);
        break;
      case 'ArrowRight':
        event.preventDefault();
        focusGuideCell(queueId, rowIndex, colIndex + 1, rowCount, colCount);
        break;
      case 'Enter':
        event.preventDefault();
        focusGuideCell(queueId, event.shiftKey ? rowIndex - 1 : rowIndex + 1, colIndex, rowCount, colCount);
        break;
      default:
        break;
    }
  };

  const handleEnrich = async (item: QueueItem) => {
    if (!queueEditDraft.product_type || !queueEditDraft.gender) {
      setQueueEditError('Product type and gender are required.');
      return;
    }

    const sizingGuidePayload = buildSizingGuidePayload(sizingDraft);
    setQueueEditError('');
    setActionKey(`${item.id}:enrich`);
    try {
      const response = await enrichProductQueueItem(item.id, {
        product_type: queueEditDraft.product_type,
        gender: queueEditDraft.gender,
        sizing_guide: sizingGuidePayload,
      });
      if (!response.ok) {
        const msg = typeof response.body === 'object' && response.body && 'message' in response.body ? String((response.body as any).message) : 'Failed to enrich queue item';
        throw new Error(msg);
      }
      await fetchQueueData();
      cancelQueueEdit();
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to enrich queue item';
      setQueueEditError(msg);
    } finally {
      setActionKey('');
    }
  };

  const handlePromote = async (item: QueueItem) => {
    setActionKey(`${item.id}:promote`);
    try {
      const response = await promoteProductQueueItem(item.id);
      if (!response.ok) {
        const msg = typeof response.body === 'object' && response.body && 'message' in response.body ? String((response.body as any).message) : 'Failed to promote queue item';
        throw new Error(msg);
      }
      await fetchQueueData();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Failed to promote queue item');
    } finally {
      setActionKey('');
    }
  };

  const handleDeleteQueueItem = async (item: QueueItem) => {
    if (!window.confirm(`Delete queue item ${item.id}?`)) return;
    setActionKey(`${item.id}:delete`);
    try {
      const response = await deleteProductQueueItem(item.id);
      if (!response.ok) {
        const msg = typeof response.body === 'object' && response.body && 'message' in response.body ? String((response.body as any).message) : 'Failed to delete queue item';
        throw new Error(msg);
      }
      await fetchQueueData();
      if (queueEditId === item.id) cancelQueueEdit();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Failed to delete queue item');
    } finally {
      setActionKey('');
    }
  };

  const handleBulkDeleteFilteredQueue = async () => {
    const targetItems = filteredQueue;
    if (targetItems.length === 0) return;
    const confirmed = window.confirm(`Delete ${targetItems.length} queue item(s) matching current filters? This cannot be undone.`);
    if (!confirmed) return;

    setActionKey('bulkDelete');
    try {
      const ids = targetItems.map((item) => item.id);
      const BATCH_SIZE = 12;
      let failed = 0;

      for (let i = 0; i < ids.length; i += BATCH_SIZE) {
        const batch = ids.slice(i, i + BATCH_SIZE);
        const results = await Promise.allSettled(batch.map((id) => deleteProductQueueItem(id)));
        results.forEach((result) => {
          if (result.status === 'rejected') {
            failed += 1;
            return;
          }
          if (!result.value.ok) failed += 1;
        });
      }

      await fetchQueueData();
      if (queueEditId && ids.includes(queueEditId)) cancelQueueEdit();

      if (failed > 0) {
        window.alert(`Bulk delete finished with ${failed} failure(s).`);
      }
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Bulk delete failed');
    } finally {
      setActionKey('');
    }
  };

  const openCatalogEdit = (product: any) => {
    setCatalogEditId(product.id);
    setCatalogEditError('');
    setCatalogEditDraft({
      title: String(product.title || ''),
      description: String(product.description || ''),
      status: (['active', 'draft', 'archived'].includes(product.status) ? product.status : 'active') as 'active' | 'draft' | 'archived',
      is_featured: !!product.is_featured,
      tagsInput: Array.isArray(product.tags) ? product.tags.join(', ') : '',
    });
  };

  const cancelCatalogEdit = () => {
    setCatalogEditId('');
    setCatalogEditError('');
  };

  const handleCatalogPatch = async (product: any) => {
    if (!catalogEditDraft.title.trim()) {
      setCatalogEditError('Title is required.');
      return;
    }

    const payload = {
      title: catalogEditDraft.title.trim(),
      description: catalogEditDraft.description.trim(),
      status: catalogEditDraft.status,
      is_featured: catalogEditDraft.is_featured,
      tags: catalogEditDraft.tagsInput.split(',').map((t) => t.trim()).filter(Boolean),
    };

    setCatalogEditError('');
    setActionKey(`${product.id}:patch`);
    try {
      const response = await AdminCatalog.updateProduct(product.id, payload);
      if (!response.ok) {
        const msg = typeof response.body === 'object' && response.body && 'message' in response.body ? String((response.body as any).message) : 'Failed to update product';
        throw new Error(msg);
      }
      await fetchCatalogData();
      cancelCatalogEdit();
    } catch (error) {
      setCatalogEditError(error instanceof Error ? error.message : 'Failed to update product');
    } finally {
      setActionKey('');
    }
  };

  const handleCatalogDelete = async (product: any) => {
    if (!window.confirm(`Delete active catalog product "${product.title || product.id}"?`)) return;
    setActionKey(`${product.id}:deleteCatalog`);
    try {
      const response = await AdminCatalog.deleteProduct(product.id);
      if (!response.ok) {
        const msg = typeof response.body === 'object' && response.body && 'message' in response.body ? String((response.body as any).message) : 'Failed to delete product';
        throw new Error(msg);
      }
      await fetchCatalogData();
      if (catalogEditId === product.id) cancelCatalogEdit();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Failed to delete product');
    } finally {
      setActionKey('');
    }
  };

  const renderPager = (page: number, totalPages: number, setPage: (n: number) => void) => (
    <div className="mt-3 flex items-center justify-between text-xs text-neutral-400">
      <span>Page {Math.min(page, totalPages)} of {totalPages}</span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => setPage(Math.max(1, page - 1))}
          disabled={page <= 1}
          className="rounded border border-white/15 px-2 py-1 text-neutral-200 disabled:opacity-40"
        >
          Prev
        </button>
        <button
          onClick={() => setPage(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
          className="rounded border border-white/15 px-2 py-1 text-neutral-200 disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );

  return (
    <div className="mt-4 space-y-4 text-neutral-100">
      <section className="rounded-lg border border-white/10 bg-[#121212] p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Package size={16} className="text-primary" />
            <h2 className="text-base font-semibold">Product Operations</h2>
          </div>
          <button
            onClick={handleRefresh}
            className="inline-flex items-center gap-2 rounded border border-white/15 bg-[#1a1a1a] px-3 py-1.5 text-xs"
          >
            <RefreshCw size={13} />
            Refresh
          </button>
        </div>

        <div className="mt-3 grid gap-2 md:grid-cols-[auto_1fr]">
          <div className="inline-flex rounded border border-white/15 bg-[#0f0f0f] p-1">
            <button
              onClick={() => setActiveTab('queue')}
              className={`rounded px-3 py-1 text-xs ${activeTab === 'queue' ? 'bg-white text-black' : 'text-neutral-300'}`}
            >
              Queue
            </button>
            <button
              onClick={() => setActiveTab('catalog')}
              className={`rounded px-3 py-1 text-xs ${activeTab === 'catalog' ? 'bg-white text-black' : 'text-neutral-300'}`}
            >
              Active Catalog
            </button>
          </div>
          <div className="relative">
            <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={activeTab === 'queue' ? 'Smart search queue (e.g. status:ready seller:rakh has:table)' : 'Search catalog...'}
              className="w-full rounded border border-white/20 bg-[#080808] py-1.5 pl-7 pr-2 text-xs text-neutral-100 placeholder:text-neutral-500 focus:border-primary/60 focus:outline-none"
            />
          </div>
        </div>
      </section>

      {activeTab === 'queue' ? (
        <section className="rounded-lg border border-white/10 bg-[#121212] p-4">
          <div className="grid gap-2 lg:grid-cols-[180px_180px_1fr_1fr_auto]">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded border border-white/20 bg-[#080808] px-2 py-1.5 text-xs text-neutral-100 [color-scheme:dark] focus:border-primary/60 focus:outline-none"
            >
              <option className="bg-[#0f0f0f] text-neutral-100" value="all">All statuses</option>
              <option className="bg-[#0f0f0f] text-neutral-100" value="queued">Queued</option>
              <option className="bg-[#0f0f0f] text-neutral-100" value="enrichment_pending">Enrichment Pending</option>
              <option className="bg-[#0f0f0f] text-neutral-100" value="ready">Ready</option>
              <option className="bg-[#0f0f0f] text-neutral-100" value="promoted">Promoted</option>
              <option className="bg-[#0f0f0f] text-neutral-100" value="failed">Failed</option>
            </select>
            <select
              value={queueBrandFilter}
              onChange={(e) => setQueueBrandFilter(e.target.value)}
              className="rounded border border-white/20 bg-[#080808] px-2 py-1.5 text-xs text-neutral-100 [color-scheme:dark] focus:border-primary/60 focus:outline-none"
            >
              <option className="bg-[#0f0f0f] text-neutral-100" value="all">All brands</option>
              {queueBrandOptions.map((brand) => (
                <option key={brand} className="bg-[#0f0f0f] text-neutral-100" value={brand}>
                  {brand}
                </option>
              ))}
            </select>
            <select
              value={selectedSellerId}
              onChange={(e) => setSelectedSellerId(e.target.value)}
              className="rounded border border-white/20 bg-[#080808] px-2 py-1.5 text-xs text-neutral-100 [color-scheme:dark] focus:border-primary/60 focus:outline-none"
            >
              {sellers.map((seller) => (
                <option key={getSellerId(seller)} value={getSellerId(seller)} className="bg-[#0f0f0f] text-neutral-100">
                  {getSellerName(seller)}
                </option>
              ))}
            </select>
            <div className="relative">
              <Globe size={13} className="absolute left-2 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input
                type="text"
                value={scrapeShopUrl}
                onChange={(e) => setScrapeShopUrl(e.target.value)}
                placeholder="Optional website URL"
                className="w-full rounded border border-white/20 bg-[#080808] py-1.5 pl-7 pr-2 text-xs text-neutral-100 placeholder:text-neutral-500 focus:border-primary/60 focus:outline-none"
              />
            </div>
            <button
              onClick={handleScrapeForSeller}
              disabled={actionKey === 'scrape' || !selectedSellerId}
              className="rounded border border-white/20 bg-[#1a1a1a] px-3 py-1.5 text-xs text-neutral-100 hover:bg-[#222] disabled:opacity-40"
            >
              {actionKey === 'scrape' ? 'Running...' : 'Scrape'}
            </button>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {[
              { key: 'noSizingGuide', label: 'No Sizing Guide' },
              { key: 'hasBodyTable', label: 'Has Body Table' },
              { key: 'outOfStock', label: 'Out of Stock' },
              { key: 'hasErrors', label: 'Has Errors' },
              { key: 'hasImages', label: 'Has Images' },
            ].map((filter) => {
              const active = queueFlagFilters[filter.key as keyof typeof queueFlagFilters];
              return (
                <button
                  key={filter.key}
                  onClick={() =>
                    setQueueFlagFilters((prev) => ({
                      ...prev,
                      [filter.key]: !prev[filter.key as keyof typeof queueFlagFilters],
                    }))
                  }
                  className={`rounded border px-2 py-1 text-[10px] uppercase tracking-[0.08em] ${
                    active
                      ? 'border-white/50 bg-white/15 text-neutral-100'
                      : 'border-white/15 bg-[#0b0b0b] text-neutral-400'
                  }`}
                >
                  {filter.label}
                </button>
              );
            })}
            <button
              onClick={() => setQueueFlagFilters({ noSizingGuide: false, hasBodyTable: false, outOfStock: false, hasErrors: false, hasImages: false })}
              className="rounded border border-white/15 bg-[#0b0b0b] px-2 py-1 text-[10px] uppercase tracking-[0.08em] text-neutral-400"
            >
              Clear
            </button>
            <button
              onClick={handleBulkDeleteFilteredQueue}
              disabled={filteredQueue.length === 0 || actionKey === 'bulkDelete'}
              className="rounded border border-red-400/35 bg-red-500/10 px-2 py-1 text-[10px] uppercase tracking-[0.08em] text-red-300 disabled:opacity-40"
            >
              {actionKey === 'bulkDelete' ? 'Deleting...' : `Delete Filtered (${filteredQueue.length})`}
            </button>
            <div className="ml-auto flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-[0.1em] text-neutral-500">{filteredQueue.length} items</span>
              <select
                value={queueSort}
                onChange={(e) => setQueueSort(e.target.value as QueueSortKey)}
                className="rounded border border-white/20 bg-[#080808] px-2 py-1 text-[10px] text-neutral-100 [color-scheme:dark] focus:border-primary/60 focus:outline-none"
              >
                <option className="bg-[#0f0f0f] text-neutral-100" value="updated_desc">Newest first</option>
                <option className="bg-[#0f0f0f] text-neutral-100" value="updated_asc">Oldest first</option>
                <option className="bg-[#0f0f0f] text-neutral-100" value="price_desc">Price high-low</option>
                <option className="bg-[#0f0f0f] text-neutral-100" value="price_asc">Price low-high</option>
                <option className="bg-[#0f0f0f] text-neutral-100" value="stock_desc">Stock high-low</option>
                <option className="bg-[#0f0f0f] text-neutral-100" value="stock_asc">Stock low-high</option>
              </select>
            </div>
          </div>
          <p className="mt-2 text-[10px] text-neutral-500">
            Smart search: <span className="font-mono">status:ready seller:rakh has:table stock:low price&gt;3000 type:eastern</span>
          </p>
          {scrapeFeedback ? <p className="mt-2 text-xs text-green-300">{scrapeFeedback}</p> : null}
          {scrapeError ? <p className="mt-2 text-xs text-red-300">{scrapeError}</p> : null}
        </section>
      ) : null}

      <section className="rounded-lg border border-white/10 bg-[#121212] p-0">
        {isLoading ? (
          <div className="p-6 text-sm text-neutral-400">Loading...</div>
        ) : activeTab === 'queue' ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs">
              <thead className="bg-[#0f0f0f] text-neutral-400">
                <tr>
                  <th className="px-3 py-2 font-medium">Product</th>
                  <th className="px-3 py-2 font-medium">Seller</th>
                  <th className="px-3 py-2 font-medium">Source</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium">Price</th>
                  <th className="px-3 py-2 font-medium">Stock</th>
                  <th className="px-3 py-2 font-medium">Updated</th>
                  <th className="px-3 py-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {queuePageItems.map((item) => {
                  const isEditing = queueEditId === item.id;
                  const price = item.product?.pricing?.price ?? item.product?.pricing?.brand_price;
                  const stock = item.product?.inventory?.available_quantity ?? item.product?.inventory?.quantity ?? 0;
                  const bodyHtmlTable = extractFirstTableHtml(item.product?.body_html);
                  return (
                    <React.Fragment key={item.id}>
                      <tr className="border-t border-white/10">
                        <td className="px-3 py-2">
                          <div className="flex items-start gap-2">
                            <img
                              src={getImageUrl(item.product?.images)}
                              alt={item.product?.title || item.id}
                              className="h-10 w-8 rounded border border-white/15 bg-[#111] object-cover"
                              loading="lazy"
                            />
                            <div className="min-w-0">
                              <div className="max-w-[300px] truncate text-neutral-100">{item.product?.title || 'Untitled'}</div>
                              <div className="font-mono text-[10px] text-neutral-500">{item.id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-neutral-300">{item.product?.seller_name || item.seller_id}</td>
                        <td className="px-3 py-2 text-neutral-300">{item.source || 'manual'}</td>
                        <td className="px-3 py-2">
                          <span className={`rounded border px-2 py-0.5 text-[10px] uppercase ${statusPillClass(item.status)}`}>{item.status || 'queued'}</span>
                        </td>
                        <td className="px-3 py-2 text-neutral-100">{formatCurrency(price, item.product?.pricing?.currency || 'PKR')}</td>
                        <td className="px-3 py-2 text-neutral-300">{stock}</td>
                        <td className="px-3 py-2 text-neutral-400">{item.updated_at ? new Date(item.updated_at).toLocaleDateString() : '-'}</td>
                        <td className="px-3 py-2">
                          <div className="flex flex-wrap gap-1">
                            <button
                              onClick={() => (isEditing ? cancelQueueEdit() : openQueueEdit(item))}
                              className="rounded border border-white/15 px-2 py-1 text-[10px]"
                            >
                              {isEditing ? 'Cancel' : 'Enrich'}
                            </button>
                            <button
                              onClick={() => handlePromote(item)}
                              disabled={!!actionKey}
                              className="rounded border border-white/15 px-2 py-1 text-[10px] disabled:opacity-40"
                            >
                              Promote
                            </button>
                            <button
                              onClick={() => handleDeleteQueueItem(item)}
                              disabled={!!actionKey}
                              className="inline-flex items-center gap-1 rounded border border-red-400/30 px-2 py-1 text-[10px] text-red-300 disabled:opacity-40"
                            >
                              <Trash2 size={10} />
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                      {isEditing ? (
                        <tr className="border-t border-white/10 bg-[#0d0d0d]">
                          <td colSpan={8} className="px-3 py-3">
                            <div className="grid gap-3 xl:grid-cols-2">
                              <div className="space-y-2 rounded border border-white/10 bg-[#0a0a0a] p-2">
                                <div className="flex flex-wrap items-center gap-1">
                                  <button
                                    onClick={() => setReferenceTab('images')}
                                    className={`rounded px-2 py-1 text-[10px] ${referenceTab === 'images' ? 'bg-white text-black' : 'border border-white/15 text-neutral-300'}`}
                                  >
                                    Images
                                  </button>
                                  <button
                                    onClick={() => setReferenceTab('description')}
                                    className={`rounded px-2 py-1 text-[10px] ${referenceTab === 'description' ? 'bg-white text-black' : 'border border-white/15 text-neutral-300'}`}
                                  >
                                    Description
                                  </button>
                                  <button
                                    onClick={() => setReferenceTab('body_html')}
                                    className={`rounded px-2 py-1 text-[10px] ${referenceTab === 'body_html' ? 'bg-white text-black' : 'border border-white/15 text-neutral-300'}`}
                                  >
                                    Body HTML
                                  </button>
                                </div>

                                {referenceTab === 'images' ? (
                                  <div className="space-y-2">
                                    <div className="h-[280px] overflow-hidden rounded border border-white/15 bg-[#050505]">
                                      {asArray(item.product?.images).length > 0 ? (
                                        <img
                                          src={getImageUrl([asArray(item.product?.images)[referenceImageIndex] || asArray(item.product?.images)[0]])}
                                          alt={item.product?.title || item.id}
                                          className="h-full w-full object-contain"
                                          loading="lazy"
                                        />
                                      ) : (
                                        <div className="flex h-full items-center justify-center text-xs text-neutral-500">No images available</div>
                                      )}
                                    </div>
                                    <div className="flex gap-1 overflow-x-auto pb-1">
                                      {asArray(item.product?.images).map((img, idx) => (
                                        <button
                                          key={`${item.id}-img-${idx}`}
                                          onClick={() => setReferenceImageIndex(idx)}
                                          className={`h-12 w-10 shrink-0 overflow-hidden rounded border ${referenceImageIndex === idx ? 'border-white' : 'border-white/15'}`}
                                        >
                                          <img src={getImageUrl([img])} alt={`Ref ${idx + 1}`} className="h-full w-full object-cover" loading="lazy" />
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                ) : null}

                                {referenceTab === 'description' ? (
                                  <div className="h-[320px] overflow-auto rounded border border-white/15 bg-[#050505] p-2 text-xs text-neutral-200">
                                    {item.product?.description || item.product?.short_description || 'No description available.'}
                                  </div>
                                ) : null}

                                {referenceTab === 'body_html' ? (
                                  bodyHtmlTable ? (
                                    <div
                                      className="h-[320px] overflow-auto rounded border border-white/15 bg-[#050505] p-2 text-xs text-neutral-200"
                                      dangerouslySetInnerHTML={{ __html: bodyHtmlTable }}
                                    />
                                  ) : (
                                    <div className="h-[320px] overflow-auto rounded border border-white/15 bg-[#050505] p-2 text-xs text-neutral-200">
                                      {stripHtml(item.product?.body_html) || 'No body_html available.'}
                                    </div>
                                  )
                                ) : null}
                              </div>

                              <div className="space-y-2 rounded border border-white/10 bg-[#0a0a0a] p-2">
                                <div className="grid gap-2 xl:grid-cols-4">
                                  <select
                                    value={queueEditDraft.product_type}
                                    onChange={(e) => setQueueEditDraft((p) => ({ ...p, product_type: e.target.value }))}
                                    className="rounded border border-white/15 bg-[#080808] px-2 py-1.5 text-xs text-neutral-100 [color-scheme:dark]"
                                  >
                                    <option className="bg-[#0a0a0a] text-neutral-100" value="">Product type</option>
                                    {PRODUCT_TYPES.map((type) => (
                                      <option key={type} className="bg-[#0a0a0a] text-neutral-100" value={type}>{type}</option>
                                    ))}
                                  </select>
                                  <select
                                    value={queueEditDraft.gender}
                                    onChange={(e) => setQueueEditDraft((p) => ({ ...p, gender: e.target.value }))}
                                    className="rounded border border-white/15 bg-[#080808] px-2 py-1.5 text-xs text-neutral-100 [color-scheme:dark]"
                                  >
                                    <option className="bg-[#0a0a0a] text-neutral-100" value="">Gender</option>
                                    {GENDERS.map((gender) => (
                                      <option key={gender} className="bg-[#0a0a0a] text-neutral-100" value={gender}>{gender}</option>
                                    ))}
                                  </select>
                                  <input
                                    value={sizingDraft.measurementUnit}
                                    onChange={(e) => setSizingDraft((prev) => ({ ...prev, measurementUnit: e.target.value }))}
                                    className="rounded border border-white/15 bg-[#080808] px-2 py-1.5 text-xs text-neutral-100"
                                    placeholder="Unit (inch/cm)"
                                  />
                                  <input
                                    value={sizingDraft.sizeFit}
                                    onChange={(e) => setSizingDraft((prev) => ({ ...prev, sizeFit: e.target.value }))}
                                    className="rounded border border-white/15 bg-[#080808] px-2 py-1.5 text-xs text-neutral-100"
                                    placeholder="Size fit notes"
                                  />
                                </div>

                                <div className="flex flex-wrap items-center gap-1">
                                  <button onClick={addGuideRow} className="rounded border border-white/15 px-2 py-1 text-[10px]">+ Size Row</button>
                                  <button onClick={addGuideCol} className="rounded border border-white/15 px-2 py-1 text-[10px]">+ Measurement</button>
                                  <button onClick={transposeGuide} className="rounded border border-white/15 px-2 py-1 text-[10px]">Transpose</button>
                                  <label className="ml-2 text-[10px] text-neutral-400">Base</label>
                                  <select
                                    value={incrementBaseSize}
                                    onChange={(e) => setIncrementBaseSize(e.target.value)}
                                    className="rounded border border-white/15 bg-[#080808] px-2 py-1 text-[10px] text-neutral-100 [color-scheme:dark]"
                                  >
                                    <option className="bg-[#0a0a0a] text-neutral-100" value="">Select</option>
                                    {sizingDraft.rows.map((row) => (
                                      <option key={`${item.id}-base-${row}`} className="bg-[#0a0a0a] text-neutral-100" value={row}>{row}</option>
                                    ))}
                                  </select>
                                  <label className="text-[10px] text-neutral-400">Step</label>
                                  <input
                                    value={incrementStep}
                                    onChange={(e) => setIncrementStep(e.target.value)}
                                    className="w-16 rounded border border-white/15 bg-[#080808] px-2 py-1 text-[10px] text-neutral-100"
                                  />
                                  <button onClick={applyStepIncrement} className="rounded border border-white/15 px-2 py-1 text-[10px]">Apply Step</button>
                                  <button onClick={applyColumnStepIncrement} className="rounded border border-white/15 px-2 py-1 text-[10px]">Apply Per-Column</button>
                                  <button
                                    onClick={() => handleEnrich(item)}
                                    disabled={actionKey === `${item.id}:enrich`}
                                    className="ml-auto rounded border border-white/15 bg-[#1a1a1a] px-3 py-1.5 text-xs disabled:opacity-40"
                                  >
                                    {actionKey === `${item.id}:enrich` ? 'Saving...' : 'Save Enrichment'}
                                  </button>
                                </div>

                                <div className="rounded border border-white/15 bg-[#050505] p-2">
                                  <div className="mb-2 text-[10px] text-neutral-400">Per-measurement step (from base size)</div>
                                  <div className="flex flex-wrap gap-1">
                                    {sizingDraft.cols.map((col) => (
                                      <label key={`${item.id}-step-${col}`} className="inline-flex items-center gap-1 rounded border border-white/15 bg-[#080808] px-2 py-1 text-[10px] text-neutral-300">
                                        <span className="max-w-[90px] truncate">{col}</span>
                                        <input
                                          value={incrementStepsByCol[col] ?? '0.5'}
                                          onChange={(e) => setIncrementStepsByCol((prev) => ({ ...prev, [col]: e.target.value }))}
                                          className="w-12 rounded border border-white/15 bg-[#040404] px-1 py-0.5 text-[10px] text-neutral-100"
                                        />
                                      </label>
                                    ))}
                                  </div>
                                </div>

                                <div className="max-h-[340px] overflow-auto rounded border border-white/15 bg-[#070707]">
                                  <table className="min-w-full border-collapse text-[10px]">
                                    <thead className="bg-[#050505]">
                                      <tr>
                                        <th className="sticky left-0 z-20 border border-white/10 bg-[#050505] px-2 py-1 text-left text-neutral-400">Size</th>
                                        {sizingDraft.cols.map((col) => (
                                          <th key={`${item.id}-col-${col}`} className="border border-white/10 px-1 py-1">
                                            <div className="flex items-center gap-1">
                                              <input
                                                defaultValue={col}
                                                onBlur={(e) => updateGuideColName(col, e.target.value)}
                                                className="w-24 rounded border border-white/15 bg-[#080808] px-1 py-1 font-mono text-[10px] text-neutral-100"
                                              />
                                              <button onClick={() => removeGuideCol(col)} className="rounded border border-white/15 px-1 text-[10px] text-neutral-400">x</button>
                                            </div>
                                          </th>
                                        ))}
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {sizingDraft.rows.map((row, rowIndex) => (
                                        <tr key={`${item.id}-row-${row}`} className="border-t border-white/10">
                                          <td className="sticky left-0 z-10 border border-white/10 bg-[#0a0a0a] px-2 py-1">
                                            <div className="flex items-center gap-1">
                                              <input
                                                defaultValue={row}
                                                onBlur={(e) => updateGuideRowName(row, e.target.value)}
                                                className="w-16 rounded border border-white/15 bg-[#080808] px-1 py-1 font-mono text-[10px] text-neutral-100"
                                              />
                                              <button onClick={() => removeGuideRow(row)} className="rounded border border-white/15 px-1 text-[10px] text-neutral-400">x</button>
                                            </div>
                                          </td>
                                          {sizingDraft.cols.map((col, colIndex) => (
                                            <td key={`${item.id}-cell-${row}-${col}`} className="border border-white/10 px-1 py-1">
                                              <input
                                                id={`sg-cell-${item.id}-${rowIndex}-${colIndex}`}
                                                value={sizingDraft.cells[row]?.[col] || ''}
                                                onChange={(e) => updateGuideCell(row, col, e.target.value)}
                                                onKeyDown={(e) => onGuideCellKeyDown(
                                                  e,
                                                  item.id,
                                                  rowIndex,
                                                  colIndex,
                                                  sizingDraft.rows.length,
                                                  sizingDraft.cols.length
                                                )}
                                                onFocus={(e) => e.currentTarget.select()}
                                                className="w-20 rounded border border-white/15 bg-[#080808] px-1 py-1 font-mono text-[10px] text-neutral-100 focus:border-primary/60 focus:outline-none"
                                              />
                                            </td>
                                          ))}
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </div>
                            {queueEditError ? <p className="mt-2 text-xs text-red-300">{queueEditError}</p> : null}
                          </td>
                        </tr>
                      ) : null}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
            {filteredQueue.length === 0 ? <div className="p-4 text-xs text-neutral-500">No queue items found.</div> : null}
            <div className="px-3 pb-3">{renderPager(queuePage, queueTotalPages, setQueuePage)}</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs">
              <thead className="bg-[#0f0f0f] text-neutral-400">
                <tr>
                  <th className="px-3 py-2 font-medium">Product</th>
                  <th className="px-3 py-2 font-medium">Seller</th>
                  <th className="px-3 py-2 font-medium">Type</th>
                  <th className="px-3 py-2 font-medium">Variants</th>
                  <th className="px-3 py-2 font-medium">Price</th>
                  <th className="px-3 py-2 font-medium">Stock</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {catalogPageItems.map((product) => {
                  const isEditing = catalogEditId === product.id;
                  const variantInfo = getVariantAvailability(product);
                  return (
                    <tr key={product.id} className="border-t border-white/10">
                      <td className="px-3 py-2">
                        {isEditing ? (
                          <input
                            value={catalogEditDraft.title}
                            onChange={(e) => setCatalogEditDraft((p) => ({ ...p, title: e.target.value }))}
                            className="w-full rounded border border-white/15 bg-[#0a0a0a] px-2 py-1 text-xs"
                          />
                        ) : (
                          <div className="flex items-start gap-2">
                            <img
                              src={getImageUrl(product.images)}
                              alt={product.title || product.id}
                              className="h-10 w-8 rounded border border-white/15 bg-[#111] object-cover"
                              loading="lazy"
                            />
                            <div className="min-w-0">
                              <div className="max-w-[300px] truncate text-neutral-100">{product.title || 'Untitled'}</div>
                              <div className="font-mono text-[10px] text-neutral-500">{product.id}</div>
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2 text-neutral-300">{product.seller_name || product.seller_id || '-'}</td>
                      <td className="px-3 py-2 text-neutral-300">{product.product_type || '-'}</td>
                      <td className="px-3 py-2">
                        <div className="space-y-1">
                          <div className="text-[10px] text-green-300">
                            Available: {variantInfo.available.length}
                          </div>
                          <div className="text-[10px] text-red-300">
                            Unavailable: {variantInfo.unavailable.length}
                          </div>
                          <div className="max-w-[250px] space-y-0.5">
                            {variantInfo.available.slice(0, 4).map((name) => (
                              <div key={`${product.id}-av-${name}`} className="truncate text-[10px] text-neutral-200">{name}</div>
                            ))}
                            {variantInfo.unavailable.slice(0, 4).map((name) => (
                              <div key={`${product.id}-un-${name}`} className="truncate text-[10px] text-neutral-500 line-through">{name}</div>
                            ))}
                            {variantInfo.available.length + variantInfo.unavailable.length > 8 ? (
                              <div className="text-[10px] text-neutral-500">+{variantInfo.available.length + variantInfo.unavailable.length - 8} more</div>
                            ) : null}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-neutral-100">{formatCurrency(product.pricing?.price, product.pricing?.currency || 'PKR')}</td>
                      <td className="px-3 py-2 text-neutral-300">{product.inventory?.available_quantity ?? product.inventory?.quantity ?? 0}</td>
                      <td className="px-3 py-2">
                        {isEditing ? (
                          <select
                            value={catalogEditDraft.status}
                            onChange={(e) => setCatalogEditDraft((p) => ({ ...p, status: e.target.value as 'active' | 'draft' | 'archived' }))}
                            className="rounded border border-white/15 bg-[#0a0a0a] px-2 py-1 text-xs"
                          >
                            <option className="bg-[#0a0a0a]" value="active">active</option>
                            <option className="bg-[#0a0a0a]" value="draft">draft</option>
                            <option className="bg-[#0a0a0a]" value="archived">archived</option>
                          </select>
                        ) : (
                          <span className={`rounded border px-2 py-0.5 text-[10px] uppercase ${statusPillClass(product.status)}`}>{product.status || 'draft'}</span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-wrap gap-1">
                          {isEditing ? (
                            <>
                              <button
                                onClick={() => handleCatalogPatch(product)}
                                disabled={actionKey === `${product.id}:patch`}
                                className="rounded border border-white/15 px-2 py-1 text-[10px] disabled:opacity-40"
                              >
                                {actionKey === `${product.id}:patch` ? 'Saving...' : 'Save'}
                              </button>
                              <button
                                onClick={cancelCatalogEdit}
                                className="rounded border border-white/15 px-2 py-1 text-[10px]"
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => openCatalogEdit(product)}
                              className="rounded border border-white/15 px-2 py-1 text-[10px]"
                            >
                              Edit
                            </button>
                          )}
                          <button
                            onClick={() => handleCatalogDelete(product)}
                            disabled={!!actionKey}
                            className="inline-flex items-center gap-1 rounded border border-red-400/30 px-2 py-1 text-[10px] text-red-300 disabled:opacity-40"
                          >
                            <Trash2 size={10} />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {catalogEditId ? (
              <div className="border-t border-white/10 bg-[#0d0d0d] px-3 py-3">
                <div className="grid gap-2 md:grid-cols-2">
                  <textarea
                    value={catalogEditDraft.description}
                    onChange={(e) => setCatalogEditDraft((p) => ({ ...p, description: e.target.value }))}
                    rows={4}
                    className="w-full resize-none rounded border border-white/15 bg-[#0a0a0a] px-2 py-1.5 text-xs"
                    placeholder="Description"
                  />
                  <div className="space-y-2">
                    <input
                      value={catalogEditDraft.tagsInput}
                      onChange={(e) => setCatalogEditDraft((p) => ({ ...p, tagsInput: e.target.value }))}
                      className="w-full rounded border border-white/15 bg-[#0a0a0a] px-2 py-1.5 text-xs"
                      placeholder="Tags: summer, new"
                    />
                    <label className="inline-flex items-center gap-2 text-xs text-neutral-300">
                      <input
                        type="checkbox"
                        checked={catalogEditDraft.is_featured}
                        onChange={(e) => setCatalogEditDraft((p) => ({ ...p, is_featured: e.target.checked }))}
                      />
                      Featured product
                    </label>
                  </div>
                </div>
                {catalogEditError ? <p className="mt-2 text-xs text-red-300">{catalogEditError}</p> : null}
              </div>
            ) : null}

            {filteredCatalog.length === 0 ? <div className="p-4 text-xs text-neutral-500">No catalog products found.</div> : null}
            <div className="px-3 pb-3">{renderPager(catalogPage, catalogTotalPages, setCatalogPage)}</div>
          </div>
        )}
      </section>
    </div>
  );
};

export default ManageProducts;
