import React from 'react';
import { OrderStatus } from '../../constants/orders';

export const OrderStatusBadge: React.FC<{ status: OrderStatus }> = ({ status }) => {
    const statusConfig = {
        pending: { text: 'Pending', className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
        confirmed: { text: 'Confirmed', className: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
        packed: { text: 'Packed', className: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' },
        booked: { text: 'Booked', className: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
        shipped: { text: 'Shipped', className: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
        delivered: { text: 'Delivered', className: 'bg-green-500/20 text-green-400 border-green-500/30' },
        cancelled: { text: 'Cancelled', className: 'bg-red-500/20 text-red-400 border-red-500/30' },
        returned: { text: 'Returned', className: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
    };

    const config = statusConfig[status] || { text: status, className: 'bg-neutral-500/20 text-neutral-400 border-neutral-500/30' };

    return (
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${config.className}`}>
            {config.text}
        </span>
    );
};
