import { forwardRef, type ButtonHTMLAttributes } from 'react';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'outline' | 'ghost' | 'danger' };
const styles = { primary: 'bg-primary text-primary-foreground hover:opacity-90', outline: 'border border-border bg-card text-foreground hover:bg-muted', ghost: 'text-foreground hover:bg-muted', danger: 'bg-destructive text-primary-foreground hover:opacity-90' };
const Button = forwardRef<HTMLButtonElement, Props>(({ variant = 'primary', className = '', type = 'button', ...props }, ref) => <button ref={ref} type={type} className={`inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${styles[variant]} ${className}`} {...props} />);
Button.displayName = 'Button';
export default Button;