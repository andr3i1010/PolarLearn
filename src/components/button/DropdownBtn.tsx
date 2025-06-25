"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useImperativeHandle,
  forwardRef,
  ReactNode,
  useCallback,
  useMemo,
} from "react";
import Link from "next/link";

interface DropdownProps {
  text: string;
  dropdownMatrix: [ReactNode, string][];
  selectorMode?: boolean;
  onChangeSelected?: (selected: { id: string; display: ReactNode }) => void;
  width?: number;
  onSelect?: (value: string) => void;
  onChange?: (selected: any) => void;
  disabled?: boolean;
  value?: string;
  className?: string;
  zIndex?: number;
}

export interface DropdownHandle {
  getSelectedItem: () => string;
  setValue: (newId: string, newDisplay: ReactNode) => void;
}

const Dropdown = forwardRef<DropdownHandle, DropdownProps>(
  ({ text, dropdownMatrix, selectorMode, onChangeSelected, width, onSelect, onChange, disabled, value, zIndex = 50, className }, ref) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [computedWidth, setComputedWidth] = useState<number>(0);
    const [dropdownHeight, setDropdownHeight] = useState<number>(0);
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
    }, [dropdownMatrix, width]);

    useEffect(() => {
      if (dropdownRef.current) {
        setDropdownHeight(dropdownRef.current.scrollHeight);
      }
    }, [isExpanded]);

    const effectiveWidth = useMemo(() =>
      width !== undefined ? width : computedWidth
      , [width, computedWidth]);

    const handleMouseEnter = useCallback(() => {
      isMouseOverMainButton.current = true;
      setIsExpanded(true);
    }, []);

    const handleMouseLeave = useCallback(() => {
      isMouseOverMainButton.current = false;
      if (!isMouseOverDropdown.current && !isMouseOverMainButton.current) {
        setIsExpanded(false);
      }
    }, []);

    const handleDropdownMouseEnter = useCallback(() => {
      isMouseOverDropdown.current = true;
    }, []);

    const handleDropdownMouseLeave = useCallback(() => {
      isMouseOverDropdown.current = false;
      if (!isMouseOverMainButton.current) {
        setIsExpanded(false);
      }
    }, []);

    const handleItemClick = useCallback((optionId: string, optionDisplay: ReactNode) => {
      if (selectorMode) {
        setSelectedOption({ id: optionId, display: optionDisplay });
        onChangeSelected && onChangeSelected({ id: optionId, display: optionDisplay });
        onSelect && onSelect(optionId);
      }
      setIsExpanded(false);
      onChange && onChange({ id: optionId, display: optionDisplay });
    }, [selectorMode, onChangeSelected, onSelect, onChange]);

    const handleButtonClick = () => {
      if (!isExpanded) {
        setIsExpanded(true);
      }
    };

    return (
      <div
        className={`absolute ${disabled ? "pointer-events-none opacity-50" : ""} ${className}`}
        style={{ zIndex }}
      >
        <div
          className={`inline-block hover:bg-gradient-to-r from-sky-400 to-sky-100 transition-transform rounded-lg`}
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
              className={`overflow-hidden transition-all duration-300 ${isExpanded ? "opacity-100" : "opacity-0"} shadow-lg`}
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

Dropdown.displayName = "Dropdown";

export default Dropdown;

export function getCurrentSelectedItem(
  dropdownRef: React.RefObject<DropdownHandle | null>
): string | undefined {
  return dropdownRef.current?.getSelectedItem();
}