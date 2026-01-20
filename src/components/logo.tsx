import type { SVGProps } from 'react';
import { cn } from '@/lib/utils';

export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <title>UmmaTech Aid Logo</title>
      <path
        d="M12 2c-5.523 0-10 4.477-10 10s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z"
        className="fill-green-200/20 stroke-green-500/30"
        strokeWidth="0.5"
        style={{
          fill: 'hsl(var(--accent) / 0.2)',
          stroke: 'hsl(var(--accent) / 0.3)',
        }}
      />
      <path
        d="M16,16 A5,5 0 0,1 8,16"
        strokeWidth="1.5"
        className="stroke-primary"
      />
      <path
        d="M17.5,14 A7,7 0 0,1 6.5,14"
        strokeWidth="1.5"
        className="stroke-primary/70"
      />
      <path
        d="M9.5 12c0-2 1-3.5 2.5-3.5S14.5 10 14.5 12"
        className="fill-accent stroke-accent"
        strokeWidth="1"
      />
    </svg>
  );
}
