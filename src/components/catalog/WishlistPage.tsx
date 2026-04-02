import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, ArrowLeft, ShoppingBag } from 'lucide-react';
import { Catalog, type CatalogProduct } from '../../api/api';
import ProductCard from './ProductCard';

const WishlistPage: React.FC = () => {
    const [wishlistItems, setWishlistItems] = useState<CatalogProduct[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadWishlist = async () => {
            setIsLoading(true);
            setError(null);

            const wishlistIds = JSON.parse(localStorage.getItem('juno_wishlist') || '[]');

            if (wishlistIds.length === 0) {
                setWishlistItems([]);
                setIsLoading(false);
                return;
            }

            try {
                // Fetch all wishlist items
                const products = await Promise.all(
                    wishlistIds.map(async (id: string) => {
                        const response = await Catalog.getProduct(id);
                        return response.ok ? response.body : null;
                    })
                );

                setWishlistItems(products.filter((p): p is CatalogProduct => p !== null));
            } catch {
                setError('Failed to load wishlist items');
            } finally {
                setIsLoading(false);
            }
        };

        loadWishlist();
    }, []);

    const removeFromWishlist = (productId: string) => {
        const wishlist = JSON.parse(localStorage.getItem('juno_wishlist') || '[]');
        const updated = wishlist.filter((id: string) => id !== productId);
        localStorage.setItem('juno_wishlist', JSON.stringify(updated));
        setWishlistItems((prev) => prev.filter((item) => item.id !== productId));
    };

    return (
        <div className="min-h-screen bg-background pb-20 pt-24 text-white">
            <div className="container mx-auto max-w-7xl px-4">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <Link
                        to="/catalog"
                        className="mb-4 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-white/60 transition-colors hover:text-white"
                    >
                        <ArrowLeft size={14} />
                        Back to Catalog
                    </Link>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-primary to-secondary">
                                <Heart size={24} className="text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-black uppercase tracking-[-0.04em] text-white md:text-4xl">
                                    Wishlist
                                </h1>
                                <p className="text-sm text-white/60">
                                    {wishlistItems.length} saved item{wishlistItems.length !== 1 ? 's' : ''}
                                </p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Content */}
                {isLoading ? (
                    <div className="flex min-h-[400px] items-center justify-center">
                        <div className="text-center">
                            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                            <p className="text-sm font-bold uppercase tracking-[0.2em] text-white/60">
                                Loading wishlist...
                            </p>
                        </div>
                    </div>
                ) : error ? (
                    <div className="rounded-[2rem] border border-red-500/20 bg-red-500/5 p-8 text-center">
                        <p className="text-xl font-bold text-white">Couldn't load wishlist</p>
                        <p className="mt-2 text-sm text-red-100/80">{error}</p>
                    </div>
                ) : wishlistItems.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-10 text-center"
                    >
                        <Heart size={64} className="mx-auto mb-4 text-white/20" />
                        <p className="text-xl font-bold text-white">Your wishlist is empty</p>
                        <p className="mt-2 text-sm text-white/60">
                            Save products you love to find them here later
                        </p>
                        <Link
                            to="/catalog"
                            className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-secondary px-6 py-3 text-xs font-bold uppercase tracking-[0.2em] text-white"
                        >
                            <ShoppingBag size={16} />
                            Explore Catalog
                        </Link>
                    </motion.div>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {wishlistItems.map((product, index) => (
                            <div key={product.id} className="relative">
                                <ProductCard product={product} index={index} />
                                <button
                                    onClick={() => removeFromWishlist(product.id)}
                                    className="absolute -right-2 -top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-red-500 text-white shadow-lg transition-transform hover:scale-110"
                                    aria-label="Remove from wishlist"
                                >
                                    <Heart size={14} className="fill-white" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default WishlistPage;
