# Plan 3 of 3 — Product Editor V2: Variants Section Redesign

## 1. Objective

Replace the current comma-separated option values input with an individual-field-per-value input system. Each option value gets its own text input. Typing into the last empty input automatically adds a new empty input below it. Values can be reordered by drag (mouse) or up/down arrow buttons. Variant rows below show title + price + stock in a single row. Total inventory count is shown at the bottom of the variants table.

---

## 2. Surface

Website

---

## 3. Scale

Large (Plan 3 of 3)

---

## 4. Scope

**Included:**
- Remove comma-separated option values input
- Replace with per-value input fields that auto-add a new empty field when the last one is typed into
- Up/Down buttons to reorder option values within an option
- Quick-add preset badge buttons: Size (S/M/L), Size (XS-XL), Color (Black/White) — already exist, keep them
- Variant rows: compact single-row layout showing variant title + price input + quantity input
- Total stock count at the bottom of the variant table
- Empty state for variants section: shows a large "+" button and preset badges when no options are added yet

**Not included:**
- Option drag-and-drop (too complex; up/down buttons are sufficient)
- Cross-option reordering (reorder values within a single option only)
- Any pricing or layout changes (Plans 1 and 2)

---

## 5. Assumptions

- Plans 1 and 2 are done. The two-column layout exists. Sections 1, 2, 3 are implemented.
- File to edit: `src/components/seller/ProductEditor.tsx`
- Existing state: `formData.options`, `formData.variants`, `totalStock`
- Existing handlers still present: `handleOptionChange`, `handleOptionValueChange`, `addOption`, `removeOption`, `handleVariantChange`, `setPresetOption`, `generateVariantCombinations`
- `Option` type has: `{ name: string; values: string[]; required: boolean }`
- `Variant` type has: `{ id: string; title: string; price: number; inventory: { quantity: number }; is_default: boolean }`
- `quickChipClassName`, `fieldClassName` constants are available
- Framer Motion `AnimatePresence` and `motion` are available

---

## 6. Step-by-Step Implementation

### Step 1: Add a helper function `handleOptionValueFieldChange`

This replaces the role of `handleOptionValueChange` for the new per-field system.
Add inside the `ProductEditor` component:

```typescript
const handleOptionValueFieldChange = (optionIndex: number, valueIndex: number, newValue: string) => {
  const newOptions = [...(formData.options || [])];
  const values = [...newOptions[optionIndex].values];
  values[valueIndex] = newValue;
  newOptions[optionIndex] = { ...newOptions[optionIndex], values };
  setFormData(prev => ({ ...prev, options: newOptions }));
};
```

### Step 2: Add a helper function `handleOptionValueKeyDown`

This auto-adds a new empty field when the user types into the last field:

```typescript
const addOptionValueField = (optionIndex: number) => {
  const newOptions = [...(formData.options || [])];
  newOptions[optionIndex] = {
    ...newOptions[optionIndex],
    values: [...newOptions[optionIndex].values, ''],
  };
  setFormData(prev => ({ ...prev, options: newOptions }));
};
```

### Step 3: Add a helper function `removeOptionValueField`

```typescript
const removeOptionValueField = (optionIndex: number, valueIndex: number) => {
  const newOptions = [...(formData.options || [])];
  const values = newOptions[optionIndex].values.filter((_, i) => i !== valueIndex);
  newOptions[optionIndex] = { ...newOptions[optionIndex], values };
  setFormData(prev => ({ ...prev, options: newOptions }));
};
```

### Step 4: Add a helper function `moveOptionValue`

```typescript
const moveOptionValue = (optionIndex: number, valueIndex: number, direction: 'up' | 'down') => {
  const newOptions = [...(formData.options || [])];
  const values = [...newOptions[optionIndex].values];
  const targetIndex = direction === 'up' ? valueIndex - 1 : valueIndex + 1;
  if (targetIndex < 0 || targetIndex >= values.length) return;
  [values[valueIndex], values[targetIndex]] = [values[targetIndex], values[valueIndex]];
  newOptions[optionIndex] = { ...newOptions[optionIndex], values };
  setFormData(prev => ({ ...prev, options: newOptions }));
};
```

### Step 5: Replace the Section 4 Variants JSX

Find the existing `<Section id="options-variants" ...>` block and replace it entirely with the following:

```jsx
<Section id="options-variants" title="Variants" eyebrow="Step 4" icon={<Settings2 size={16} />}>
  <div className="space-y-5">

    {/* Empty state — shown when no options exist yet */}
    {(!formData.options || formData.options.length === 0) && (
      <div className="rounded-2xl border border-dashed border-white/10 p-6 text-center">
        <button
          type="button"
          onClick={addOption}
          className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/60 hover:border-primary/30 hover:text-primary transition-colors mx-auto"
        >
          <Plus size={22} />
        </button>
        <p className="mt-3 text-xs text-white/40">Add an option like size or color</p>
        <div className="mt-4 flex flex-wrap gap-2 justify-center">
          <button
            type="button"
            onClick={() => setPresetOption('Size', ['S', 'M', 'L'])}
            className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-white/60 hover:border-primary/30 hover:text-white transition-colors"
          >
            Size S / M / L
          </button>
          <button
            type="button"
            onClick={() => setPresetOption('Size', ['XS', 'S', 'M', 'L', 'XL'])}
            className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-white/60 hover:border-primary/30 hover:text-white transition-colors"
          >
            Size XS / S / M / L / XL
          </button>
          <button
            type="button"
            onClick={() => setPresetOption('Color', ['Black', 'White'])}
            className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-white/60 hover:border-primary/30 hover:text-white transition-colors"
          >
            Color Black / White
          </button>
        </div>
      </div>
    )}

    {/* Option editors — one per option */}
    {formData.options && formData.options.length > 0 && formData.options.map((opt, optionIndex) => {
      // Derive the "display" values: always have at least one empty field at the end
      const displayValues = opt.values.length === 0
        ? ['']
        : opt.values[opt.values.length - 1] === ''
          ? opt.values
          : [...opt.values, ''];

      return (
        <div key={optionIndex} className="rounded-2xl border border-white/10 bg-black/25 p-4 space-y-3">
          {/* Option name row */}
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label className="block text-[11px] text-white/40 mb-1">Option name</label>
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

          {/* Option values — one input per value */}
          <div>
            <label className="block text-[11px] text-white/40 mb-2">Option values</label>
            <div className="space-y-2">
              <AnimatePresence initial={false}>
                {displayValues.map((val, valueIndex) => {
                  const isLastField = valueIndex === displayValues.length - 1;
                  const isOnlyField = displayValues.length === 1;
                  return (
                    <motion.div
                      key={valueIndex}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.15 }}
                      className="flex items-center gap-2"
                    >
                      {/* Up/Down reorder buttons — hidden on last (empty) field */}
                      {!isLastField && (
                        <div className="flex flex-col gap-0.5">
                          <button
                            type="button"
                            onClick={() => moveOptionValue(optionIndex, valueIndex, 'up')}
                            disabled={valueIndex === 0}
                            className="rounded-md border border-white/10 bg-white/[0.03] p-0.5 text-white/40 disabled:opacity-20 hover:text-white transition-colors"
                          >
                            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                              <path d="M5 2L9 8H1L5 2Z" fill="currentColor"/>
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => moveOptionValue(optionIndex, valueIndex, 'down')}
                            disabled={valueIndex >= displayValues.length - 2}
                            className="rounded-md border border-white/10 bg-white/[0.03] p-0.5 text-white/40 disabled:opacity-20 hover:text-white transition-colors"
                          >
                            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                              <path d="M5 8L1 2H9L5 8Z" fill="currentColor"/>
                            </svg>
                          </button>
                        </div>
                      )}
                      {/* Value input */}
                      <input
                        type="text"
                        value={val}
                        placeholder={isLastField ? 'Add value...' : ''}
                        onChange={e => {
                          const newVal = e.target.value;
                          if (isLastField && newVal !== '') {
                            // Typing into the last empty field: update value and add a new empty field
                            handleOptionValueFieldChange(optionIndex, valueIndex, newVal);
                            // The useEffect on options will re-derive displayValues with a new empty tail
                          } else {
                            handleOptionValueFieldChange(optionIndex, valueIndex, newVal);
                          }
                        }}
                        onBlur={e => {
                          // If the last field was filled, ensure a new empty field exists
                          if (isLastField && e.target.value !== '') {
                            addOptionValueField(optionIndex);
                          }
                        }}
                        className="flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none transition-colors placeholder:text-white/30 focus:border-primary/35"
                      />
                      {/* Remove button — hidden on last (empty) field and if it's the only field */}
                      {!isLastField && !isOnlyField && (
                        <button
                          type="button"
                          onClick={() => removeOptionValueField(optionIndex, valueIndex)}
                          className="rounded-xl border border-white/10 bg-white/[0.03] p-1.5 text-white/30 hover:text-red-400 hover:border-red-400/20 transition-colors"
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
        </div>
      );
    })}

    {/* Add option button — shown when at least one option already exists */}
    {formData.options && formData.options.length > 0 && (
      <button
        type="button"
        onClick={addOption}
        className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-4 py-2 text-xs font-medium text-white/60 hover:text-white transition-colors"
      >
        <Plus size={14} />
        Add another option
      </button>
    )}

    {/* Variants table — shown when variants exist */}
    {formData.variants && formData.variants.length > 0 && (
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-[1fr_120px_120px] gap-3 border-b border-white/10 px-4 py-2.5">
          <p className="text-[10px] font-mono uppercase tracking-widest text-white/30">Variant</p>
          <p className="text-[10px] font-mono uppercase tracking-widest text-white/30">Price (PKR)</p>
          <p className="text-[10px] font-mono uppercase tracking-widest text-white/30">Qty</p>
        </div>
        {/* Variant rows */}
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
        {/* Total stock footer */}
        <div className="flex items-center justify-between border-t border-white/10 bg-black/20 px-4 py-3">
          <p className="text-xs text-white/40">Total inventory</p>
          <p className="text-sm font-semibold text-white">{totalStock} units</p>
        </div>
      </div>
    )}

  </div>
</Section>
```

### Step 6: Fix the `displayValues` logic issue

The `displayValues` variable computed inside the `map` render uses a derived tail-empty array. But `formData.options[i].values` should NOT store the trailing empty string — it should only store real values. The handlers already filter with `.filter(Boolean)`. Verify the existing `handleOptionValueChange` call sites are replaced. The new `handleOptionValueFieldChange` does NOT filter empty strings — that is intentional so the trailing empty field persists. However, when generating variants, the `generateVariantCombinations` function uses `option.values` which may include empty strings. Fix by updating the variant generation call:

Find in `generateVariantCombinations`:
```typescript
if (option.values.length === 0) {
```

Change to:
```typescript
const filteredValues = option.values.filter(v => v.trim() !== '');
if (filteredValues.length === 0) {
```

And replace `option.values.forEach(value => {` with:
```typescript
filteredValues.forEach(value => {
```

This ensures empty strings in option values don't generate blank variant titles.

---

## 7. Exact Logic Specification

**Auto-add new field on input:**
- `displayValues` is always `opt.values` with a trailing `''` appended if the last real value is non-empty
- When user types into the last empty field (onChange): call `handleOptionValueFieldChange` to update that index
- On blur of the last field, if the value is non-empty: call `addOptionValueField` to push a new `''` to the array
- Result: there is always exactly one empty trailing field ready for input

**Removing a value:**
- Only show remove (X) button on non-last, non-only fields
- On click: call `removeOptionValueField(optionIndex, valueIndex)`

**Reorder:**
- Only show up/down arrows on non-last fields
- Up arrow is disabled on `valueIndex === 0`
- Down arrow is disabled on `valueIndex >= displayValues.length - 2` (can't swap the last real value into the empty tail slot)

**Variant table:**
- Rows are read from `formData.variants` which is auto-computed by the existing `useEffect` on `formData.options`
- Price and quantity inputs call `handleVariantChange` exactly as before
- Total stock = `totalStock` (already computed via existing `useMemo`)

---

## 8. UI Specification

- Up/Down arrows: tiny SVG triangles, 10×10px, inside a small button `p-0.5`
- Value input: `rounded-xl`, `text-sm`, full width (`flex-1`)
- Remove (X) button: small, `p-1.5`, uses `<X size={12} />`
- Variant table: `grid-cols-[1fr_120px_120px]` for title/price/qty columns
- Variant rows: `py-3 px-4`, `divide-y` between rows
- Total stock footer: `px-4 py-3`, right-aligned bold number
- Empty state: centered, dashed border, large Plus button + preset chips below

---

## 9. Edge Cases

- Option with zero values → `displayValues` = `['']` → shows one empty input ready for typing
- User deletes all characters from a non-last value field → value becomes `''` → on next variant generation it is filtered out by the fix in Step 6
- Preset button (e.g. "Size S/M/L") calls `setPresetOption('Size', ['S', 'M', 'L'])` → sets values to `['S', 'M', 'L']`. The trailing empty field appears because the last real value `'L'` is non-empty → `displayValues` appends `''`. This is correct.
- User clicks "Add another option" when existing options have empty names → allowed (no validation here)
- `formData.variants` is empty (no options added yet) → variant table is not rendered → empty state is shown

---

## 10. Testing Instructions

1. Open product editor. Navigate to Section 4 "Variants".
2. Verify: empty state shows large "+" button and preset chip buttons.
3. Click "Size S / M / L" preset → three value fields appear: S, M, L + one empty trailing field.
4. Type "XXL" into the empty trailing field → a new empty field appears below it.
5. Click the up arrow on "M" → M moves to position 1, S moves to position 2.
6. Click the remove X on "S" → S is removed. Remaining values: M, L, XXL.
7. Click "Add another option" → a new option block appears with one empty name field and one empty value field.
8. Type "Color" in the name, type "Black" in the value → new empty field appears below "Black".
9. Verify variant table shows all combinations: M/Black, M/White (if White added), L/Black, etc.
10. Enter price and quantity for each variant.
11. Verify total stock count at the bottom of the table matches sum of all quantities.

---

## 11. Definition of Done

- Empty state shows correctly when no options exist
- Typing in last value field creates a new empty field below
- Up/Down arrows reorder values within an option
- X removes a value (not shown on last empty field)
- Variant table shows one row per variant with title/price/qty in a single row
- Total inventory count is shown at the bottom of the variant table
- No blank variant titles generated from trailing empty value fields
- No TypeScript compile errors

---

## 12. Constraints

- Do not modify pricing, shipping, layout, or Section 1 (Plans 1 and 2)
- Do not add drag-and-drop library — up/down buttons only
- Do not modify any files except `src/components/seller/ProductEditor.tsx`
- Do not change existing state variable names (`formData`, `handleVariantChange`, etc.)
- The existing `handleOptionValueChange` function can remain in the file but is no longer called from JSX — it may be left unused or deleted
