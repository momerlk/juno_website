import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingCart, User, MapPin, Hash, Calendar, CreditCard, Truck, Package, DollarSign, Percent, FileText } from 'lucide-react';
import { Order, OrderItem, OrderStatus, PaymentStatus } from '../../constants/orders';
import { Seller } from '../../constants/seller';
import { Product } from '../../constants/types';
import { GetProductById } from '../../api/adminApi';

const statusColors: { [key in OrderStatus]: string } = {
  pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-700',
  confirmed: 'bg-blue-500/20 text-blue-400 border-blue-700',
  packed: 'bg-indigo-500/20 text-indigo-400 border-indigo-700',
  booked: 'bg-purple-500/20 text-purple-400 border-purple-700',
  shipped: 'bg-cyan-500/20 text-cyan-400 border-cyan-700',
  delivered: 'bg-green-500/20 text-green-400 border-green-700',
  cancelled: 'bg-red-500/20 text-red-400 border-red-700',
  returned: 'bg-orange-500/20 text-orange-400 border-orange-700',
  refunded: 'bg-gray-500/20 text-gray-400 border-gray-700',
  fulfilled: 'bg-teal-500/20 text-teal-400 border-teal-700',
};

const paymentStatusColors: { [key in PaymentStatus]: string } = {
  pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-700',
  paid: 'bg-green-500/20 text-green-400 border-green-700',
  failed: 'bg-red-500/20 text-red-400 border-red-700',
  refunded: 'bg-gray-500/20 text-gray-400 border-gray-700',
};

const OrderItemCard: React.FC<{ item: OrderItem }> = ({ item }) => {
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!item.product_id) return;
      setIsLoading(true);
      try {
        const res = await GetProductById(item.product_id);
        if (res.ok) {
          setProduct(res.body);
        } else {
          console.error('Failed to fetch product', res.body);
        }
      } catch (err) {
        console.error('Error fetching product:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProduct();
  }, [item.product_id]);

  const variant = product?.variants.find(v => v.id === item.variant_id);

  if (isLoading) {
    return <div className="flex items-center bg-background p-4 rounded-lg animate-pulse"><div className="w-16 h-16 bg-neutral-700 rounded-md"></div><div className="ml-4 flex-grow space-y-2"><div class="h-4 bg-neutral-700 rounded w-3/4"></div><div class="h-3 bg-neutral-700 rounded w-1/2"></div></div></div>;
  }

  if (!product) {
    return (
        <div className="flex items-center bg-background p-4 rounded-lg">
            <div className="w-16 h-16 bg-neutral-800 rounded-md flex items-center justify-center">
                <Package size={24} className="text-neutral-500" />
            </div>
            <div className="flex-grow ml-4">
                <p className="text-white font-semibold">Product not found</p>
                <p className="text-neutral-400 text-sm font-mono">ID: {item.product_id}</p>
            </div>
            <div className="text-right">
                <p className="text-white font-bold">Qty: {item.quantity}</p>
                <p className="text-neutral-300 text-sm">Rs {item.unit_price.toLocaleString()}</p>
            </div>
        </div>
    );
  }

  return (
    <div className="flex items-start bg-background p-4 rounded-lg">
      <img src={product.images[0]} alt={product.title} className="w-20 h-24 object-cover rounded-md" />
      <div className="flex-grow ml-4">
        <p className="text-white font-bold text-lg">{product.title}</p>
        <p className="text-neutral-400 text-sm">{product.short_description}</p>
        <div className="text-sm text-neutral-300 mt-2 font-mono">
          <p>SKU: {variant?.sku || 'N/A'}</p>
          {variant?.options && Object.entries(variant.options).map(([key, value]) => (
            <p key={key}><span className="capitalize">{key}:</span> {value}</p>
          ))}
        </div>
      </div>
      <div className="text-right ml-4 flex-shrink-0">
        <p className="text-white font-bold text-lg">Rs {item.total_price.toLocaleString()}</p>
        <p className="text-neutral-400 text-sm">Qty: {item.quantity}</p>
        <p className="text-neutral-400 text-sm">@ Rs {item.unit_price.toLocaleString()}</p>
      </div>
    </div>
  );
};

interface OrderDetailModalProps {
  order: Order;
  sellers: Seller[];
  isOpen: boolean;
  onClose: () => void;
}

const OrderDetailModal: React.FC<OrderDetailModalProps> = ({ order, sellers, isOpen, onClose }) => {
  if (!isOpen) return null;

  const seller = sellers.find(s => s.id === order.seller_id);

  const renderAddress = (address: any, title: string) => (
    <div className="bg-background p-4 rounded-lg">
      <h4 className="text-lg font-semibold text-primary mb-3 flex items-center"><MapPin size={18} className="mr-2"/>{title}</h4>
      <p className="text-neutral-200 font-medium">{address?.name}</p>
      <p className="text-neutral-300">{address?.address_line1}</p>
      {address?.address_line2 && <p className="text-neutral-300">{address.address_line2}</p>}
      <p className="text-neutral-300">{address?.city}, {address?.province} {address?.postal_code}</p>
      <p className="text-neutral-300">{address?.country}</p>
      {address?.phone_number && <p className="text-neutral-300 mt-2">Phone: {address.phone_number}</p>}
    </div>
  );

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 50 }}
          transition={{ duration: 0.3 }}
          className="bg-background-light rounded-xl shadow-2xl border border-neutral-800 max-w-5xl w-full max-h-[95vh] overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-700 scrollbar-track-background-light"
        >
          <header className="sticky top-0 bg-background-light/80 backdrop-blur-sm z-10 flex justify-between items-center p-6 border-b border-neutral-800">
            <div>
                <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                    <ShoppingCart size={28}/> Order Details
                </h2>
                <p className="text-neutral-400 font-mono text-sm mt-1">{order.order_number}</p>
            </div>
            <button onClick={onClose} className="text-neutral-500 hover:text-white hover:bg-neutral-700 rounded-full p-2 transition-colors">
              <X size={24} />
            </button>
          </header>

          <main className="p-6">
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <div className="lg:col-span-2 bg-background p-4 rounded-lg">
                    <h3 className="text-xl font-semibold text-primary mb-4 flex items-center"><FileText size={20} className="mr-2"/>Order Summary</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        <div className="flex flex-col"><span className="text-neutral-400 flex items-center gap-1.5"><Hash size={14}/>Order ID</span> <span className="text-white font-mono text-xs">{order.id}</span></div>
                        <div className="flex flex-col"><span className="text-neutral-400 flex items-center gap-1.5"><Calendar size={14}/>Created At</span> <span className="text-white">{new Date(order.created_at).toLocaleString()}</span></div>
                        <div className="flex flex-col"><span className="text-neutral-400 flex items-center gap-1.5"><CreditCard size={14}/>Payment Method</span> <span className="text-white capitalize">{order.payment_method.replace(/_/g, ' ')}</span></div>
                        <div className="flex flex-col"><span className="text-neutral-400 flex items-center gap-1.5"><Truck size={14}/>Delivery Method</span> <span className="text-white capitalize">{order.delivery_method}</span></div>
                        <div className="flex flex-col"><span className="text-neutral-400">Order Status</span> <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${statusColors[order.status] || 'bg-gray-500/20 text-gray-400'} w-min`}>{order.status}</span></div>
                        <div className="flex flex-col"><span className="text-neutral-400">Payment Status</span> <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${paymentStatusColors[order.payment_status] || 'bg-gray-500/20 text-gray-400'} w-min`}>{order.payment_status}</span></div>
                    </div>
                    <div className="border-t border-neutral-800 mt-4 pt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex flex-col"><span className="text-neutral-400 flex items-center gap-1.5"><DollarSign size={14}/>Subtotal</span> <span className="text-white font-medium">Rs {order.subtotal.toLocaleString()}</span></div>
                        <div className="flex flex-col"><span className="text-neutral-400 flex items-center gap-1.5"><Truck size={14}/>Shipping</span> <span className="text-white font-medium">Rs {order.shipping_cost.toLocaleString()}</span></div>
                        <div className="flex flex-col"><span className="text-neutral-400 flex items-center gap-1.5"><Percent size={14}/>Discount</span> <span className="text-white font-medium">- Rs {order.discount.toLocaleString()}</span></div>
                        <div className="flex flex-col"><span className="text-neutral-400 flex items-center gap-1.5"><FileText size={14}/>Tax</span> <span className="text-white font-medium">Rs {order.tax.toLocaleString()}</span></div>
                        <div className="col-span-full md:col-span-4 border-t border-neutral-800 mt-2 pt-2 flex justify-end items-center gap-4">
                            <span className="text-xl font-bold text-white">Total</span>
                            <span className="text-2xl font-bold text-primary">Rs {order.total.toLocaleString()}</span>
                        </div>
                    </div>
                </div>
                <div className="bg-background p-4 rounded-lg">
                    <h3 className="text-xl font-semibold text-primary mb-4 flex items-center"><User size={20} className="mr-2"/>Seller Information</h3>
                    {seller ? (
                        <div className="flex items-center gap-4">
                            <img src={seller.logo_url} alt={seller.business_name} className="w-16 h-16 rounded-full object-cover"/>
                            <div>
                                <p className="text-white font-bold text-lg">{seller.business_name}</p>
                                <p className="text-neutral-400 text-sm">{seller.contact.email}</p>
                                <p className="text-neutral-400 text-sm">{seller.contact.phone_number}</p>
                            </div>
                        </div>
                    ) : <p className="text-neutral-400">Seller details not available.</p>}
                </div>
            </section>

            <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {renderAddress(order.shipping_address, 'Shipping Address')}
              {renderAddress(order.billing_address, 'Billing Address')}
            </section>

            <section>
              <h3 className="text-xl font-semibold text-primary mb-4 flex items-center"><Package size={20} className="mr-2"/>Order Items ({order.order_items?.length || 0})</h3>
              <div className="space-y-4">
                {order.order_items?.map(item => (
                  <OrderItemCard key={item.id || item.product_id} item={item} />
                ))}
              </div>
            </section>

          </main>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default OrderDetailModal;

