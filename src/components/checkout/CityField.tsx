import React, { useCallback, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import CitySelectModal from './CitySelectModal';

/**
 * Owns whether the picker is open. Kept out of the checkout page because that
 * toggle used to re-render the whole page — order summary, payment section and
 * all — in the same frame the picker was trying to animate in.
 */
const CityField: React.FC<{
    value: string;
    hasError?: boolean;
    onSelect: (city: string) => void;
}> = ({ value, hasError, onSelect }) => {
    const [isOpen, setIsOpen] = useState(false);
    const close = useCallback(() => setIsOpen(false), []);
    const select = useCallback((city: string) => {
        onSelect(city);
        setIsOpen(false);
    }, [onSelect]);

    return (
        <>
            <button
                type="button"
                onClick={() => setIsOpen(true)}
                className={`flex w-full items-center justify-between rounded-xl border bg-black/40 px-4 py-4 text-left text-[16px] transition-colors ${
                    hasError ? 'border-red-500/50' : 'border-white/[0.1] hover:border-white/35'
                }`}
            >
                <span className={value ? 'text-white' : 'text-white/30'}>{value || 'Select city'}</span>
                <ChevronRight size={16} className="shrink-0 text-white/40" />
            </button>

            <CitySelectModal isOpen={isOpen} selectedCity={value} onClose={close} onSelect={select} />
        </>
    );
};

export default React.memo(CityField);
