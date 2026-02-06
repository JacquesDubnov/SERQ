import { memo } from "react"

type SvgProps = React.ComponentPropsWithoutRef<"svg">

/** Generic columns icon (2-pane split) */
export const ColumnsIcon = memo(({ className, ...props }: SvgProps) => {
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
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M3 5C3 3.89543 3.89543 3 5 3H19C20.1046 3 21 3.89543 21 5V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V5ZM5 5H11V19H5V5ZM13 5H19V19H13V5Z"
        fill="currentColor"
      />
    </svg>
  )
})

ColumnsIcon.displayName = "ColumnsIcon"

/** 2-column icon */
export const Columns2Icon = memo(({ className, ...props }: SvgProps) => {
  return (
    <svg
      width="24"
      height="24"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <rect x="3" y="3" width="8" height="18" rx="1.5" />
      <rect x="13" y="3" width="8" height="18" rx="1.5" />
    </svg>
  )
})

Columns2Icon.displayName = "Columns2Icon"

/** 3-column icon */
export const Columns3Icon = memo(({ className, ...props }: SvgProps) => {
  return (
    <svg
      width="24"
      height="24"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <rect x="2" y="3" width="5.5" height="18" rx="1.5" />
      <rect x="9.25" y="3" width="5.5" height="18" rx="1.5" />
      <rect x="16.5" y="3" width="5.5" height="18" rx="1.5" />
    </svg>
  )
})

Columns3Icon.displayName = "Columns3Icon"

/** 4-column icon */
export const Columns4Icon = memo(({ className, ...props }: SvgProps) => {
  return (
    <svg
      width="24"
      height="24"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <rect x="1.5" y="3" width="4" height="18" rx="1" />
      <rect x="7" y="3" width="4" height="18" rx="1" />
      <rect x="12.5" y="3" width="4" height="18" rx="1" />
      <rect x="18" y="3" width="4" height="18" rx="1" />
    </svg>
  )
})

Columns4Icon.displayName = "Columns4Icon"
