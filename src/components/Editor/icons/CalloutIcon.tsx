import type { SVGProps } from 'react';

export function CalloutIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="currentColor"
      {...props}
    >
      <rect x="1" y="2" width="2" height="12" rx="1" />
      <rect x="4" y="2" width="11" height="12" rx="1" opacity="0.4" />
      <circle cx="9" cy="6" r="1.5" />
      <rect x="7" y="9" width="4" height="1.5" rx="0.5" />
    </svg>
  );
}
