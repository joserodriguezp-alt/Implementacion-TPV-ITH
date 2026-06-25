import { forwardRef } from 'react';

// forwardRef para compatibilidad con react-hook-form
const Input = forwardRef(function Input({ label, error, id, className = '', ...props }, ref) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-gray-700 leading-none">
          {label}
        </label>
      )}
      <input
        id={id}
        ref={ref}
        className={[
          'w-full px-3.5 py-2.5 text-sm bg-white border rounded-lg outline-none',
          'placeholder:text-gray-400 text-gray-900',
          'transition-all duration-150',
          'focus:border-brand-500 focus:ring-3 focus:ring-brand-100',
          error
            ? 'border-red-400 focus:border-red-500 focus:ring-red-100 bg-red-50'
            : 'border-gray-200 hover:border-gray-300',
          className,
        ].join(' ')}
        {...props}
      />
      {error && (
        <p className="text-xs text-red-600 flex items-center gap-1">
          <span>⚠</span> {error}
        </p>
      )}
    </div>
  );
});

export { Input };
