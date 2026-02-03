/**
 * TOC Show Title Button - Stub
 * This component is not used in SERQ but is referenced by TipTap's drag-context-menu.
 */

import { forwardRef, memo } from 'react';

type IconProps = React.SVGProps<SVGSVGElement>;

// Placeholder icon
const PlaceholderIcon = memo(
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
      <rect x="3" y="3" width="18" height="18" rx="2" />
    </svg>
  ))
);

PlaceholderIcon.displayName = 'PlaceholderIcon';

export const TocShowTitleButton = forwardRef<HTMLButtonElement>((_props, _ref) => {
  return null; // Stub - TOC not implemented
});

TocShowTitleButton.displayName = 'TocShowTitleButton';

// Stub hook for TOC show title functionality
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function useTocShowTitle(_config?: unknown) {
  return {
    isVisible: false,
    canToggle: false,
    isActive: false,
    handleToggle: () => {},
    label: 'Show Title',
    Icon: PlaceholderIcon,
  };
}

export default TocShowTitleButton;
