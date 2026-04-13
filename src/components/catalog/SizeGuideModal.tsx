import React from 'react';
import { motion } from 'framer-motion';
import { X, Ruler } from 'lucide-react';

interface SizeGuideModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const SizeGuideModal: React.FC<SizeGuideModalProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-[2rem] border border-white/10 bg-[#0A0A0A] p-6 md:p-8 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/10"
            >
                {/* Header */}
                <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Ruler size={20} className="text-primary" />
                        <h2 className="text-lg font-black uppercase tracking-[-0.02em]">Size Guide</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-full border border-white/10 p-2 text-white/60 transition-colors hover:bg-white/5 hover:text-white"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="space-y-6">
                    {/* General Guide */}
                    <div>
                        <h3 className="mb-3 text-sm font-bold uppercase tracking-[0.16em] text-white/70">
                            Tops & Dresses
                        </h3>
                        <div className="overflow-hidden rounded-[1.2rem] border border-white/10">
                            <table className="w-full text-sm">
                                <thead className="bg-white/[0.04]">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.16em] text-white/60">
                                            Size
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.16em] text-white/60">
                                            Chest (inches)
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.16em] text-white/60">
                                            Length (inches)
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    <tr>
                                        <td className="px-4 py-3 font-bold text-white">XS</td>
                                        <td className="px-4 py-3 text-white/80">30-32</td>
                                        <td className="px-4 py-3 text-white/80">24-26</td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-3 font-bold text-white">S</td>
                                        <td className="px-4 py-3 text-white/80">32-34</td>
                                        <td className="px-4 py-3 text-white/80">26-28</td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-3 font-bold text-white">M</td>
                                        <td className="px-4 py-3 text-white/80">34-36</td>
                                        <td className="px-4 py-3 text-white/80">28-30</td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-3 font-bold text-white">L</td>
                                        <td className="px-4 py-3 text-white/80">36-38</td>
                                        <td className="px-4 py-3 text-white/80">30-32</td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-3 font-bold text-white">XL</td>
                                        <td className="px-4 py-3 text-white/80">38-40</td>
                                        <td className="px-4 py-3 text-white/80">32-34</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Bottoms Guide */}
                    <div>
                        <h3 className="mb-3 text-sm font-bold uppercase tracking-[0.16em] text-white/70">
                            Bottoms
                        </h3>
                        <div className="overflow-hidden rounded-[1.2rem] border border-white/10">
                            <table className="w-full text-sm">
                                <thead className="bg-white/[0.04]">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.16em] text-white/60">
                                            Size
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.16em] text-white/60">
                                            Waist (inches)
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.16em] text-white/60">
                                            Hips (inches)
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    <tr>
                                        <td className="px-4 py-3 font-bold text-white">XS</td>
                                        <td className="px-4 py-3 text-white/80">24-26</td>
                                        <td className="px-4 py-3 text-white/80">34-36</td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-3 font-bold text-white">S</td>
                                        <td className="px-4 py-3 text-white/80">26-28</td>
                                        <td className="px-4 py-3 text-white/80">36-38</td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-3 font-bold text-white">M</td>
                                        <td className="px-4 py-3 text-white/80">28-30</td>
                                        <td className="px-4 py-3 text-white/80">38-40</td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-3 font-bold text-white">L</td>
                                        <td className="px-4 py-3 text-white/80">30-32</td>
                                        <td className="px-4 py-3 text-white/80">40-42</td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-3 font-bold text-white">XL</td>
                                        <td className="px-4 py-3 text-white/80">32-34</td>
                                        <td className="px-4 py-3 text-white/80">42-44</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Tips */}
                    <div className="rounded-[1.2rem] border border-primary/30 bg-primary/10 p-4">
                        <h4 className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-primary">
                            Fitting Tips
                        </h4>
                        <ul className="space-y-1 text-sm text-white/70">
                            <li>• Measure yourself while wearing light undergarments</li>
                            <li>• For a relaxed fit, size up from your usual size</li>
                            <li>• For a fitted look, choose your exact measurements</li>
                            <li>• When in between sizes, we recommend sizing up</li>
                        </ul>
                    </div>

                    <p className="text-center text-xs text-white/40">
                        Note: Measurements may vary slightly between brands. For brand-specific sizing,
                        please check the product description.
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default SizeGuideModal;
