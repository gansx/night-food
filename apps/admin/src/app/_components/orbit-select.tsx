"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";

type OrbitSelectOption = {
  value: string;
  label: string;
};

type PopoverPosition = {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
};

export function OrbitSelect({
  value,
  options,
  onChange,
  placeholder = "请选择",
  disabled = false,
  testId
}: {
  value: string;
  options: OrbitSelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  testId?: string;
}) {
  const id = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<PopoverPosition | null>(null);
  const selected = options.find((option) => option.value === value);

  function updatePosition() {
    const rect = rootRef.current?.getBoundingClientRect();
    if (!rect) {
      return;
    }

    const margin = 12;
    const width = Math.max(rect.width, 180);
    const maxLeft = Math.max(margin, window.innerWidth - width - margin);
    const topSpace = window.innerHeight - rect.bottom - margin;
    const bottomSpace = rect.top - margin;
    const openUp = topSpace < 180 && bottomSpace > topSpace;
    const maxHeight = Math.max(160, Math.min(320, openUp ? bottomSpace - 8 : topSpace - 8));

    setPosition({
      top: openUp ? Math.max(margin, rect.top - maxHeight - 8) : rect.bottom + 8,
      left: Math.min(Math.max(margin, rect.left), maxLeft),
      width,
      maxHeight
    });
  }

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (!rootRef.current?.contains(target) && !popoverRef.current?.contains(target)) {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  useLayoutEffect(() => {
    if (!open) {
      setPosition(null);
      return;
    }

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open]);

  const popoverStyle: CSSProperties | undefined = position
    ? {
        top: position.top,
        left: position.left,
        width: position.width,
        maxHeight: position.maxHeight
      }
    : undefined;

  return (
    <div ref={rootRef} className="orbit-select" data-open={open ? "true" : "false"}>
      <button
        type="button"
        className="orbit-select-trigger"
        data-testid={testId}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-listbox`}
        disabled={disabled || !options.length}
        onClick={() => setOpen((current) => !current)}
      >
        <span>{selected?.label ?? placeholder}</span>
        <span className="orbit-select-caret" aria-hidden="true">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </button>

      {open && position
        ? createPortal(
            <div
              ref={popoverRef}
              id={`${id}-listbox`}
              className="orbit-select-popover"
              role="listbox"
              style={popoverStyle}
            >
          {options.map((option) => {
            const active = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                className="orbit-select-option"
                data-active={active ? "true" : "false"}
                role="option"
                aria-selected={active}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
              >
                <span>{option.label}</span>
                {active ? <span className="orbit-select-dot" aria-hidden="true" /> : null}
              </button>
            );
          })}
            </div>,
            document.body
          )
        : null}
    </div>
  );
}

export function OrbitFormSelect({
  name,
  defaultValue,
  options,
  placeholder,
  disabled = false,
  testId,
  submitOnChange = false
}: {
  name: string;
  defaultValue: string;
  options: OrbitSelectOption[];
  placeholder?: string;
  disabled?: boolean;
  testId?: string;
  submitOnChange?: boolean;
}) {
  const [value, setValue] = useState(defaultValue);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleChange(nextValue: string) {
    setValue(nextValue);
    if (inputRef.current) {
      inputRef.current.value = nextValue;
    }
    if (submitOnChange) {
      window.setTimeout(() => inputRef.current?.form?.requestSubmit(), 0);
    }
  }

  return (
    <>
      <input ref={inputRef} type="hidden" name={name} value={value} />
      <OrbitSelect
        value={value}
        onChange={handleChange}
        options={options}
        placeholder={placeholder}
        disabled={disabled}
        testId={testId}
      />
    </>
  );
}
