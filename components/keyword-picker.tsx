"use client";

import { useState } from "react";

export type KeywordOption = {
  id: string;
  label: string;
};

type KeywordPickerProps = {
  options: KeywordOption[];
};

export function KeywordPicker({ options }: KeywordPickerProps) {
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(options.map((option) => option.id))
  );

  function toggle(id: string) {
    setSelected((current) => {
      const next = new Set(current);

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      return next;
    });
  }

  if (!options.length) {
    return null;
  }

  return (
    <div className="keyword-picker">
      <div className="keyword-picker-controls">
        <span className="label">
          {selected.size} of {options.length} keywords selected
        </span>
        <div className="row-actions">
          <button
            className="button button-secondary"
            type="button"
            onClick={() => setSelected(new Set(options.map((option) => option.id)))}
          >
            Select all
          </button>
          <button
            className="button button-secondary"
            type="button"
            onClick={() => setSelected(new Set())}
          >
            Select none
          </button>
        </div>
      </div>
      <div className="keyword-picker-list">
        {options.map((option) => (
          <label className="choice-row" key={option.id}>
            <input
              type="checkbox"
              name="keywordIds"
              value={option.id}
              checked={selected.has(option.id)}
              onChange={() => toggle(option.id)}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
