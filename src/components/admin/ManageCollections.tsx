import React, { useState, useEffect } from 'react';
import { Layers, Plus, Search, RefreshCw, AlertCircle, Trash2 } from 'lucide-react';
import { AdminCatalog } from '../../api/catalogApi';
import { Collection } from '../../api/api.types';

const ManageCollections: React.FC = () => {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchCollections = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Note: The AdminCatalog namespace currently doesn't have a listCollections, 
      // but the public Catalog namespace does. However, usually admins use the same or a specific one.
      // Looking at catalogApi.ts, getCollections is in the Catalog namespace.
      // AdminCatalog has create/update/delete.
      const { Catalog } = await import('../../api/catalogApi');
      const resp = await Catalog.getCollections();
      
      if (resp.ok && Array.isArray(resp.body)) {
        setCollections(resp.body);
      } else {
        setError('Failed to fetch collections from backend.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCollections();
  }, []);

  const filteredCollections = collections.filter(c => 
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRemoveProductFromCollection = async (collectionId: string) => {
    const productID = window.prompt('Enter Product ID to remove from this collection:');
    if (!productID || !productID.trim()) return;
    try {
      const response = await AdminCatalog.removeProductFromCollection(collectionId, productID.trim());
      if (!response.ok) {
        const message = typeof response.body === 'object' && response.body && 'message' in response.body
          ? String((response.body as any).message)
          : 'Failed to remove product from collection.';
        throw new Error(message);
      }
      await fetchCollections();
      window.alert('Product removed from collection.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to remove product from collection.';
      window.alert(message);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm font-mono uppercase tracking-widest text-white/40">Loading Collections...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-[2rem] border border-red-500/20 bg-red-500/5 p-8 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
        <h3 className="text-lg font-bold text-white">Catalog Integration Error</h3>
        <p className="mt-2 text-sm text-red-200/80 max-w-md mx-auto">{error}</p>
        <button onClick={fetchCollections} className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-6 py-3 text-xs font-bold uppercase tracking-widest text-white hover:bg-white/10 transition-all">
          <RefreshCw size={14} /> Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight text-white">Collections</h1>
          <p className="text-white/40 font-mono text-xs uppercase tracking-[0.2em] mt-1">Curation & Visual Merchandising</p>
        </div>
        <button className="flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-black uppercase tracking-widest text-white transition-all hover:bg-primary-dark hover:scale-[1.02] shadow-glow-primary">
          <Plus size={18} />
          Create Collection
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/20" size={18} />
        <input 
          type="text" 
          placeholder="Search collections..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:border-primary/50 transition-colors text-white"
        />
      </div>

      {filteredCollections.length === 0 ? (
        <div className="glass-panel p-12 border-white/5 bg-white/[0.02] text-center">
          <Layers className="mx-auto h-12 w-12 text-white/10 mb-4" />
          <p className="text-white/30 font-mono uppercase tracking-widest text-sm">No collections found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCollections.map((col) => (
            <div key={col.id} className="group relative overflow-hidden rounded-[2rem] border border-white/5 bg-white/[0.02] transition-all hover:border-white/10">
              <div className="aspect-[16/10] overflow-hidden bg-white/5">
                {col.image_url ? (
                  <img src={col.image_url} alt={col.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110 opacity-60 group-hover:opacity-100" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-white/10">
                    <Layers size={48} />
                  </div>
                )}
              </div>
              <div className="p-6">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-black uppercase tracking-tight text-white">{col.title}</h3>
                  <span className={`text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full border ${col.is_active ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-white/5 text-white/40 border-white/10'}`}>
                    {col.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-4">
                  <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-white/30">{col.product_ids?.length || 0} Items</p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleRemoveProductFromCollection(col.id)}
                      className="inline-flex items-center gap-1 rounded-lg border border-red-500/20 bg-red-500/10 px-2 py-1 text-[10px] font-mono uppercase tracking-widest text-red-300 transition-colors hover:bg-red-500/20"
                    >
                      <Trash2 size={11} />
                      Remove Product
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ManageCollections;
