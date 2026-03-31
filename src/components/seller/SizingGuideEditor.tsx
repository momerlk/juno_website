import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { SizingGuide } from '../../constants/types';
import { dummySizingGuides, productTypeToSizingGuide } from '../../constants/sizing';
import { AlertTriangle, Wand2 } from 'lucide-react';

interface SizingGuideEditorProps {
    value?: SizingGuide;
    onChange: (value: SizingGuide) => void;
    productType?: string;
    availableSizes?: string[];
}

const SizingGuideEditor: React.FC<SizingGuideEditorProps> = ({ value, onChange, productType, availableSizes = [] }) => {
    const [selectedType, setSelectedType] = useState<string>('');
    const [sizeFitDraft, setSizeFitDraft] = useState('');
    const [cellDrafts, setCellDrafts] = useState<Record<string, string>>({});

    const commitGuide = useCallback((next: Partial<SizingGuide>) => {
        onChange({
            ...(value || { size_chart: {}, size_fit: '', measurement_unit: 'inch' }),
            ...next,
        } as SizingGuide);
    }, [onChange, value]);
    
    useEffect(() => {
        if (productType && productTypeToSizingGuide[productType]) {
             setSelectedType((current) => current || productTypeToSizingGuide[productType]);
        }
    }, [productType]);

    useEffect(() => {
        setSizeFitDraft(value?.size_fit || '');
    }, [value?.size_fit]);

    const handleChange = (field: keyof SizingGuide, newVal: any) => {
        commitGuide({ [field]: newVal } as Partial<SizingGuide>);
    };

    const getCellDraftKey = (rowKey: string, colKey: string) => `${rowKey}__${colKey}`;

    const commitChartChange = (rowKey: string, colKey: string, cellVal: string) => {
        const newChart = { ...(value?.size_chart || {}) };
        let finalValue: number;
        if (cellVal.trim() === '') {
            finalValue = -1;
        } else {
            const numericValue = parseFloat(cellVal);
            finalValue = isNaN(numericValue) ? -1 : numericValue;
        }
        newChart[rowKey] = { ...(newChart[rowKey] || {}), [colKey]: finalValue };
        commitGuide({ size_chart: newChart });
        setCellDrafts((current) => {
            const next = { ...current };
            delete next[getCellDraftKey(rowKey, colKey)];
            return next;
        });
    };

    const handleTypeChange = (newType: string) => {
        setSelectedType(newType);
        const guide = dummySizingGuides[newType];
        if (guide) {
            const newChart: Record<string, Record<string, number>> = {};
            const cols = Object.keys(guide.size_chart['dummy_row']);
            
            if (availableSizes.length > 0) {
                availableSizes.forEach(size => {
                    newChart[size] = {};
                    cols.forEach(col => newChart[size][col] = -1);
                });
            }

            commitGuide({
                size_chart: newChart,
                size_fit: guide.size_fit,
                measurement_unit: guide.measurement_unit as any
            });
        }
    };
    
    useEffect(() => {
        if (!selectedType || availableSizes.length === 0) {
            return;
        }
        const guide = dummySizingGuides[selectedType];
        if (!guide) return;

        const cols = Object.keys(guide.size_chart['dummy_row']);
        const currentChart = value?.size_chart || {};
        const newChart = { ...currentChart };
        let hasChanges = false;

        availableSizes.forEach(size => {
            if (!newChart[size]) {
                newChart[size] = {};
                cols.forEach(col => {
                    newChart[size][col] = -1;
                });
                hasChanges = true;
                return;
            }

            cols.forEach(col => {
                if (typeof newChart[size][col] !== 'number') {
                    newChart[size][col] = -1;
                    hasChanges = true;
                }
            });
        });

        if (hasChanges) {
            commitGuide({ size_chart: newChart });
        }
    }, [availableSizes.join('|'), selectedType]); 


    const sizingGuideColumns = useMemo(
        () => (selectedType ? Object.keys(dummySizingGuides[selectedType].size_chart['dummy_row']) : []),
        [selectedType],
    );

    const applyLinearPreset = () => {
        if (!selectedType || availableSizes.length === 0) return;
        const cols = Object.keys(dummySizingGuides[selectedType].size_chart['dummy_row']);
        const nextChart: Record<string, Record<string, number>> = {};

        availableSizes.forEach((size, rowIdx) => {
            nextChart[size] = {};
            cols.forEach((col, colIdx) => {
                nextChart[size][col] = Math.round((30 + rowIdx * 2.2 + colIdx * 1.4) * 10) / 10;
            });
        });

        commitGuide({
            size_chart: nextChart,
            measurement_unit: value?.measurement_unit || 'inch',
            size_fit: value?.size_fit || '',
        });
        setCellDrafts({});
    };

    return (
        <div className="space-y-5">
            <div className="rounded-[1.8rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(255,24,24,0.12),transparent_34%),linear-gradient(145deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-5">
                <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-primary/75">Sizing Setup</p>
                <h3 className="mt-2 text-lg font-black uppercase tracking-[-0.03em] text-white">Buyer Confidence Layer</h3>
                <p className="mt-2 text-sm text-white/60">
                    Keep the chart practical. Buyers need clean fit notes and clear measurements, not a dense spreadsheet.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-neutral-300">Sizing Guide Type</label>
                    <select 
                        value={selectedType} 
                        onChange={e => handleTypeChange(e.target.value)} 
                        className="mt-1 w-full rounded-[1.2rem] border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none transition-colors focus:border-primary/35"
                    >
                        <option value="" className="bg-neutral-900">Select Type</option>
                        {Object.keys(dummySizingGuides).map(key => (
                            <option key={key} value={key} className="bg-neutral-900">
                                {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-neutral-300">Measurement Unit</label>
                    <select 
                        value={value?.measurement_unit || 'inch'} 
                        onChange={e => handleChange('measurement_unit', e.target.value)} 
                        className="mt-1 w-full rounded-[1.2rem] border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none transition-colors focus:border-primary/35"
                    >
                        <option value="inch" className="bg-neutral-900">Inch</option>
                        <option value="cm" className="bg-neutral-900">CM</option>
                    </select>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-neutral-300">Sizing & Fit Details</label>
                <textarea 
                    value={sizeFitDraft} 
                    onChange={e => setSizeFitDraft(e.target.value)}
                    onBlur={() => {
                        if (sizeFitDraft !== (value?.size_fit || '')) {
                            handleChange('size_fit', sizeFitDraft);
                        }
                    }}
                    className="mt-1 h-24 w-full rounded-[1.2rem] border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-white/25 focus:border-primary/35" 
                    placeholder="Tell buyers how this fits (e.g. true to size, relaxed shoulder, narrow waist)."
                />
            </div>

            {availableSizes.length > 0 && selectedType && (
                <div className="overflow-hidden rounded-[1.8rem] border border-white/10 bg-white/[0.03]">
                    <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                        <p className="text-xs font-mono uppercase tracking-[0.2em] text-white/45">Size Matrix</p>
                        <button
                            type="button"
                            onClick={applyLinearPreset}
                            className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/75 hover:text-white"
                        >
                            <Wand2 size={13} />
                            Quick Fill
                        </button>
                    </div>
                    <div className="grid gap-3 p-4 md:hidden">
                        {availableSizes.map((size) => (
                            <div key={size} className="rounded-[1.2rem] border border-white/10 bg-black/25 p-4">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-black uppercase tracking-[0.03em] text-white">{size}</p>
                                    <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-white/30">
                                        {value?.measurement_unit}
                                    </span>
                                </div>
                                <div className="mt-4 grid grid-cols-2 gap-3">
                                    {sizingGuideColumns.map((col) => {
                                        const draftKey = getCellDraftKey(size, col);
                                        const draftValue = cellDrafts[draftKey];
                                        const storedValue = (value?.size_chart?.[size]?.[col] ?? -1) === -1 ? '' : String(value?.size_chart?.[size]?.[col]);
                                        return (
                                            <div key={col}>
                                                <label className="block text-[10px] font-mono uppercase tracking-[0.18em] text-white/30">{col}</label>
                                                <input
                                                    type="number"
                                                    placeholder="N/A"
                                                    value={draftValue ?? storedValue}
                                                    onChange={e => setCellDrafts((current) => ({ ...current, [draftKey]: e.target.value }))}
                                                    onBlur={e => commitChartChange(size, col, e.target.value)}
                                                    onKeyDown={e => {
                                                        if (e.key === 'Enter') {
                                                            e.currentTarget.blur();
                                                        }
                                                    }}
                                                    className="mt-2 h-10 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none transition-colors placeholder:text-white/20 focus:border-primary/35"
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="hidden overflow-x-auto md:block">
                    <table className="w-full text-sm text-left text-neutral-300">
                        <thead className="text-xs uppercase text-neutral-400 bg-black/25">
                            <tr>
                                <th scope="col" className="px-4 py-3">Size</th>
                                {sizingGuideColumns.map(col => (
                                    <th key={col} scope="col" className="px-4 py-3">{col} ({value?.measurement_unit})</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {availableSizes.map(size => (
                                <tr key={size} className="border-b border-white/5 bg-black/20">
                                    <th scope="row" className="px-4 py-2 font-medium whitespace-nowrap">{size}</th>
                                    {sizingGuideColumns.map(col => (
                                        <td key={col} className="px-4 py-2">
                                            {(() => {
                                                const draftKey = getCellDraftKey(size, col);
                                                const draftValue = cellDrafts[draftKey];
                                                const storedValue = (value?.size_chart?.[size]?.[col] ?? -1) === -1 ? '' : String(value?.size_chart?.[size]?.[col]);
                                                return (
                                            <input 
                                                type="number" 
                                                placeholder="N/A"
                                                value={draftValue ?? storedValue}
                                                onChange={e => setCellDrafts((current) => ({ ...current, [draftKey]: e.target.value }))}
                                                onBlur={e => commitChartChange(size, col, e.target.value)}
                                                onKeyDown={e => {
                                                    if (e.key === 'Enter') {
                                                        e.currentTarget.blur();
                                                    }
                                                }}
                                                className="h-9 w-24 rounded-lg border border-white/10 bg-black/30 px-3 py-1 text-sm text-white outline-none transition-colors placeholder:text-white/20 focus:border-primary/35" 
                                            />
                                                );
                                            })()}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    </div>
                </div>
            )}
             {availableSizes.length === 0 && (
                <div className="flex items-center gap-2 rounded-[1.2rem] border border-yellow-500/15 bg-yellow-500/8 px-4 py-3 text-xs text-yellow-300">
                    <AlertTriangle size={14} />
                    <span>No sizes detected. Add variants with a `Size` option or select products that already include sizes.</span>
                </div>
            )}
        </div>
    );
};

export default SizingGuideEditor;
