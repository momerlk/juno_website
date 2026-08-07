import React, { useEffect, useState } from 'react';
import { FileText, RefreshCw } from 'lucide-react';
import { useSellerAuth } from '../../contexts/SellerAuthContext';
import { Seller } from '../../api/sellerApi';
import type { SellerStatement } from '../../api/api.types';

const money = (value?: number) => `Rs ${new Intl.NumberFormat('en-PK', { maximumFractionDigits: 0 }).format(value || 0)}`;

const StatementsPage: React.FC = () => {
  const { seller } = useSellerAuth();
  const [statements, setStatements] = useState<SellerStatement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    if (!seller?.token) return;
    setLoading(true);
    setError(null);
    try {
      const response = await Seller.getStatements(seller.token);
      if (!response.ok) throw new Error((response.body as any)?.message || 'Could not load statements');
      const body = response.body as SellerStatement[] | { statements?: SellerStatement[] };
      setStatements(Array.isArray(body) ? body : body.statements || []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not load statements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, [seller?.token]);

  return (
    <div className="mt-4 space-y-4 text-neutral-100">
      <section className="rounded-lg border border-white/10 bg-[#121212] p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FileText size={16} className="text-primary" />
            <div>
              <h2 className="text-base font-semibold">Brand statements</h2>
              <p className="text-xs text-neutral-500">Payout status and transfer references for your brand.</p>
            </div>
          </div>
          <button onClick={() => void load()} disabled={loading} className="inline-flex items-center gap-2 rounded border border-white/15 bg-[#1a1a1a] px-3 py-2 text-xs text-neutral-100 disabled:opacity-40">
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </section>

      {error ? <section className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</section> : null}

      <section className="rounded-lg border border-white/10 bg-[#121212] p-2">
        {loading ? (
          <div className="p-6 text-sm text-neutral-400">Loading statements...</div>
        ) : statements.length === 0 ? (
          <div className="p-10 text-center">
            <FileText className="mx-auto text-neutral-600" size={24} />
            <p className="mt-3 text-sm font-medium text-neutral-200">No statements yet</p>
            <p className="mt-1 text-xs text-neutral-500">Statements appear here after Juno receives DEX payment and completes settlement.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs">
              <thead className="bg-[#0f0f0f] text-neutral-400">
                <tr>
                  <th className="px-3 py-2 font-medium">Statement</th>
                  <th className="px-3 py-2 font-medium">Created</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 text-right font-medium">Transfer</th>
                  <th className="px-3 py-2 font-medium">Reference</th>
                </tr>
              </thead>
              <tbody>
                {statements.map((statement) => (
                  <tr key={statement.id} className="border-t border-white/5 text-neutral-300">
                    <td className="px-3 py-2 font-mono text-neutral-100">{statement.id}</td>
                    <td className="px-3 py-2">{statement.created_at ? new Date(statement.created_at).toLocaleDateString('en-PK') : '-'}</td>
                    <td className="px-3 py-2">
                      <span className={`rounded border px-2 py-0.5 text-[10px] uppercase tracking-[0.08em] ${statement.status === 'paid' ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300' : 'border-amber-400/30 bg-amber-400/10 text-amber-200'}`}>{statement.status}</span>
                    </td>
                    <td className="px-3 py-2 text-right font-medium text-neutral-100">{money(statement.transfer_amount ?? statement.amount)}</td>
                    <td className="px-3 py-2 font-mono text-neutral-500">{statement.bank_reference || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default StatementsPage;
