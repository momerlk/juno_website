import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Product, Variant, Option, Pricing, SizingGuide, Inventory } from '../../constants/types';
import * as api from '../../api/sellerApi';
import { useSellerAuth } from '../../contexts/SellerAuthContext';
import { X, Plus, Trash2, Upload, DollarSign, Paperclip, Settings2, Ruler, ArrowLeft, ArrowRight, Loader, Package } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SizingGuideEditor from './SizingGuideEditor';
import { productTypes, apparelTypes, productTypeToSizingGuide } from '../../constants/sizing';

interface ProductEditorProps {
    product: Product | null | undefined;
    queueId?: string;
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

const Section: React.FC<{ id?: string; title: string; icon: React.ReactNode; eyebrow?: string; children: React.ReactNode }> = ({ id, title, icon, eyebrow, children }) => (
    <section id={id} className="rounded-[1.6rem] border border-white/10 bg-white/[0.03] p-5 scroll-mt-24">
        <div className="mb-4 flex items-center gap-3">
            <div className="rounded-[1rem] border border-white/10 bg-black/25 p-2.5 text-primary">
                {icon}
            </div>
            <div>
                {eyebrow && <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-white/30">{eyebrow}</p>}
                <h3 className="text-lg font-black uppercase tracking-[-0.03em] text-white">{title}</h3>
            </div>
        </div>
        <div className="space-y-4">{children}</div>
    </section>
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

const fieldClassName = 'mt-1 w-full rounded-[1.05rem] border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-white/22 focus:border-primary/35';
const quickChipClassName = 'rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-white/72 transition-colors hover:border-primary/30 hover:text-white';
const sizePresets = ['XS, S, M, L, XL', 'S, M, L', '30, 32, 34, 36', 'One Size'];
type ProfitData = {
    brand_price: number;
    effective_brand_price: number;
    commission: number;
    seller_payout: number;
    cost_price: number;
    profit: number;
    margin_percent: number;
};

const ProductEditor: React.FC<ProductEditorProps> = ({ product, queueId, onClose }) => {
    const { seller } = useSellerAuth();
    const [formData, setFormData] = useState<Partial<Product>>({});
    const [isSaving, setIsSaving] = useState(false);
    const [uploadingMedia, setUploadingMedia] = useState<'image' | 'video' | null>(null);
    const [tagInput, setTagInput] = useState('');
    const [showComparePrice, setShowComparePrice] = useState(false);
    const [showUnitPrice, setShowUnitPrice] = useState(false);
    const [showCostSection, setShowCostSection] = useState(false);
    const [costPrice, setCostPrice] = useState<number | ''>('');
    const [shippingIncluded, setShippingIncluded] = useState(false);
    const [profitData, setProfitData] = useState<ProfitData | null>(null);
    const [loadingProfit, setLoadingProfit] = useState(false);

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
            ? { 
                ...defaultProductState, 
                ...product,
                // Ensure arrays are initialized if they come as null/undefined from API
                options: product.options || [],
                variants: product.variants || [],
                images: product.images || [],
                tags: product.tags || [],
                inventory: product.inventory || { quantity: 0, in_stock: false },
                pricing: product.pricing || { price: 0, currency: 'PKR', discounted: false },
                sizing_guide: product.sizing_guide || { size_chart: {}, size_fit: '', measurement_unit: 'inch' }
              }
            : defaultProductState;

        setFormData(initialState);
        setShowComparePrice(Boolean(product?.pricing?.compare_at_price));
        setShowUnitPrice(Boolean((product?.pricing as any)?.unit_price));
        setShowCostSection(Boolean(product?.pricing && 'cost_price' in product.pricing && (product.pricing as any).cost_price));
        setCostPrice(
            product?.pricing && 'cost_price' in product.pricing && typeof (product.pricing as any).cost_price === 'number'
                ? (product.pricing as any).cost_price
                : ''
        );
        setShippingIncluded(Boolean(product?.pricing && 'shipping_included' in product.pricing && (product.pricing as any).shipping_included));
        setProfitData(null);
        const nonGenderTags = initialState.tags?.filter(tag => !['male', 'female', 'unisex'].includes(tag.toLowerCase())) || [];
        setTagInput(nonGenderTags.join(', '));
        console.groupCollapsed('[inventory-debug] editor-init');
        console.log('mode', queueId ? 'queue' : product?.id ? 'active-product' : 'create');
        console.log('product_id', product?.id);
        console.log('queue_id', queueId);
        console.log('variant_count', initialState.variants?.length || 0);
        console.log('image_count', initialState.images?.length || 0);
        console.groupEnd();
    }, [product]);

    const generateVariantCombinations = useCallback((options: Option[] | null | undefined = []) => {
        const normalizedOptions = (options || [])
            .map((option) => ({
                ...option,
                values: option.values.filter((value) => value.trim() !== ''),
            }))
            .filter((option) => option.name.trim() !== '');

        if (!normalizedOptions.length || normalizedOptions.every((o) => o.values.length === 0)) return [];
        
        const combinations: Record<string, string>[] = [];
        const generate = (index: number, current: Record<string, string>) => {
            if (index === normalizedOptions.length) {
                if (Object.keys(current).length > 0) combinations.push(current);
                return;
            }
            const option = normalizedOptions[index];
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
        const basePrice = formData.pricing?.price || 0;
        
        const newVariants = newCombinations.map((combo, index) => {
            const title = Object.values(combo).join(' / ');
            const existingVariant = formData.variants?.find(v => v.title === title);
            return {
                id: existingVariant?.id || `new_${Date.now()}_${index}`,
                title,
                options: combo,
                price: existingVariant?.price ?? basePrice,
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

    const fetchProfit = async () => {
        const price = formData.pricing?.price || 0;
        const cp = typeof costPrice === 'number' ? costPrice : undefined;

        if (cp === undefined || price <= 0) {
            setProfitData(null);
            return;
        }

        if (!product?.id || !seller?.token) {
            setProfitData(null);
            return;
        }

        setLoadingProfit(true);
        try {
            const res = await api.Seller.GetProductProfit(seller.token, product.id, { cost_price: cp });
            if (res.ok && res.body) {
                setProfitData(res.body as ProfitData);
            } else {
                setProfitData(null);
            }
        } catch (error) {
            setProfitData(null);
        } finally {
            setLoadingProfit(false);
        }
    };

    const handleShippingIncludedToggle = async () => {
        const next = !shippingIncluded;
        setShippingIncluded(next);
        if (product?.id && seller?.token) {
            try {
                await api.Seller.UpdateProductPricing(seller.token, product.id, { shipping_included: next });
            } catch (error) {
                console.error('Failed to update shipping included state:', error);
            }
        }
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

    const handleOptionValueFieldChange = (optionIndex: number, valueIndex: number, newValue: string) => {
        const newOptions = [...(formData.options || [])];
        const values = [...newOptions[optionIndex].values];
        values[valueIndex] = newValue;
        newOptions[optionIndex] = { ...newOptions[optionIndex], values };
        setFormData(prev => ({ ...prev, options: newOptions }));
    };

    const addOptionValueField = (optionIndex: number) => {
        const newOptions = [...(formData.options || [])];
        newOptions[optionIndex] = {
            ...newOptions[optionIndex],
            values: [...newOptions[optionIndex].values, ''],
        };
        setFormData(prev => ({ ...prev, options: newOptions }));
    };

    const removeOptionValueField = (optionIndex: number, valueIndex: number) => {
        const newOptions = [...(formData.options || [])];
        const values = newOptions[optionIndex].values.filter((_, i) => i !== valueIndex);
        newOptions[optionIndex] = { ...newOptions[optionIndex], values };
        setFormData(prev => ({ ...prev, options: newOptions }));
    };

    const moveOptionValue = (optionIndex: number, valueIndex: number, direction: 'up' | 'down') => {
        const newOptions = [...(formData.options || [])];
        const values = [...newOptions[optionIndex].values];
        const targetIndex = direction === 'up' ? valueIndex - 1 : valueIndex + 1;
        if (targetIndex < 0 || targetIndex >= values.length) return;
        [values[valueIndex], values[targetIndex]] = [values[targetIndex], values[valueIndex]];
        newOptions[optionIndex] = { ...newOptions[optionIndex], values };
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
        const genderTags = formData.tags?.filter(t => ['male', 'female', 'unisex'].includes(t.toLowerCase())) || [];
        setFormData(prev => ({ ...prev, tags: [...newTags, ...genderTags] }));
    };

    const addSuggestedTag = (tag: string) => {
        const current = tagInput.split(',').map(item => item.trim()).filter(Boolean);
        if (current.includes(tag)) return;
        const next = [...current, tag];
        setTagInput(next.join(', '));
        handleTagChange(next);
    };

    const setPresetOption = (name: string, values: string[]) => {
        const currentOptions = [...(formData.options || [])];
        const existingIndex = currentOptions.findIndex((option) => option.name.toLowerCase() === name.toLowerCase());

        if (existingIndex >= 0) {
            currentOptions[existingIndex] = { ...currentOptions[existingIndex], name, values };
        } else {
            currentOptions.push({ name, values, required: true });
        }

        setFormData(prev => ({ ...prev, options: currentOptions }));
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
        return formData.options?.find(opt => opt.name.toLowerCase() === 'size')?.values.filter((value) => value.trim() !== '') || [];
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
        // Strict validation only if it's NOT a draft/queue item?
        // Actually, queue items allow partial data, but if user hits Save here, we might want some validation.
        // However, the user might be fixing errors. 
        // For now, let's keep runValidations but maybe relax it or just warn?
        // The doc says "System immediately runs validation... If invalid -> validation_pending".
        // So we should allow saving even if invalid, effectively updating the queue item.
        // But `runValidations` currently blocks submission.
        // Let's keep `runValidations` blocking for now to encourage good data, or maybe relax it.
        // Since the prompt says "Build clear UI states for... failed validation", maybe we should allow saving invalid data to the queue.
        // But `ProductEditor` is a form.
        
        // Keep active catalog entries strict; drafts/queue items can be saved incrementally.
        const strictValidation = Boolean(product?.id && !queueId);
        if (strictValidation && !runValidations()) return;
        
        if (!seller?.token) return;

        setIsSaving(true);
        try {
            const payload = prepareSubmitData();
            console.groupCollapsed('[inventory-debug] editor-submit');
            console.log('mode', queueId ? 'queue-update' : product?.id ? 'product-update' : 'queue-create');
            console.log('product_id', product?.id);
            console.log('queue_id', queueId);
            console.log('title', payload.title);
            console.log('variant_count', payload.variants?.length || 0);
            console.log('inventory_quantity', payload.inventory?.quantity);
            console.log('image_count', payload.images?.length || 0);
            console.log('product_type', payload.product_type);
            console.log('gender', payload.tags?.find(t => ['male', 'female', 'unisex'].includes(t.toLowerCase())));
            console.groupEnd();
            
            let response;
            if (queueId) {
                // Updating an existing queue item
                 response = await api.Seller.Queue.Update(seller.token, queueId, { product: payload });
                 // Keep queue enrichment aligned with documented API flow when required fields exist.
                 const gender = payload.tags?.find(t => ['male', 'female', 'unisex'].includes(t.toLowerCase()));
                 if (payload.product_type && gender) {
                    await api.Seller.Queue.Enrich(seller.token, queueId, {
                        product_type: payload.product_type,
                        gender,
                        sizing_guide: payload.sizing_guide?.size_chart || {},
                    });
                 }
            } else if (product && product.id) {
                // Updating an active product
                response = await api.Seller.UpdateProduct(seller.token, { ...payload, id: product.id });
            } else {
                // Creating a new product -> Goes to Queue
                const createPayload = {
                    ...payload,
                    handle: generateHandle(payload.title || '', seller?.user?.business_name || ''),
                    status: 'queued', // Default to queued
                    seller_name: seller?.user?.business_name,
                    seller_logo: seller?.user?.logo_url,
                };
                response = await api.Seller.Queue.Create(seller.token, createPayload as Product);
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
    const editorMode = queueId ? 'Draft Editor' : product?.id ? 'Product Editor' : 'Create Product';
    const totalStock = useMemo(() => (formData.variants || []).reduce((sum, variant) => sum + (variant.inventory?.quantity || 0), 0), [formData.variants]);
    const hasSizing = Boolean(formData.sizing_guide?.size_chart && Object.keys(formData.sizing_guide.size_chart).length > 0);
    const sizeOption = useMemo(() => formData.options?.find((option) => option.name.toLowerCase() === 'size'), [formData.options]);
    const sizeCount = sizeOption?.values?.length || 0;
    const sizeFitReady = Boolean(formData.sizing_guide?.size_fit?.trim());
    const pricingPreview = useMemo(() => {
        const sellingPrice = formData.pricing?.price || 0;
        const cp = typeof costPrice === 'number' ? costPrice : 0;
        const displayPrice = shippingIncluded ? sellingPrice : sellingPrice + 99;
        const commission = Math.round(displayPrice * 0.175);
        const payout = displayPrice - commission;
        const profit = payout - cp;
        const margin = payout > 0 ? ((profit / payout) * 100).toFixed(1) : '0.0';

        return {
            displayPrice,
            commission,
            payout,
            cost: cp,
            profit,
            margin,
        };
    }, [formData.pricing?.price, costPrice, shippingIncluded]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            className="flex h-full min-h-[calc(100dvh-9rem)] flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,#060606_0%,#0a0a0a_100%)] shadow-[0_30px_100px_rgba(0,0,0,0.35)]"
        >
            <div className="sticky top-0 z-20 flex items-center justify-between border-b border-white/10 bg-black/70 px-6 py-4 backdrop-blur-xl">
                <div>
                    <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-primary/75">{editorMode}</p>
                    <h2 className="mt-1 text-xl font-black uppercase tracking-[-0.03em] text-white">
                        {product ? product.title || 'Untitled Product' : 'New Product'}
                    </h2>
                </div>
                <button onClick={onClose} className="rounded-xl border border-white/10 bg-white/[0.03] p-2 text-neutral-400 transition-colors hover:text-white">
                    <X size={18} />
                </button>
            </div>

            <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
                <div className="min-h-0 overflow-y-auto px-4 py-5 sm:px-6">
                    <div className="mx-auto max-w-6xl">
                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px] lg:items-start">
                            <div className="space-y-5" id="main-col">
                                <Section id="content" title="Product" eyebrow="Step 1" icon={<Paperclip size={16} />}>
                                    <div className="space-y-4">
                                        <div>
                                            <label htmlFor="title" className="mb-1 block text-xs font-medium text-neutral-400">
                                                Title
                                            </label>
                                            <input
                                                type="text"
                                                name="title"
                                                id="title"
                                                value={formData.title || ''}
                                                onChange={handleChange}
                                                className={fieldClassName}
                                                placeholder="Classic lawn kurta, cropped denim jacket..."
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label htmlFor="description" className="mb-1 block text-xs font-medium text-neutral-400">
                                                Description
                                            </label>
                                            <textarea
                                                name="description"
                                                id="description"
                                                value={formData.description || ''}
                                                onChange={handleChange}
                                                className={`${fieldClassName} h-28 resize-none`}
                                                placeholder="Explain the fabric, fit, and what makes this piece worth buying."
                                            />
                                        </div>

                                        <div>
                                            <p className="mb-2 text-xs font-medium text-neutral-400">Media</p>
                                            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5">
                                                <AnimatePresence>
                                                    {formData.images?.map((url, index) => (
                                                        <motion.div layout key={url} className="relative overflow-hidden rounded-xl border border-white/10 bg-black/30">
                                                            <img src={getShopifyThumbnail(url)} loading="lazy" alt={`Product image ${index + 1}`} className="h-24 w-full object-cover" />
                                                            {index === 0 && (
                                                                <div className="absolute left-1.5 top-1.5 rounded-md bg-black/70 px-1.5 py-0.5 text-[9px] font-mono uppercase tracking-widest text-white/80">
                                                                    Cover
                                                                </div>
                                                            )}
                                                            <div className="flex items-center justify-between gap-0.5 border-t border-white/10 bg-black/55 px-1.5 py-1.5">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleReorderImage(index, 'left')}
                                                                    disabled={index === 0}
                                                                    className="rounded-md border border-white/10 bg-white/[0.04] p-1 text-white/80 disabled:opacity-30 hover:bg-white/[0.08]"
                                                                >
                                                                    <ArrowLeft size={11} />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleRemoveImage(index)}
                                                                    className="rounded-md border border-red-500/20 bg-red-500/10 p-1 text-red-300 hover:bg-red-500/20"
                                                                >
                                                                    <Trash2 size={11} />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleReorderImage(index, 'right')}
                                                                    disabled={index === (formData.images?.length || 0) - 1}
                                                                    className="rounded-md border border-white/10 bg-white/[0.04] p-1 text-white/80 disabled:opacity-30 hover:bg-white/[0.08]"
                                                                >
                                                                    <ArrowRight size={11} />
                                                                </button>
                                                            </div>
                                                        </motion.div>
                                                    ))}
                                                </AnimatePresence>
                                                <label
                                                    htmlFor="image-upload"
                                                    className={`flex h-24 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-white/10 bg-white/[0.03] text-center text-neutral-400 transition-colors ${uploadingMedia ? 'cursor-not-allowed' : 'hover:border-primary/50 hover:bg-primary/5 hover:text-primary'}`}
                                                >
                                                    {uploadingMedia === 'image' ? (
                                                        <>
                                                            <Loader className="animate-spin" size={18} />
                                                            <span className="mt-1 text-[10px]">Uploading...</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Upload size={18} />
                                                            <span className="mt-1 text-[10px] font-medium">Add photo</span>
                                                        </>
                                                    )}
                                                    <input
                                                        id="image-upload"
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={(e) => e.target.files && handleMediaUpload(e.target.files[0], 'image')}
                                                        className="hidden"
                                                        disabled={uploadingMedia !== null}
                                                    />
                                                </label>
                                            </div>
                                            <p className="mt-1.5 text-[11px] text-white/35">First image is the cover. Drag to reorder.</p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label htmlFor="product_type" className="mb-1 block text-xs font-medium text-neutral-400">
                                                    Category
                                                </label>
                                                <select
                                                    name="product_type"
                                                    id="product_type"
                                                    value={formData.product_type || ''}
                                                    onChange={handleChange}
                                                    className={fieldClassName}
                                                    required
                                                >
                                                    <option value="" className="bg-neutral-900">Select category</option>
                                                    {productTypes.map((type) => (
                                                        <option key={type} value={type} className="bg-neutral-900">{type}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label htmlFor="gender" className="mb-1 block text-xs font-medium text-neutral-400">
                                                    Gender
                                                </label>
                                                <select
                                                    id="gender"
                                                    value={currentGender}
                                                    onChange={handleGenderChange}
                                                    className={fieldClassName}
                                                    required
                                                >
                                                    <option value="" className="bg-neutral-900">Select gender</option>
                                                    <option value="male" className="bg-neutral-900">Male</option>
                                                    <option value="female" className="bg-neutral-900">Female</option>
                                                    <option value="unisex" className="bg-neutral-900">Unisex</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </Section>

                                <Section id="pricing" title="Pricing" eyebrow="Step 2" icon={<DollarSign size={16} />}>
                                    <div className="space-y-4">
                                        <div>
                                            <label htmlFor="price" className="mb-1 block text-xs font-medium text-neutral-400">
                                                Price <span className="font-normal text-white/30">(PKR)</span>
                                            </label>
                                            <input
                                                type="number"
                                                name="price"
                                                id="price"
                                                value={formData.pricing?.price || ''}
                                                onChange={handlePricingChange}
                                                className={fieldClassName}
                                                placeholder="0"
                                                required
                                            />
                                        </div>

                                        {showComparePrice && (
                                            <div>
                                                <label htmlFor="compare_at_price" className="mb-1 block text-xs font-medium text-neutral-400">
                                                    Compare-at price <span className="font-normal text-white/30">(original / struck-through)</span>
                                                </label>
                                                <input
                                                    type="number"
                                                    name="compare_at_price"
                                                    id="compare_at_price"
                                                    value={formData.pricing?.compare_at_price || ''}
                                                    onChange={handlePricingChange}
                                                    className={fieldClassName}
                                                    placeholder="0"
                                                />
                                            </div>
                                        )}

                                        {showUnitPrice && (
                                            <div>
                                                <label htmlFor="unit_price" className="mb-1 block text-xs font-medium text-neutral-400">
                                                    Unit price <span className="font-normal text-white/30">(price per unit for bulk listings)</span>
                                                </label>
                                                <input
                                                    type="number"
                                                    name="unit_price"
                                                    id="unit_price"
                                                    value={(formData.pricing as any)?.unit_price || ''}
                                                    onChange={handlePricingChange}
                                                    className={fieldClassName}
                                                    placeholder="0"
                                                />
                                            </div>
                                        )}

                                        <div className="flex flex-wrap gap-2">
                                            {!showComparePrice && (
                                                <button
                                                    type="button"
                                                    onClick={() => setShowComparePrice(true)}
                                                    className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-white/60 transition-colors hover:border-primary/30 hover:text-white"
                                                >
                                                    + Compare-at price
                                                </button>
                                            )}
                                            {!showUnitPrice && (
                                                <button
                                                    type="button"
                                                    onClick={() => setShowUnitPrice(true)}
                                                    className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-white/60 transition-colors hover:border-primary/30 hover:text-white"
                                                >
                                                    + Unit price
                                                </button>
                                            )}
                                        </div>

                                        <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/25 px-4 py-3">
                                            <div>
                                                <p className="text-xs font-medium text-white/80">Shipping included in price</p>
                                                <p className="mt-0.5 text-[11px] text-white/40">
                                                    Juno adds Rs. 99 shipping to each product. If this is on, Rs. 99 will be deducted from your listed price, plus commission.
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={handleShippingIncludedToggle}
                                                className={`relative h-5 w-9 rounded-full transition-colors ${shippingIncluded ? 'bg-primary' : 'bg-white/10'}`}
                                                aria-pressed={shippingIncluded}
                                            >
                                                <span
                                                    className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${shippingIncluded ? 'translate-x-4' : 'translate-x-0'}`}
                                                />
                                            </button>
                                        </div>

                                        {!showCostSection ? (
                                            <button
                                                type="button"
                                                onClick={() => setShowCostSection(true)}
                                                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[11px] font-medium text-white/50 transition-colors hover:border-primary/20 hover:text-white/80"
                                            >
                                                <span className="rounded-sm bg-white/10 px-1 py-0.5 text-[9px] uppercase tracking-wider">Cost</span>
                                                Add cost price to see profit & margin
                                            </button>
                                        ) : (
                                            <div className="space-y-4 rounded-2xl border border-white/10 bg-black/25 p-4">
                                                <div className="flex items-center justify-between">
                                                    <p className="text-xs font-semibold uppercase tracking-widest text-white/60">Cost & Profit</p>
                                                    <p className="text-[10px] text-white/30">Not shown to customers</p>
                                                </div>

                                                <div>
                                                    <label htmlFor="cost_price" className="mb-1 block text-xs font-medium text-neutral-400">
                                                        Cost price <span className="font-normal text-white/30">(PKR)</span>
                                                    </label>
                                                    <div className="flex gap-2">
                                                        <input
                                                            type="number"
                                                            id="cost_price"
                                                            value={costPrice}
                                                            onChange={(e) => {
                                                                const value = e.target.value;
                                                                setCostPrice(value === '' ? '' : parseFloat(value));
                                                                if (value === '') {
                                                                    setProfitData(null);
                                                                }
                                                            }}
                                                            onBlur={fetchProfit}
                                                            className={fieldClassName}
                                                            placeholder="What you paid to make or source this"
                                                        />
                                                    </div>
                                                </div>

                                                {loadingProfit && (
                                                    <div className="flex items-center gap-2 text-[11px] text-white/40">
                                                        <Loader size={12} className="animate-spin" />
                                                        Calculating...
                                                    </div>
                                                )}

                                                {(typeof costPrice === 'number' && (formData.pricing?.price || 0) > 0 && !loadingProfit) && (() => {
                                                    const displayValues = profitData
                                                        ? {
                                                            displayPrice: pricingPreview.displayPrice,
                                                            commission: profitData.commission,
                                                            payout: profitData.seller_payout,
                                                            cost: profitData.cost_price,
                                                            profit: profitData.profit,
                                                            margin: (profitData.margin_percent ?? 0).toFixed(1),
                                                        }
                                                        : pricingPreview;

                                                    return (
                                                        <div className="space-y-2">
                                                            <div className="grid grid-cols-2 gap-2 text-[11px]">
                                                                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                                                                    <p className="text-white/40">Display price</p>
                                                                    <p className="mt-1 font-semibold text-white">Rs {displayValues.displayPrice.toLocaleString()}</p>
                                                                    {!shippingIncluded && <p className="text-[10px] text-white/30">incl. Rs 99 buffer</p>}
                                                                </div>
                                                                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                                                                    <p className="text-white/40">Commission (17.5%)</p>
                                                                    <p className="mt-1 font-semibold text-white">- Rs {displayValues.commission.toLocaleString()}</p>
                                                                </div>
                                                                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                                                                    <p className="text-white/40">Your payout</p>
                                                                    <p className="mt-1 font-semibold text-white">Rs {displayValues.payout.toLocaleString()}</p>
                                                                </div>
                                                                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                                                                    <p className="text-white/40">Cost price</p>
                                                                    <p className="mt-1 font-semibold text-white">- Rs {displayValues.cost.toLocaleString()}</p>
                                                                </div>
                                                            </div>
                                                            <div className={`flex items-center justify-between rounded-xl border p-3 ${displayValues.profit >= 0 ? 'border-emerald-400/20 bg-emerald-500/10' : 'border-red-400/20 bg-red-500/10'}`}>
                                                                <div>
                                                                    <p className="text-[10px] uppercase tracking-wider text-white/50">Profit</p>
                                                                    <p className={`mt-0.5 text-lg font-black ${displayValues.profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                                        Rs {displayValues.profit.toLocaleString()}
                                                                    </p>
                                                                </div>
                                                                <div className="text-right">
                                                                    <p className="text-[10px] uppercase tracking-wider text-white/50">Margin</p>
                                                                    <p className={`mt-0.5 text-lg font-black ${displayValues.profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                                        {displayValues.margin}%
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <p className="text-center text-[10px] text-white/25">
                                                                Profit = payout after 17.5% commission {!shippingIncluded ? '+ Rs 99 shipping buffer ' : ''}minus your cost
                                                            </p>
                                                        </div>
                                                    );
                                                })()}

                                                {!product?.id && (
                                                    <p className="text-[11px] text-white/35">
                                                        Save the product first to get a live profit calculation from the API.
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </Section>

                                <Section id="shipping" title="Shipping" eyebrow="Step 3" icon={<Package size={16} />}>
                                    <div>
                                        <label htmlFor="weight" className="mb-1 block text-xs font-medium text-neutral-400">
                                            Product weight <span className="font-normal text-white/30">(grams)</span>
                                        </label>
                                        <input
                                            type="number"
                                            name="weight"
                                            id="weight"
                                            value={(formData as any).weight || ''}
                                            onChange={handleChange}
                                            className={fieldClassName}
                                            placeholder="e.g. 350"
                                        />
                                        <p className="mt-1.5 text-[11px] text-white/35">
                                            Used to calculate shipping rates accurately.
                                        </p>
                                    </div>
                                </Section>

                                <Section id="options-variants" title="Variants" eyebrow="Step 4" icon={<Settings2 size={16} />}>
                                    <div className="space-y-5">
                                        {(!formData.options || formData.options.length === 0) && (
                                            <div className="rounded-2xl border border-dashed border-white/10 p-6 text-center">
                                                <button
                                                    type="button"
                                                    onClick={addOption}
                                                    className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/60 transition-colors hover:border-primary/30 hover:text-primary"
                                                >
                                                    <Plus size={22} />
                                                </button>
                                                <p className="mt-3 text-xs text-white/40">Add an option like size or color</p>
                                                <div className="mt-4 flex flex-wrap justify-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => setPresetOption('Size', ['S', 'M', 'L'])}
                                                        className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-white/60 transition-colors hover:border-primary/30 hover:text-white"
                                                    >
                                                        Size S / M / L
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setPresetOption('Size', ['XS', 'S', 'M', 'L', 'XL'])}
                                                        className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-white/60 transition-colors hover:border-primary/30 hover:text-white"
                                                    >
                                                        Size XS / S / M / L / XL
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setPresetOption('Color', ['Black', 'White'])}
                                                        className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-white/60 transition-colors hover:border-primary/30 hover:text-white"
                                                    >
                                                        Color Black / White
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {formData.options && formData.options.length > 0 && formData.options.map((opt, optionIndex) => {
                                            const displayValues = opt.values.length === 0
                                                ? ['']
                                                : opt.values[opt.values.length - 1] === ''
                                                    ? opt.values
                                                    : [...opt.values, ''];

                                            return (
                                                <div key={optionIndex} className="space-y-3 rounded-2xl border border-white/10 bg-black/25 p-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex-1">
                                                            <label className="mb-1 block text-[11px] text-white/40">Option name</label>
                                                            <input
                                                                type="text"
                                                                placeholder="e.g. Size, Color, Material"
                                                                value={opt.name}
                                                                onChange={e => handleOptionChange(optionIndex, e.target.value)}
                                                                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none transition-colors placeholder:text-white/20 focus:border-primary/35"
                                                            />
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => removeOption(optionIndex)}
                                                            className="mt-5 rounded-xl border border-red-500/20 bg-red-500/10 p-2 text-red-300 transition-colors hover:bg-red-500/20"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>

                                                    <div>
                                                        <label className="mb-2 block text-[11px] text-white/40">Option values</label>
                                                        <div className="space-y-2">
                                                            <AnimatePresence initial={false}>
                                                                {displayValues.map((val, valueIndex) => {
                                                                    const isLastField = valueIndex === displayValues.length - 1;
                                                                    const isOnlyField = displayValues.length === 1;

                                                                    return (
                                                                        <motion.div
                                                                            key={`${optionIndex}-${valueIndex}`}
                                                                            initial={{ opacity: 0, height: 0 }}
                                                                            animate={{ opacity: 1, height: 'auto' }}
                                                                            exit={{ opacity: 0, height: 0 }}
                                                                            transition={{ duration: 0.15 }}
                                                                            className="flex items-center gap-2"
                                                                        >
                                                                            {!isLastField && (
                                                                                <div className="flex flex-col gap-0.5">
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={() => moveOptionValue(optionIndex, valueIndex, 'up')}
                                                                                        disabled={valueIndex === 0}
                                                                                        className="rounded-md border border-white/10 bg-white/[0.03] p-0.5 text-white/40 transition-colors hover:text-white disabled:opacity-20"
                                                                                    >
                                                                                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                                                                                            <path d="M5 2L9 8H1L5 2Z" fill="currentColor" />
                                                                                        </svg>
                                                                                    </button>
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={() => moveOptionValue(optionIndex, valueIndex, 'down')}
                                                                                        disabled={valueIndex >= displayValues.length - 2}
                                                                                        className="rounded-md border border-white/10 bg-white/[0.03] p-0.5 text-white/40 transition-colors hover:text-white disabled:opacity-20"
                                                                                    >
                                                                                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                                                                                            <path d="M5 8L1 2H9L5 8Z" fill="currentColor" />
                                                                                        </svg>
                                                                                    </button>
                                                                                </div>
                                                                            )}

                                                                            <input
                                                                                type="text"
                                                                                value={val}
                                                                                placeholder={isLastField ? 'Add value...' : ''}
                                                                                onChange={e => handleOptionValueFieldChange(optionIndex, valueIndex, e.target.value)}
                                                                                onBlur={e => {
                                                                                    if (isLastField && e.target.value !== '') {
                                                                                        addOptionValueField(optionIndex);
                                                                                    }
                                                                                }}
                                                                                className="flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none transition-colors placeholder:text-white/30 focus:border-primary/35"
                                                                            />

                                                                            {!isLastField && !isOnlyField && (
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => removeOptionValueField(optionIndex, valueIndex)}
                                                                                    className="rounded-xl border border-white/10 bg-white/[0.03] p-1.5 text-white/30 transition-colors hover:border-red-400/20 hover:text-red-400"
                                                                                >
                                                                                    <X size={12} />
                                                                                </button>
                                                                            )}
                                                                        </motion.div>
                                                                    );
                                                                })}
                                                            </AnimatePresence>
                                                        </div>
                                                    </div>

                                                    {opt.name.toLowerCase() === 'size' && (
                                                        <div className="mt-1 flex flex-wrap gap-2">
                                                            {sizePresets.map((preset) => (
                                                                <button
                                                                    key={preset}
                                                                    type="button"
                                                                    onClick={() => handleOptionValueChange(optionIndex, preset.split(',').map(item => item.trim()))}
                                                                    className={quickChipClassName}
                                                                >
                                                                    {preset}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}

                                        {formData.options && formData.options.length > 0 && (
                                            <button
                                                type="button"
                                                onClick={addOption}
                                                className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-4 py-2 text-xs font-medium text-white/60 transition-colors hover:text-white"
                                            >
                                                <Plus size={14} />
                                                Add another option
                                            </button>
                                        )}

                                        {formData.variants && formData.variants.length > 0 && (
                                            <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
                                                <div className="grid grid-cols-[1fr_120px_120px] gap-3 border-b border-white/10 px-4 py-2.5">
                                                    <p className="text-[10px] font-mono uppercase tracking-widest text-white/30">Variant</p>
                                                    <p className="text-[10px] font-mono uppercase tracking-widest text-white/30">Price (PKR)</p>
                                                    <p className="text-[10px] font-mono uppercase tracking-widest text-white/30">Qty</p>
                                                </div>
                                                <div className="divide-y divide-white/[0.06]">
                                                    {formData.variants.map(variant => (
                                                        <div key={variant.id} className="grid grid-cols-[1fr_120px_120px] items-center gap-3 px-4 py-3">
                                                            <p className="truncate text-sm text-neutral-300" title={variant.title}>
                                                                {variant.title}
                                                            </p>
                                                            <input
                                                                type="number"
                                                                value={variant.price}
                                                                onChange={e => handleVariantChange(variant.id, 'price', e.target.value)}
                                                                className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-1.5 text-sm text-white outline-none transition-colors focus:border-primary/35"
                                                            />
                                                            <input
                                                                type="number"
                                                                value={variant.inventory?.quantity || 0}
                                                                onChange={e => handleVariantChange(variant.id, 'quantity', e.target.value)}
                                                                className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-1.5 text-sm text-white outline-none transition-colors focus:border-primary/35"
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="flex items-center justify-between border-t border-white/10 bg-black/20 px-4 py-3">
                                                    <p className="text-xs text-white/40">Total inventory</p>
                                                    <p className="text-sm font-semibold text-white">{totalStock} units</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </Section>

                                {isApparel ? (
                                    <div id="sizing-guide" className="scroll-mt-24 space-y-5">
                                        <Section title="Sizing Guide" eyebrow="Step 5" icon={<Ruler size={16} />}>
                                            <div className="space-y-4">
                                                <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                                        <div>
                                                            <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/35">Buyer Confidence</p>
                                                            <h4 className="mt-1 text-sm font-semibold text-white">Keep sizing practical and easy to trust.</h4>
                                                        </div>
                                                        <p className="text-[11px] text-white/35">Only include measurements shoppers actually use.</p>
                                                    </div>
                                                    <div className="mt-4 grid gap-3 md:grid-cols-3">
                                                        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                                                            <p className="text-[11px] font-medium text-white/75">Sizes</p>
                                                            <p className="mt-1 text-[11px] leading-relaxed text-white/45">
                                                                {sizeCount > 0 ? `${sizeCount} sizes are ready from your variants.` : 'Add a Size option in Variants first.'}
                                                            </p>
                                                        </div>
                                                        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                                                            <p className="text-[11px] font-medium text-white/75">Fit notes</p>
                                                            <p className="mt-1 text-[11px] leading-relaxed text-white/45">Use short language like true to size, relaxed, slim, or oversized.</p>
                                                        </div>
                                                        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                                                            <p className="text-[11px] font-medium text-white/75">Measurements</p>
                                                            <p className="mt-1 text-[11px] leading-relaxed text-white/45">Chest, length, waist, or inseam usually matter most. Skip the noise.</p>
                                                        </div>
                                                    </div>
                                                    <div className="mt-4 flex flex-wrap gap-2">
                                                        <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-[11px] font-medium text-white/65">
                                                            {sizeCount || 'No'} sizes detected
                                                        </span>
                                                        <span className={`rounded-full border px-3 py-2 text-[11px] font-medium ${sizeFitReady ? 'border-emerald-400/20 bg-emerald-500/10 text-emerald-300' : 'border-yellow-400/20 bg-yellow-500/10 text-yellow-300'}`}>
                                                            {sizeFitReady ? 'Fit notes ready' : 'Fit notes missing'}
                                                        </span>
                                                        <span className={`rounded-full border px-3 py-2 text-[11px] font-medium ${hasSizing ? 'border-emerald-400/20 bg-emerald-500/10 text-emerald-300' : 'border-yellow-400/20 bg-yellow-500/10 text-yellow-300'}`}>
                                                            {hasSizing ? 'Chart started' : 'Chart not filled'}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                                                    <SizingGuideEditor
                                                        value={formData.sizing_guide}
                                                        onChange={handleSizingGuideUpdate}
                                                        productType={formData.product_type}
                                                        availableSizes={sizeOptionValues}
                                                    />
                                                </div>
                                            </div>
                                        </Section>
                                    </div>
                                ) : (
                                    <div id="sizing-guide" className="scroll-mt-24 rounded-[1.6rem] border border-white/10 bg-white/[0.03] p-5">
                                        <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/35">Step 5</p>
                                        <p className="mt-2 text-sm font-semibold text-white">Sizing guide not required</p>
                                        <p className="mt-1 text-[11px] text-white/45">Sizing appears for apparel product types. Select an apparel category if this product needs measurements.</p>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-4 lg:sticky lg:top-6" id="sidebar-col">
                                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                                    <p className="mb-3 text-[10px] font-mono uppercase tracking-[0.2em] text-white/35">Status</p>
                                    <div className="flex items-center gap-2">
                                        <span className={`h-2 w-2 rounded-full ${product?.id ? 'bg-emerald-400' : 'bg-yellow-400'}`} />
                                        <span className="text-sm font-semibold text-white">
                                            {product?.id ? 'Active' : 'Draft'}
                                        </span>
                                    </div>
                                    {queueId && (
                                        <p className="mt-2 text-[11px] text-white/40">In review queue. Save to update.</p>
                                    )}
                                </div>

                                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                                    <p className="mb-3 text-[10px] font-mono uppercase tracking-[0.2em] text-white/35">Publishing</p>
                                    <div className="space-y-2 text-[11px] text-white/50">
                                        <div className="flex items-center justify-between">
                                            <span>Juno Catalog</span>
                                            <span className={`font-semibold ${product?.id ? 'text-emerald-400' : 'text-white/30'}`}>
                                                {product?.id ? 'Listed' : 'Pending approval'}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span>Discovery feed</span>
                                            <span className={`font-semibold ${product?.id ? 'text-emerald-400' : 'text-white/30'}`}>
                                                {product?.id ? 'Eligible' : '—'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                                    <p className="mb-3 text-[10px] font-mono uppercase tracking-[0.2em] text-white/35">Organisation</p>
                                    <div className="space-y-3">
                                        <div>
                                            <label className="mb-1 block text-[11px] text-white/45">Tags</label>
                                            <input
                                                type="text"
                                                value={tagInput}
                                                onChange={(e) => setTagInput(e.target.value)}
                                                onBlur={(e) => handleTagChange(e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                                                className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs text-white outline-none transition-colors placeholder:text-white/20 focus:border-primary/35"
                                                placeholder="summer, new-arrival"
                                            />
                                        </div>
                                        <div className="flex flex-wrap gap-1.5">
                                            {['new-arrival', 'eid-edit', 'summer', 'festive', 'essentials', 'best-seller'].map((tag) => (
                                                <button
                                                    key={tag}
                                                    type="button"
                                                    onClick={() => addSuggestedTag(tag)}
                                                    className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-[10px] font-medium text-white/60 transition-colors hover:border-primary/30 hover:text-white"
                                                >
                                                    {tag}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="w-full rounded-2xl bg-primary px-4 py-3 text-sm font-black uppercase tracking-[0.08em] text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                                >
                                    {isSaving ? 'Saving...' : product?.id ? 'Save Changes' : 'Submit for Review'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </motion.div>
    );
};

export default ProductEditor;
