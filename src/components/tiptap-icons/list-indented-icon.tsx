/**
 * List Indented Icon - Stub
 * This icon is referenced by TipTap's slash-dropdown-menu.
 */

import { memo, forwardRef } from 'react';

type IconProps = React.SVGProps<SVGSVGElement>;

export const ListIndentedIcon = memo(
  forwardRef<SVGSVGElement, IconProps>(({ className, ...props }, ref) => (
    <svg
      ref={ref}
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <line x1="21" y1="8" x2="11" y2="8" />
      <line x1="21" y1="12" x2="11" y2="12" />
      <line x1="21" y1="16" x2="11" y2="16" />
      <line x1="3" y1="12" x2="7" y2="12" />
    </svg>
  ))
);

ListIndentedIcon.displayName = 'ListIndentedIcon';

export default ListIndentedIcon;
