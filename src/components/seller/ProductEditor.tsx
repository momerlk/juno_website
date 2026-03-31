import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Product, Variant, Option, Pricing, SizingGuide, Inventory } from '../../constants/types';
import * as api from '../../api/sellerApi';
import { useSellerAuth } from '../../contexts/SellerAuthContext';
import { X, Plus, Trash2, Upload, DollarSign, Tag, Image as ImageIcon, Paperclip, Settings2, Ruler, ArrowLeft, ArrowRight, Video, Loader } from 'lucide-react';
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
const suggestedTags = ['new-arrival', 'eid-edit', 'summer', 'festive', 'essentials', 'best-seller'];
const editorSections = [
    { id: 'basic-information', label: 'Basic', title: 'Basic Information' },
    { id: 'media', label: 'Media', title: 'Media' },
    { id: 'pricing', label: 'Pricing', title: 'Pricing' },
    { id: 'options-variants', label: 'Variants', title: 'Options & Variants' },
    { id: 'organization', label: 'Organization', title: 'Organization' },
    { id: 'sizing-guide', label: 'Sizing', title: 'Sizing Guide' },
];


const ProductEditor: React.FC<ProductEditorProps> = ({ product, queueId, onClose }) => {
    const { seller } = useSellerAuth();
    const [formData, setFormData] = useState<Partial<Product>>({});
    const [isSaving, setIsSaving] = useState(false);
    const [uploadingMedia, setUploadingMedia] = useState<'image' | 'video' | null>(null);
    const [tagInput, setTagInput] = useState('');
    const [activeSection, setActiveSection] = useState('basic-information');
    const contentRef = useRef<HTMLDivElement | null>(null);

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
        if (!options || options.length === 0 || options.every(o => o.values.length === 0)) return [];
        
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
    const primaryPrice = useMemo(() => formData.variants?.find(variant => variant.is_default)?.price || formData.pricing?.price || 0, [formData.variants, formData.pricing?.price]);
    const hasSizing = Boolean(formData.sizing_guide?.size_chart && Object.keys(formData.sizing_guide.size_chart).length > 0);
    const sizeOption = useMemo(() => formData.options?.find((option) => option.name.toLowerCase() === 'size'), [formData.options]);
    const sizeCount = sizeOption?.values?.length || 0;
    const sizeFitReady = Boolean(formData.sizing_guide?.size_fit?.trim());
    const visibleSections = useMemo(
        () => editorSections.filter((section) => section.id !== 'sizing-guide' || isApparel),
        [isApparel],
    );

    const jumpToSection = useCallback((sectionId: string) => {
        const container = contentRef.current;
        if (!container) return;
        const target = container.querySelector<HTMLElement>(`#${sectionId}`);
        if (!target) return;
        const top = target.offsetTop - 12;
        container.scrollTo({ top, behavior: 'smooth' });
        setActiveSection(sectionId);
    }, []);

    useEffect(() => {
        const container = contentRef.current;
        if (!container) return;

        const handleScroll = () => {
            const sections = visibleSections
                .map((section) => {
                    const element = container.querySelector<HTMLElement>(`#${section.id}`);
                    if (!element) return null;
                    return {
                        id: section.id,
                        distance: Math.abs(element.offsetTop - container.scrollTop - 20),
                    };
                })
                .filter(Boolean) as Array<{ id: string; distance: number }>;

            if (sections.length === 0) return;
            sections.sort((a, b) => a.distance - b.distance);
            setActiveSection(sections[0].id);
        };

        handleScroll();
        container.addEventListener('scroll', handleScroll);
        return () => container.removeEventListener('scroll', handleScroll);
    }, [visibleSections]);

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
                <div ref={contentRef} className="min-h-0 overflow-y-auto px-4 py-5 sm:px-6">
                    <div className="mx-auto max-w-5xl space-y-6">
                        <div className="rounded-[1.8rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(255,24,24,0.14),transparent_34%),linear-gradient(145deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-5">
                            <p className="text-[10px] font-mono uppercase tracking-[0.24em] text-primary/75">Product Setup</p>
                            <h3 className="mt-2 text-2xl font-black uppercase tracking-[-0.04em] text-white">
                                {queueId ? 'Fix What Matters And Publish' : product?.id ? 'Edit Product Details' : 'Create A Product'}
                            </h3>
                            <p className="mt-2 max-w-2xl text-sm text-white/58">
                                Work top to bottom. Start with the product details, then add photos, price, stock, and sizing.
                            </p>
                            <div className="mt-4 flex flex-wrap gap-2">
                                {[
                                    { label: primaryPrice > 0 ? `Price: Rs ${primaryPrice.toLocaleString()}` : 'Price not set' },
                                    { label: `${formData.variants?.length || 0} variants` },
                                    { label: `${totalStock} in stock` },
                                    { label: isApparel ? (hasSizing ? 'Sizing ready' : 'Sizing pending') : 'Sizing optional' },
                                ].map((item) => (
                                    <span key={item.label} className="rounded-full border border-white/10 bg-black/25 px-3 py-2 text-xs font-semibold text-white/70">
                                        {item.label}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-3">
                            <div className="flex gap-2 overflow-x-auto pb-1">
                                {visibleSections.map((section) => (
                                    <button
                                        key={section.id}
                                        type="button"
                                        onClick={() => jumpToSection(section.id)}
                                        className={`whitespace-nowrap rounded-full border px-3 py-2 text-xs font-black uppercase tracking-[0.08em] transition-colors ${
                                            activeSection === section.id
                                                ? 'border-primary/30 bg-primary text-white'
                                                : 'border-white/10 bg-black/25 text-white/65'
                                        }`}
                                    >
                                        {section.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <Section id="basic-information" title="Basic Information" eyebrow="Step 1" icon={<Paperclip size={18} />}>
                            <div className="space-y-5">
                                <div>
                                    <label htmlFor="title" className="block text-sm font-medium text-neutral-300">Product title</label>
                                    <input
                                        type="text"
                                        name="title"
                                        id="title"
                                        value={formData.title || ''}
                                        onChange={handleChange}
                                        className={fieldClassName}
                                        placeholder="Classic lawn kurta, cropped denim jacket, embroidered waistcoat..."
                                        required
                                    />
                                </div>
                                <div>
                                    <label htmlFor="description" className="block text-sm font-medium text-neutral-300">Description</label>
                                    <textarea
                                        name="description"
                                        id="description"
                                        value={formData.description || ''}
                                        onChange={handleChange}
                                        className={`${fieldClassName} h-28`}
                                        placeholder="Explain the fabric, fit, and what makes this piece worth buying."
                                    />
                                </div>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div>
                                        <label htmlFor="product_type" className="block text-sm font-medium text-neutral-300">Product type</label>
                                        <select name="product_type" id="product_type" value={formData.product_type || ''} onChange={handleChange} className={fieldClassName} required>
                                            <option value="" className="bg-neutral-900">Select a type</option>
                                            {productTypes.map(type => <option key={type} value={type} className="bg-neutral-900">{type}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label htmlFor="gender" className="block text-sm font-medium text-neutral-300">Gender</label>
                                        <select id="gender" value={currentGender} onChange={handleGenderChange} className={fieldClassName} required>
                                            <option value="" className="bg-neutral-900">Select gender</option>
                                            <option value="male" className="bg-neutral-900">Male</option>
                                            <option value="female" className="bg-neutral-900">Female</option>
                                            <option value="unisex" className="bg-neutral-900">Unisex</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="rounded-[1.2rem] border border-white/10 bg-black/25 p-4">
                                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-white/45">Quick setup</p>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {['Eastern', 'Western', 'Accessories', 'Footwear'].map((type) => (
                                            <button key={type} type="button" onClick={() => setFormData(prev => ({ ...prev, product_type: type }))} className={quickChipClassName}>
                                                {type}
                                            </button>
                                        ))}
                                        {['female', 'male', 'unisex'].map((gender) => (
                                            <button key={gender} type="button" onClick={() => handleGenderChange({ target: { value: gender } } as React.ChangeEvent<HTMLSelectElement>)} className={quickChipClassName}>
                                                {gender}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </Section>

                        <Section id="media" title="Media" eyebrow="Step 2" icon={<ImageIcon size={18} />}>
                            <div className="space-y-5">
                                <div className="rounded-[1.2rem] border border-white/10 bg-black/25 p-4">
                                    <h4 className="text-base font-black uppercase tracking-[-0.03em] text-white">Product photos</h4>
                                    <p className="mt-1 text-sm text-white/55">Upload clear images first. The first image becomes the cover image customers see.</p>
                                    <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                                        <AnimatePresence>
                                            {formData.images?.map((url, index) => (
                                                <motion.div layout key={url} className="relative overflow-hidden rounded-[1.1rem] border border-white/10 bg-black/30">
                                                    <img src={getShopifyThumbnail(url)} loading="lazy" alt={`Product image ${index + 1}`} className="h-32 w-full object-cover" />
                                                    <div className="absolute left-3 top-3 rounded-full bg-black/70 px-2 py-1 text-[10px] font-mono uppercase tracking-[0.16em] text-white/80">
                                                        {index === 0 ? 'Cover' : `Image ${index + 1}`}
                                                    </div>
                                                    <div className="border-t border-white/10 bg-black/55 p-2">
                                                        <div className="flex items-center justify-between gap-1">
                                                            <button type="button" onClick={() => handleReorderImage(index, 'left')} className="rounded-lg border border-white/10 bg-white/[0.04] p-2 text-white/80 transition-colors hover:bg-white/[0.08] disabled:opacity-40" disabled={index === 0}>
                                                                <ArrowLeft size={14} />
                                                            </button>
                                                            <button type="button" onClick={() => handleRemoveImage(index)} className="rounded-lg border border-red-500/20 bg-red-500/10 p-2 text-red-300 transition-colors hover:bg-red-500/20">
                                                                <Trash2 size={14} />
                                                            </button>
                                                            <button type="button" onClick={() => handleReorderImage(index, 'right')} className="rounded-lg border border-white/10 bg-white/[0.04] p-2 text-white/80 transition-colors hover:bg-white/[0.08] disabled:opacity-40" disabled={index === (formData.images?.length || 0) - 1}>
                                                                <ArrowRight size={14} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>
                                        <label htmlFor="image-upload" className={`flex h-32 cursor-pointer flex-col items-center justify-center rounded-[1.1rem] border-2 border-dashed border-white/10 bg-white/[0.03] p-4 text-center text-neutral-400 transition-colors ${uploadingMedia ? 'cursor-not-allowed' : 'hover:border-primary/50 hover:bg-primary/5 hover:text-primary'}`}>
                                            {uploadingMedia === 'image' ? (
                                                <>
                                                    <Loader className="animate-spin" size={22} />
                                                    <span className="mt-2 text-xs font-semibold">Uploading image...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Upload size={22} />
                                                    <span className="mt-2 text-sm font-semibold">Add image</span>
                                                    <span className="mt-1 text-xs text-white/40">JPEG, PNG, WEBP</span>
                                                </>
                                            )}
                                            <input id="image-upload" type="file" accept="image/*" onChange={(e) => e.target.files && handleMediaUpload(e.target.files[0], 'image')} className="hidden" disabled={uploadingMedia !== null} />
                                        </label>
                                    </div>
                                </div>

                                <div className="rounded-[1.2rem] border border-white/10 bg-black/25 p-4">
                                    <h4 className="text-base font-black uppercase tracking-[-0.03em] text-white">Optional product video</h4>
                                    <p className="mt-1 text-sm text-white/55">Add a short video only if it helps explain movement, fabric, or styling.</p>
                                    <div className="mt-4">
                                        {formData.video_url ? (
                                            <div className="max-w-sm overflow-hidden rounded-[1.1rem] border border-white/10 bg-black/30">
                                                <video src={formData.video_url} className="h-40 w-full bg-black object-cover" controls />
                                                <div className="flex justify-end border-t border-white/10 p-3">
                                                    <button type="button" onClick={() => setFormData(p => ({ ...p, video_url: '' }))} className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm font-semibold text-red-300 transition-colors hover:bg-red-500/20">
                                                        Remove video
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <label htmlFor="video-upload" className={`flex h-32 max-w-sm cursor-pointer flex-col items-center justify-center rounded-[1.1rem] border-2 border-dashed border-white/10 bg-white/[0.03] p-4 text-center text-neutral-400 transition-colors ${uploadingMedia ? 'cursor-not-allowed' : 'hover:border-primary/50 hover:bg-primary/5 hover:text-primary'}`}>
                                                {uploadingMedia === 'video' ? (
                                                    <>
                                                        <Loader className="animate-spin" size={22} />
                                                        <span className="mt-2 text-xs font-semibold">Uploading video...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Video size={22} />
                                                        <span className="mt-2 text-sm font-semibold">Add video</span>
                                                        <span className="mt-1 text-xs text-white/40">Short product reel or fit clip</span>
                                                    </>
                                                )}
                                                <input id="video-upload" type="file" accept="video/*" onChange={(e) => e.target.files && handleMediaUpload(e.target.files[0], 'video')} className="hidden" disabled={uploadingMedia !== null} />
                                            </label>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </Section>

                        <Section id="pricing" title="Pricing" eyebrow="Step 3" icon={<DollarSign size={18} />}>
                            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
                                <div className="space-y-4">
                                    <div>
                                        <label htmlFor="price" className="block text-sm font-medium text-neutral-300">Selling price (PKR)</label>
                                        <input type="number" name="price" id="price" value={formData.pricing?.price || ''} onChange={handlePricingChange} className={fieldClassName} required />
                                        <p className="mt-2 text-xs text-white/45">This is the price shoppers will pay.</p>
                                    </div>
                                    <div>
                                        <label htmlFor="compare_at_price" className="block text-sm font-medium text-neutral-300">Original price (optional)</label>
                                        <input type="number" name="compare_at_price" id="compare_at_price" value={formData.pricing?.compare_at_price || ''} onChange={handlePricingChange} className={fieldClassName} />
                                        <p className="mt-2 text-xs text-white/45">Use this only if the item is on sale and you want to show a struck-through original price.</p>
                                    </div>
                                </div>
                                <div className="rounded-[1.2rem] border border-white/10 bg-black/25 p-4">
                                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-white/45">Pricing summary</p>
                                    <div className="mt-4 space-y-3 text-sm">
                                        <div className="flex items-center justify-between text-white/70">
                                            <span>Live price</span>
                                            <span className="font-semibold text-white">{primaryPrice > 0 ? `Rs ${primaryPrice.toLocaleString()}` : 'Not set'}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-white/70">
                                            <span>Variants</span>
                                            <span className="font-semibold text-white">{formData.variants?.length || 0}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-white/70">
                                            <span>Total stock</span>
                                            <span className="font-semibold text-white">{totalStock}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Section>

                        <Section id="options-variants" title="Options & Variants" eyebrow="Step 4" icon={<Settings2 size={18} />}>
                            <div className="space-y-5">
                                <div className="rounded-[1.2rem] border border-white/10 bg-black/25 p-4">
                                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-white/45">Quick presets</p>
                                    <p className="mt-1 text-sm text-white/55">Use a preset if this product only needs standard size or color options.</p>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        <button type="button" onClick={() => setPresetOption('Size', ['S', 'M', 'L'])} className={quickChipClassName}>Size S-M-L</button>
                                        <button type="button" onClick={() => setPresetOption('Size', ['XS', 'S', 'M', 'L', 'XL'])} className={quickChipClassName}>Size XS-XL</button>
                                        <button type="button" onClick={() => setPresetOption('Color', ['Black', 'White'])} className={quickChipClassName}>Color Black/White</button>
                                    </div>
                                </div>

                                {formData.options?.map((opt, index) => (
                                    <div key={index} className="rounded-[1.2rem] border border-white/10 bg-black/25 p-4">
                                        <div className="grid gap-3 md:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)_auto]">
                                            <input type="text" placeholder="Option name, for example Size" value={opt.name} onChange={e => handleOptionChange(index, e.target.value)} className="w-full rounded-[0.95rem] border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none transition-colors placeholder:text-white/20 focus:border-primary/35" />
                                            <input type="text" placeholder="Option values, separated by commas" value={opt.values.join(', ')} onChange={e => handleOptionValueChange(index, e.target.value.split(',').map(s => s.trim()).filter(Boolean))} className="w-full rounded-[0.95rem] border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none transition-colors placeholder:text-white/20 focus:border-primary/35" />
                                            <button type="button" onClick={() => removeOption(index)} className="rounded-[0.95rem] border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm font-semibold text-red-300 transition-colors hover:bg-red-500/20">
                                                Remove
                                            </button>
                                        </div>
                                        {opt.name.toLowerCase() === 'size' && (
                                            <div className="mt-3 flex flex-wrap gap-2">
                                                {sizePresets.map((preset) => (
                                                    <button
                                                        key={preset}
                                                        type="button"
                                                        onClick={() => handleOptionValueChange(index, preset.split(',').map(item => item.trim()))}
                                                        className={quickChipClassName}
                                                    >
                                                        {preset}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}

                                <button type="button" onClick={addOption} className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-white/78 transition-colors hover:text-white">
                                    <Plus size={16} />
                                    <span>Add another option</span>
                                </button>

                                {formData.variants && formData.variants.length > 0 && (
                                    <div className="rounded-[1.2rem] border border-white/10 bg-white/[0.03] p-4">
                                        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                                            <div>
                                                <h4 className="text-base font-black uppercase tracking-[-0.03em] text-white">Variant pricing and stock</h4>
                                                <p className="mt-1 text-sm text-white/55">Edit each variant only if it differs from the base product.</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const price = formData.pricing?.price || 0;
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        variants: prev.variants?.map((variant) => ({ ...variant, price })) || [],
                                                    }));
                                                }}
                                                className={quickChipClassName}
                                            >
                                                Apply base price to all
                                            </button>
                                        </div>
                                        <div className="space-y-3">
                                            {formData.variants.map(variant => (
                                                <div key={variant.id} className="grid gap-4 rounded-[1.1rem] border border-white/10 bg-black/25 p-4 md:grid-cols-[minmax(0,1.2fr)_10rem_10rem]">
                                                    <div>
                                                        <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-white/25">Variant</p>
                                                        <p className="mt-2 truncate text-sm font-semibold text-neutral-300" title={variant.title}>{variant.title}</p>
                                                    </div>
                                                    <div>
                                                        <label className="mb-1 block text-xs text-neutral-500">Price</label>
                                                        <input type="number" value={variant.price} onChange={e => handleVariantChange(variant.id, 'price', e.target.value)} className="w-full rounded-[0.9rem] border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-primary/35" />
                                                    </div>
                                                    <div>
                                                        <label className="mb-1 block text-xs text-neutral-500">Stock</label>
                                                        <input type="number" value={variant.inventory?.quantity || 0} onChange={e => handleVariantChange(variant.id, 'quantity', e.target.value)} className="w-full rounded-[0.9rem] border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-primary/35" />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </Section>

                        <Section id="organization" title="Organization" eyebrow="Step 5" icon={<Tag size={18} />}>
                            <div>
                                <label htmlFor="tags" className="block text-sm font-medium text-neutral-300">Tags</label>
                                <input
                                    type="text"
                                    id="tags"
                                    value={tagInput}
                                    onChange={(e) => setTagInput(e.target.value)}
                                    onBlur={(e) => handleTagChange(e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                                    className={fieldClassName}
                                    placeholder="summer, new-arrival, sale"
                                />
                                <p className="mt-2 text-xs text-white/45">Use a few clean tags to keep products grouped correctly.</p>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {suggestedTags.map((tag) => (
                                        <button key={tag} type="button" onClick={() => addSuggestedTag(tag)} className={quickChipClassName}>
                                            {tag}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </Section>

                        {isApparel ? (
                            <div id="sizing-guide" className="scroll-mt-24 space-y-5">
                                <Section title="Sizing Guide" eyebrow="Step 6" icon={<Ruler size={18} />}>
                                    <div className="space-y-5">
                                        <div className="rounded-[1.2rem] border border-white/10 bg-black/25 p-4">
                                            <h4 className="text-base font-black uppercase tracking-[-0.03em] text-white">How to fill this section</h4>
                                            <div className="mt-3 grid gap-3 md:grid-cols-3">
                                                <div className="rounded-[1rem] border border-white/10 bg-white/[0.03] p-3">
                                                    <p className="text-sm font-semibold text-white">1. Confirm sizes</p>
                                                    <p className="mt-1 text-xs leading-relaxed text-white/50">{sizeCount > 0 ? `${sizeCount} sizes are already available from your variants.` : 'Add a Size option under Variants first.'}</p>
                                                </div>
                                                <div className="rounded-[1rem] border border-white/10 bg-white/[0.03] p-3">
                                                    <p className="text-sm font-semibold text-white">2. Add fit notes</p>
                                                    <p className="mt-1 text-xs leading-relaxed text-white/50">Keep it simple: true to size, relaxed fit, slim fit, or oversized.</p>
                                                </div>
                                                <div className="rounded-[1rem] border border-white/10 bg-white/[0.03] p-3">
                                                    <p className="text-sm font-semibold text-white">3. Fill only useful measurements</p>
                                                    <p className="mt-1 text-xs leading-relaxed text-white/50">Buyers usually need chest, length, waist, or inseam. Skip anything unnecessary.</p>
                                                </div>
                                            </div>
                                            <div className="mt-4 flex flex-wrap gap-2">
                                                <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-semibold text-white/70">
                                                    {sizeCount || 'No'} sizes detected
                                                </span>
                                                <span className={`rounded-full border px-3 py-2 text-xs font-semibold ${sizeFitReady ? 'border-emerald-400/20 bg-emerald-500/10 text-emerald-300' : 'border-yellow-400/20 bg-yellow-500/10 text-yellow-300'}`}>
                                                    {sizeFitReady ? 'Fit notes ready' : 'Fit notes missing'}
                                                </span>
                                                <span className={`rounded-full border px-3 py-2 text-xs font-semibold ${hasSizing ? 'border-emerald-400/20 bg-emerald-500/10 text-emerald-300' : 'border-yellow-400/20 bg-yellow-500/10 text-yellow-300'}`}>
                                                    {hasSizing ? 'Chart started' : 'Chart not filled'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="rounded-[1.2rem] border border-white/10 bg-white/[0.03] p-4">
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
                            <div id="sizing-guide" className="scroll-mt-24 rounded-[1.8rem] border border-white/10 bg-white/[0.03] p-5">
                                <p className="text-sm font-semibold text-white">Sizing guide not required</p>
                                <p className="mt-2 text-sm text-white/50">Sizing appears for apparel product types. Select an apparel type if this product needs measurements.</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="sticky bottom-0 flex items-center justify-end gap-3 border-t border-white/10 bg-black/70 px-6 py-4 backdrop-blur-xl">
                    <button type="button" onClick={onClose} className="rounded-xl px-5 py-2 text-neutral-300 transition-colors hover:bg-white/10 hover:text-white">Cancel</button>
                    <button type="submit" disabled={isSaving} className="rounded-xl border border-primary/30 bg-primary px-5 py-2 font-semibold text-white transition-colors hover:bg-primary/90 disabled:opacity-50">
                        {isSaving ? 'Saving...' : 'Save Product'}
                    </button>
                </div>
            </form>
        </motion.div>
    );
};

export default ProductEditor;
