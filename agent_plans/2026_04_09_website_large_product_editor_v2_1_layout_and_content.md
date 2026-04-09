# Plan 1 of 3 — Product Editor V2: Layout + Section 1 + Sidebar

## 1. Objective

Restructure `ProductEditor.tsx` from a single-column scrollable form into a Shopify-style two-column layout. Left column is wide (main content). Right column is narrow (sidebar with status, publishing, organization). Rebuild Section 1 to contain: Title, Description, Media, and Category in that order. Extract sidebar fields from the existing Organization section.

---

## 2. Surface

Website

---

## 3. Scale

Large (Plan 1 of 3)

---

## 4. Scope

**Included:**
- Change outer layout from single-column to two-column (left main + right sidebar)
- Rebuild Section 1 with Title → Description → Media → Category (product_type + gender)
- Build the right sidebar with three sub-cards: Status, Publishing, Product Organisation
- Remove the old section navigation bar (the pill buttons at the top)
- Remove the old header banner card (the "Product Setup / Fix What Matters" card)
- Keep all existing state, handlers, and submit logic untouched

**Not included:**
- Pricing section changes (Plan 2)
- Shipping section (Plan 2)
- Variants section changes (Plan 3)
- Sizing guide section (leave as-is, append below main column)

---

## 5. Assumptions

- File: `src/components/seller/ProductEditor.tsx`
- Existing state variables, handlers, and API calls are not modified
- Tailwind CSS is available; all styling uses Tailwind
- `formData`, `handleChange`, `handleGenderChange`, `handleMediaUpload`, `handleRemoveImage`, `handleReorderImage`, `currentGender`, `productTypes`, `uploadingMedia`, `isSaving`, `handleSubmit`, `onClose`, `product`, `queueId`, `editorMode`, `seller` are all still in scope
- The `Section` component stays as-is and is reused
- `fieldClassName` constant stays as-is
- Framer Motion, Lucide icons, AnimatePresence are available
- Tags / organization section is collapsed into the sidebar

---

## 6. Step-by-Step Implementation

### Step 1: Remove the section navigation pill bar
- In the JSX, find the `<div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-3">` block that renders the section pill buttons
- Delete the entire block (roughly lines 530–547 in the original file)
- Also delete the `editorSections`, `visibleSections`, `activeSection`, `jumpToSection`, `useEffect` scroll listener, and `contentRef` — they are no longer needed
- Also delete the `useCallback` import if it becomes unused

### Step 2: Remove the header banner card
- Delete the `<div className="rounded-[1.8rem] border ... p-5">` block containing "Product Setup", "Fix What Matters" headline, description text, and the summary badge row (price, variants, stock, sizing)
- This is roughly lines 508–528

### Step 3: Change the outer scroll container to a two-column grid
- Find: `<div ref={contentRef} className="min-h-0 overflow-y-auto px-4 py-5 sm:px-6">`
- Remove `ref={contentRef}` (no longer needed)
- Keep the overflow-y-auto and padding
- Inside it, change `<div className="mx-auto max-w-5xl space-y-6">` to:
  ```
  <div className="mx-auto max-w-6xl">
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px] lg:items-start">
      {/* LEFT COLUMN */}
      <div className="space-y-5" id="main-col">
        {/* sections go here */}
      </div>
      {/* RIGHT SIDEBAR */}
      <div className="space-y-4 lg:sticky lg:top-6" id="sidebar-col">
        {/* sidebar cards go here */}
      </div>
    </div>
  </div>
  ```

### Step 4: Build Section 1 — Content (replaces old "Basic Information" section)
Place this as the first item inside `<div id="main-col">`:

```jsx
<Section id="content" title="Product" eyebrow="Step 1" icon={<Paperclip size={16} />}>
  <div className="space-y-4">

    {/* Title */}
    <div>
      <label htmlFor="title" className="block text-xs font-medium text-neutral-400 mb-1">
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

    {/* Description */}
    <div>
      <label htmlFor="description" className="block text-xs font-medium text-neutral-400 mb-1">
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

    {/* Media */}
    <div>
      <p className="text-xs font-medium text-neutral-400 mb-2">Media</p>
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

    {/* Category */}
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label htmlFor="product_type" className="block text-xs font-medium text-neutral-400 mb-1">
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
          {productTypes.map(type => (
            <option key={type} value={type} className="bg-neutral-900">{type}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="gender" className="block text-xs font-medium text-neutral-400 mb-1">
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
```

### Step 5: Build the right sidebar
Place this inside `<div id="sidebar-col">`. Three cards:

**Card A — Status**
```jsx
<div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
  <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/35 mb-3">Status</p>
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
```

**Card B — Publishing**
```jsx
<div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
  <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/35 mb-3">Publishing</p>
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
```

**Card C — Organisation**
```jsx
<div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
  <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/35 mb-3">Organisation</p>
  <div className="space-y-3">
    <div>
      <label className="block text-[11px] text-white/45 mb-1">Tags</label>
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
          className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-[10px] font-medium text-white/60 hover:border-primary/30 hover:text-white transition-colors"
        >
          {tag}
        </button>
      ))}
    </div>
  </div>
</div>
```

**Card D — Save button** (move the Save/Submit button from the footer into the sidebar bottom)
```jsx
<button
  type="submit"
  disabled={isSaving}
  className="w-full rounded-2xl bg-primary px-4 py-3 text-sm font-black uppercase tracking-[0.08em] text-white transition-opacity disabled:opacity-60 hover:opacity-90"
>
  {isSaving ? 'Saving...' : product?.id ? 'Save Changes' : 'Submit for Review'}
</button>
```

### Step 6: Remove old Organization and old Media sections
- Delete the old `<Section id="organization" ...>` block (the tags section that was at the bottom)
- Delete the old `<Section id="media" ...>` block (media is now inside Section 1)
- Delete the old `<Section id="basic-information" ...>` block (replaced by new Section 1)

### Step 7: Remove old footer save button
- Find the `<div className="sticky bottom-0 ...">` footer bar that contains the Save/Submit button
- Delete it entirely (button is now in sidebar)

### Step 8: Clean up unused imports and constants
- Remove `Settings2` from lucide imports if it's only used in the Variants section (keep if still referenced)
- Remove `suggestedTags` constant if it is now defined inline in the sidebar
- Remove `editorSections` constant
- Keep `sizePresets`, `productTypes`, `quickChipClassName`, `fieldClassName`, `getShopifyThumbnail`

---

## 7. Exact Logic Specification

- Layout switches to `lg:grid-cols-[1fr_280px]` at `lg` breakpoint; below that it's single column (sidebar renders below main)
- Sidebar is `lg:sticky lg:top-6` so it stays visible while scrolling the left column
- Status card: if `product?.id` is truthy → "Active" + emerald dot. Otherwise "Draft" + yellow dot
- Publishing card: all "Listed"/"Eligible" only when `product?.id` is truthy
- Save button in sidebar replaces old footer sticky bar
- The video upload section is removed from the editor in this plan (it was in the old Media section). Do not add it back — leave video for a future improvement.

---

## 8. UI Specification

- Font sizes are smaller than current: labels are `text-xs`, body inputs are `text-sm`, sidebar text is `text-[11px]` and `text-[10px]`
- Input fields keep `fieldClassName` (already defined as `text-sm`)
- Media grid: images are `h-24` (shorter than current `h-32`), tighter gap (`gap-3`)
- Sidebar card padding: `p-4`, border-radius `rounded-2xl`
- Section cards in main column keep existing `Section` component styling

---

## 9. Edge Cases

- If `formData.images` is empty → grid shows only the "Add photo" upload tile
- If `product?.id` is falsy and `queueId` is set → Status card shows "Draft" dot + "In review queue" note
- Tags input: if `tagInput` is empty string → `handleTagChange([])` passes empty array (existing behavior preserved)
- `currentGender` and `handleGenderChange` are already defined — reuse exactly as-is

---

## 10. Testing Instructions

1. Open the seller portal
2. Click "Add Product" or edit an existing product
3. Verify: editor shows two-column layout on desktop (≥1024px wide screen)
4. Verify: Section 1 shows Title → Description → Media grid → Category + Gender in that order
5. Verify: right sidebar shows Status card, Publishing card, Organisation card (with tags), Save button
6. Verify: uploading an image adds a thumbnail to the media grid
7. Verify: sidebar is sticky — scroll down and sidebar stays visible
8. Verify: Save/Submit button in sidebar triggers form submit correctly

---

## 11. Definition of Done

- Two-column layout renders correctly at desktop width
- Section 1 has all four sub-sections in order: title, description, media, category
- Sidebar has Status, Publishing, Organisation, and Save button
- Old section nav pills are gone
- Old header banner card is gone
- Old footer save bar is gone
- No TypeScript compile errors

---

## 12. Constraints

- Do not modify `src/api/sellerApi.ts` in this plan
- Do not modify any files outside `src/components/seller/ProductEditor.tsx`
- Do not change any existing state variable names or handler function signatures
- Do not add new npm packages
