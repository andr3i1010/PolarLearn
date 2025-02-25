"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useImperativeHandle,
  forwardRef,
  ReactNode,
} from "react";
import Link from "next/link";

interface DropdownProps {
  text: string;
  dropdownMatrix: [ReactNode, string][];
  selectorMode?: boolean;
  onChangeSelected?: (selected: { id: string; display: ReactNode }) => void; // UPDATED
  width?: number; // new optional width parameter
  onSelect?: (value: string) => void; // Added onSelect callback
  onChange?: (selected: any) => void; // Added onChange prop
  disabled?: boolean; // NEW disabled prop
  value?: string; // NEW value prop
}

export interface DropdownHandle {
  getSelectedItem: () => string;
  setValue: (newId: string, newDisplay: ReactNode) => void; // NEW method
}

const Dropdown = forwardRef<DropdownHandle, DropdownProps>(
  ({ text, dropdownMatrix, selectorMode, onChangeSelected, width, onSelect, onChange, disabled, value }, ref) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [computedWidth, setComputedWidth] = useState<number>(0);
    const [dropdownHeight, setDropdownHeight] = useState<number>(0);
    // Store both the selected option id and display.
    const [selectedOption, setSelectedOption] = useState<{
      id: string;
      display: ReactNode;
    }>({ id: text, display: text });
    const dropdownRef = useRef<HTMLDivElement>(null);
    const isMouseOverDropdown = useRef(false);
    const isMouseOverMainButton = useRef(false);

    useImperativeHandle(
      ref,
      () => ({
        getSelectedItem: () => selectedOption.id,
        setValue: (newId: string, newDisplay: ReactNode) => {
          setSelectedOption({ id: newId, display: newDisplay });
        }
      }),
      [selectedOption]
    );

    useEffect(() => {
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");

      if (context) {
        context.font = "bold 16px Arial";
        const maxWidth = dropdownMatrix.reduce((acc, [display]) => {
          const str = typeof display === "string" ? display : "";
          const width = context.measureText(str).width;
          return Math.max(acc, width);
        }, 0);
        setComputedWidth(maxWidth + (width !== undefined ? width : 60));
      }
    }, [dropdownMatrix]);

    useEffect(() => {
      if (dropdownRef.current) {
        setDropdownHeight(dropdownRef.current.scrollHeight);
      }
    }, [isExpanded]);

    const effectiveWidth = width !== undefined ? width : computedWidth;

    const handleMouseEnter = () => {
      isMouseOverMainButton.current = true;
      setIsExpanded(true);
    };

    const handleMouseLeave = () => {
      isMouseOverMainButton.current = false;
      if (!isMouseOverDropdown.current && !isMouseOverMainButton.current) {
        setIsExpanded(false);
      }
    };

    const handleDropdownMouseEnter = () => {
      isMouseOverDropdown.current = true;
    };

    const handleDropdownMouseLeave = () => {
      isMouseOverDropdown.current = false;
      if (!isMouseOverMainButton.current) {
        setIsExpanded(false);
      }
    };

    // Accept both id (second element) and display (first element)
    const handleItemClick = (optionId: string, optionDisplay: ReactNode) => {
      if (selectorMode) {
        setSelectedOption({ id: optionId, display: optionDisplay });
        onChangeSelected && onChangeSelected({ id: optionId, display: optionDisplay }); // UPDATED
        onSelect && onSelect(optionId); // Call onSelect if provided
        if (onChange) {
          onChange(optionId);
        }
      }
      setIsExpanded(false);
    };

    const handleButtonClick = () => {
      if (!isExpanded) {
        setIsExpanded(true);
      }
    };

    return (
      <div 
        className={`absolute z-50 ${disabled ? "pointer-events-none opacity-50" : ""}`} // Added z-50 for high stacking order
      >
        <div
          className="inline-block hover:bg-gradient-to-r from-sky-400 to-sky-100 transition-transform rounded-lg"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div
            className={`rounded-lg border-4 border-neutral-700 duration-300 hover:border-transparent`}
            style={{
              width: `${effectiveWidth}px`,
              height: isExpanded ? `${48 + dropdownHeight}px` : "48px",
              backgroundColor: isExpanded ? "transparent" : "#26",
            }}
          >
            <button
              type="button"
              className="w-full bg-neutral-800 text-white font-bold py-2 px-4 rounded-t-md"
              onClick={handleButtonClick}
            >
              {selectorMode ? (value || selectedOption.display) : text}
            </button>

            <div
              ref={dropdownRef}
              className={`overflow-hidden transition-all duration-300 ${isExpanded ? "opacity-100" : "opacity-0"} shadow-lg`} // Add shadow if needed
              style={{
                height: isExpanded ? `${dropdownHeight}px` : "0px",
                width: `${effectiveWidth - 8}px`,
                backgroundColor: "#262626",
                margin: "0 auto",
                transition: "height 0.3s ease, opacity 0.3s ease",
              }}
              onMouseEnter={handleDropdownMouseEnter}
              onMouseLeave={handleDropdownMouseLeave}
            >
              {dropdownMatrix.map(([display, path], index) =>
                selectorMode ? (
                  <div
                    key={index}
                    className="block px-4 py-2 text-white hover:bg-sky-500 transition-colors duration-200 cursor-pointer"
                    onClick={() => handleItemClick(path, display)}
                  >
                    {display}
                  </div>
                ) : (
                  <Link
                    key={index}
                    href={path}
                    className="block px-4 py-2 text-white hover:bg-sky-500 transition-colors duration-200"
                    onClick={() => handleItemClick(path, display)}
                  >
                    {display}
                  </Link>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
);

export default Dropdown;

// Utility function to get currently selected item from a dropdown ref.
export function getCurrentSelectedItem(
  dropdownRef: React.RefObject<DropdownHandle | null>
): string | undefined {
  return dropdownRef.current?.getSelectedItem();
}
