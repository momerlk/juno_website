import React from 'react';
import { ShoppingBag } from 'lucide-react';
import { getShopifySizedImage } from '../../utils/shopifyImage';

// Memoised out of the checkout page: the bag does not change while someone
// types their address, so it should not be rebuilt on every form commit.
type SummaryItem = {
    product_id?: string;
    variant_id?: string;
    image_url?: string;
    product_title?: string;
    seller_name?: string;
    variant_title?: string;
    quantity: number;
    price: number;
};

const formatCurrency = (value: number) =>
    `Rs ${new Intl.NumberFormat('en-PK', { maximumFractionDigits: 0 }).format(value)}`;

const CheckoutSummaryItems: React.FC<{ items: SummaryItem[]; hidden?: boolean }> = ({ items, hidden }) => (
    <div className={`space-y-3.5 ${hidden ? 'hidden' : ''}`}>
        {items.map((item, index) => (
            <div key={`${item.product_id || 'product'}-${item.variant_id || 'variant'}-${index}`} className="flex gap-4">
                <div className="h-20 w-16 flex-shrink-0 overflow-hidden rounded-xl border border-white/[0.08] bg-white/5">
                    {item.image_url ? (
                        <img
                            src={getShopifySizedImage(item.image_url, 160)}
                            alt={item.product_title || 'Product'}
                            width={64}
                            height={80}
                            loading="lazy"
                            decoding="async"
                            className="h-full w-full object-cover"
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center">
                            <ShoppingBag size={18} className="text-white/20" />
                        </div>
                    )}
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-[14px] text-white/45">{item.seller_name || 'Juno Label'}</p>
                    <h3
                        className="mt-1 line-clamp-1 uppercase text-white"
                        style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: '1rem', letterSpacing: '-0.03em' }}
                    >
                        {item.product_title || 'Product'}
                    </h3>
                    {item.variant_title ? <p className="mt-1 text-[14px] text-white/55">{item.variant_title}</p> : null}
                    <p className="mt-1 text-[14px] text-white/40">Qty · {item.quantity}</p>
                </div>
                <p
                    className="shrink-0 text-white"
                    style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 900, fontSize: '1rem', letterSpacing: '-0.03em' }}
                >
                    {formatCurrency(item.price * item.quantity)}
                </p>
            </div>
        ))}
    </div>
);

export default React.memo(CheckoutSummaryItems);
