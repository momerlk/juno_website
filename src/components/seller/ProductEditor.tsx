import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Product, Variant, Option, Pricing, SizingGuide, Inventory } from '../../constants/types';
import * as api from '../../api/sellerApi';
import { useSellerAuth } from '../../contexts/SellerAuthContext';
import { X, Plus, Trash2, Upload, DollarSign, Type, Tag, Image as ImageIcon, Paperclip, Settings2, Ruler, ArrowLeft, ArrowRight, Video, Loader } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SizingGuideEditor from './SizingGuideEditor';
import { productTypes, apparelTypes, productTypeToSizingGuide } from '../../constants/sizing';

interface ProductEditorProps {
    product: Product | null;
    onClose: () => void;
}

const getShopifyThumbnail = (url: string, size: string = '100x100') => {
    if (!url || typeof url !== 'string' || !url.includes("shopify.com")) return url || 'https://via.placeholder.com/100';
    try {
        const parts = url.split('?');
        const path = parts[0];
        const query = parts[1] ? `?${parts[1]}` : '';
        const lastDotIndex = path.lastIndexOf('.');
        if (lastDotIndex === -1) return url;
        
        const pathWithoutExt = path.substring(0, lastDotIndex);
        const ext = path.substring(lastDotIndex);
        
        return `${pathWithoutExt}_${size}${ext}${query}`;
    } catch (e) {
        return url;
    }
};

const Section: React.FC<{title: string, icon: React.ReactNode, children: React.ReactNode}> = ({ title, icon, children }) => (
    <div className="glass-panel p-6 bg-white/5 border border-white/5">
        <div className="flex items-center mb-4">
            <div className="p-2 bg-white/5 rounded-lg mr-3">
                {icon}
            </div>
            <h3 className="text-lg font-semibold text-white">{title}</h3>
        </div>
        <div className="space-y-4">{children}</div>
    </div>
);

const generateHandle = (title: string, brand: string): string => {
  if (!title || !brand) return '';
  const combined = `${brand} ${title}`;
  return combined
    .toLowerCase()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w\-]+/g, '')        // Remove all non-word chars
    .replace(/--+/g, '-')           // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start of text
    .replace(/-+$/, '');            // Trim - from end of text
};


const ProductEditor: React.FC<ProductEditorProps> = ({ product, onClose }) => {
    const { seller } = useSellerAuth();
    const [formData, setFormData] = useState<Partial<Product>>({});
    const [isSaving, setIsSaving] = useState(false);
    const [uploadingMedia, setUploadingMedia] = useState<'image' | 'video' | null>(null);

    useEffect(() => {
        const defaultProductState: Partial<Product> = {
            title: '',
            description: '',
            product_type: '',
            pricing: { price: 0, currency: 'PKR', discounted: false },
            options: [],
            variants: [],
            images: [],
            video_url: '',
            tags: [],
            sizing_guide: { size_chart: {}, size_fit: '', measurement_unit: 'inch' },
            inventory: { quantity: 0, in_stock: false }
        };
        
        const initialState = product 
            ? { ...defaultProductState, ...product }
            : defaultProductState;

        setFormData(initialState);
    }, [product]);

    const generateVariantCombinations = useCallback((options: Option[] = []) => {
        if (options.length === 0 || options.every(o => o.values.length === 0)) return [];
        
        const combinations: Record<string, string>[] = [];
        const generate = (index: number, current: Record<string, string>) => {
            if (index === options.length) {
                if (Object.keys(current).length > 0) combinations.push(current);
                return;
            }
            const option = options[index];
            if (option.values.length === 0) {
                generate(index + 1, current);
            } else {
                option.values.forEach(value => {
                    generate(index + 1, { ...current, [option.name]: value });
                });
            }
        };
        generate(0, {});
        return combinations;
    }, []);

    useEffect(() => {
        const newCombinations = generateVariantCombinations(formData.options);
        
        const newVariants = newCombinations.map((combo, index) => {
            const title = Object.values(combo).join(' / ');
            const existingVariant = formData.variants?.find(v => v.title === title);
            return {
                id: existingVariant?.id || `new_${Date.now()}_${index}`,
                title,
                options: combo,
                price: existingVariant?.price || formData.pricing?.price || 0,
                inventory: existingVariant?.inventory || { quantity: 0 },
                sku: existingVariant?.sku || '',
                available: existingVariant?.available ?? true,
                is_default: existingVariant?.is_default ?? (index === 0),
                position: index,
            } as Variant;
        });

        if (newVariants.length > 0 || (formData.options || []).length > 0) {
            setFormData(p => ({...p, variants: newVariants}));
        }

    }, [formData.options, formData.pricing?.price]);

    useEffect(() => {
        const totalInventory = (formData.variants || []).reduce((sum, variant) => sum + (variant.inventory?.quantity || 0), 0);
        setFormData(prev => ({
            ...prev,
            inventory: {
                ...(prev.inventory || {}),
                quantity: totalInventory,
                in_stock: totalInventory > 0,
            } as Inventory,
        }));
    }, [formData.variants]);


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handlePricingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        const val = type === 'checkbox' ? checked : parseFloat(value);
        setFormData(prev => ({ ...prev, pricing: { ...prev.pricing, [name]: val } as Pricing }));
    };

    const handleMediaUpload = async (file: File, mediaType: 'image' | 'video') => {
        if (file) {
            setUploadingMedia(mediaType);
            try {
                const url = await api.uploadFileAndGetUrl(file, "high_quality");
                if (mediaType === 'image') {
                    setFormData(prev => ({ ...prev, images: [...(prev.images || []), url] }));
                } else {
                    setFormData(prev => ({ ...prev, video_url: url }));
                }
            } catch (error) {
                console.error("Upload failed:", error);
                alert("File upload failed. Please try again.");
            } finally {
                setUploadingMedia(null);
            }
        }
    };

    const handleRemoveImage = (index: number) => {
        setFormData(prev => ({ ...prev, images: prev.images?.filter((_, i) => i !== index) }));
    };

    const handleReorderImage = (index: number, direction: 'left' | 'right') => {
        const newImages = [...(formData.images || [])];
        const newIndex = direction === 'left' ? index - 1 : index + 1;
        if (newIndex >= 0 && newIndex < newImages.length) {
            [newImages[index], newImages[newIndex]] = [newImages[newIndex], newImages[index]];
            setFormData(prev => ({ ...prev, images: newImages }));
        }
    };

    const handleOptionChange = (index: number, name: string) => {
        const newOptions = [...(formData.options || [])];
        newOptions[index].name = name;
        setFormData(prev => ({ ...prev, options: newOptions }));
    };

    const handleOptionValueChange = (optionIndex: number, values: string[]) => {
        const newOptions = [...(formData.options || [])];
        newOptions[optionIndex].values = values;
        setFormData(prev => ({ ...prev, options: newOptions }));
    };

    const addOption = () => {
        setFormData(prev => ({ ...prev, options: [...(prev.options || []), { name: '', values: [], required: true }] }));
    };

    const removeOption = (index: number) => {
        setFormData(prev => ({ ...prev, options: prev.options?.filter((_, i) => i !== index) }));
    };

    const handleVariantChange = (variantId: string, field: 'price' | 'quantity', value: string) => {
        const numericValue = parseFloat(value);
        if (isNaN(numericValue) || numericValue < 0) return;

        const newVariants = formData.variants?.map(v => {
            if (v.id === variantId) {
                if (field === 'quantity') {
                    return { ...v, inventory: { ...v.inventory, quantity: numericValue } };
                }
                return { ...v, [field]: numericValue };
            }
            return v;
        });
        setFormData(prev => ({ ...prev, variants: newVariants }));
    };

    const handleTagChange = (newTags: string[]) => {
        setFormData(prev => ({ ...prev, tags: newTags }));
    };

    const handleGenderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newGender = e.target.value;
        const otherTags = formData.tags?.filter(t => !['male', 'female', 'unisex'].includes(t.toLowerCase())) || [];
        if (newGender) {
            setFormData(prev => ({ ...prev, tags: [...otherTags, newGender] }));
        } else {
            setFormData(prev => ({ ...prev, tags: otherTags }));
        }
    };

    const handleSizingGuideUpdate = (newGuide: SizingGuide) => {
        setFormData(prev => ({ ...prev, sizing_guide: newGuide }));
    };

    const sizeOptionValues = useMemo(() => {
        return formData.options?.find(opt => opt.name.toLowerCase() === 'size')?.values || [];
    }, [formData.options]);

    const runValidations = () => {
        const issues = [];
        if (!formData.title?.trim()) issues.push("Title is missing.");
        if (!formData.description?.trim()) issues.push("Description is missing.");
        if (!formData.product_type?.trim()) issues.push("Product Type is missing.");
        if ((formData.pricing?.price || 0) <= 0) issues.push("Price must be greater than 0.");
        if (!formData.images || formData.images.length === 0) issues.push("At least one image is required.");
        
        const hasGenderTag = formData.tags?.some(t => ['male', 'female', 'unisex'].includes(t.toLowerCase()));
        if (!hasGenderTag) issues.push("Gender tag (male, female, or unisex) is required.");
        
        const isApparel = apparelTypes.includes(formData.product_type || '');
        if (isApparel) {
             const guideType = productTypeToSizingGuide[formData.product_type || ''];
            if (!guideType) issues.push("Sizing guide type is required for apparel.");
            if (!formData.sizing_guide?.size_fit?.trim()) issues.push("Sizing & Fit Details are required for apparel.");
            if (sizeOptionValues.length > 0 && (!formData.sizing_guide?.size_chart || Object.keys(formData.sizing_guide.size_chart).length === 0)) {
                issues.push("Size chart measurements are required when 'Size' option is present.");
            }
        }
        
        if (formData.variants && formData.variants.length > 0) {
            const totalStock = formData.variants.reduce((acc, v) => acc + (v.inventory?.quantity || 0), 0);
            if (totalStock <= 0) {
                issues.push("Total stock for all variants cannot be zero.");
            }
        }

        if (issues.length > 0) {
            alert(`Please resolve the following issues:\n- ${issues.join("\n- ")}`);
            return false;
        }
        return true;
    };

    const prepareSubmitData = (): Product => {
        const finalData = { ...formData };
        
        const totalInventory = (finalData.variants || []).reduce((sum, variant) => sum + (variant.inventory?.quantity || 0), 0);
        finalData.inventory = {
            ...finalData.inventory,
            quantity: totalInventory,
            in_stock: totalInventory > 0,
        };

        if (!apparelTypes.includes(finalData.product_type || '')) {
            finalData.sizing_guide = undefined;
        }

        return finalData as Product;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!runValidations()) return;
        if (!seller?.token) return;

        setIsSaving(true);
        try {
            const payload = prepareSubmitData();
            
            let response;
            if (product && product.id) {
                response = await api.Seller.UpdateProduct(seller.token, { ...payload, id: product.id });
            } else {
                const createPayload = {
                    ...payload,
                    handle: generateHandle(payload.title || '', seller?.user?.business_name || ''),
                    status: 'active',
                    seller_name: seller?.user?.business_name,
                    seller_logo: seller?.user?.logo_url,
                };
                response = await api.Seller.CreateProduct(seller.token, createPayload as Product);
            }

            if (response.ok) {
                alert(`Product ${product ? 'updated' : 'created'} successfully!`);
                onClose();
            } else {
                alert(`Failed to save product: ${response.body?.message || 'Unknown error'}`);
            }
        } catch (err) {
            alert('An error occurred while saving the product.');
        } finally {
            setIsSaving(false);
        }
    };

    const currentGender = useMemo(() => formData.tags?.find(t => ['male', 'female', 'unisex'].includes(t.toLowerCase())) || '', [formData.tags]);
    const isApparel = useMemo(() => apparelTypes.includes(formData.product_type || ''), [formData.product_type]);

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex justify-center items-center p-4">
            <motion.div 
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 50, opacity: 0 }}
                className="glass-panel shadow-2xl bg-black/60 w-full max-w-5xl max-h-[95vh] flex flex-col border border-white/10"
            >
                <div className="flex justify-between items-center p-6 border-b border-white/10 flex-shrink-0">
                    <h2 className="text-2xl font-bold text-white">{product ? 'Edit Product' : 'Create Product'}</h2>
                    <button onClick={onClose} className="text-neutral-400 hover:text-white transition-colors"><X /></button>
                </div>
                <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto p-6 space-y-6">
                    <Section title="Basic Information" icon={<Paperclip className="text-primary" />}>
                        <div>
                            <label htmlFor="title" className="block text-sm font-medium text-neutral-300">Title</label>
                            <input type="text" name="title" id="title" value={formData.title || ''} onChange={handleChange} className="glass-input w-full mt-1" required />
                        </div>
                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-neutral-300">Description</label>
                            <textarea name="description" id="description" value={formData.description || ''} onChange={handleChange} className="glass-input w-full mt-1 h-24" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="product_type" className="block text-sm font-medium text-neutral-300">Product Type</label>
                                <select name="product_type" id="product_type" value={formData.product_type || ''} onChange={handleChange} className="glass-input w-full mt-1" required>
                                    <option value="" className="bg-neutral-900">Select a type</option>
                                    {productTypes.map(type => <option key={type} value={type} className="bg-neutral-900">{type}</option>)}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="gender" className="block text-sm font-medium text-neutral-300">Gender</label>
                                <select id="gender" value={currentGender} onChange={handleGenderChange} className="glass-input w-full mt-1" required>
                                    <option value="" className="bg-neutral-900">Select gender</option>
                                    <option value="male" className="bg-neutral-900">Male</option>
                                    <option value="female" className="bg-neutral-900">Female</option>
                                    <option value="unisex" className="bg-neutral-900">Unisex</option>
                                </select>
                            </div>
                        </div>
                    </Section>

                    <Section title="Media" icon={<ImageIcon className="text-blue-500" />}>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-neutral-300 mb-2">Images</label>
                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
                                    <AnimatePresence>
                                        {formData.images?.map((url, index) => (
                                            <motion.div layout key={url} className="relative group">
                                                <img src={getShopifyThumbnail(url)} loading="lazy" alt={`Product image ${index + 1}`} className="w-full h-24 object-cover rounded-xl border border-white/10" />
                                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex justify-center items-center gap-1 rounded-xl">
                                                    <button type="button" onClick={() => handleReorderImage(index, 'left')} className="text-white p-1 rounded-full bg-black/50 hover:bg-black/80 disabled:opacity-50" disabled={index === 0}><ArrowLeft size={14} className="drop-shadow-lg" /></button>
                                                    <button type="button" onClick={() => handleRemoveImage(index)} className="text-white p-1 rounded-full bg-red-500/80 hover:bg-red-500"><Trash2 size={14} className="drop-shadow-lg" /></button>
                                                    <button type="button" onClick={() => handleReorderImage(index, 'right')} className="text-white p-1 rounded-full bg-black/50 hover:bg-black/80 disabled:opacity-50" disabled={index === (formData.images?.length || 0) - 1}><ArrowRight size={14} className="drop-shadow-lg" /></button>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                    <label htmlFor="image-upload" className={`w-full h-24 border-2 border-dashed border-white/10 bg-white/5 rounded-xl flex flex-col justify-center items-center text-neutral-400 transition-colors ${uploadingMedia ? 'cursor-not-allowed' : 'cursor-pointer hover:border-primary/50 hover:bg-primary/5 hover:text-primary'}`}>
                                        {uploadingMedia === 'image' ? (
                                            <>
                                                <Loader className="animate-spin" size={24} />
                                                <span className="text-xs mt-1">Uploading...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Upload size={24} />
                                                <span className="text-xs mt-1">Upload</span>
                                            </>
                                        )}
                                        <input id="image-upload" type="file" accept="image/*" onChange={(e) => e.target.files && handleMediaUpload(e.target.files[0], 'image')} className="hidden" disabled={uploadingMedia !== null} />
                                    </label>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-300 mb-2">Video</label>
                                {formData.video_url ? (
                                    <div className="relative group w-48">
                                        <video src={formData.video_url} className="w-full h-24 object-cover rounded-xl bg-black border border-white/10" />
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex justify-center items-center rounded-xl">
                                            <button type="button" onClick={() => setFormData(p => ({...p, video_url: ''}))} className="text-white p-1 rounded-full bg-red-500/80 hover:bg-red-500"><Trash2 size={14} className="drop-shadow-lg" /></button>
                                        </div>
                                    </div>
                                ) : (
                                    <label htmlFor="video-upload" className={`w-48 h-24 border-2 border-dashed border-white/10 bg-white/5 rounded-xl flex flex-col justify-center items-center text-neutral-400 transition-colors ${uploadingMedia ? 'cursor-not-allowed' : 'cursor-pointer hover:border-primary/50 hover:bg-primary/5 hover:text-primary'}`}>
                                        {uploadingMedia === 'video' ? (
                                            <>
                                                <Loader className="animate-spin" size={24} />
                                                <span className="text-xs mt-1">Uploading...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Video size={24} />
                                                <span className="text-xs mt-1">Upload Video</span>
                                            </>
                                        )}
                                        <input id="video-upload" type="file" accept="video/*" onChange={(e) => e.target.files && handleMediaUpload(e.target.files[0], 'video')} className="hidden" disabled={uploadingMedia !== null} />
                                    </label>
                                )}
                            </div>
                        </div>
                    </Section>

                    {isApparel && (
                        <Section title="Sizing Guide" icon={<Ruler className="text-teal-500" />}>
                            <SizingGuideEditor 
                                value={formData.sizing_guide} 
                                onChange={handleSizingGuideUpdate} 
                                productType={formData.product_type}
                                availableSizes={sizeOptionValues}
                            />
                        </Section>
                    )}

                    <Section title="Pricing" icon={<DollarSign className="text-green-500" />}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="price" className="block text-sm font-medium text-neutral-300">Price (PKR)</label>
                                <input type="number" name="price" id="price" value={formData.pricing?.price || ''} onChange={handlePricingChange} className="glass-input w-full mt-1" required />
                            </div>
                            <div>
                                <label htmlFor="compare_at_price" className="block text-sm font-medium text-neutral-300">Compare At Price</label>
                                <input type="number" name="compare_at_price" id="compare_at_price" value={formData.pricing?.compare_at_price || ''} onChange={handlePricingChange} className="glass-input w-full mt-1" />
                            </div>
                        </div>
                    </Section>

                    <Section title="Options & Variants" icon={<Settings2 className="text-purple-500" />}>
                        {formData.options?.map((opt, index) => (
                            <div key={index} className="p-4 bg-white/5 rounded-xl border border-white/10">
                                <div className="flex justify-between items-center">
                                    <input type="text" placeholder="Option name (e.g. Size)" defaultValue={opt.name} onBlur={e => handleOptionChange(index, e.target.value)} className="glass-input py-1 px-2 w-1/2" />
                                    <button type="button" onClick={() => removeOption(index)}><Trash2 size={16} className="text-red-500 hover:text-red-400" /></button>
                                </div>
                                <div className="mt-3">
                                    <input type="text" placeholder="Option values, comma separated" defaultValue={opt.values.join(', ')} onBlur={e => handleOptionValueChange(index, e.target.value.split(',').map(s => s.trim()).filter(Boolean))} className="glass-input w-full text-sm" />
                                </div>
                            </div>
                        ))}
                        <button type="button" onClick={addOption} className="flex items-center space-x-2 text-sm text-primary hover:text-primary-light hover:underline"><Plus size={16} /><span>Add another option</span></button>
                        
                        {formData.variants && formData.variants.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-white/10">
                                <h4 className="font-semibold text-neutral-300 mb-2">Variants ({formData.inventory?.quantity} total stock)</h4>
                                <div className="space-y-2">
                                    {formData.variants.map(variant => (
                                        <div key={variant.id} className="grid grid-cols-3 gap-4 items-center bg-white/5 p-3 rounded-xl border border-white/5">
                                            <p className="text-sm text-neutral-300 col-span-1 truncate" title={variant.title}>{variant.title}</p>
                                            <div className="col-span-1">
                                                <label className="text-xs text-neutral-500 block mb-1">Price</label>
                                                <input type="number" value={variant.price} onChange={e => handleVariantChange(variant.id, 'price', e.target.value)} className="glass-input w-full py-1 px-2 text-sm" />
                                            </div>
                                            <div className="col-span-1">
                                                <label className="text-xs text-neutral-500 block mb-1">Stock</label>
                                                <input type="number" value={variant.inventory?.quantity || 0} onChange={e => handleVariantChange(variant.id, 'quantity', e.target.value)} className="glass-input w-full py-1 px-2 text-sm" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </Section>

                    <Section title="Organization" icon={<Tag className="text-orange-500" />}>
                        <div>
                            <label htmlFor="tags" className="block text-sm font-medium text-neutral-300">Tags</label>
                            <input type="text" id="tags" defaultValue={formData.tags?.filter(t => !['male', 'female', 'unisex'].includes(t.toLowerCase())).join(', ')} onBlur={e => handleTagChange(e.target.value.split(',').map(s => s.trim()).filter(Boolean))} className="glass-input w-full mt-1" placeholder="e.g. summer, new-arrival, sale" />
                        </div>
                    </Section>

                    <div className="pt-6 border-t border-white/10 flex justify-end items-center space-x-4 flex-shrink-0">
                        <button type="button" onClick={onClose} className="px-6 py-2 rounded-xl text-neutral-300 hover:text-white hover:bg-white/10 transition-colors">Cancel</button>
                        <button type="submit" disabled={isSaving} className="glass-button bg-primary text-white hover:bg-primary-dark border-primary/50 shadow-glow-primary disabled:opacity-50">
                            {isSaving ? 'Saving...' : 'Save Product'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

export default ProductEditor;