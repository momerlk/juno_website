import React, { useState, useEffect } from 'react';
import { SizingGuide } from '../../constants/types';
import { dummySizingGuides, productTypeToSizingGuide } from '../../constants/sizing';
import { AlertTriangle } from 'lucide-react';

interface SizingGuideEditorProps {
    value?: SizingGuide;
    onChange: (value: SizingGuide) => void;
    productType?: string;
    availableSizes?: string[];
}

const SizingGuideEditor: React.FC<SizingGuideEditorProps> = ({ value, onChange, productType, availableSizes = [] }) => {
    const [selectedType, setSelectedType] = useState<string>('');
    
    useEffect(() => {
        if (productType && productTypeToSizingGuide[productType]) {
             // Only auto-select if no type is currently selected
             if (!selectedType) setSelectedType(productTypeToSizingGuide[productType]);
        }
    }, [productType, selectedType]);

    const handleChange = (field: keyof SizingGuide, newVal: any) => {
        onChange({ ...value, [field]: newVal } as SizingGuide);
    };

    const handleChartChange = (rowKey: string, colKey: string, cellVal: string) => {
        const newChart = { ...(value?.size_chart || {}) };
        let finalValue: number;
        if (cellVal.trim() === '') {
            finalValue = -1;
        } else {
            const numericValue = parseFloat(cellVal);
            finalValue = isNaN(numericValue) ? -1 : numericValue;
        }
        newChart[rowKey] = { ...(newChart[rowKey] || {}), [colKey]: finalValue };
        handleChange('size_chart', newChart);
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

            onChange({
                size_chart: newChart,
                size_fit: guide.size_fit,
                measurement_unit: guide.measurement_unit as any
            });
        }
    };
    
    useEffect(() => {
        if (selectedType && availableSizes.length > 0) {
             const guide = dummySizingGuides[selectedType];
             if (!guide) return;
             const cols = Object.keys(guide.size_chart['dummy_row']);
             
             const currentChart = value?.size_chart || {};
             const newChart = { ...currentChart };
             let hasChanges = false;

             availableSizes.forEach(size => {
                 if (!newChart[size]) {
                     newChart[size] = {};
                     cols.forEach(col => newChart[size][col] = -1);
                     hasChanges = true;
                 }
             });
             
             if (hasChanges) {
                 onChange({ ...value, size_chart: newChart } as SizingGuide);
             }
        }
    }, [availableSizes, selectedType, value?.size_chart, onChange, value]); 


    const sizingGuideColumns = selectedType ? Object.keys(dummySizingGuides[selectedType].size_chart['dummy_row']) : [];

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-neutral-300">Sizing Guide Type</label>
                    <select 
                        value={selectedType} 
                        onChange={e => handleTypeChange(e.target.value)} 
                        className="glass-input w-full mt-1"
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
                        className="glass-input w-full mt-1"
                    >
                        <option value="inch" className="bg-neutral-900">Inch</option>
                        <option value="cm" className="bg-neutral-900">CM</option>
                    </select>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-neutral-300">Sizing & Fit Details</label>
                <textarea 
                    value={value?.size_fit || ''} 
                    onChange={e => handleChange('size_fit', e.target.value)} 
                    className="glass-input w-full mt-1 h-20" 
                    placeholder="e.g., Regular fit, true to size."
                />
            </div>

            {availableSizes.length > 0 && selectedType && (
                <div className="overflow-x-auto rounded-xl border border-white/10">
                    <table className="w-full text-sm text-left text-neutral-300">
                        <thead className="text-xs text-neutral-400 uppercase bg-white/5">
                            <tr>
                                <th scope="col" className="px-4 py-3">Size</th>
                                {sizingGuideColumns.map(col => (
                                    <th key={col} scope="col" className="px-4 py-3">{col} ({value?.measurement_unit})</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {availableSizes.map(size => (
                                <tr key={size} className="border-b border-white/5 bg-white/5">
                                    <th scope="row" className="px-4 py-2 font-medium whitespace-nowrap">{size}</th>
                                    {sizingGuideColumns.map(col => (
                                        <td key={col} className="px-4 py-2">
                                            <input 
                                                type="number" 
                                                placeholder="N/A"
                                                value={(value?.size_chart?.[size]?.[col] ?? -1) === -1 ? '' : value?.size_chart?.[size]?.[col]}
                                                onChange={e => handleChartChange(size, col, e.target.value)} 
                                                className="w-20 glass-input py-1 px-2 h-8 text-sm" 
                                            />
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
             {availableSizes.length === 0 && (
                <p className='text-xs text-yellow-500 flex items-center mt-1'>
                    <AlertTriangle size={14} className='mr-1'/> 
                    No sizes detected. Add variants with "Size" option or ensure selected products have sizes.
                </p>
            )}
        </div>
    );
};

export default SizingGuideEditor;