import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Search, ExternalLink, User, Building, Clock, Heart, Star, X, RefreshCw } from 'lucide-react';
import { getChapterForms } from '../../api/adminApi';

const ChapterForms: React.FC = () => {
  const [forms, setForms] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedForm, setSelectedForm] = useState<any | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getChapterForms();
      if (response.ok) {
        const body = Array.isArray(response.body)
          ? response.body
          : response.body?.data || [];
        setForms(body.reverse());
      } else {
        setError('Failed to fetch chapter forms.');
      }
    } catch {
      setError('An error occurred while fetching data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredForms = useMemo(() => {
    if (!searchTerm) return forms;
    const s = searchTerm.toLowerCase();
    return forms.filter(f =>
      (f.name || '').toLowerCase().includes(s) ||
      (f.institute || '').toLowerCase().includes(s) ||
      (f.role || '').toLowerCase().includes(s) ||
      (f.phone || '').toLowerCase().includes(s)
    );
  }, [forms, searchTerm]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass-panel p-10 mt-6 w-full"
    >
      <div className="flex flex-col xl:flex-row justify-between items-center mb-10 gap-8">
        <div className="flex items-center">
          <div className="p-4 bg-primary/20 rounded-2xl mr-5">
            <FileText size={40} className="text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white uppercase">
              Chapter Submissions
            </h2>
            <p className="text-neutral-400 text-sm mt-1">
              Total Applications: {forms.length}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-5 w-full xl:w-auto">
          <div className="relative flex-grow xl:w-[500px]">
            <Search
              className="absolute left-5 top-1/2 -translate-y-1/2 text-neutral-400"
              size={28}
            />
            <input
              type="text"
              placeholder="Search by name, institute..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="glass-input w-full pl-12 py-3 text-sm text-white"
            />
          </div>
          <button
            onClick={fetchData}
            className="p-5 glass-button rounded-2xl hover:bg-white/10"
          >
            <RefreshCw size={28} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-40 text-neutral-400 text-3xl font-black flex flex-col items-center gap-6 uppercase tracking-widest">
          <RefreshCw size={64} className="animate-spin text-primary" />
          Syncing...
        </div>
      ) : error ? (
        <div className="text-center py-32 text-red-400 text-2xl font-bold">
          {error}
        </div>
      ) : forms.length === 0 ? (
        <div className="text-center py-40 text-neutral-400 text-2xl font-bold bg-white/5 rounded-[40px] border border-white/5 uppercase tracking-widest">
          No records found.
        </div>
      ) : filteredForms.length === 0 ? (
        <div className="text-center py-40 text-neutral-400 text-2xl italic bg-white/5 rounded-[40px] border border-white/5 font-medium">
          No matches found for "{searchTerm}"
        </div>
      ) : (
        <div className="overflow-x-auto rounded-[32px] border border-white/10 shadow-2xl">
          <table className="w-full text-left border-collapse min-w-[1200px]">
            <thead>
              <tr className="bg-white/5 text-neutral-400 text-xs uppercase tracking-wider font-semibold">
                <th className="p-8">Candidate</th>
                <th className="p-8">Institution</th>
                <th className="p-8">Roles</th>
                <th className="p-8">Interests</th>
                <th className="p-8 w-48">Commitment</th>
                <th className="p-8 w-40 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="text-xl">
              {filteredForms.map((form, index) => (
                <tr
                  key={index}
                  className="border-b border-white/5 hover:bg-white/10 transition-all group"
                >
                  <td className="p-8">
                    <div className="flex flex-col gap-1.5">
                      <span className="text-white font-black text-lg group-hover:text-primary">
                        {form.name || 'N/A'}
                      </span>
                      <span className="text-xs text-neutral-400 font-bold">
                        {form.gender} • {form.phone}
                      </span>
                    </div>
                  </td>

                  <td className="p-8">
                    <div className="flex flex-col gap-1.5">
                      <span className="text-white font-medium">
                        {form.institute || 'N/A'}
                      </span>
                      <span className="text-base text-neutral-500 font-black uppercase tracking-widest">
                        {form.year} Year
                      </span>
                    </div>
                  </td>

                  <td className="p-8">
                    <div className="flex flex-wrap gap-2.5 max-w-sm">
                      {form.role?.split(',').map((r: string, i: number) => (
                        <span
                          key={i}
                          className="bg-primary/10 text-primary px-4 py-1.5 rounded-xl text-sm font-black border border-primary/20 uppercase"
                        >
                          {r.trim()}
                        </span>
                      ))}
                    </div>
                  </td>

                  <td className="p-8">
                    <div className="flex flex-col gap-3 font-black text-sm">
                      <span className="bg-blue-500/10 text-blue-400 px-3 py-1.5 rounded-xl border border-blue-500/20 w-fit">
                        TECH: {form.tech_interest}/10
                      </span>
                      <span className="bg-pink-500/10 text-pink-400 px-3 py-1.5 rounded-xl border border-pink-500/20 w-fit">
                        FASHION: {form.fashion_interest}/10
                      </span>
                    </div>
                  </td>

                  <td className="p-8 text-white font-black">
                    {form.commitment_hours}
                  </td>

                  <td className="p-8">
                    <div className="flex items-center justify-center gap-4">
                      <button
                        onClick={() => setSelectedForm(form)}
                        className="p-4 text-primary bg-primary/10 hover:bg-primary/20 rounded-[20px]"
                      >
                        <ExternalLink size={32} />
                      </button>
                      {form.experience_link && (
                        <a
                          href={form.experience_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-4 text-neutral-400 bg-white/5 hover:text-white hover:bg-white/10 rounded-[20px]"
                        >
                          <User size={32} />
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AnimatePresence>
        {selectedForm && (
          <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="glass-panel w-full max-w-6xl max-h-[90vh] overflow-y-auto"
            >
              <div className="sticky top-0 p-10 flex justify-between items-center">
                <h3 className="text-4xl font-black text-white uppercase">
                  Application Master Profile
                </h3>
                <button onClick={() => setSelectedForm(null)}>
                  <X size={48} />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ChapterForms;