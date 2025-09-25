import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Order } from '../../constants/orders';

interface OrderDetailModalProps {
  order: Order;
  isOpen: boolean;
  onClose: () => void;
}

const OrderDetailModal: React.FC<OrderDetailModalProps> = ({ order, isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-background-light rounded-lg p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">Order Details</h2>
            <button onClick={onClose} className="text-neutral-400 hover:text-white">
              <X size={24} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-primary mb-2">Order Information</h3>
              <p className="text-neutral-400"><strong>ID:</strong> <span className='font-mono text-xs'>{order.id}</span></p>
              <p className="text-neutral-400"><strong>Date:</strong> {new Date(order.created_at).toLocaleString()}</p>
              <p className="text-neutral-400"><strong>Date:</strong> {new Date(order.created_at).toLocaleString()}</p>
              <p className="text-neutral-400"><strong>Sub Total:</strong> Rs {order.subtotal}</p>
              <p className="text-neutral-400"><strong>Total:</strong> Rs {order.total}</p>
              <p className="text-neutral-400"><strong>Payment Method:</strong> {order.payment_method}</p>
              <p className="text-neutral-400"><strong>Payment Status:</strong> {order.payment_status}</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-primary mb-2">Customer Information</h3>
              <p className="text-neutral-400"><strong>Customer :</strong> <span className='font-mono text-xs'>{order.shipping_address?.name}</span></p>
              <p className="text-neutral-400"><strong>Address:</strong> {order.shipping_address?.address_line1}, {order.shipping_address?.city}, {order.shipping_address?.province}</p>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="text-lg font-semibold text-primary mb-2">Items</h3>
            <div className="space-y-4">
              {order.order_items?.map(item => (
                <div key={item.product_id} className="flex items-center bg-background p-4 rounded-lg">
                  <div className="flex-grow">
                    <p className="text-white font-semibold">{item.product_id}</p>
                    <p className="text-neutral-400 text-sm">Variant: {item.variant_id}</p>
                    <p className="text-neutral-400 text-sm">Seller: {item.seller_id}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white">Qty: {item.quantity}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* <div className="mt-6">
            <h3 className="text-lg font-semibold text-primary mb-2">Status History</h3>
            <div className="space-y-2">
              {order.status_history.map((status, index) => (
                <div key={index} className="flex items-center text-sm">
                  <p className="text-neutral-400 mr-2">{new Date(status.timestamp).toLocaleString()}:</p>
                  <p className="text-white font-semibold">{status.status}</p>
                </div>
              ))}
            </div>
          </div> */}

        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default OrderDetailModal;
