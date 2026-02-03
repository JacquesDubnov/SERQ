/**
 * PaginationModeSelector - Toggle between continuous scroll and paginated modes
 *
 * Uses TipTap UI primitives for consistent styling.
 */

import { forwardRef, useState, useCallback } from 'react';

// TipTap Icons
import { ChevronDownIcon } from '@/components/tiptap-icons/chevron-down-icon';

// TipTap UI Primitives
import { Button, ButtonGroup } from '@/components/tiptap-ui-primitive/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/tiptap-ui-primitive/dropdown-menu';
import { Card, CardBody, CardGroupLabel, CardItemGroup } from '@/components/tiptap-ui-primitive/card';
import { Separator } from '@/components/tiptap-ui-primitive/separator';

// Store types
import type { PageSize } from '@/stores/editorStore';

// Page size options
const PAGE_SIZES: { value: PageSize; label: string; description: string }[] = [
  { value: 'a4', label: 'A4', description: '210 × 297 mm' },
  { value: 'letter', label: 'Letter', description: '8.5 × 11 in' },
  { value: 'legal', label: 'Legal', description: '8.5 × 14 in' },
];

// Icons
const ScrollIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 3v18" />
    <path d="m8 7-4 4 4 4" />
    <path d="m16 7 4 4-4 4" />
  </svg>
);

const PagesIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <line x1="3" y1="12" x2="21" y2="12" />
  </svg>
);

interface PaginationModeSelectorProps {
  paginationEnabled: boolean;
  pageSize: PageSize;
  onTogglePagination: () => void;
  onPageSizeChange: (size: PageSize) => void;
}

export const PaginationModeSelector = forwardRef<HTMLButtonElement, PaginationModeSelectorProps>(
  ({ paginationEnabled, pageSize, onTogglePagination, onPageSizeChange }, ref) => {
    const [isOpen, setIsOpen] = useState(false);

    const currentPageSize = PAGE_SIZES.find((s) => s.value === pageSize);

    const handleModeSelect = useCallback(
      (mode: 'continuous' | 'paginated') => {
        if ((mode === 'paginated') !== paginationEnabled) {
          onTogglePagination();
        }
        if (mode === 'continuous') {
          setIsOpen(false);
        }
      },
      [paginationEnabled, onTogglePagination]
    );

    const handlePageSizeSelect = useCallback(
      (size: PageSize) => {
        if (!paginationEnabled) {
          onTogglePagination();
        }
        onPageSizeChange(size);
        setIsOpen(false);
      },
      [paginationEnabled, onTogglePagination, onPageSizeChange]
    );

    return (
      <DropdownMenu modal open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            data-style="ghost"
            data-active-state={paginationEnabled ? 'on' : 'off'}
            role="button"
            tabIndex={-1}
            aria-label="Document layout mode"
            tooltip={paginationEnabled ? `Paginated (${currentPageSize?.label})` : 'Continuous scroll'}
            ref={ref}
          >
            {paginationEnabled ? (
              <PagesIcon />
            ) : (
              <ScrollIcon />
            )}
            <span className="tiptap-button-text" style={{ fontSize: '12px', minWidth: '52px' }}>
              {paginationEnabled ? currentPageSize?.label : 'Paginate'}
            </span>
            <ChevronDownIcon className="tiptap-button-dropdown-small" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="start"
          style={{
            width: '180px',
            padding: 0,
            background: 'transparent',
            border: 'none',
            boxShadow: 'none',
            borderRadius: '12px',
            overflow: 'hidden',
          }}
        >
          <Card style={{ overflow: 'hidden', width: '100%', borderRadius: '12px' }}>
            <CardBody style={{ paddingTop: '8px', paddingBottom: '8px' }}>
              {/* Continuous mode option */}
              <CardItemGroup>
                <DropdownMenuItem asChild>
                  <Button
                    type="button"
                    data-style="ghost"
                    data-active-state={!paginationEnabled ? 'on' : 'off'}
                    onClick={() => handleModeSelect('continuous')}
                    style={{ width: '100%', justifyContent: 'flex-start' }}
                  >
                    <ScrollIcon />
                    <span className="tiptap-button-text">Continuous</span>
                  </Button>
                </DropdownMenuItem>
              </CardItemGroup>

              <Separator orientation="horizontal" />

              {/* Page sizes */}
              <CardItemGroup>
                <CardGroupLabel>Page Size</CardGroupLabel>
                <ButtonGroup orientation="vertical">
                  {PAGE_SIZES.map((size) => (
                    <DropdownMenuItem key={size.value} asChild>
                      <Button
                        type="button"
                        data-style="ghost"
                        data-active-state={paginationEnabled && pageSize === size.value ? 'on' : 'off'}
                        onClick={() => handlePageSizeSelect(size.value)}
                        style={{ width: '100%', justifyContent: 'flex-start' }}
                      >
                        <PagesIcon />
                        <span className="tiptap-button-text">{size.label}</span>
                        <span
                          style={{
                            fontSize: '10px',
                            opacity: 0.6,
                            marginLeft: 'auto',
                          }}
                        >
                          {size.description}
                        </span>
                      </Button>
                    </DropdownMenuItem>
                  ))}
                </ButtonGroup>
              </CardItemGroup>
            </CardBody>
          </Card>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }
);

PaginationModeSelector.displayName = 'PaginationModeSelector';

export default PaginationModeSelector;
