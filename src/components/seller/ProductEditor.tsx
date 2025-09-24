import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Product, Variant, Option, Pricing, SizingGuide, Inventory } from '../../constants/types';
import * as api from '../../api/sellerApi';
import { useSellerAuth } from '../../contexts/SellerAuthContext';
import { X, Plus, Trash2, Upload, DollarSign, Type, Tag, Image as ImageIcon, Paperclip, Settings2, Ruler, AlertTriangle, ArrowLeft, ArrowRight, Copy, Video, Loader } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ProductEditorProps {
    product: Product | null;
    onClose: () => void;
}

const getShopifyThumbnail = (url: string, size: string = '100x100') => {
    if (url.includes("shopify.com") === false) {return url}
    if (!url || typeof url !== 'string') return 'https://via.placeholder.com/100';
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
    <div className="bg-background p-6 rounded-lg border border-neutral-700">
        <div className="flex items-center mb-4">
            {icon}
            <h3 className="text-lg font-semibold text-white ml-3">{title}</h3>
        </div>
        <div className="space-y-4">{children}</div>
    </div>
);

const productTypes = ["T-Shirt", "Polo Shirt", "Shirt", "Kurta", "Shalwar Kameez", "Trousers", "Jeans", "Shorts", "Jacket", "Zipper", "Hoodie", "Sweatshirt", "Dupatta", "Scarf", "Bag", "Shoe", "Sandal", "Belt", "Watch", "Accessory"];
const apparelTypes = ["T-Shirt", "Polo Shirt", "Shirt", "Kurta", "Shalwar Kameez", "Trousers", "Jeans", "Shorts", "Jacket", "Zipper", "Hoodie", "Sweatshirt", "Dupatta", "Scarf"];

const dummySizingGuides: Record<string, SizingGuide> = {
  'top_wear': {
    size_chart: { 'dummy_row': { 'Chest': 0, 'Shoulder': 0, 'Length': 0, 'Sleeve Length': 0 } },
    size_fit: 'Regular fit for tops.',
    measurement_unit: 'inch',
  },
  'bottom_wear': {
    size_chart: { 'dummy_row': { 'Waist': 0, 'Hips': 0, 'Inseam': 0, 'Length': 0 } },
    size_fit: 'Comfort fit for bottoms.',
    measurement_unit: 'inch',
  },
};


const ProductEditor: React.FC<ProductEditorProps> = ({ product, onClose }) => {
    const { seller } = useSellerAuth();
    const [formData, setFormData] = useState<Partial<Product>>({});
    const [isSaving, setIsSaving] = useState(false);
    const [uploadingMedia, setUploadingMedia] = useState<'image' | 'video' | null>(null);
    const [selectedSizingGuideType, setSelectedSizingGuideType] = useState<string>('');

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

        if (product?.sizing_guide?.size_chart) {
            const sizeKeys = Object.keys(Object.values(product.sizing_guide.size_chart)[0] || {});
            if (sizeKeys.includes('Chest') || sizeKeys.includes('Shoulder')) {
                setSelectedSizingGuideType('top_wear');
            } else if (sizeKeys.includes('Waist') || sizeKeys.includes('Inseam')) {
                setSelectedSizingGuideType('bottom_wear');
            }
        }

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
                console.log(`Uploading ${file.name} of size ${file.size}`);
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

    const handleSizingGuideChange = (field: keyof SizingGuide, value: any) => {
        setFormData(prev => ({ ...prev, sizing_guide: { ...prev.sizing_guide, [field]: value } as SizingGuide }));
    };

    const handleSizingGuideChartChange = (rowKey: string, colKey: string, value: string) => {
        const numericValue = parseFloat(value) || 0;
        const newChart = { ...formData.sizing_guide?.size_chart };
        newChart[rowKey] = { ...(newChart[rowKey] || {}), [colKey]: numericValue };
        handleSizingGuideChange('size_chart', newChart);
    };

    const sizeOptionValues = useMemo(() => {
        return formData.options?.find(opt => opt.name.toLowerCase() === 'size')?.values || [];
    }, [formData.options]);

    useEffect(() => {
        if (sizeOptionValues.length > 0 && selectedSizingGuideType) {
            const guide = dummySizingGuides[selectedSizingGuideType];
            if (!guide) return;

            const newChart: Record<string, Record<string, number>> = {};
            const measurementKeys = Object.keys(guide.size_chart['dummy_row']);

            sizeOptionValues.forEach(size => {
                newChart[size] = {};
                measurementKeys.forEach(key => {
                    newChart[size][key] = formData.sizing_guide?.size_chart?.[size]?.[key] || 0;
                });
            });
            handleSizingGuideChange('size_chart', newChart);
        }
    }, [sizeOptionValues, selectedSizingGuideType]);


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
            if (!selectedSizingGuideType) issues.push("Sizing guide type is required for apparel.");
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
        
        // Ensure inventory is correctly summed up
        const totalInventory = (finalData.variants || []).reduce((sum, variant) => sum + (variant.inventory?.quantity || 0), 0);
        finalData.inventory = {
            ...finalData.inventory,
            quantity: totalInventory,
            in_stock: totalInventory > 0,
        };

        // Clean up sizing guide if not apparel
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
                    seller_name: seller.user.business_name,
                    seller_logo: seller.user.logo_url,
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
    const sizingGuideColumns = selectedSizingGuideType ? Object.keys(dummySizingGuides[selectedSizingGuideType].size_chart['dummy_row']) : [];

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex justify-center items-center p-4">
            <motion.div 
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 50, opacity: 0 }}
                className="bg-background-light rounded-lg shadow-xl w-full max-w-5xl max-h-[95vh] flex flex-col"
            >
                <div className="flex justify-between items-center p-6 border-b border-neutral-700 flex-shrink-0">
                    <h2 className="text-2xl font-bold text-white">{product ? 'Edit Product' : 'Create Product'}</h2>
                    <button onClick={onClose} className="text-neutral-400 hover:text-white"><X /></button>
                </div>
                <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto p-6 space-y-6">
                    {/* Basic Info */}
                    <Section title="Basic Information" icon={<Paperclip className="text-primary" />}>
                        <div>
                            <label htmlFor="title" className="block text-sm font-medium text-neutral-300">Title</label>
                            <input type="text" name="title" id="title" value={formData.title || ''} onChange={handleChange} className="w-full bg-background border border-neutral-700 rounded-md p-2 text-white mt-1" required />
                        </div>
                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-neutral-300">Description</label>
                            <textarea name="description" id="description" value={formData.description || ''} onChange={handleChange} className="w-full bg-background border border-neutral-700 rounded-md p-2 text-white mt-1 h-24" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="product_type" className="block text-sm font-medium text-neutral-300">Product Type</label>
                                <select name="product_type" id="product_type" value={formData.product_type || ''} onChange={handleChange} className="w-full bg-background border border-neutral-700 rounded-md p-2 text-white mt-1" required>
                                    <option value="">Select a type</option>
                                    {productTypes.map(type => <option key={type} value={type}>{type}</option>)}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="gender" className="block text-sm font-medium text-neutral-300">Gender</label>
                                <select id="gender" value={currentGender} onChange={handleGenderChange} className="w-full bg-background border border-neutral-700 rounded-md p-2 text-white mt-1" required>
                                    <option value="">Select gender</option>
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                    <option value="unisex">Unisex</option>
                                </select>
                            </div>
                        </div>
                    </Section>

                    {/* Media */}
                    <Section title="Media" icon={<ImageIcon className="text-blue-500" />}>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-neutral-300 mb-2">Images</label>
                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
                                    <AnimatePresence>
                                        {formData.images?.map((url, index) => (
                                            <motion.div layout key={url} className="relative group">
                                                <img src={getShopifyThumbnail(url)} loading="lazy" alt={`Product image ${index + 1}`} className="w-full h-24 object-cover rounded-md" />
                                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex justify-center items-center gap-1">
                                                    <button type="button" onClick={() => handleReorderImage(index, 'left')} className="text-white p-1 rounded-full bg-black/50 hover:bg-black/80 disabled:opacity-50" disabled={index === 0}><ArrowLeft size={14} /></button>
                                                    <button type="button" onClick={() => handleRemoveImage(index)} className="text-white p-1 rounded-full bg-red-500/80 hover:bg-red-500"><Trash2 size={14} /></button>
                                                    <button type="button" onClick={() => handleReorderImage(index, 'right')} className="text-white p-1 rounded-full bg-black/50 hover:bg-black/80 disabled:opacity-50" disabled={index === (formData.images?.length || 0) - 1}><ArrowRight size={14} /></button>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                    <label htmlFor="image-upload" className={`w-full h-24 border-2 border-dashed border-neutral-600 rounded-md flex flex-col justify-center items-center text-neutral-400 ${uploadingMedia ? 'cursor-not-allowed' : 'cursor-pointer hover:border-primary'}`}>
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
                                        <video src={formData.video_url} className="w-full h-24 object-cover rounded-md bg-black" />
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex justify-center items-center">
                                            <button type="button" onClick={() => setFormData(p => ({...p, video_url: ''}))} className="text-white p-1 rounded-full bg-red-500/80 hover:bg-red-500"><Trash2 size={14} /></button>
                                        </div>
                                    </div>
                                ) : (
                                    <label htmlFor="video-upload" className={`w-48 h-24 border-2 border-dashed border-neutral-600 rounded-md flex flex-col justify-center items-center text-neutral-400 ${uploadingMedia ? 'cursor-not-allowed' : 'cursor-pointer hover:border-primary'}`}>
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

                    {/* Sizing Guide */}
                    {isApparel && (
                        <Section title="Sizing Guide" icon={<Ruler className="text-teal-500" />}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="sizing_guide_type" className="block text-sm font-medium text-neutral-300">Sizing Guide Type</label>
                                    <select id="sizing_guide_type" value={selectedSizingGuideType} onChange={e => setSelectedSizingGuideType(e.target.value)} className="w-full bg-background border border-neutral-700 rounded-md p-2 text-white mt-1" required>
                                        <option value="">Select Type</option>
                                        <option value="top_wear">Top Wear</option>
                                        <option value="bottom_wear">Bottom Wear</option>
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="measurement_unit" className="block text-sm font-medium text-neutral-300">Measurement Unit</label>
                                    <select id="measurement_unit" value={formData.sizing_guide?.measurement_unit || 'inch'} onChange={e => handleSizingGuideChange('measurement_unit', e.target.value)} className="w-full bg-background border border-neutral-700 rounded-md p-2 text-white mt-1">
                                        <option value="inch">Inch</option>
                                        <option value="cm">CM</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label htmlFor="size_fit" className="block text-sm font-medium text-neutral-300">Sizing & Fit Details</label>
                                <textarea id="size_fit" value={formData.sizing_guide?.size_fit || ''} onChange={e => handleSizingGuideChange('size_fit', e.target.value)} className="w-full bg-background border border-neutral-700 rounded-md p-2 text-white mt-1 h-20" placeholder="e.g., Regular fit, true to size. Model is 6ft and wears a size M." required/>
                            </div>
                            {sizeOptionValues.length > 0 && selectedSizingGuideType && (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left text-neutral-300">
                                        <thead className="text-xs text-neutral-400 uppercase bg-background">
                                            <tr>
                                                <th scope="col" className="px-4 py-3">Size</th>
                                                {sizingGuideColumns.map(col => <th key={col} scope="col" className="px-4 py-3">{col} ({formData.sizing_guide?.measurement_unit})</th>)}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {sizeOptionValues.map(size => (
                                                <tr key={size} className="border-b border-neutral-700">
                                                    <th scope="row" className="px-4 py-2 font-medium whitespace-nowrap">{size}</th>
                                                    {sizingGuideColumns.map(col => (
                                                        <td key={col} className="px-4 py-2">
                                                            <input type="number" value={formData.sizing_guide?.size_chart?.[size]?.[col] || ''} onChange={e => handleSizingGuideChartChange(size, col, e.target.value)} className="w-20 bg-neutral-800 text-white rounded-md p-1 border border-neutral-600" />
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                            {sizeOptionValues.length === 0 && <p className='text-xs text-yellow-500 flex items-center mt-1'><AlertTriangle size={14} className='mr-1'/> Add a 'Size' option to create a size chart.</p>}
                        </Section>
                    )}

                    {/* Pricing */}
                    <Section title="Pricing" icon={<DollarSign className="text-green-500" />}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="price" className="block text-sm font-medium text-neutral-300">Price (PKR)</label>
                                <input type="number" name="price" id="price" value={formData.pricing?.price || ''} onChange={handlePricingChange} className="w-full bg-background border border-neutral-700 rounded-md p-2 text-white mt-1" required />
                            </div>
                            <div>
                                <label htmlFor="compare_at_price" className="block text-sm font-medium text-neutral-300">Compare At Price</label>
                                <input type="number" name="compare_at_price" id="compare_at_price" value={formData.pricing?.compare_at_price || ''} onChange={handlePricingChange} className="w-full bg-background border border-neutral-700 rounded-md p-2 text-white mt-1" />
                            </div>
                        </div>
                    </Section>

                    {/* Options & Variants */}
                    <Section title="Options & Variants" icon={<Settings2 className="text-purple-500" />}>
                        {formData.options?.map((opt, index) => (
                            <div key={index} className="p-4 bg-background rounded-md border border-neutral-700">
                                <div className="flex justify-between items-center">
                                    <input type="text" placeholder="Option name (e.g. Size)" defaultValue={opt.name} onBlur={e => handleOptionChange(index, e.target.value)} className="bg-neutral-800 text-white p-1 rounded-md border border-neutral-600" />
                                    <button type="button" onClick={() => removeOption(index)}><Trash2 size={16} className="text-red-500" /></button>
                                </div>
                                <div className="mt-2">
                                    <input type="text" placeholder="Option values, comma separated" defaultValue={opt.values.join(', ')} onBlur={e => handleOptionValueChange(index, e.target.value.split(',').map(s => s.trim()).filter(Boolean))} className="w-full text-sm bg-neutral-800 text-white p-1 rounded-md border border-neutral-600" />
                                </div>
                            </div>
                        ))}
                        <button type="button" onClick={addOption} className="flex items-center space-x-2 text-sm text-primary hover:underline"><Plus size={16} /><span>Add another option</span></button>
                        
                        {formData.variants && formData.variants.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-neutral-700">
                                <h4 className="font-semibold text-neutral-300 mb-2">Variants ({formData.inventory?.quantity} total stock)</h4>
                                <div className="space-y-2">
                                    {formData.variants.map(variant => (
                                        <div key={variant.id} className="grid grid-cols-3 gap-4 items-center bg-background p-2 rounded-md">
                                            <p className="text-sm text-neutral-300 col-span-1">{variant.title}</p>
                                            <div className="col-span-1">
                                                <label className="text-xs text-neutral-500">Price</label>
                                                <input type="number" value={variant.price} onChange={e => handleVariantChange(variant.id, 'price', e.target.value)} className="w-full bg-neutral-800 text-white rounded-md p-1 text-sm border border-neutral-700" />
                                            </div>
                                            <div className="col-span-1">
                                                <label className="text-xs text-neutral-500">Stock</label>
                                                <input type="number" value={variant.inventory?.quantity || 0} onChange={e => handleVariantChange(variant.id, 'quantity', e.target.value)} className="w-full bg-neutral-800 text-white rounded-md p-1 text-sm border border-neutral-700" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </Section>

                    {/* Organization */}
                    <Section title="Organization" icon={<Tag className="text-orange-500" />}>
                        <div>
                            <label htmlFor="tags" className="block text-sm font-medium text-neutral-300">Tags</label>
                            <input type="text" id="tags" defaultValue={formData.tags?.filter(t => !['male', 'female', 'unisex'].includes(t.toLowerCase())).join(', ')} onBlur={e => handleTagChange(e.target.value.split(',').map(s => s.trim()).filter(Boolean))} className="w-full bg-background border border-neutral-700 rounded-md p-2 text-white mt-1" placeholder="e.g. summer, new-arrival, sale" />
                        </div>
                    </Section>

                    <div className="pt-6 border-t border-neutral-700 flex justify-end items-center space-x-4 flex-shrink-0">
                        <button type="button" onClick={onClose} className="px-6 py-2 rounded-md text-white bg-neutral-600 hover:bg-neutral-500">Cancel</button>
                        <button type="submit" disabled={isSaving} className="px-6 py-2 rounded-md text-white bg-primary hover:bg-primary/90 disabled:opacity-50">
                            {isSaving ? 'Saving...' : 'Save Product'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

export default ProductEditor;