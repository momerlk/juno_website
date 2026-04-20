import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Layers, Plus, Image as ImageIcon, Zap } from 'lucide-react';
import { AdminCatalog } from '../../api/catalogApi';

interface CreateCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateCollectionModal: React.FC<CreateCollectionModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    image_url: '',
    is_active: true,
    priority: 0
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const resp = await AdminCatalog.createCollection(formData);
      if (resp.ok) {
        onSuccess();
        onClose();
      } else {
        const err = resp.body as any;
        setError(err.message || 'Failed to create collection');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[100] flex justify-center items-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="glass-panel w-full max-w-2xl border-white/10"
        >
          <header className="flex justify-between items-center p-6 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-primary/20 rounded-2xl text-primary">
                <Layers size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-black uppercase tracking-tight text-white">Create Collection</h2>
                <p className="text-xs font-mono uppercase tracking-widest text-white/40">Curate Platform Aesthetic</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl text-white/40 hover:text-white transition-colors">
              <X size={24} />
            </button>
          </header>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm font-medium">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-widest text-white/40 ml-1">Collection Title</label>
                <input
                  required
                  type="text"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Minimalist Eastern"
                  className="w-full bg-white/[0.03] border border-white/5 rounded-2xl p-4 text-sm focus:border-primary/50 transition-colors"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-widest text-white/40 ml-1">Slug</label>
                <input
                  required
                  type="text"
                  value={formData.slug}
                  onChange={e => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                  placeholder="minimalist-eastern"
                  className="w-full bg-white/[0.03] border border-white/5 rounded-2xl p-4 text-sm font-mono focus:border-primary/50 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-widest text-white/40 ml-1">Description</label>
              <textarea
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the collection's theme..."
                className="w-full bg-white/[0.03] border border-white/5 rounded-2xl p-4 text-sm min-h-[100px] focus:border-primary/50 transition-colors resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-widest text-white/40 ml-1">Cover Image URL</label>
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                  <input
                    type="url"
                    value={formData.image_url}
                    onChange={e => setFormData({ ...formData, image_url: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full bg-white/[0.03] border border-white/5 rounded-2xl p-4 pl-12 text-sm focus:border-primary/50 transition-colors"
                  />
                </div>
                {formData.image_url && (
                  <div className="w-14 h-14 rounded-xl overflow-hidden border border-white/10 bg-white/5">
                    <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5">
              <div className="flex items-center gap-3">
                <div className="text-sm font-bold text-white uppercase tracking-tight">Active Status</div>
                <p className="text-[10px] text-white/30 uppercase tracking-widest">Visible on platform</p>
              </div>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                className={`w-12 h-6 rounded-full transition-colors relative ${formData.is_active ? 'bg-primary' : 'bg-white/10'}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${formData.is_active ? 'left-7' : 'left-1'}`} />
              </button>
            </div>

            <footer className="flex justify-end gap-4 pt-4 border-t border-white/5">
              <button
                type="button"
                onClick={onClose}
                className="px-8 py-4 rounded-2xl bg-white/5 text-white/60 font-black uppercase tracking-widest hover:bg-white/10 transition-all"
              >
                Cancel
              </button>
              <button
                disabled={isLoading}
                type="submit"
                className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-primary text-white font-black uppercase tracking-widest shadow-glow-primary hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? <Zap size={18} className="animate-spin" /> : <Plus size={18} />}
                {isLoading ? 'Creating...' : 'Create Collection'}
              </button>
            </footer>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default CreateCollectionModal;
