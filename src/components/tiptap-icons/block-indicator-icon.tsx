import { memo } from "react"

type SvgProps = React.ComponentPropsWithoutRef<"svg">

/**
 * Block Indicator Icon - represents the side line indicator for blocks
 * Shows a vertical bar on left with text lines, representing the block indicator feature
 */
export const BlockIndicatorIcon = memo(({ className, ...props }: SvgProps) => {
  return (
    <svg
      width="24"
      height="24"
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      {/* Vertical indicator bar on left */}
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M4 5C4 4.44772 4.22386 4 4.5 4C4.77614 4 5 4.44772 5 5V19C5 19.5523 4.77614 20 4.5 20C4.22386 20 4 19.5523 4 19V5Z"
        fill="currentColor"
      />
      {/* Text line 1 */}
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M8 7C8 6.44772 8.44772 6 9 6H20C20.5523 6 21 6.44772 21 7C21 7.55228 20.5523 8 20 8H9C8.44772 8 8 7.55228 8 7Z"
        fill="currentColor"
      />
      {/* Text line 2 */}
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M8 12C8 11.4477 8.44772 11 9 11H17C17.5523 11 18 11.4477 18 12C18 12.5523 17.5523 13 17 13H9C8.44772 13 8 12.5523 8 12Z"
        fill="currentColor"
      />
      {/* Text line 3 */}
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M8 17C8 16.4477 8.44772 16 9 16H19C19.5523 16 20 16.4477 20 17C20 17.5523 19.5523 18 19 18H9C8.44772 18 8 17.5523 8 17Z"
        fill="currentColor"
      />
    </svg>
  )
})

BlockIndicatorIcon.displayName = "BlockIndicatorIcon"
