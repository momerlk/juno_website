import React, { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  Edit3,
  Eye,
  LogIn,
  RefreshCw,
  Search,
  Store,
  Wallet,
  X,
  XCircle,
} from 'lucide-react';
import { AdminPortal, approveSeller } from '../../api/adminApi';
import { Auth as SellerAuth } from '../../api/sellerApi';

type SellerStatus = 'all' | 'pending' | 'active' | 'suspended' | 'rejected';
type DrawerTab = 'profile' | 'inventory' | 'wallet' | 'products' | 'draft';

const STATUS_OPTIONS: SellerStatus[] = ['all', 'pending', 'active', 'suspended', 'rejected'];

const asArray = (value: any): any[] => {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== 'object') return [];
  for (const key of ['sellers', 'rows', 'items', 'data', 'drafts']) {
    if (Array.isArray(value[key])) return value[key];
  }
  return [];
};

const getSellerId = (seller: any) => String(seller?.id || seller?._id || seller?.seller_id || '');
const getSellerName = (seller: any) => seller?.business_name || seller?.brand_name || seller?.legal_name || seller?.name || 'Unnamed seller';
const getSellerEmail = (seller: any) => seller?.email || seller?.contact?.email || '';
const getSellerPhone = (seller: any) => seller?.phone_number || seller?.contact?.phone_number || seller?.phone || '';
const getSellerCity = (seller: any) => seller?.city || seller?.location?.city || '';
const getSellerStatus = (seller: any) => String(seller?.status || 'pending').toLowerCase();
const getProductStatus = (product: any) => String(product?.status || 'draft').toLowerCase();
const getProductStock = (product: any) =>
  typeof product?.inventory?.available_quantity === 'number'
    ? product.inventory.available_quantity
    : typeof product?.inventory?.quantity === 'number'
      ? product.inventory.quantity
      : 0;
const getProductPrice = (product: any) =>
  typeof product?.pricing?.brand_price === 'number'
    ? product.pricing.brand_price
    : product?.pricing?.price ?? 0;

const dateText = (value?: string) => {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
};

const money = (value?: number) => `Rs ${new Intl.NumberFormat('en-PK', { maximumFractionDigits: 0 }).format(value ?? 0)}`;

const statusClass = (status: string) => {
  if (status === 'active') return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300';
  if (status === 'pending') return 'border-yellow-500/30 bg-yellow-500/10 text-yellow-300';
  if (status === 'suspended') return 'border-amber-500/30 bg-amber-500/10 text-amber-300';
  return 'border-red-500/30 bg-red-500/10 text-red-300';
};

const ManageSellers: React.FC = () => {
  const [status, setStatus] = useState<SellerStatus>('pending');
  const [query, setQuery] = useState('');
  const [sellers, setSellers] = useState<any[]>([]);
  const [drafts, setDrafts] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedSeller, setSelectedSeller] = useState<any | null>(null);
  const [drawerTab, setDrawerTab] = useState<DrawerTab>('profile');
  const [profileDraft, setProfileDraft] = useState<Record<string, string>>({});
  const [inventory, setInventory] = useState<any[]>([]);
  const [walletData, setWalletData] = useState<any | null>(null);
  const [sellerProducts, setSellerProducts] = useState<any[]>([]);
  const [sellerProductsStatus, setSellerProductsStatus] = useState<'all' | 'draft' | 'active' | 'rejected' | 'archived'>('all');
  const [walletDraft, setWalletDraft] = useState({ amount: '', direction: 'debit' as 'debit' | 'credit', reason: 'late_dispatch_penalty', adjustment_type: 'penalty', related_order_id: '' });
  const [bulkStatus, setBulkStatus] = useState<'active' | 'suspended' | 'rejected'>('active');
  const [bulkNote, setBulkNote] = useState('Reviewed by admin');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [sellerRes, draftRes] = await Promise.all([
        AdminPortal.listSellers({ status: status === 'all' ? undefined : status, q: query || undefined, limit: 100 }),
        AdminPortal.listSellerDrafts({ page: 1, limit: 100 }),
      ]);
      if (!sellerRes.ok) throw new Error((sellerRes.body as any)?.message || 'Failed to load sellers');
      setSellers(asArray(sellerRes.body));
      if (draftRes.ok) setDrafts(asArray(draftRes.body));
      setSelectedIds([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected seller loading error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const filteredSellers = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sellers;
    return sellers.filter((seller) => [
      getSellerId(seller),
      getSellerName(seller),
      getSellerEmail(seller),
      getSellerPhone(seller),
      getSellerCity(seller),
      seller.legal_name,
    ].join(' ').toLowerCase().includes(q));
  }, [query, sellers]);

  const metrics = useMemo(() => {
    const source = status === 'all' ? sellers : [...sellers, ...filteredSellers];
    return {
      pending: sellers.filter((s) => getSellerStatus(s) === 'pending').length,
      active: sellers.filter((s) => getSellerStatus(s) === 'active').length,
      suspended: sellers.filter((s) => getSellerStatus(s) === 'suspended').length,
      rejected: sellers.filter((s) => getSellerStatus(s) === 'rejected').length,
      drafts: drafts.length,
      shown: source.length,
    };
  }, [drafts.length, filteredSellers, sellers, status]);

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const toggleVisible = () => {
    const visibleIds = filteredSellers.map(getSellerId).filter(Boolean);
    const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));
    setSelectedIds((prev) => allSelected ? prev.filter((id) => !visibleIds.includes(id)) : Array.from(new Set([...prev, ...visibleIds])));
  };

  const openSeller = async (seller: any, tab: DrawerTab = 'profile') => {
    const id = getSellerId(seller);
    setSelectedSeller(seller);
    setDrawerTab(tab);
    setProfileDraft({
      business_name: getSellerName(seller),
      contact_person: seller.contact_person || seller.contact?.contact_person_name || '',
      phone_number: getSellerPhone(seller),
      email: getSellerEmail(seller),
      legal_name: seller.legal_name || '',
      commission_rate: String(seller.commission_rate ?? seller.commission_settings?.commission_rate ?? ''),
      city: getSellerCity(seller),
    });
    setInventory([]);
    setWalletData(null);
    setSellerProducts([]);

    const detailRes = await AdminPortal.listSellers({ q: id, limit: 1 });
    if (detailRes.ok) {
      const detail = asArray(detailRes.body)[0] || seller;
      setSelectedSeller(detail);
      setProfileDraft({
        business_name: getSellerName(detail),
        contact_person: detail.contact_person || detail.contact?.contact_person_name || '',
        phone_number: getSellerPhone(detail),
        email: getSellerEmail(detail) || detail.contact?.support_email || '',
        legal_name: detail.legal_name || '',
        commission_rate: String(detail.commission_rate ?? detail.commission_settings?.commission_rate ?? ''),
        city: getSellerCity(detail),
      });
    }

    const accessProfileRes = await AdminPortal.getSellerAccessProfile(id);
    if (accessProfileRes.ok && accessProfileRes.body) {
      const accessProfile = accessProfileRes.body;
      setSelectedSeller((prev: any) => ({ ...prev, ...accessProfile }));
      setProfileDraft({
        business_name: getSellerName(accessProfile),
        contact_person: accessProfile.contact_person || accessProfile.contact?.contact_person_name || '',
        phone_number: getSellerPhone(accessProfile),
        email: getSellerEmail(accessProfile) || accessProfile.contact?.support_email || '',
        legal_name: accessProfile.legal_name || '',
        commission_rate: String(accessProfile.commission_rate ?? accessProfile.commission_settings?.commission_rate ?? ''),
        city: getSellerCity(accessProfile),
      });
    }
  };

  const loadInventory = async () => {
    if (!selectedSeller) return;
    const res = await AdminPortal.getSellerInventory(getSellerId(selectedSeller));
    if (res.ok) setInventory(asArray(res.body));
    else setError((res.body as any)?.message || 'Failed to load inventory');
  };

  const loadWallet = async () => {
    if (!selectedSeller) return;
    const res = await AdminPortal.getSellerWallet(getSellerId(selectedSeller));
    if (res.ok) setWalletData(res.body);
    else setError((res.body as any)?.message || 'Failed to load wallet');
  };

  const loadSellerProducts = async () => {
    if (!selectedSeller) return;
    const res = await AdminPortal.listSellerAccessProducts(
      getSellerId(selectedSeller),
      sellerProductsStatus === 'all' ? undefined : { status: sellerProductsStatus }
    );
    if (res.ok) setSellerProducts(asArray(res.body));
    else setError((res.body as any)?.message || 'Failed to load seller products');
  };

  useEffect(() => {
    if (!selectedSeller) return;
    if (drawerTab === 'inventory') void loadInventory();
    if (drawerTab === 'wallet') void loadWallet();
    if (drawerTab === 'products') void loadSellerProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawerTab, selectedSeller?.id, sellerProductsStatus]);

  const saveProfile = async () => {
    if (!selectedSeller) return;
    setSaving(true);
    setError(null);
    try {
      const commission = Number(profileDraft.commission_rate);
      const res = await AdminPortal.updateSellerAccessProfile(getSellerId(selectedSeller), {
        name: profileDraft.business_name,
        business_name: profileDraft.business_name,
        legal_name: profileDraft.legal_name,
        contact: {
          phone_number: profileDraft.phone_number,
          contact_person_name: profileDraft.contact_person,
          support_email: profileDraft.email,
        },
        location: {
          city: profileDraft.city,
        },
        commission_rate: Number.isFinite(commission) ? commission : undefined,
      });
      if (!res.ok) throw new Error((res.body as any)?.message || 'Failed to update seller profile');
      await load();
      await openSeller(selectedSeller, 'profile');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update seller profile');
    } finally {
      setSaving(false);
    }
  };

  const setSellerStatus = async (sellerIds: string[], nextStatus: 'active' | 'suspended' | 'rejected', note = bulkNote) => {
    if (sellerIds.length === 0) return;
    setSaving(true);
    setError(null);
    try {
      const res = await AdminPortal.bulkUpdateSellerStatus({ seller_ids: sellerIds, status: nextStatus, note });
      if (!res.ok) throw new Error((res.body as any)?.message || 'Failed to update seller status');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update seller status');
    } finally {
      setSaving(false);
    }
  };

  const approve = async (seller: any, approved: boolean) => {
    setSaving(true);
    setError(null);
    try {
      const res = await approveSeller(getSellerId(seller), approved, approved ? 'KYC verified' : 'Rejected by admin');
      if (!res.ok) throw new Error((res.body as any)?.message || 'Approval action failed');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Approval action failed');
    } finally {
      setSaving(false);
    }
  };

  const updateInventoryRow = async (row: any, quantity: number) => {
    if (!selectedSeller) return;
    setSaving(true);
    try {
      const res = await AdminPortal.updateSellerInventory(getSellerId(selectedSeller), {
        product_id: row.product_id,
        variant_id: row.variant_id,
        available_quantity: quantity,
      });
      if (!res.ok) throw new Error((res.body as any)?.message || 'Inventory update failed');
      await loadInventory();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Inventory update failed');
    } finally {
      setSaving(false);
    }
  };

  const adjustWallet = async () => {
    if (!selectedSeller) return;
    const amount = Number(walletDraft.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Enter a valid wallet adjustment amount.');
      return;
    }
    setSaving(true);
    try {
      const res = await AdminPortal.adjustSellerWallet(getSellerId(selectedSeller), {
        amount,
        direction: walletDraft.direction,
        reason: walletDraft.reason,
        adjustment_type: walletDraft.adjustment_type,
        related_order_id: walletDraft.related_order_id || undefined,
      });
      if (!res.ok) throw new Error((res.body as any)?.message || 'Wallet adjustment failed');
      setWalletDraft((prev) => ({ ...prev, amount: '', related_order_id: '' }));
      await loadWallet();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Wallet adjustment failed');
    } finally {
      setSaving(false);
    }
  };

  const loginAsSeller = async (seller: any) => {
    const email = getSellerEmail(seller);
    if (!email) {
      setError('Seller has no email address.');
      return;
    }
    const response = await SellerAuth.Login(email, 'JunoPakistan12#');
    if (response.ok) {
      window.open('/seller/dashboard', '_blank');
      return;
    }
    setError((response.body as any)?.message || 'Seller login failed');
  };

  const deleteSellerProduct = async (product: any) => {
    if (!selectedSeller) return;
    if (!window.confirm(`Delete "${product.title || product.id}" for ${getSellerName(selectedSeller)}?`)) return;
    setSaving(true);
    setError(null);
    try {
      const res = await AdminPortal.deleteSellerAccessProduct(getSellerId(selectedSeller), String(product.id || ''));
      if (!res.ok) throw new Error((res.body as any)?.message || 'Failed to delete seller product');
      await loadSellerProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete seller product');
    } finally {
      setSaving(false);
    }
  };

  const visibleIds = filteredSellers.map(getSellerId).filter(Boolean);
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-white/10 bg-[#111]">
        <div className="flex flex-col gap-4 border-b border-white/10 p-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Store size={18} className="text-primary" />
              <h2 className="text-lg font-semibold text-white">Sellers</h2>
            </div>
            <p className="mt-1 text-xs text-neutral-400">Approval queue, account remediation, inventory checks, and seller wallet operations.</p>
          </div>
          <button onClick={() => void load()} className="inline-flex w-fit items-center gap-1 rounded-md border border-white/10 px-3 py-2 text-xs text-white/80 hover:bg-white/10">
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        <div className="grid grid-cols-2 gap-px border-b border-white/10 bg-white/10 text-xs md:grid-cols-5">
          <div className="bg-[#111] p-3"><p className="text-neutral-500">Pending</p><p className="mt-1 text-lg font-semibold text-yellow-300">{metrics.pending}</p></div>
          <div className="bg-[#111] p-3"><p className="text-neutral-500">Active</p><p className="mt-1 text-lg font-semibold text-emerald-300">{metrics.active}</p></div>
          <div className="bg-[#111] p-3"><p className="text-neutral-500">Suspended</p><p className="mt-1 text-lg font-semibold text-amber-300">{metrics.suspended}</p></div>
          <div className="bg-[#111] p-3"><p className="text-neutral-500">Rejected</p><p className="mt-1 text-lg font-semibold text-red-300">{metrics.rejected}</p></div>
          <div className="bg-[#111] p-3"><p className="text-neutral-500">Drafts</p><p className="mt-1 text-lg font-semibold text-white">{metrics.drafts}</p></div>
        </div>

        <div className="flex flex-wrap gap-1 border-b border-white/10 px-3 py-2">
          {STATUS_OPTIONS.map((option) => (
            <button key={option} onClick={() => setStatus(option)} className={`rounded-md px-3 py-1.5 text-xs font-medium ${status === option ? 'bg-white text-black' : 'text-neutral-300 hover:bg-white/10'}`}>
              {option[0].toUpperCase() + option.slice(1)}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-3 border-b border-white/10 p-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="relative w-full xl:max-w-lg">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={16} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search seller, email, phone, city"
              className="w-full rounded-md border border-white/10 bg-black/30 py-2 pl-9 pr-3 text-sm text-white outline-none focus:border-primary/60"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-neutral-400">{selectedIds.length} selected</span>
            <select value={bulkStatus} onChange={(e) => setBulkStatus(e.target.value as any)} className="rounded-md border border-white/10 bg-black/30 px-2 py-2 text-xs text-white">
              <option value="active">active</option>
              <option value="suspended">suspended</option>
              <option value="rejected">rejected</option>
            </select>
            <input value={bulkNote} onChange={(e) => setBulkNote(e.target.value)} className="w-48 rounded-md border border-white/10 bg-black/30 px-2 py-2 text-xs text-white" />
            <button disabled={saving || selectedIds.length === 0} onClick={() => void setSellerStatus(selectedIds, bulkStatus)} className="rounded-md border border-white/10 px-3 py-2 text-xs text-white/80 hover:bg-white/10 disabled:opacity-40">Apply</button>
          </div>
        </div>

        {error && <div className="border-b border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200">{error}</div>}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px] text-left text-sm">
            <thead className="border-b border-white/10 text-xs uppercase text-neutral-500">
              <tr>
                <th className="w-10 p-3"><input type="checkbox" checked={allVisibleSelected} onChange={toggleVisible} className="accent-[#f43f5e]" /></th>
                <th className="p-3">Seller</th>
                <th className="p-3">Contact</th>
                <th className="p-3">City</th>
                <th className="p-3">Status</th>
                <th className="p-3">Commission</th>
                <th className="p-3">Registered</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="p-10 text-center text-neutral-400">Loading sellers...</td></tr>
              ) : filteredSellers.length === 0 ? (
                <tr><td colSpan={8} className="p-10 text-center text-neutral-500">No sellers match this view.</td></tr>
              ) : filteredSellers.map((seller) => {
                const id = getSellerId(seller);
                const sellerStatus = getSellerStatus(seller);
                return (
                  <tr key={id} className="border-b border-white/5 hover:bg-white/[0.03]">
                    <td className="p-3"><input type="checkbox" checked={selectedIds.includes(id)} onChange={() => toggleSelected(id)} className="accent-[#f43f5e]" /></td>
                    <td className="p-3">
                      <p className="font-medium text-white">{getSellerName(seller)}</p>
                      <p className="mt-0.5 max-w-[220px] truncate font-mono text-[11px] text-neutral-500">{id}</p>
                    </td>
                    <td className="p-3">
                      <p className="text-neutral-300">{getSellerEmail(seller) || '-'}</p>
                      <p className="text-xs text-neutral-500">{getSellerPhone(seller) || '-'}</p>
                    </td>
                    <td className="p-3 text-neutral-300">{getSellerCity(seller) || '-'}</td>
                    <td className="p-3"><span className={`rounded-full border px-2 py-1 text-[11px] ${statusClass(sellerStatus)}`}>{sellerStatus}</span></td>
                    <td className="p-3 text-neutral-300">{seller.commission_rate ?? seller.commission_settings?.commission_rate ?? '-'}</td>
                    <td className="p-3 text-neutral-400">{dateText(seller.created_at)}</td>
                    <td className="p-3">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => void loginAsSeller(seller)} className="rounded-md border border-white/10 p-2 text-neutral-300 hover:bg-white/10" title="Login as seller"><LogIn size={14} /></button>
                        <button onClick={() => void openSeller(seller, 'profile')} className="rounded-md border border-white/10 p-2 text-neutral-300 hover:bg-white/10" title="View seller"><Eye size={14} /></button>
                        <button onClick={() => void openSeller(seller, 'wallet')} className="rounded-md border border-white/10 p-2 text-neutral-300 hover:bg-white/10" title="Wallet"><Wallet size={14} /></button>
                        {sellerStatus === 'pending' && (
                          <>
                            <button onClick={() => void approve(seller, true)} className="rounded-md border border-emerald-500/30 p-2 text-emerald-300 hover:bg-emerald-500/10" title="Approve"><CheckCircle2 size={14} /></button>
                            <button onClick={() => void approve(seller, false)} className="rounded-md border border-red-500/30 p-2 text-red-300 hover:bg-red-500/10" title="Reject"><XCircle size={14} /></button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {drafts.length > 0 && (
        <div className="rounded-lg border border-white/10 bg-[#111]">
          <div className="border-b border-white/10 p-3">
            <h3 className="text-sm font-semibold text-white">Registration drafts</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-white/10 text-xs uppercase text-neutral-500">
                <tr><th className="p-3">Email</th><th className="p-3">Step</th><th className="p-3">Business</th><th className="p-3">Updated</th></tr>
              </thead>
              <tbody>
                {drafts.slice(0, 8).map((draft, index) => (
                  <tr key={draft.id || draft.email || index} className="border-b border-white/5">
                    <td className="p-3 text-white">{draft.email || '-'}</td>
                    <td className="p-3 text-neutral-300">{draft.step ?? draft.current_step ?? '-'}</td>
                    <td className="p-3 text-neutral-300">{draft.business_name || draft.legal_name || '-'}</td>
                    <td className="p-3 text-neutral-400">{dateText(draft.updated_at || draft.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedSeller && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60">
          <button className="flex-1" onClick={() => setSelectedSeller(null)} aria-label="Close drawer" />
          <aside className="h-full w-full max-w-2xl overflow-y-auto border-l border-white/10 bg-[#111] shadow-2xl">
            <div className="sticky top-0 z-10 border-b border-white/10 bg-[#111] p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-wide text-neutral-500">Seller</p>
                  <h3 className="mt-1 text-lg font-semibold text-white">{getSellerName(selectedSeller)}</h3>
                  <p className="text-xs text-neutral-500">{getSellerEmail(selectedSeller)}</p>
                </div>
                <button onClick={() => setSelectedSeller(null)} className="rounded-md border border-white/10 p-2 text-neutral-300 hover:bg-white/10"><X size={16} /></button>
              </div>
              <div className="mt-4 flex flex-wrap gap-1">
                {(['profile', 'inventory', 'wallet', 'products'] as DrawerTab[]).map((tab) => (
                  <button key={tab} onClick={() => setDrawerTab(tab)} className={`rounded-md px-3 py-1.5 text-xs font-medium ${drawerTab === tab ? 'bg-white text-black' : 'text-neutral-300 hover:bg-white/10'}`}>
                    {tab[0].toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-5">
              {drawerTab === 'profile' && (
                <div className="space-y-5">
                  <div className="grid gap-3 md:grid-cols-2">
                    {[
                      ['business_name', 'Business name'],
                      ['legal_name', 'Legal name'],
                      ['contact_person', 'Contact person'],
                      ['email', 'Email'],
                      ['phone_number', 'Phone'],
                      ['city', 'City'],
                      ['commission_rate', 'Commission rate'],
                    ].map(([key, label]) => (
                      <label key={key} className="text-xs text-neutral-400">
                        {label}
                        <input value={profileDraft[key] || ''} onChange={(e) => setProfileDraft((prev) => ({ ...prev, [key]: e.target.value }))} className="mt-1 w-full rounded-md border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-primary/60" />
                      </label>
                    ))}
                  </div>
                  <div className="flex flex-wrap justify-end gap-2">
                    <button disabled={saving} onClick={() => void saveProfile()} className="inline-flex items-center gap-1 rounded-md bg-white px-3 py-2 text-sm font-semibold text-black disabled:opacity-50"><Edit3 size={14} /> Save profile</button>
                    <button disabled={saving} onClick={() => void setSellerStatus([getSellerId(selectedSeller)], 'suspended', 'Suspended from seller drawer')} className="rounded-md border border-amber-500/30 px-3 py-2 text-sm text-amber-300 hover:bg-amber-500/10 disabled:opacity-50">Suspend</button>
                    <button disabled={saving} onClick={() => void setSellerStatus([getSellerId(selectedSeller)], 'active', 'Activated from seller drawer')} className="rounded-md border border-emerald-500/30 px-3 py-2 text-sm text-emerald-300 hover:bg-emerald-500/10 disabled:opacity-50">Activate</button>
                  </div>
                </div>
              )}

              {drawerTab === 'inventory' && (
                <div className="space-y-3">
                  <button onClick={() => void loadInventory()} className="rounded-md border border-white/10 px-3 py-2 text-xs text-white/80 hover:bg-white/10">Refresh inventory</button>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[640px] text-left text-sm">
                      <thead className="border-b border-white/10 text-xs uppercase text-neutral-500">
                        <tr><th className="p-2">Product</th><th className="p-2">Variant</th><th className="p-2">SKU</th><th className="p-2">Price</th><th className="p-2">Qty</th><th className="p-2"></th></tr>
                      </thead>
                      <tbody>
                        {inventory.length === 0 ? (
                          <tr><td colSpan={6} className="p-8 text-center text-neutral-500">No inventory rows loaded.</td></tr>
                        ) : inventory.map((row, index) => (
                          <tr key={`${row.product_id}-${row.variant_id}-${index}`} className="border-b border-white/5">
                            <td className="p-2 text-white">{row.product_title || row.product_id}</td>
                            <td className="p-2 text-neutral-300">{row.variant_title || row.variant_id}</td>
                            <td className="p-2 text-neutral-400">{row.sku || '-'}</td>
                            <td className="p-2 text-neutral-300">{money(row.price)}</td>
                            <td className="p-2"><input defaultValue={row.available_quantity ?? 0} id={`qty-${index}`} type="number" className="w-20 rounded-md border border-white/10 bg-black/30 px-2 py-1 text-sm text-white" /></td>
                            <td className="p-2 text-right">
                              <button disabled={saving} onClick={() => {
                                const input = document.getElementById(`qty-${index}`) as HTMLInputElement | null;
                                void updateInventoryRow(row, Number(input?.value || 0));
                              }} className="rounded-md border border-white/10 px-2 py-1 text-xs text-white/80 hover:bg-white/10 disabled:opacity-40">Save</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {drawerTab === 'wallet' && (
                <div className="space-y-5">
                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="rounded-md border border-white/10 bg-black/20 p-3"><p className="text-xs text-neutral-500">Balance</p><p className="mt-1 text-lg font-semibold text-white">{money(walletData?.balance ?? walletData?.current_balance)}</p></div>
                    <div className="rounded-md border border-white/10 bg-black/20 p-3"><p className="text-xs text-neutral-500">Ledger rows</p><p className="mt-1 text-lg font-semibold text-white">{asArray(walletData?.ledger || walletData?.entries || walletData).length}</p></div>
                    <div className="rounded-md border border-white/10 bg-black/20 p-3"><p className="text-xs text-neutral-500">Seller</p><p className="mt-1 truncate text-sm font-semibold text-white">{getSellerId(selectedSeller)}</p></div>
                  </div>

                  <div className="grid gap-2 md:grid-cols-5">
                    <input value={walletDraft.amount} onChange={(e) => setWalletDraft((prev) => ({ ...prev, amount: e.target.value }))} placeholder="Amount" type="number" className="rounded-md border border-white/10 bg-black/30 px-3 py-2 text-sm text-white" />
                    <select value={walletDraft.direction} onChange={(e) => setWalletDraft((prev) => ({ ...prev, direction: e.target.value as any }))} className="rounded-md border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"><option value="debit">debit</option><option value="credit">credit</option></select>
                    <input value={walletDraft.reason} onChange={(e) => setWalletDraft((prev) => ({ ...prev, reason: e.target.value }))} placeholder="Reason" className="rounded-md border border-white/10 bg-black/30 px-3 py-2 text-sm text-white" />
                    <input value={walletDraft.related_order_id} onChange={(e) => setWalletDraft((prev) => ({ ...prev, related_order_id: e.target.value }))} placeholder="Order ID" className="rounded-md border border-white/10 bg-black/30 px-3 py-2 text-sm text-white" />
                    <button disabled={saving} onClick={() => void adjustWallet()} className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-black disabled:opacity-50">Adjust</button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[620px] text-left text-sm">
                      <thead className="border-b border-white/10 text-xs uppercase text-neutral-500"><tr><th className="p-2">Date</th><th className="p-2">Type</th><th className="p-2">Reason</th><th className="p-2 text-right">Amount</th></tr></thead>
                      <tbody>
                        {asArray(walletData?.ledger || walletData?.entries || walletData).map((row, index) => (
                          <tr key={row.id || index} className="border-b border-white/5">
                            <td className="p-2 text-neutral-400">{dateText(row.created_at)}</td>
                            <td className="p-2 text-neutral-300">{row.direction || row.type || '-'}</td>
                            <td className="p-2 text-neutral-300">{row.reason || row.adjustment_type || '-'}</td>
                            <td className="p-2 text-right text-white">{money(row.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {drawerTab === 'products' && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm text-neutral-400">Seller-access product listing from the updated admin module.</p>
                    <div className="flex items-center gap-2">
                      <select
                        value={sellerProductsStatus}
                        onChange={(e) => setSellerProductsStatus(e.target.value as typeof sellerProductsStatus)}
                        className="rounded-md border border-white/10 bg-black/30 px-3 py-2 text-xs text-white"
                      >
                        <option value="all">all</option>
                        <option value="draft">draft</option>
                        <option value="active">active</option>
                        <option value="rejected">rejected</option>
                        <option value="archived">archived</option>
                      </select>
                      <button onClick={() => void loadSellerProducts()} className="rounded-md border border-white/10 px-3 py-2 text-xs text-white/80 hover:bg-white/10">
                        Refresh products
                      </button>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[720px] text-left text-sm">
                      <thead className="border-b border-white/10 text-xs uppercase text-neutral-500">
                        <tr>
                          <th className="p-2">Product</th>
                          <th className="p-2">Status</th>
                          <th className="p-2">Price</th>
                          <th className="p-2">Stock</th>
                          <th className="p-2">Badges</th>
                          <th className="p-2 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sellerProducts.length === 0 ? (
                          <tr><td colSpan={6} className="p-8 text-center text-neutral-500">No seller products loaded.</td></tr>
                        ) : sellerProducts.map((product) => {
                          const badges = product.badges || {};
                          const badgeLabels = [
                            badges.marketing_campaign ? 'Marketing campaign' : null,
                            badges.best_seller ? 'Best seller' : null,
                            badges.thrifted ? 'Thrifted' : null,
                          ].filter(Boolean);

                          return (
                            <tr key={product.id} className="border-b border-white/5">
                              <td className="p-2">
                                <p className="font-medium text-white">{product.title || product.id}</p>
                                <p className="mt-0.5 font-mono text-[11px] text-neutral-500">{product.id}</p>
                              </td>
                              <td className="p-2 text-neutral-300">{getProductStatus(product)}</td>
                              <td className="p-2 text-neutral-300">{money(getProductPrice(product))}</td>
                              <td className="p-2 text-neutral-300">{getProductStock(product)}</td>
                              <td className="p-2 text-neutral-300">{badgeLabels.length > 0 ? badgeLabels.join(', ') : '-'}</td>
                              <td className="p-2 text-right">
                                <button
                                  disabled={saving}
                                  onClick={() => void deleteSellerProduct(product)}
                                  className="rounded-md border border-red-500/30 px-2 py-1 text-xs text-red-300 hover:bg-red-500/10 disabled:opacity-40"
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
};

export default ManageSellers;
