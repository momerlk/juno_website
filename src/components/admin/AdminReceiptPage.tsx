import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, RefreshCw, Printer } from 'lucide-react';
import { AdminCommerce } from '../../api/adminApi';

const AdminReceiptPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payload, setPayload] = useState<any>(null);

  const load = async () => {
    if (!orderId) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await AdminCommerce.getOrderReceipt(orderId);
      if (!res.ok) throw new Error((res.body as any)?.message || 'Failed to load receipt');
      setPayload(res.body);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unexpected error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  useEffect(() => {
    const fileOrderNumber =
      payload?.order_number ||
      payload?.parent_order_id ||
      payload?.order_id ||
      orderId ||
      'receipt';
    document.title = `${fileOrderNumber}`;
    return () => {
      document.title = 'Juno';
    };
  }, [orderId, payload]);

  useEffect(() => {
    const shouldPrint = searchParams.get('print') === '1';
    if (!shouldPrint || isLoading || !payload?.html) return;
    const timer = window.setTimeout(() => {
      window.print();
    }, 200);
    return () => window.clearTimeout(timer);
  }, [isLoading, payload, searchParams]);

  return (
    <div className="max-w-6xl mx-auto space-y-4 mt-6">
      <style>{`
        @media print {
          @page { size: A4; margin: 8mm; }
          body { background: #fff !important; }
          .no-print { display: none !important; }
          .print-shell {
            margin: 0 !important;
            padding: 0 !important;
            border: 0 !important;
            background: #fff !important;
            min-height: auto !important;
          }
          .print-receipt {
            width: 100% !important;
            max-width: 100% !important;
            overflow: hidden !important;
            page-break-inside: avoid;
          }
          .print-receipt table {
            width: 100% !important;
            max-width: 100% !important;
          }
          .print-receipt img {
            max-width: 100% !important;
            height: auto !important;
          }
        }
      `}</style>

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 no-print">
          <button onClick={() => navigate('/admin/logistics')} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 text-white/80 hover:bg-white/10 text-xs">
            <ArrowLeft size={14} /> Back to Logistics
          </button>
          <button onClick={() => void load()} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 text-white/80 hover:bg-white/10 text-xs">
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
        <button
          onClick={() => window.print()}
          disabled={isLoading || !payload?.html}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 text-xs disabled:opacity-50 no-print"
        >
          <Printer size={14} /> Print / Save PDF
        </button>
      </div>

      <div className="glass-panel p-5 no-print">
        <h2 className="text-xl font-bold text-white">Receipt • {orderId}</h2>
        {payload && (
          <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3"><p className="text-neutral-500">Subject</p><p className="text-white break-all">{payload.subject || '-'}</p></div>
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3"><p className="text-neutral-500">Tracking URL</p><p className="text-white break-all">{payload.tracking_url || '-'}</p></div>
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3"><p className="text-neutral-500">Customer Email</p><p className="text-white break-all">{payload.customer_email || '-'}</p></div>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-white/10 bg-white p-2 min-h-[70vh] print-shell">
        {isLoading ? (
          <div className="h-[70vh] flex items-center justify-center text-black">Loading receipt...</div>
        ) : error ? (
          <div className="h-[70vh] overflow-auto p-4 text-black">
            <p className="font-semibold text-red-700">{error}</p>
          </div>
        ) : payload?.html ? (
          <>
            <iframe title="Admin Receipt" className="w-full h-[70vh] rounded no-print" srcDoc={payload.html} />
            <div className="hidden print:block print-receipt" dangerouslySetInnerHTML={{ __html: payload.html }} />
          </>
        ) : (
          <div className="h-[70vh] overflow-auto p-4 text-black">
            <p className="font-semibold">No HTML receipt content returned by API.</p>
            <pre className="mt-3 whitespace-pre-wrap break-words text-xs">{JSON.stringify(payload, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminReceiptPage;
