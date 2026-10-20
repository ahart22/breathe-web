"use client";

/** From Uiverse.io by andrew-demchenk0 — bordered pill with a hard shadow. */
export function SegmentedPill({
  options,
  selected,
  onSelect,
}: {
  options: string[];
  selected: number;
  onSelect: (index: number) => void;
}) {
  return (
    <div className="pill" role="tablist">
      {options.map((label, index) => (
        <button
          key={label}
          role="tab"
          aria-selected={index === selected}
          data-on={index === selected}
          onClick={() => onSelect(index)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
