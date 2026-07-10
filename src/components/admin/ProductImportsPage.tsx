import React, { useEffect, useState } from 'react';
import { ArrowLeft, Globe, Loader, Package, Sparkles, Upload } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AdminPortal, scrapeSellerProducts } from '../../api/adminApi';
import type { Option } from '../../constants/types';
import {
  EMPTY_CREATE_DRAFT,
  asArray,
  buildAdminProductPayload,
  getSellerId,
  getSellerName,
  type CreateProductDraft,
  type SellerProfile,
} from './productManagement';

const fieldClassName =
  'mt-1 w-full rounded-lg border border-white/10 bg-black/25 px-3 py-2.5 text-sm text-white outline-none transition-colors placeholder:text-white/20 focus:border-white/25';
const cardClassName = 'rounded-xl border border-white/10 bg-[#101010] p-4';

type ImportedProductRow = Record<string, string>;

const parseCsv = (value: string): ImportedProductRow[] => {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;

  for (let index = 0; index < value.length; index += 1) {
    const character = value[index];
    const next = value[index + 1];
    if (character === '"' && quoted && next === '"') {
      cell += '"';
      index += 1;
    } else if (character === '"') {
      quoted = !quoted;
    } else if (character === ',' && !quoted) {
      row.push(cell);
      cell = '';
    } else if ((character === '\n' || character === '\r') && !quoted) {
      if (character === '\r' && next === '\n') index += 1;
      row.push(cell);
      if (row.some((entry) => entry.trim())) rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += character;
    }
  }
  if (cell || row.length) {
    row.push(cell);
    if (row.some((entry) => entry.trim())) rows.push(row);
  }

  if (rows.length < 2) return [];
  const headers = rows[0].map((header) => header.trim().toLowerCase());
  return rows.slice(1).map((values) => headers.reduce<ImportedProductRow>((result, header, index) => {
    result[header] = (values[index] || '').trim();
    return result;
  }, {}));
};

const getImportedValue = (row: ImportedProductRow, ...keys: string[]) => {
  for (const key of keys) {
    const value = row[key.toLowerCase()];
    if (value) return value;
  }
  return '';
};

const splitImportedList = (value: string) => value.split(/[,|;]/).map((item) => item.trim()).filter(Boolean);

const importedProductToDraft = (row: ImportedProductRow, sellerId: string): CreateProductDraft => {
  const title = getImportedValue(row, 'name', 'title', 'product name') || 'Imported product';
  const description = getImportedValue(row, 'description', 'long description', 'short description') || title;
  const regularPrice = Number(getImportedValue(row, 'regular price', 'price', 'regular_price').replace(/[^0-9.]/g, '')) || 0;
  const salePrice = Number(getImportedValue(row, 'sale price', 'sale_price').replace(/[^0-9.]/g, '')) || 0;
  const stock = Number(getImportedValue(row, 'stock quantity', 'stock', 'quantity').replace(/[^0-9.-]/g, '')) || 0;
  const options: Option[] = [];
  for (let index = 1; index <= 3; index += 1) {
    const name = getImportedValue(row, `attribute ${index} name`, `attribute_${index}_name`);
    const values = splitImportedList(getImportedValue(row, `attribute ${index} value(s)`, `attribute_${index}_value(s)`, `attribute ${index} values`));
    if (name && values.length) options.push({ name, values, required: true });
  }

  return {
    ...EMPTY_CREATE_DRAFT,
    seller_id: sellerId,
    title,
    description,
    short_description: getImportedValue(row, 'short description'),
    product_type: getImportedValue(row, 'categories', 'category').split(',')[0]?.trim() || 'General',
    gender: getImportedValue(row, 'gender') || 'unisex',
    price: String(salePrice > 0 ? salePrice : regularPrice),
    compare_at_price: salePrice > 0 && regularPrice > salePrice ? String(regularPrice) : '',
    available_quantity: String(Math.max(0, stock)),
    images: splitImportedList(getImportedValue(row, 'images', 'image', 'image urls')),
    tagsInput: [getImportedValue(row, 'categories', 'category'), getImportedValue(row, 'tags')].flatMap(splitImportedList).join(', '),
    options,
    status: 'queue',
  };
};

const normalizeShopUrl = (input: string): string => input.trim().replace(/^https?:\/\//, '').replace(/\/$/, '').split('/')[0];

const ProductImportsPage: React.FC = () => {
  const [sellers, setSellers] = useState<SellerProfile[]>([]);
  const [shopifySellerId, setShopifySellerId] = useState('');
  const [shopUrl, setShopUrl] = useState('');
  const [shopifyMessage, setShopifyMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [importSellerId, setImportSellerId] = useState('');
  const [importMessage, setImportMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [actionKey, setActionKey] = useState('');

  useEffect(() => {
    void AdminPortal.listSellers({ limit: 500, status: 'active' }).then((response) => {
      if (response.ok) setSellers(asArray(response.body));
    });
  }, []);

  const handleShopifyImport = async () => {
    const normalizedUrl = normalizeShopUrl(shopUrl);
    if (!shopifySellerId) return setShopifyMessage({ type: 'error', text: 'Select a seller first.' });
    if (!normalizedUrl) return setShopifyMessage({ type: 'error', text: 'Enter a valid Shopify store URL.' });
    setActionKey('shopify');
    setShopifyMessage(null);
    try {
      const response = await scrapeSellerProducts(shopifySellerId, normalizedUrl);
      if (response.status === 202) setShopifyMessage({ type: 'info', text: 'Shopify import started. Products will sync into the seller queue in the background.' });
      else if (!response.ok) throw new Error((response.body as any)?.message || 'Shopify import failed');
      else {
        const count = Number((response.body as any)?.scrape_count ?? (response.body as any)?.count ?? 0);
        setShopifyMessage({ type: 'success', text: `Imported ${count} product${count === 1 ? '' : 's'} into the seller queue.` });
        setShopUrl('');
      }
    } catch (error) {
      setShopifyMessage({ type: 'error', text: error instanceof Error ? error.message : 'Shopify import failed' });
    } finally {
      setActionKey('');
    }
  };

  const handleProductFileImport = async (file: File) => {
    if (!importSellerId) {
      setImportMessage({ type: 'error', text: 'Select a seller before importing products.' });
      return;
    }
    setActionKey('file');
    setImportMessage(null);
    try {
      const contents = await file.text();
      let rows: ImportedProductRow[];
      if (file.name.toLowerCase().endsWith('.json')) {
        const parsed = JSON.parse(contents);
        const products = Array.isArray(parsed) ? parsed : parsed.products || parsed.data || [];
        rows = products.map((product: Record<string, unknown>) => Object.entries(product).reduce<ImportedProductRow>((result, [key, value]) => {
          result[key.toLowerCase()] = Array.isArray(value) ? value.join(', ') : String(value ?? '');
          return result;
        }, {}));
      } else rows = parseCsv(contents.replace(/^\uFEFF/, ''));
      if (!rows.length) throw new Error('The file does not contain any products. Use a WooCommerce CSV export or a JSON array.');

      let created = 0;
      const failures: string[] = [];
      const seller = sellers.find((entry) => getSellerId(entry) === importSellerId);
      for (let index = 0; index < rows.length; index += 1) {
        const draft = importedProductToDraft(rows[index], importSellerId);
        if (Number(draft.price) <= 0) {
          failures.push(`Row ${index + 2}: a positive price is required`);
          continue;
        }
        const response = await AdminPortal.createProduct(buildAdminProductPayload(draft, seller));
        if (response.ok) created += 1;
        else failures.push(`Row ${index + 2}: ${(response.body as any)?.message || 'API rejected product'}`);
        setImportMessage({ type: 'info', text: `Imported ${created} of ${rows.length} products...` });
      }
      setImportMessage({ type: failures.length ? 'error' : 'success', text: `Imported ${created} of ${rows.length} products${failures.length ? `. ${failures.length} failed: ${failures.slice(0, 3).join('; ')}` : '.'}` });
    } catch (error) {
      setImportMessage({ type: 'error', text: error instanceof Error ? error.message : 'Product import failed.' });
    } finally {
      setActionKey('');
    }
  };

  const renderMessage = (message: { type: 'success' | 'error' | 'info'; text: string } | null) => message ? (
    <div className={`mt-3 rounded-lg border px-3 py-2 text-xs ${message.type === 'success' ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300' : message.type === 'info' ? 'border-blue-500/20 bg-blue-500/10 text-blue-300' : 'border-red-500/20 bg-red-500/10 text-red-300'}`}>
      {message.text}
    </div>
  ) : null;

  return (
    <div className="mt-4 space-y-4 text-neutral-100">
      <section className="rounded-xl border border-white/10 bg-[#121212] p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3"><Package size={18} className="text-primary" /><div><h2 className="text-base font-semibold">Product imports</h2><p className="text-xs text-neutral-500">Bring products in from connected storefronts and exports.</p></div></div>
          <Link to="/admin/products/create" className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-[#1a1a1a] px-3 py-2 text-xs text-neutral-100"><ArrowLeft size={13} /> Manual product creation</Link>
        </div>
      </section>

      <section className={cardClassName}>
        <div className="mb-4 flex items-center gap-2"><Globe size={16} className="text-primary" /><div><h3 className="text-sm font-semibold">Shopify import</h3><p className="mt-1 text-xs text-white/45">Start a public Shopify storefront scrape. Imported products arrive in the seller queue.</p></div></div>
        <div className="grid gap-3 md:grid-cols-[1fr_1.3fr_auto]">
          <label className="text-xs text-neutral-400">Seller<select value={shopifySellerId} onChange={(event) => setShopifySellerId(event.target.value)} className={`${fieldClassName} [color-scheme:dark]`}><option value="">Select seller</option>{sellers.map((seller) => <option key={getSellerId(seller)} value={getSellerId(seller)}>{getSellerName(seller)}</option>)}</select></label>
          <label className="text-xs text-neutral-400">Shopify store URL<input value={shopUrl} onChange={(event) => setShopUrl(event.target.value)} placeholder="your-store.myshopify.com or yourbrand.com" className={fieldClassName} /></label>
          <button onClick={() => void handleShopifyImport()} disabled={actionKey === 'shopify'} className="mt-auto inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-[#1a1a1a] px-3 py-2 text-xs text-neutral-100 disabled:opacity-40">{actionKey === 'shopify' ? <Loader size={14} className="animate-spin" /> : <Sparkles size={14} />}{actionKey === 'shopify' ? 'Importing...' : 'Import products'}</button>
        </div>
        {renderMessage(shopifyMessage)}
      </section>

      <section className={cardClassName}>
        <div className="mb-4 flex items-center gap-2"><Upload size={16} className="text-primary" /><div><h3 className="text-sm font-semibold">WooCommerce / WordPress upload</h3><p className="mt-1 text-xs text-white/45">Upload a standard WooCommerce product CSV export or a JSON array. Products are created directly in the catalog.</p></div></div>
        <div className="grid gap-3 md:grid-cols-[1fr_auto]">
          <label className="text-xs text-neutral-400">Seller<select value={importSellerId} onChange={(event) => setImportSellerId(event.target.value)} className={`${fieldClassName} [color-scheme:dark]`}><option value="">Select seller</option>{sellers.map((seller) => <option key={getSellerId(seller)} value={getSellerId(seller)}>{getSellerName(seller)}</option>)}</select></label>
          <label className="flex cursor-pointer items-end"><span className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-[#1a1a1a] px-3 py-2 text-xs text-white">{actionKey === 'file' ? <Loader size={14} className="animate-spin" /> : <Upload size={14} />}{actionKey === 'file' ? 'Uploading...' : 'Choose CSV / JSON'}</span><input type="file" accept=".csv,.json,text/csv,application/json" className="hidden" disabled={actionKey === 'file'} onChange={(event) => { const file = event.target.files?.[0]; if (file) void handleProductFileImport(file); event.currentTarget.value = ''; }} /></label>
        </div>
        {renderMessage(importMessage)}
      </section>
    </div>
  );
};

export default ProductImportsPage;
