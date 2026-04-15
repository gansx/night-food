"use client";

import { useEffect, useId, useRef, useState } from "react";

type OrbitSelectOption = {
  value: string;
  label: string;
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
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

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

      {open ? (
        <div id={`${id}-listbox`} className="orbit-select-popover" role="listbox">
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
        </div>
      ) : null}
    </div>
  );
}

export function OrbitFormSelect({
  name,
  defaultValue,
  options,
  placeholder,
  disabled = false,
  testId
}: {
  name: string;
  defaultValue: string;
  options: OrbitSelectOption[];
  placeholder?: string;
  disabled?: boolean;
  testId?: string;
}) {
  const [value, setValue] = useState(defaultValue);

  return (
    <>
      <input type="hidden" name={name} value={value} />
      <OrbitSelect
        value={value}
        onChange={setValue}
        options={options}
        placeholder={placeholder}
        disabled={disabled}
        testId={testId}
      />
    </>
  );
}
