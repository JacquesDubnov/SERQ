import type { SVGProps } from 'react';

export function PaginationIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="currentColor"
      {...props}
    >
      {/* Page icon with break line */}
      <rect x="2" y="1" width="12" height="14" rx="1" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <line x1="2" y1="8" x2="14" y2="8" stroke="currentColor" strokeWidth="1" strokeDasharray="2 1" />
    </svg>
  );
}
