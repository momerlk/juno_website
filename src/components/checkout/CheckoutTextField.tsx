import React, { startTransition, useCallback, useEffect, useRef, useState } from 'react';

/**
 * The checkout form is one large component: every keystroke re-rendered the
 * order summary, the payment picker and the sticky bar with it (~70ms per
 * character on a throttled phone). This input keeps the value it is being given
 * locally, so typing re-renders one field, and pushes the value up on a short
 * debounce plus on blur — soon enough for validation, autosave and analytics,
 * rarely enough that the page is not rebuilt per character.
 */
const COMMIT_DELAY_MS = 220;

type CheckoutTextFieldProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> & {
    value: string;
    onCommit: (value: string) => void;
};

const CheckoutTextField: React.FC<CheckoutTextFieldProps> = ({ value, onCommit, onBlur, ...inputProps }) => {
    const [localValue, setLocalValue] = useState(value);
    const isEditingRef = useRef(false);
    const timerRef = useRef(0);
    const commitRef = useRef(onCommit);
    commitRef.current = onCommit;

    // Accept outside changes (restored draft, programmatic reset) but never
    // overwrite what someone is in the middle of typing.
    useEffect(() => {
        if (!isEditingRef.current) setLocalValue(value);
    }, [value]);

    useEffect(() => () => window.clearTimeout(timerRef.current), []);

    const flush = useCallback((next: string, urgent = false) => {
        window.clearTimeout(timerRef.current);
        isEditingRef.current = false;
        // Blur is the last chance before a submit reads the form, so that path
        // commits synchronously. Mid-typing commits stay low priority: the
        // page-wide re-render must never sit in front of the next character.
        if (urgent) commitRef.current(next);
        else startTransition(() => commitRef.current(next));
    }, []);

    return (
        <input
            {...inputProps}
            value={localValue}
            onChange={(event) => {
                const next = event.target.value;
                isEditingRef.current = true;
                setLocalValue(next);
                window.clearTimeout(timerRef.current);
                timerRef.current = window.setTimeout(() => flush(next), COMMIT_DELAY_MS);
            }}
            onBlur={(event) => {
                flush(event.target.value, true);
                onBlur?.(event);
            }}
        />
    );
};

export default React.memo(CheckoutTextField);
