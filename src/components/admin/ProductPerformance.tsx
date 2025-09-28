import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { adminGetAllInteractions, GetProductById, getAllSellers, GetAllOrders } from '../../api/adminApi';

const ProductCard: React.FC<{ product: any, metric: string, value: number, seller: any }> = ({ product, metric, value, seller }) => (
  <div className="bg-background-light p-4 rounded-lg flex space-x-4">
    <img src={product.images[0]} alt={product.title} className="w-24 h-24 object-cover rounded-md" />
    <div>
      <p className="font-bold text-white">{product.title}</p>
      <p className="text-sm text-neutral-400">by {seller?.business_name || 'Unknown Seller'}</p>
      <p className="text-lg font-semibold text-primary">{value} {metric}</p>
    </div>
  </div>
);

const ProductPerformance: React.FC = () => {
  const [interactions, setInteractions] = useState<any[]>([]);
  const [productDetails, setProductDetails] = useState<any>({});
  const [sellerDetails, setSellerDetails] = useState<any>({});
  const [purchaseCounts, setPurchaseCounts] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [interactionsResponse, sellersResponse, ordersResponse] = await Promise.all([
          adminGetAllInteractions(),
          getAllSellers(),
          GetAllOrders(),
        ]);

        if (interactionsResponse.ok) {
          setInteractions(interactionsResponse.body);

          const productIds = [...new Set(interactionsResponse.body.map((i: any) => i.product_id))];
          const productPromises = productIds.map(id => GetProductById(id));
          const productResults = await Promise.all(productPromises);

          const products: any = {};
          productResults.forEach(res => {
            if (res.ok) {
              products[res.body.id] = res.body;
            }
          });
          setProductDetails(products);
        }

        if (sellersResponse.ok) {
          const sellers: any = {};
          sellersResponse.body.forEach((s: any) => {
            sellers[s.id] = s;
          });
          setSellerDetails(sellers);
        }

        if (ordersResponse.ok) {
          const counts = ordersResponse.body.reduce((acc: any, order: any) => {
            order.order_items.forEach((item: any) => {
              acc[item.product_id] = (acc[item.product_id] || 0) + 1;
            });
            return acc;
          }, {});
          setPurchaseCounts(counts);
        }

      } catch (error) {
        console.error("Failed to fetch interaction data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const analytics = React.useMemo(() => {
    if (interactions.length === 0) return null;

    const productStats = Object.values(productDetails).map((p: any) => {
        const productInteractions = interactions.filter(i => i.product_id === p.id);
        const likes = productInteractions.filter(i => i.action_type === 'like').length;
        const dislikes = productInteractions.filter(i => i.action_type === 'dislike').length;
        const addToCarts = productInteractions.filter(i => i.action_type === 'add_to_cart').length;
        const purchases = purchaseCounts[p.id] || 0;
        return { ...p, likes, dislikes, addToCarts, purchases };
    });

    const topLiked = [...productStats].sort((a, b) => b.likes - a.likes).slice(0, 15);
    const topDisliked = [...productStats].sort((a, b) => b.dislikes - a.dislikes).slice(0, 15);
    const topAddedToCart = [...productStats].sort((a, b) => b.addToCarts - a.addToCarts).slice(0, 15);
    const topPurchased = [...productStats].sort((a, b) => b.purchases - a.purchases).slice(0, 15);

    return {
      topLiked,
      topDisliked,
      topAddedToCart,
      topPurchased,
    };
  }, [interactions, productDetails, purchaseCounts]);

  if (isLoading) {
    return <div className="text-center p-8">Loading product performance...</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="text-2xl font-bold text-white mb-6">Product Performance</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div>
            <h3 className="text-lg font-semibold text-primary mb-2">Most Liked</h3>
            <div className="space-y-4">
              {analytics?.topLiked.map((p: any) => (
                  <ProductCard key={p.id} product={p} metric="Likes" value={p.likes} seller={sellerDetails[p.seller_id]} />
              ))}
            </div>
        </div>
        <div>
            <h3 className="text-lg font-semibold text-primary mb-2">Most Disliked</h3>
            <div className="space-y-4">
              {analytics?.topDisliked.map((p: any) => (
                  <ProductCard key={p.id} product={p} metric="Dislikes" value={p.dislikes} seller={sellerDetails[p.seller_id]} />
              ))}
            </div>
        </div>
        <div>
            <h3 className="text-lg font-semibold text-primary mb-2">Most Added to Cart</h3>
            <div className="space-y-4">
              {analytics?.topAddedToCart.map((p: any) => (
                  <ProductCard key={p.id} product={p} metric="Carts" value={p.addToCarts} seller={sellerDetails[p.seller_id]} />
              ))}
            </div>
        </div>
        <div>
            <h3 className="text-lg font-semibold text-primary mb-2">Most Purchased</h3>
            <div className="space-y-4">
              {analytics?.topPurchased.map((p: any) => (
                  <ProductCard key={p.id} product={p} metric="Purchases" value={p.purchases} seller={sellerDetails[p.seller_id]} />
              ))}
            </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductPerformance;
