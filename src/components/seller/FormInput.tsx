import React from 'react';

interface FormInputProps {
  id: string;
  label: string;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  error?: string;
  maxLength?: number;
  icon?: React.ReactNode;
  className?: string;
}

const FormInput: React.FC<FormInputProps> = ({
  id,
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  required = false,
  error,
  maxLength,
  icon,
  className = ''
}) => {
  return (
    <div className={`space-y-1 ${className}`}>
      <label htmlFor={id} className="block text-sm font-medium text-neutral-400">
        {label}{required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400">
            {icon}
          </div>
        )}
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={maxLength}
          placeholder={placeholder}
          required={required}
          className={`
            w-full px-3 py-2 
            ${icon ? 'pl-10' : ''}
            bg-background 
            border border-neutral-700 
            rounded-md 
            text-white 
            placeholder-neutral-500
            focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
            ${error ? 'border-red-500' : ''}
          `}
        />
      </div>
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
      {maxLength && (
        <p className="text-xs text-neutral-500 text-right">
          {value.length}/{maxLength}
        </p>
      )}
    </div>
  );
};

export default FormInput;