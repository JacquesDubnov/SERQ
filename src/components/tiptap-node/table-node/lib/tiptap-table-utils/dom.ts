export function isHTMLElement(n: unknown): n is HTMLElement {
  return n instanceof HTMLElement
}

export type DomCellAroundResult =
  | {
      type: "cell"
      domNode: HTMLElement
      tbodyNode: HTMLTableSectionElement | null
    }
  | {
      type: "wrapper"
      domNode: HTMLElement
      tbodyNode: HTMLTableSectionElement | null
    }

export function safeClosest<T extends Element>(
  start: Element | null,
  selector: string
): T | null {
  return (start?.closest?.(selector) as T | null) ?? null
}

/**
 * Walk up from an element until we find a TD/TH or the table wrapper.
 * Returns the found element plus its tbody (if present).
 */
export function domCellAround(
  target: Element
): DomCellAroundResult | undefined {
  let current: Element | null = target

  while (
    current &&
    current.tagName !== "TD" &&
    current.tagName !== "TH" &&
    !current.classList.contains("tableWrapper")
  ) {
    if (current.classList.contains("ProseMirror")) return undefined
    current = isHTMLElement(current.parentNode)
      ? (current.parentNode as Element)
      : null
  }

  if (!current) return undefined

  if (current.tagName === "TD" || current.tagName === "TH") {
    return {
      type: "cell",
      domNode: current as HTMLElement,
      tbodyNode: safeClosest<HTMLTableSectionElement>(current, "tbody"),
    }
  }

  return {
    type: "wrapper",
    domNode: current as HTMLElement,
    tbodyNode: (current as HTMLElement).querySelector("tbody"),
  }
}
