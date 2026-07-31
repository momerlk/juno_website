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
    <section className="glass-panel mt-6 p-6">
      <div className="mb-6 flex items-start justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-white/40">Finance</p>
          <h2 className="mt-1 text-2xl font-black uppercase text-white">Brand statements</h2>
          <p className="mt-2 text-sm text-white/55">Payout status and transfer references for your brand.</p>
        </div>
        <button onClick={() => void load()} disabled={loading} className="rounded-xl border border-white/10 p-2.5 text-white/70 hover:bg-white/10 disabled:opacity-50" aria-label="Refresh statements">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {error && <p className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</p>}
      {loading ? <p className="py-10 text-center text-sm text-white/45">Loading statements…</p> : statements.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 p-10 text-center">
          <FileText className="mx-auto text-white/25" size={28} />
          <p className="mt-3 text-sm font-semibold text-white">No statements yet</p>
          <p className="mt-1 text-xs text-white/45">Statements appear here after Juno receives DEX payment and completes settlement.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-left text-sm">
            <thead className="border-b border-white/10 text-[10px] uppercase tracking-[0.16em] text-white/40">
              <tr><th className="pb-3">Statement</th><th className="pb-3">Created</th><th className="pb-3">Status</th><th className="pb-3 text-right">Transfer</th><th className="pb-3">Reference</th></tr>
            </thead>
            <tbody>
              {statements.map((statement) => (
                <tr key={statement.id} className="border-b border-white/5 text-white/75">
                  <td className="py-4 font-mono text-xs text-white">{statement.id}</td>
                  <td className="py-4">{statement.created_at ? new Date(statement.created_at).toLocaleDateString('en-PK') : '-'}</td>
                  <td className="py-4"><span className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase ${statement.status === 'paid' ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300' : 'border-amber-400/30 bg-amber-400/10 text-amber-200'}`}>{statement.status}</span></td>
                  <td className="py-4 text-right font-semibold text-white">{money(statement.transfer_amount ?? statement.amount)}</td>
                  <td className="py-4 font-mono text-xs text-white/50">{statement.bank_reference || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};

export default StatementsPage;
