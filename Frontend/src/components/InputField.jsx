import React from 'react';

const InputField = ({ 
  label, 
  type = 'text', 
  name, 
  value, 
  onChange, 
  placeholder, 
  error,
  ...props 
}) => {
  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label 
          htmlFor={name} 
          className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 select-none"
        >
          {label}
        </label>
      )}
      
      <div className="relative">
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`block w-full rounded-xl border px-3.5 py-2 text-sm text-zinc-900 bg-white focus:outline-hidden focus:ring-1 transition-all duration-200 ${
            error
              ? 'border-red-300 bg-red-50/10 focus:border-red-500 focus:ring-red-500'
              : 'border-zinc-200 focus:border-zinc-900 focus:ring-zinc-900'
          }`}
          {...props}
        />
      </div>

      {/* Animated Validation Error Warning Alert */}
      {error && (
        <p className="text-[11px] font-medium text-red-600 transition-all duration-200 animate-fadeIn">
          {error}
        </p>
      )}
    </div>
  );
};

export default InputField;