"use client";

import { Download, FileUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

import {
  importKeywords,
  type CsvImportResult,
  type CsvImportRow
} from "@/app/actions/keywords";

const fieldOptions = [
  { value: "", label: "Do not import" },
  { value: "topic", label: "Topic" },
  { value: "location", label: "Location" },
  { value: "notes", label: "Notes" },
  { value: "active", label: "Active" }
] as const;

type ImportField = (typeof fieldOptions)[number]["value"];

type ParsedCsv = {
  headers: string[];
  rows: string[][];
};

function parseCsv(text: string): ParsedCsv {
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"' && inQuotes && next === '"') {
      field += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(field);
      field = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") {
        index += 1;
      }
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      continue;
    }

    field += char;
  }

  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }

  const nonEmptyRows = rows.filter((cells) =>
    cells.some((cell) => cell.trim().length > 0)
  );

  return {
    headers: nonEmptyRows[0]?.map((header) => header.trim()) ?? [],
    rows: nonEmptyRows.slice(1)
  };
}

function detectField(header: string): ImportField {
  const normalized = header.trim().toLowerCase().replace(/[\s_-]+/g, "");

  if (["topic", "subject", "query", "keyword", "term"].includes(normalized)) {
    return "topic";
  }

  if (["location", "place", "region", "area"].includes(normalized)) {
    return "location";
  }

  if (["notes", "note", "intent", "description"].includes(normalized)) {
    return "notes";
  }

  if (["active", "enabled", "include"].includes(normalized)) {
    return "active";
  }

  return "";
}

function buildRows(parsed: ParsedCsv, mapping: ImportField[]) {
  return parsed.rows.map((cells) => {
    const output: CsvImportRow = {};

    mapping.forEach((field, index) => {
      if (field) {
        output[field] = cells[index] ?? "";
      }
    });

    return output;
  });
}

export function CsvKeywordImporter() {
  const router = useRouter();
  const [parsed, setParsed] = useState<ParsedCsv | null>(null);
  const [mapping, setMapping] = useState<ImportField[]>([]);
  const [mode, setMode] = useState<"append" | "replace">("append");
  const [replaceConfirmed, setReplaceConfirmed] = useState(false);
  const [result, setResult] = useState<CsvImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const mappedRows = useMemo(() => {
    if (!parsed) {
      return [];
    }

    return buildRows(parsed, mapping);
  }, [mapping, parsed]);

  const topicMapped = mapping.includes("topic");

  async function handleFile(file: File | undefined) {
    setResult(null);
    setError(null);

    if (!file) {
      return;
    }

    const text = await file.text();
    const nextParsed = parseCsv(text);

    if (!nextParsed.headers.length) {
      setParsed(null);
      setMapping([]);
      setError("The CSV needs a header row.");
      return;
    }

    setParsed(nextParsed);
    setMapping(nextParsed.headers.map(detectField));
  }

  function submitImport() {
    if (!parsed || !topicMapped) {
      setError("Map one column to Topic before importing.");
      return;
    }

    setError(null);
    startTransition(async () => {
      const nextResult = await importKeywords({
        rows: mappedRows,
        mode,
        confirmReplace: mode === "replace" && replaceConfirmed
      });
      setResult(nextResult);
      router.refresh();
    });
  }

  return (
    <section className="panel stack-lg" aria-labelledby="csv-import-title">
      <div className="section-heading">
        <div>
          <h2 className="panel-title" id="csv-import-title">
            CSV import
          </h2>
          <p className="panel-copy">
            Upload rows, map headers, then append by default.
          </p>
        </div>
        <a
          className="button button-secondary"
          href="data:text/csv;charset=utf-8,topic,location,notes,active%0AResearch%20topic,Optional%20location,Optional%20notes,true"
          download="keyword-template.csv"
        >
          <Download size={16} aria-hidden="true" />
          Template
        </a>
      </div>

      <label className="file-drop">
        <FileUp size={18} aria-hidden="true" />
        <span>Choose CSV file</span>
        <input
          type="file"
          accept=".csv,text/csv"
          onChange={(event) => void handleFile(event.target.files?.[0])}
        />
      </label>

      {parsed ? (
        <div className="stack-md">
          <div className="mapping-grid">
            {parsed.headers.map((header, index) => (
              <label className="field" key={`${header}-${index}`}>
                <span className="label">{header || `Column ${index + 1}`}</span>
                <select
                  className="input"
                  value={mapping[index] ?? ""}
                  onChange={(event) => {
                    const next = [...mapping];
                    next[index] = event.target.value as ImportField;
                    setMapping(next);
                  }}
                >
                  {fieldOptions.map((option) => (
                    <option value={option.value} key={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>

          <div className="import-options">
            <label className="choice-row">
              <input
                type="radio"
                checked={mode === "append"}
                onChange={() => setMode("append")}
              />
              <span>Append and skip duplicates</span>
            </label>
            <label className="choice-row">
              <input
                type="radio"
                checked={mode === "replace"}
                onChange={() => setMode("replace")}
              />
              <span>Replace all existing keywords</span>
            </label>
            {mode === "replace" ? (
              <label className="choice-row danger-copy">
                <input
                  type="checkbox"
                  checked={replaceConfirmed}
                  onChange={(event) => setReplaceConfirmed(event.target.checked)}
                />
                <span>I understand this deletes the current keyword list first.</span>
              </label>
            ) : null}
          </div>

          <div className="preview-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Topic</th>
                  <th>Location</th>
                  <th>Notes</th>
                  <th>Active</th>
                </tr>
              </thead>
              <tbody>
                {mappedRows.slice(0, 5).map((row, index) => (
                  <tr key={index}>
                    <td>{row.topic || "Not mapped"}</td>
                    <td>{row.location || ""}</td>
                    <td>{row.notes || ""}</td>
                    <td>{row.active || "true"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            className="button"
            type="button"
            disabled={isPending || !topicMapped}
            onClick={submitImport}
          >
            {isPending ? "Importing..." : `Import ${mappedRows.length} rows`}
          </button>
        </div>
      ) : null}

      {error ? (
        <p className="form-message" role="alert">
          {error}
        </p>
      ) : null}

      {result ? (
        <div className="import-summary" role="status">
          <strong>
            {result.added} added, {result.skipped} skipped, {result.rejected} rejected
          </strong>
          {result.messages.length ? (
            <ul>
              {result.messages.slice(0, 8).map((message) => (
                <li key={message}>{message}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
