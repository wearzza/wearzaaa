import { Star } from 'lucide-react';

interface Props {
  rating: number;
  size?: number;
  interactive?: boolean;
  onChange?: (r: number) => void;
}

export default function StarRating({ rating, size = 16, interactive = false, onChange }: Props) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => {
        const filled = i < Math.floor(rating);
        const half = !filled && i < rating;
        return (
          <button
            key={i}
            type={interactive ? 'button' : undefined}
            onClick={interactive && onChange ? () => onChange(i + 1) : undefined}
            className={interactive ? 'cursor-pointer hover:scale-125 transition-transform' : 'cursor-default'}
            disabled={!interactive}
          >
            <Star
              size={size}
              fill={filled || half ? '#f59e0b' : 'none'}
              stroke={filled || half ? '#f59e0b' : '#d1d5db'}
              strokeWidth={1.5}
            />
          </button>
        );
      })}
    </div>
  );
}
