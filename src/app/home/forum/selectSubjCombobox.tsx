"use client"

import React, { memo } from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { SearchIcon } from "lucide-react"
import Image from "next/image"
import { icons, defaultItems } from "@/components/icons"

// Define the item type to support ReactNode in the label
interface ComboboxItem {
  value: string;
  label: React.ReactNode;
  // SearchText is used for filtering when label is a ReactNode
  searchText: string;
}

// Convert existing frameworks to match the new format
const convertedItems: ComboboxItem[] = defaultItems.map(item => ({
  ...item,
  searchText: typeof item.label === 'string' ? item.label : '',
}));

interface ComboboxProps {
  items?: ComboboxItem[];
  placeholder?: string;
  searchPlaceholder?: string;
  className?: string;
  onSelect?: (value: string) => void;
  onSelectAction?: (value: any) => void; // Add this prop
  initialValue?: string; // Add this prop
  defaultValue?: any; // Add this prop
  minWidth?: string | number;
}

export function Combobox({
  items = convertedItems,
  placeholder = "Selecteer een vak",
  searchPlaceholder = "Zoek voor een vak...",
  className,
  onSelect,
  onSelectAction, // Include the new prop in function parameters
  initialValue = "", // Include with default empty string
  defaultValue, // Include new prop
  minWidth = "16rem",
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [value, setValue] = React.useState(initialValue || defaultValue || "")
  const [searchTerm, setSearchTerm] = React.useState("")
  const containerRef = React.useRef<HTMLDivElement>(null)
  const buttonRef = React.useRef<HTMLButtonElement>(null)
  const dropdownRef = React.useRef<HTMLDivElement>(null)
  const [dropPosition, setDropPosition] = React.useState<'bottom' | 'top'>('bottom')
  const [isPositioned, setIsPositioned] = React.useState(false)

  // Filter items based on search term using searchText property
  const filteredItems = React.useMemo(() => {
    return items.filter(item =>
      item.searchText.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [searchTerm, items])

  // Function to handle selection
  const handleSelect = (currentValue: string) => {
    const newValue = currentValue === value ? "" : currentValue;
    setValue(newValue);
    if (onSelect) {
      onSelect(newValue);
    }
    // Call onSelectAction if it exists
    if (onSelectAction) {
      onSelectAction(newValue);
    }
    setOpen(false);
    setSearchTerm("");
  };

  // Function to determine and set dropdown position with more robust calculations
  const updateDropPosition = React.useCallback(() => {
    if (!open || !buttonRef.current || !dropdownRef.current) return;

    const buttonRect = buttonRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const spaceBelow = viewportHeight - buttonRect.bottom;

    // Get actual dropdown height directly from DOM
    const dropdownHeight = dropdownRef.current.getBoundingClientRect().height;

    // Set position with more biasing towards showing below when possible
    if (spaceBelow < dropdownHeight && buttonRect.top > dropdownHeight) {
      setDropPosition('top');
    } else {
      setDropPosition('bottom');
    }

    // Mark as positioned
    setIsPositioned(true);
  }, [open]);

  // Initial position calculation when dropdown opens
  React.useEffect(() => {
    if (open) {
      setIsPositioned(false); // Reset positioned state

      // Fast pre-calculation for initial position to reduce flicker
      if (buttonRef.current) {
        const buttonRect = buttonRef.current.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const spaceBelow = viewportHeight - buttonRect.bottom;

        // Use a simplified check for initial position
        if (spaceBelow < 240 && buttonRect.top > 240) {
          setDropPosition('top');
        } else {
          setDropPosition('bottom');
        }
      }

      // More precise calculation after render
      const rafId = requestAnimationFrame(() => {
        updateDropPosition();
      });

      return () => {
        cancelAnimationFrame(rafId);
      };
    } else {
      setIsPositioned(false);
    }
  }, [open, updateDropPosition]);

  // Handle search term changes
  React.useEffect(() => {
    if (!open) return;

    setIsPositioned(false);
    const rafId = requestAnimationFrame(() => {
      updateDropPosition();
    });

    return () => cancelAnimationFrame(rafId);
  }, [searchTerm, open, updateDropPosition]);

  // Handle initial open and window resize
  React.useEffect(() => {
    if (!open) return;

    // Initial positioning when opening
    const initialTimer = setTimeout(updateDropPosition, 50);

    // Handle window resize
    const handleResize = () => {
      updateDropPosition();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(initialTimer);
      window.removeEventListener('resize', handleResize);
    };
  }, [open, updateDropPosition]);

  // Observer for dropdown content changes
  React.useEffect(() => {
    if (!open || !dropdownRef.current) return;

    // Use ResizeObserver to detect any size changes in the dropdown
    const resizeObserver = new ResizeObserver(() => {
      updateDropPosition();
    });

    resizeObserver.observe(dropdownRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [open, updateDropPosition]);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    if (open) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [open])

  // Reset positioned state when closing
  React.useEffect(() => {
    if (!open) {
      setIsPositioned(false);
    }
  }, [open]);

  // Get the selected item
  const selectedItem = React.useMemo(() => {
    return items.find(item => item.value === value);
  }, [items, value]);

  const containerStyle = {
    minWidth: minWidth,
  };

  return (
    <div ref={containerRef} className={cn("relative w-full", className)} style={containerStyle}>
      <Button
        ref={buttonRef}
        variant="outline"
        role="combobox"
        aria-expanded={open}
        className="w-full justify-between border-neutral-700"
        onClick={() => setOpen(!open)}
        style={{ minWidth: "inherit" }}
        type="button" // Add this to prevent form submission when clicked
      >
        <div className="truncate text-left">
          {selectedItem ? selectedItem.label : placeholder}
        </div>
        <ChevronsUpDown className="opacity-50 ml-2 h-4 w-4 shrink-0" />
      </Button>

      {open && (
        <div
          ref={dropdownRef}
          className={cn(
            "absolute rounded-md border border-neutral-700 bg-neutral-900 shadow-lg z-[120] transition-opacity duration-150",
            dropPosition === 'bottom' ? "mt-1 top-full" : "bottom-full mb-1",
            isPositioned ? "opacity-100" : "opacity-0"
          )}
          style={{ width: "100%", minWidth: "inherit" }}
        >
          <div className="flex-row flex items-center bg-neutral-800">
            <SearchIcon className="size-4 stroke-white shrink-0 opacity-50 ml-2" />
            <input
              className="w-full border-0 bg-neutral-800 p-2 text-sm text-white focus:outline-none focus:ring-0"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
              disabled={!isPositioned} // Prevent interaction until positioned
            />
          </div>

          <div className="max-h-60 overflow-auto">
            {filteredItems.length === 0 ? (
              <div className="py-2 px-2 text-sm text-gray-400">Geen resultaten gevonden</div>
            ) : (
              filteredItems.map(item => (
                <div
                  key={item.value}
                  className={cn(
                    "flex items-center justify-between py-1.5 px-2 cursor-pointer hover:bg-sky-400",
                    value === item.value && "bg-neutral-800"
                  )}
                  onClick={() => handleSelect(item.value)}
                >
                  <div className="flex-grow">{item.label}</div>
                  {value === item.value && <Check className="h-4 w-4 ml-2 flex-shrink-0" />}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}