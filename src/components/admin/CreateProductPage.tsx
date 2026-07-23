import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Loader,
  Package,
  Plus,
  Trash2,
  Upload,
  Video,
  X,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { uploadFileAndGetUrl, uploadImagesAndGetUrls } from '../../api/shared';
import { AdminPortal } from '../../api/adminApi';
import type { Option, Variant } from '../../constants/types';
import {
  BADGE_LABELS,
  EMPTY_CREATE_DRAFT,
  asArray,
  buildAdminProductPayload,
  getSellerId,
  getSellerName,
  type BadgeKey,
  type CreateProductDraft,
  type SellerProfile,
} from './productManagement';

const fieldClassName =
  'mt-1 w-full rounded-lg border border-white/10 bg-black/25 px-3 py-2.5 text-sm text-white outline-none transition-colors placeholder:text-white/20 focus:border-white/25';
const cardClassName = 'rounded-xl border border-white/10 bg-[#101010] p-4';
const subtleCardClassName = 'rounded-xl border border-white/10 bg-black/20 p-4';
const sizePresets = ['XS, S, M, L, XL', 'S, M, L', '30, 32, 34, 36', 'One Size'];

const cloneDraft = (): CreateProductDraft => ({
  ...EMPTY_CREATE_DRAFT,
  badges: { ...EMPTY_CREATE_DRAFT.badges },
  options: [],
  variants: [],
  images: [],
  sizing_guide: { size_chart: {}, size_fit: '', measurement_unit: 'inch' },
});

const getShopifyThumbnail = (url: string, size = '240x240') => {
  if (!url || !url.includes('shopify.com')) return url;
  const [path, query] = url.split('?');
  const lastDotIndex = path.lastIndexOf('.');
  if (lastDotIndex === -1) return url;
  return `${path.slice(0, lastDotIndex)}_${size}${path.slice(lastDotIndex)}${query ? `?${query}` : ''}`;
};

const buildVariantTitle = (options: Record<string, string>) => Object.values(options).join(' / ') || 'Default';

const CreateProductPage: React.FC = () => {
  const [sellers, setSellers] = useState<SellerProfile[]>([]);
  const [createDraft, setCreateDraft] = useState<CreateProductDraft>(cloneDraft);
  const [createError, setCreateError] = useState('');
  const [createMessage, setCreateMessage] = useState('');
  const [actionKey, setActionKey] = useState('');
  const [uploadingMedia, setUploadingMedia] = useState<'image' | 'video' | 'size-chart' | null>(null);
  const [imageOptionName, setImageOptionName] = useState('');
  const [imageOptionValue, setImageOptionValue] = useState('');

  useEffect(() => {
    const loadSellers = async () => {
      const response = await AdminPortal.listSellers({ limit: 500, status: 'active' });
      if (response.ok) setSellers(asArray(response.body));
    };
    void loadSellers();
  }, []);

  const currentSeller = useMemo(
    () => sellers.find((entry) => getSellerId(entry) === createDraft.seller_id),
    [createDraft.seller_id, sellers],
  );
  const totalStock = useMemo(
    () => (createDraft.variants || []).reduce((sum, variant) => sum + Math.max(0, Number(variant.inventory?.quantity || 0)), 0),
    [createDraft.variants],
  );
  const hasSizing = Boolean(
    createDraft.sizing_guide?.size_fit?.trim() || Object.keys(createDraft.sizing_guide?.size_chart || {}).length > 0 || createDraft.sizing_guide?.image_url?.trim() || createDraft.sizing_guide?.html_table?.trim(),
  );
  const imageOption = useMemo(
    () => createDraft.options.find((option) => option.name.trim() === imageOptionName) || createDraft.options[0],
    [createDraft.options, imageOptionName],
  );
  const selectedImageOptionName = imageOption?.name.trim() || '';
  const selectedImageOptionValue = imageOption?.values.includes(imageOptionValue) ? imageOptionValue : imageOption?.values[0] || '';

  const generateVariantCombinations = useCallback((options: Option[]) => {
    const normalizedOptions = options
      .map((option) => ({
        ...option,
        name: option.name.trim(),
        values: option.values.map((value) => value.trim()).filter(Boolean),
      }))
      .filter((option) => option.name && option.values.length > 0);

    if (!normalizedOptions.length) return [];

    const combinations: Record<string, string>[] = [];
    const generate = (index: number, current: Record<string, string>) => {
      if (index === normalizedOptions.length) {
        combinations.push(current);
        return;
      }
      normalizedOptions[index].values.forEach((value) => {
        generate(index + 1, { ...current, [normalizedOptions[index].name]: value });
      });
    };

    generate(0, {});
    return combinations;
  }, []);

  useEffect(() => {
    if (!createDraft.options.length) return;
    const basePrice = Number(createDraft.price) > 0 ? Number(createDraft.price) : 0;
    const defaultQuantity = Math.max(0, Number(createDraft.available_quantity) || 0);
    const combinations = generateVariantCombinations(createDraft.options);
    if (!combinations.length) return;

    setCreateDraft((prev) => {
      const nextVariants = combinations.map((combo, index) => {
        const title = buildVariantTitle(combo);
        const existingVariant = prev.variants.find((variant) => variant.title === title);
        return {
          id: existingVariant?.id || `new-${index}`,
          sku: existingVariant?.sku || '',
          title,
          options: combo,
          image_url: existingVariant?.image_url,
          price: existingVariant?.price ?? basePrice,
          compare_at_price: existingVariant?.compare_at_price,
          inventory: existingVariant?.inventory || { quantity: defaultQuantity, available_quantity: defaultQuantity },
          position: index,
          is_default: existingVariant?.is_default ?? index === 0,
          available: existingVariant?.available ?? Number(existingVariant?.inventory?.quantity || 0) > 0,
        } as Variant;
      });
      return { ...prev, variants: nextVariants };
    });
  }, [createDraft.options, createDraft.price, createDraft.available_quantity, generateVariantCombinations]);

  const handleDraftField = <K extends keyof CreateProductDraft>(key: K, value: CreateProductDraft[K]) => {
    setCreateDraft((prev) => ({ ...prev, [key]: value }));
  };

  const handleImageUpload = async (files: FileList) => {
    if (!files.length) return;
    setUploadingMedia('image');
    setCreateError('');
    try {
      const urls = await uploadImagesAndGetUrls(files);
      setCreateDraft((prev) => ({ ...prev, images: [...prev.images, ...urls] }));
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : 'Image upload failed.');
    } finally {
      setUploadingMedia(null);
    }
  };

  const handleMediaUpload = async (file: File) => {
    if (!file) return;
    setUploadingMedia('video');
    setCreateError('');
    try {
      const url = await uploadFileAndGetUrl(file, 'high_quality');
      setCreateDraft((prev) => ({ ...prev, video_url: url }));
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : 'Upload failed.');
    } finally {
      setUploadingMedia(null);
    }
  };

  const handleSizeChartUpload = async (file: File) => {
    setUploadingMedia('size-chart');
    setCreateError('');
    try {
      const image_url = await uploadFileAndGetUrl(file, 'high_quality');
      handleDraftField('sizing_guide', { ...createDraft.sizing_guide, image_url });
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : 'Size chart upload failed.');
    } finally {
      setUploadingMedia(null);
    }
  };

  const handleRemoveImage = (index: number) => {
    setCreateDraft((prev) => {
      const image_url = prev.images[index];
      return {
        ...prev,
        images: prev.images.filter((_, imageIndex) => imageIndex !== index),
        variants: prev.variants.map((variant) => variant.image_url === image_url ? { ...variant, image_url: undefined } : variant),
      };
    });
  };

  const handleReorderImage = (index: number, direction: 'left' | 'right') => {
    setCreateDraft((prev) => {
      const images = [...prev.images];
      const targetIndex = direction === 'left' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= images.length) return prev;
      [images[index], images[targetIndex]] = [images[targetIndex], images[index]];
      return { ...prev, images };
    });
  };

  const handleOptionNameChange = (index: number, name: string) => {
    setCreateDraft((prev) => {
      const options = [...prev.options];
      options[index] = { ...options[index], name };
      return { ...prev, options };
    });
  };

  const handleOptionValueFieldChange = (optionIndex: number, valueIndex: number, value: string) => {
    setCreateDraft((prev) => {
      const options = [...prev.options];
      const values = [...options[optionIndex].values];
      values[valueIndex] = value;
      options[optionIndex] = { ...options[optionIndex], values };
      return { ...prev, options };
    });
  };

  const handleOptionValueChange = (optionIndex: number, values: string[]) => {
    setCreateDraft((prev) => {
      const options = [...prev.options];
      options[optionIndex] = { ...options[optionIndex], values };
      return { ...prev, options };
    });
  };

  const addOption = () => {
    setCreateDraft((prev) => ({ ...prev, options: [...prev.options, { name: '', values: [''], required: true }] }));
  };

  const removeOption = (index: number) => {
    setCreateDraft((prev) => ({
      ...prev,
      options: prev.options.filter((_, optionIndex) => optionIndex !== index),
      variants: prev.options.length === 1 ? [] : prev.variants,
    }));
  };

  const addOptionValueField = (optionIndex: number) => {
    setCreateDraft((prev) => {
      const options = [...prev.options];
      options[optionIndex] = { ...options[optionIndex], values: [...options[optionIndex].values, ''] };
      return { ...prev, options };
    });
  };

  const addNextOptionValue = (optionIndex: number, valueIndex: number) => {
    addOptionValueField(optionIndex);
    requestAnimationFrame(() => document.getElementById(`option-${optionIndex}-value-${valueIndex + 1}`)?.focus());
  };

  const removeOptionValueField = (optionIndex: number, valueIndex: number) => {
    setCreateDraft((prev) => {
      const options = [...prev.options];
      options[optionIndex] = {
        ...options[optionIndex],
        values: options[optionIndex].values.filter((_, index) => index !== valueIndex),
      };
      return { ...prev, options };
    });
  };

  const setPresetOption = (name: string, values: string[]) => {
    setCreateDraft((prev) => {
      const options = [...prev.options];
      const existingIndex = options.findIndex((option) => option.name.toLowerCase() === name.toLowerCase());
      if (existingIndex >= 0) {
        options[existingIndex] = { ...options[existingIndex], name, values };
      } else {
        options.push({ name, values, required: true });
      }
      return { ...prev, options };
    });
  };

  const handleVariantChange = (variantId: string, field: 'price' | 'quantity' | 'sku', value: string) => {
    setCreateDraft((prev) => ({
      ...prev,
      variants: prev.variants.map((variant) => {
        if (variant.id !== variantId) return variant;
        if (field === 'sku') return { ...variant, sku: value };
        const numericValue = Math.max(0, Number(value || 0));
        if (field === 'price') return { ...variant, price: numericValue };
        return {
          ...variant,
          inventory: { ...variant.inventory, quantity: numericValue, available_quantity: numericValue },
          available: numericValue > 0,
        };
      }),
    }));
  };

  const assignImageToOptionValue = (image_url: string) => {
    if (!selectedImageOptionName || !selectedImageOptionValue) return;
    setCreateDraft((prev) => ({
      ...prev,
      variants: prev.variants.map((variant) => variant.options[selectedImageOptionName] === selectedImageOptionValue ? { ...variant, image_url } : variant),
    }));
  };

  const handleDefaultStockChange = (value: string) => {
    const quantity = Math.max(0, Number(value) || 0);
    setCreateDraft((prev) => ({
      ...prev,
      available_quantity: value,
      variants: prev.variants.map((variant) => ({
        ...variant,
        inventory: { ...variant.inventory, quantity, available_quantity: quantity },
        available: quantity > 0,
      })),
    }));
  };

  const handleBasePriceChange = (value: string) => {
    const price = Math.max(0, Number(value) || 0);
    setCreateDraft((prev) => ({ ...prev, price: value, variants: prev.variants.map((variant) => ({ ...variant, price })) }));
  };

  const validateDraft = () => {
    const issues: string[] = [];
    if (!createDraft.seller_id) issues.push('Seller is required.');
    if (!createDraft.title.trim()) issues.push('Title is required.');
    if (!createDraft.description.trim()) issues.push('Description is required.');
    if (!Number.isFinite(Number(createDraft.price)) || Number(createDraft.price) <= 0) issues.push('Enter a valid price.');
    if (!createDraft.images.length) issues.push('Add at least one image.');
    if (createDraft.variants.length > 0 && totalStock <= 0) issues.push('Variant stock cannot be zero.');
    if (createDraft.variants.length === 0 && Number(createDraft.available_quantity) < 0) issues.push('Enter a valid stock quantity.');
    if (issues.length > 0) {
      setCreateError(issues.join(' '));
      return false;
    }
    return true;
  };

  const createProduct = async () => {
    if (!validateDraft()) return;
    setCreateError('');
    setCreateMessage('');
    setActionKey('create-product');
    try {
      const response = await AdminPortal.createProduct(buildAdminProductPayload(createDraft, currentSeller));
      if (!response.ok) throw new Error((response.body as any)?.message || 'Failed to create product');
      setCreateDraft(cloneDraft());
      setCreateMessage('Product created in catalog.');
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create product');
    } finally {
      setActionKey('');
    }
  };

  return (
    <div className="mt-4 space-y-4 text-neutral-100">
      <section className="rounded-xl border border-white/10 bg-[#121212] p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Package size={18} className="text-primary" />
            <div>
              <h2 className="text-base font-semibold">Create Product</h2>
              <p className="text-xs text-neutral-500">Admin direct-to-catalog creation with seller assignment, variants, media, badges, and merchandising controls.</p>
            </div>
          </div>
          <Link to="/admin/products" className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-[#1a1a1a] px-3 py-2 text-xs text-neutral-100">
            <ArrowLeft size={13} />
            Back to products
          </Link>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <section className={cardClassName}>
            <div className="mb-4 flex items-center gap-2">
              <Package size={16} className="text-primary" />
              <h3 className="text-sm font-semibold">Product details</h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-neutral-400">Title</label>
                <input
                  value={createDraft.title}
                  onChange={(e) => handleDraftField('title', e.target.value)}
                  placeholder="Classic lawn kurta, cropped denim jacket..."
                  className={fieldClassName}
                />
              </div>

              <div>
                <label className="text-xs text-neutral-400">Description</label>
                <textarea
                  value={createDraft.description}
                  onChange={(e) => handleDraftField('description', e.target.value)}
                  rows={5}
                  placeholder="Explain the fabric, fit, and what makes this piece worth buying."
                  className={`${fieldClassName} resize-none`}
                />
              </div>

              <div>
                <label className="text-xs text-neutral-400">Short description</label>
                <input
                  value={createDraft.short_description}
                  onChange={(e) => handleDraftField('short_description', e.target.value)}
                  placeholder="Optional merchandising summary"
                  className={fieldClassName}
                />
              </div>


            </div>
          </section>

          <section className={cardClassName}>
            <div className="mb-4 flex items-center gap-2">
              <Upload size={16} className="text-primary" />
              <h3 className="text-sm font-semibold">Media</h3>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {createDraft.images.map((url, index) => (
                <div key={`${url}-${index}`} className="overflow-hidden rounded-lg border border-white/10 bg-black/30">
                  <img src={getShopifyThumbnail(url)} alt={`Product ${index + 1}`} className="h-28 w-full object-cover" />
                  <div className="flex items-center justify-between border-t border-white/10 bg-black/60 px-2 py-2">
                    <button
                      type="button"
                      onClick={() => handleReorderImage(index, 'left')}
                      disabled={index === 0}
                      className="rounded-md border border-white/10 bg-white/[0.04] p-1 text-white/70 disabled:opacity-30"
                    >
                      <ArrowLeft size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="rounded-md border border-red-500/20 bg-red-500/10 p-1 text-red-300"
                    >
                      <Trash2 size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleReorderImage(index, 'right')}
                      disabled={index === createDraft.images.length - 1}
                      className="rounded-md border border-white/10 bg-white/[0.04] p-1 text-white/70 disabled:opacity-30"
                    >
                      <ArrowRight size={12} />
                    </button>
                  </div>
                </div>
              ))}

              <label className="flex h-28 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-white/15 bg-black/20 text-center text-xs text-white/55 transition-colors hover:border-white/25">
                {uploadingMedia === 'image' ? <Loader size={18} className="animate-spin" /> : <Upload size={18} />}
                <span className="mt-2">Add images (up to 10)</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  className="hidden"
                  disabled={uploadingMedia !== null}
                  multiple
                  onChange={(e) => e.target.files && void handleImageUpload(e.target.files)}
                />
              </label>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
              <div>
                <label className="text-xs text-neutral-400">Video URL</label>
                <input
                  value={createDraft.video_url}
                  onChange={(e) => handleDraftField('video_url', e.target.value)}
                  placeholder="Optional product video URL"
                  className={fieldClassName}
                />
              </div>
              <label className="flex cursor-pointer items-end">
                <span className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-[#1a1a1a] px-3 py-2 text-xs text-white">
                  {uploadingMedia === 'video' ? <Loader size={14} className="animate-spin" /> : <Video size={14} />}
                  Upload video
                </span>
                <input
                  type="file"
                  accept="video/*"
                  className="hidden"
                  disabled={uploadingMedia !== null}
                  onChange={(e) => e.target.files?.[0] && void handleMediaUpload(e.target.files[0])}
                />
              </label>
            </div>
          </section>

          <section className={cardClassName}>
            <div className="mb-4 flex items-center gap-2">
              <Package size={16} className="text-primary" />
              <h3 className="text-sm font-semibold">Price and stock</h3>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <label className="text-xs text-neutral-400">
                Price
                <input
                  value={createDraft.price}
                  onChange={(e) => handleBasePriceChange(e.target.value)}
                  type="number"
                  min="0"
                  placeholder="PKR"
                  className={fieldClassName}
                />
              </label>
              <label className="text-xs text-neutral-400">
                Price before discount
                <input
                  value={createDraft.compare_at_price}
                  onChange={(e) => handleDraftField('compare_at_price', e.target.value)}
                  type="number"
                  min="0"
                  placeholder="PKR"
                  className={fieldClassName}
                />
              </label>
              <label className="text-xs text-neutral-400">
                Default stock
                <input
                  value={createDraft.available_quantity}
                  onChange={(e) => handleDefaultStockChange(e.target.value)}
                  type="number"
                  min="0"
                  className={fieldClassName}
                />
              </label>
              <label className="text-xs text-neutral-400">
                Weight (grams)
                <input
                  value={createDraft.weight}
                  onChange={(e) => handleDraftField('weight', e.target.value)}
                  type="number"
                  min="0"
                  className={fieldClassName}
                />
              </label>
            </div>
          </section>

          <section className={cardClassName}>
            <div className="mb-4 flex items-center gap-2">
              <Plus size={16} className="text-primary" />
              <h3 className="text-sm font-semibold">Options and variants</h3>
            </div>

            <div className="space-y-4">
              {createDraft.options.length === 0 ? (
                <div className="rounded-lg border border-dashed border-white/10 p-6 text-center">
                  <button
                    type="button"
                    onClick={addOption}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/70"
                  >
                    <Plus size={18} />
                  </button>
                  <p className="mt-3 text-sm text-white/45">Add an option like size or color</p>
                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    <button type="button" onClick={() => setPresetOption('Size', ['S', 'M', 'L'])} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/70">Size S / M / L</button>
                    <button type="button" onClick={() => setPresetOption('Size', ['XS', 'S', 'M', 'L', 'XL'])} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/70">Size XS / S / M / L / XL</button>
                    <button type="button" onClick={() => setPresetOption('Color', ['Black', 'White'])} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/70">Color</button>
                  </div>
                </div>
              ) : null}

              {createDraft.options.map((option, optionIndex) => (
                <div key={`option-${optionIndex}`} className={subtleCardClassName}>
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <input
                      value={option.name}
                      onChange={(e) => handleOptionNameChange(optionIndex, e.target.value)}
                      placeholder="Option name"
                      className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none placeholder:text-white/20"
                    />
                    <button
                      type="button"
                      onClick={() => removeOption(optionIndex)}
                      className="rounded-lg border border-white/10 bg-white/[0.04] p-2 text-white/60"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <div className="space-y-2">
                    {option.values.map((value, valueIndex) => {
                      const isLastField = valueIndex === option.values.length - 1;
                      const isOnlyField = option.values.length === 1;
                      return (
                        <div key={`option-${optionIndex}-value-${valueIndex}`} className="flex items-center gap-2">
                          <input
                            value={value}
                            placeholder={isLastField ? 'Add value...' : ''}
                            onChange={(e) => handleOptionValueFieldChange(optionIndex, valueIndex, e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && isLastField && e.currentTarget.value.trim()) {
                                e.preventDefault();
                                addNextOptionValue(optionIndex, valueIndex);
                              }
                            }}
                            id={`option-${optionIndex}-value-${valueIndex}`}
                            className="flex-1 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none placeholder:text-white/20"
                          />
                          {!isOnlyField ? (
                            <button
                              type="button"
                              onClick={() => removeOptionValueField(optionIndex, valueIndex)}
                              className="rounded-lg border border-white/10 bg-white/[0.04] p-2 text-white/60"
                            >
                              <X size={14} />
                            </button>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>

                  {option.name.toLowerCase() === 'size' ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {sizePresets.map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => handleOptionValueChange(optionIndex, preset.split(',').map((item) => item.trim()))}
                          className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/70"
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}

              {createDraft.options.length > 0 ? (
                <button
                  type="button"
                  onClick={addOption}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs text-white/70"
                >
                  <Plus size={14} />
                  Add another option
                </button>
              ) : null}

              {createDraft.images.length > 0 && imageOption ? (
                <div className={subtleCardClassName}>
                  <p className="text-sm font-medium text-white">Assign images by option</p>
                  <p className="mt-1 text-xs text-white/45">Choose a value, then click its gallery image once to apply it to every matching variant.</p>
                  <select value={selectedImageOptionName} onChange={(e) => { setImageOptionName(e.target.value); setImageOptionValue(''); }} className="mt-3 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none [color-scheme:dark]">
                    {createDraft.options.filter((option) => option.name.trim() && option.values.some(Boolean)).map((option) => <option key={option.name} value={option.name.trim()}>{option.name.trim()}</option>)}
                  </select>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {imageOption.values.filter(Boolean).map((value) => {
                      const assignedImage = createDraft.variants.find((variant) => variant.options[selectedImageOptionName] === value)?.image_url;
                      return <button key={value} type="button" onClick={() => setImageOptionValue(value)} className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs ${selectedImageOptionValue === value ? 'border-primary bg-primary/10 text-white' : 'border-white/10 bg-black/20 text-white/70'}`}>
                        {assignedImage ? <img src={assignedImage} alt="" className="h-6 w-6 rounded object-cover" /> : null}
                        {value}
                      </button>;
                    })}
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
                    {createDraft.images.map((image) => (
                      <button key={image} type="button" onClick={() => assignImageToOptionValue(image)} className={`overflow-hidden rounded-lg border-2 ${createDraft.variants.find((variant) => variant.options[selectedImageOptionName] === selectedImageOptionValue)?.image_url === image ? 'border-primary' : 'border-transparent hover:border-white/40'}`} title={`Assign to ${selectedImageOptionName}: ${selectedImageOptionValue}`}>
                        <img src={image} alt={`Assign to ${selectedImageOptionValue}`} className="aspect-square w-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {createDraft.variants.length > 0 ? (
                <div className="overflow-hidden rounded-lg border border-white/10">
                  <div className="grid grid-cols-[minmax(0,1fr)_110px_110px_140px] gap-3 border-b border-white/10 bg-black/20 px-4 py-2 text-[10px] uppercase tracking-[0.16em] text-white/35">
                    <span>Variant</span>
                    <span>Price</span>
                    <span>Qty</span>
                    <span>SKU</span>
                  </div>
                  <div className="divide-y divide-white/[0.06]">
                    {createDraft.variants.map((variant) => (
                      <div key={variant.id} className="grid grid-cols-[minmax(0,1fr)_110px_110px_140px] gap-3 px-4 py-3">
                        <p className="truncate text-sm text-white/80">{variant.title}</p>
                        <input
                          type="number"
                          min="0"
                          value={variant.price}
                          onChange={(e) => handleVariantChange(variant.id, 'price', e.target.value)}
                          className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none"
                        />
                        <input
                          type="number"
                          min="0"
                          value={variant.inventory?.quantity || 0}
                          onChange={(e) => handleVariantChange(variant.id, 'quantity', e.target.value)}
                          className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none"
                        />
                        <input
                          value={variant.sku || ''}
                          onChange={(e) => handleVariantChange(variant.id, 'sku', e.target.value)}
                          className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </section>

          <section className={cardClassName}>
            <div className="mb-4 flex items-center gap-2">
              <Package size={16} className="text-primary" />
              <h3 className="text-sm font-semibold">Sizing guide</h3>
            </div>
            <div className="space-y-4">
                <div className={subtleCardClassName}>
                  <p className="text-xs font-medium text-white">Customer-facing chart</p>
                  <p className="mt-1 text-xs text-white/45">Upload the brand’s chart, paste its URL, or add safe table HTML.</p>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <label className="text-xs text-neutral-400">
                      Image URL
                      <input value={createDraft.sizing_guide.image_url || ''} onChange={(e) => handleDraftField('sizing_guide', { ...createDraft.sizing_guide, image_url: e.target.value })} className={fieldClassName} placeholder="https://..." />
                    </label>
                    <label className="flex cursor-pointer items-end">
                      <span className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-black/25 px-3 py-2.5 text-sm text-white">
                        <Upload size={14} />
                        {uploadingMedia === 'size-chart' ? 'Uploading...' : 'Upload chart image'}
                      </span>
                      <input type="file" accept="image/*" className="hidden" disabled={uploadingMedia === 'size-chart'} onChange={(e) => e.target.files?.[0] && void handleSizeChartUpload(e.target.files[0])} />
                    </label>
                  </div>
                  <label className="mt-3 block text-xs text-neutral-400">
                    Table HTML (optional)
                    <textarea value={createDraft.sizing_guide.html_table || ''} onChange={(e) => handleDraftField('sizing_guide', { ...createDraft.sizing_guide, html_table: e.target.value })} rows={4} className={`${fieldClassName} resize-y`} placeholder="<table>...</table>" />
                  </label>
                </div>
            </div>
          </section>

        </div>

        <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
          <section className={cardClassName}>
            <h3 className="text-sm font-semibold text-white">Seller assignment</h3>
            <label className="mt-3 block text-xs text-neutral-400">
              Seller
              <select
                value={createDraft.seller_id}
                onChange={(e) => handleDraftField('seller_id', e.target.value)}
                className={`${fieldClassName} [color-scheme:dark]`}
              >
                <option value="">Select seller</option>
                {sellers.map((seller) => (
                  <option key={getSellerId(seller)} value={getSellerId(seller)}>
                    {getSellerName(seller)}
                  </option>
                ))}
              </select>
            </label>
            {currentSeller ? (
              <div className="mt-3 rounded-lg border border-white/10 bg-black/20 p-3 text-xs text-white/55">
                {getSellerName(currentSeller)}
              </div>
            ) : null}
          </section>

          <section className={cardClassName}>
            <h3 className="text-sm font-semibold text-white">Organisation</h3>
            <label className="mt-3 block text-xs text-neutral-400">
              Tags
              <input
                value={createDraft.tagsInput}
                onChange={(e) => handleDraftField('tagsInput', e.target.value)}
                placeholder="summer, new-arrival, festive"
                className={fieldClassName}
              />
            </label>
            <div className="mt-3 flex flex-wrap gap-2">
              {['new-arrival', 'eid-edit', 'summer', 'festive', 'essentials', 'best-seller'].map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => {
                    const currentTags = createDraft.tagsInput.split(',').map((item) => item.trim()).filter(Boolean);
                    if (currentTags.includes(tag)) return;
                    handleDraftField('tagsInput', [...currentTags, tag].join(', '));
                  }}
                  className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] text-white/65"
                >
                  {tag}
                </button>
              ))}
            </div>
          </section>

          <section className={cardClassName}>
            <h3 className="text-sm font-semibold text-white">Badges and publish state</h3>
            <div className="mt-3 space-y-2">
              {(Object.keys(BADGE_LABELS) as BadgeKey[]).map((badge) => (
                <label key={badge} className="flex items-center gap-3 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white/80">
                  <input
                    type="checkbox"
                    checked={createDraft.badges[badge]}
                    onChange={(e) =>
                      setCreateDraft((prev) => ({
                        ...prev,
                        badges: { ...prev.badges, [badge]: e.target.checked },
                      }))
                    }
                    className="accent-white"
                  />
                  {BADGE_LABELS[badge]}
                </label>
              ))}
            </div>

            <label className="mt-3 flex items-center gap-3 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white/80">
              <input
                type="checkbox"
                checked={createDraft.is_featured}
                onChange={(e) => handleDraftField('is_featured', e.target.checked)}
                className="accent-white"
              />
              Featured
            </label>
          </section>

          <section className={cardClassName}>
            <h3 className="text-sm font-semibold text-white">Ready to create</h3>
            <div className="mt-3 space-y-2 text-xs text-white/50">
              <div className="flex items-center justify-between">
                <span>Images</span>
                <span>{createDraft.images.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Variants</span>
                <span>{createDraft.variants.length || 1}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Total stock</span>
                <span>{createDraft.variants.length ? totalStock : createDraft.available_quantity || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Sizing guide</span>
                <span>{hasSizing ? 'Ready' : '—'}</span>
              </div>
            </div>

            <button
              onClick={createProduct}
              disabled={actionKey === 'create-product'}
              className="mt-4 w-full rounded-lg bg-white px-4 py-3 text-sm font-medium text-black transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {actionKey === 'create-product' ? 'Creating...' : 'Create product'}
            </button>
            {createError ? <p className="mt-3 text-xs text-red-300">{createError}</p> : null}
            {createMessage ? <p className="mt-3 text-xs text-emerald-300">{createMessage}</p> : null}
          </section>
        </aside>
      </div>
    </div>
  );
};

export default CreateProductPage;
