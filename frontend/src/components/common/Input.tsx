import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement> {
    label?: string;
    error?: string;
    rows?: number;
    multiline?: boolean;
}

const Input: React.FC<InputProps> = ({
    label,
    error,
    multiline = false,
    rows = 3,
    className = '',
    ...props
}) => {
    const inputClasses = `w-full px-4 py-3 bg-dark-900/50 border rounded-xl text-white placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${error ? 'border-red-500/50' : 'border-dark-600/50'
        } ${className}`;

    return (
        <div>
            {label && (
                <label className="block text-sm font-medium text-dark-300 mb-2">
                    {label}
                    {props.required && <span className="text-red-400 ml-1">*</span>}
                </label>
            )}
            {multiline ? (
                <textarea
                    {...props as React.TextareaHTMLAttributes<HTMLTextAreaElement>}
                    rows={rows}
                    className={inputClasses}
                />
            ) : (
                <input
                    {...props as React.InputHTMLAttributes<HTMLInputElement>}
                    className={inputClasses}
                />
            )}
            {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
        </div>
    );
};

export default Input;
