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
  helperText?: string;
  maxLength?: number;
  icon?: React.ReactNode;
  className?: string;
  pattern?: string;
  minLength?: number;
  validate?: (value: string) => string | undefined;
  showPasswordStrength?: boolean;
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
  minLength,
  icon,
  className = '',
  pattern,
  validate,
  showPasswordStrength = false,
  helperText
}) => {
  const getPasswordStrength = (password: string): { strength: number; message: string } => {
    let strength = 0;
    let message = '';

    if (password.length >= 8) strength += 1;
    if (password.match(/[a-z]+/)) strength += 1;
    if (password.match(/[A-Z]+/)) strength += 1;
    if (password.match(/[0-9]+/)) strength += 1;
    if (password.match(/[!@#$%^&*(),.?":{}|<>]+/)) strength += 1;

    switch (strength) {
      case 0:
      case 1:
        message = 'Very Weak';
        break;
      case 2:
        message = 'Weak';
        break;
      case 3:
        message = 'Medium';
        break;
      case 4:
        message = 'Strong';
        break;
      case 5:
        message = 'Very Strong';
        break;
      default:
        message = '';
    }

    return { strength, message };
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    if (validate) {
      const validationError = validate(newValue);
      if (validationError) {
        onChange(newValue);
        return;
      }
    }
    onChange(newValue);
  };

  const passwordStrength = type === 'password' && showPasswordStrength ? getPasswordStrength(value) : null;
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
          onChange={handleChange}
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
          pattern={pattern}
          minLength={minLength}
        />
      </div>
      {(error || helperText) && (
        <p className={`text-sm ${error ? 'text-red-500' : 'text-neutral-500'}`}>
          {error || helperText}
        </p>
      )}
      {maxLength && (
        <p className="text-xs text-neutral-500 text-right">
          {value.length}/{maxLength}
        </p>
      )}
      {passwordStrength && (
        <div className="mt-2">
          <div className="flex gap-1 mb-1">
            {[...Array(5)].map((_, index) => (
              <div
                key={index}
                className={`h-1 flex-1 rounded-full ${index < passwordStrength.strength ? 
                  passwordStrength.strength <= 2 ? 'bg-red-500' :
                  passwordStrength.strength === 3 ? 'bg-yellow-500' :
                  'bg-green-500'
                  : 'bg-neutral-700'}`}
              />
            ))}
          </div>
          <p className={`text-xs ${passwordStrength.strength <= 2 ? 'text-red-500' :
            passwordStrength.strength === 3 ? 'text-yellow-500' :
            'text-green-500'}`}>
            {passwordStrength.message}
          </p>
        </div>
      )}
    </div>
  );
};

export default FormInput;