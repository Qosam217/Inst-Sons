import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function Button({ children, className, variant = 'primary', ...props }) {
  const baseStyles = 'px-4 py-2 rounded-lg font-medium transition duration-150 inline-flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm',
    secondary: 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700',
    danger: 'bg-rose-600 hover:bg-rose-500 text-white',
    outline: 'border border-slate-600 hover:bg-slate-800 text-slate-300',
  };

  return (
    <button className={twMerge(clsx(baseStyles, variants[variant], className))} {...props}>
      {children}
    </button>
  );
}

export function Card({ children, className, ...props }) {
  return (
    <div className={twMerge('bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md', className)} {...props}>
      {children}
    </div>
  );
}
