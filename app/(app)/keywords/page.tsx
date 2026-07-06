import { Plus, Save, Trash2 } from "lucide-react";

import {
  createKeyword,
  deleteKeyword,
  updateKeyword
} from "@/app/actions/keywords";
import { CsvKeywordImporter } from "@/components/csv-keyword-importer";
import { StatusMessage } from "@/components/status-message";
import { getKeywords } from "@/lib/app-data";

export const dynamic = "force-dynamic";

type KeywordsPageProps = {
  searchParams: Promise<{
    message?: string;
  }>;
};

export default async function KeywordsPage({ searchParams }: KeywordsPageProps) {
  const [{ message }, keywords] = await Promise.all([searchParams, getKeywords()]);

  return (
    <div className="page-frame stack-xl">
      <header className="page-header">
        <h1 className="page-title">Keywords</h1>
        <p className="page-kicker">
          Each active row becomes exactly one future query: topic plus optional location.
        </p>
      </header>

      <StatusMessage message={message} />

      <section className="panel stack-lg" aria-labelledby="create-keyword-title">
        <div className="section-heading">
          <div>
            <h2 className="panel-title" id="create-keyword-title">
              Create keyword
            </h2>
            <p className="panel-copy">
              Keep rows neutral and specific. No automatic expansion is applied.
            </p>
          </div>
        </div>
        <form action={createKeyword} className="form-grid align-end">
          <label className="field">
            <span className="label">Topic</span>
            <input className="input" name="topic" required />
          </label>
          <label className="field">
            <span className="label">Location</span>
            <input className="input" name="location" />
          </label>
          <label className="field field-wide">
            <span className="label">Notes</span>
            <input className="input" name="notes" />
          </label>
          <label className="choice-row">
            <input type="checkbox" name="active" defaultChecked />
            <span>Active</span>
          </label>
          <button className="button fit-content" type="submit">
            <Plus size={16} aria-hidden="true" />
            Create keyword
          </button>
        </form>
      </section>

      <CsvKeywordImporter />

      <section className="panel stack-lg" aria-labelledby="keyword-list-title">
        <div className="section-heading">
          <div>
            <h2 className="panel-title" id="keyword-list-title">
              Keyword list
            </h2>
            <p className="panel-copy">
              {keywords.length} rows currently available.
            </p>
          </div>
        </div>

        {keywords.length ? (
          <div className="keyword-list">
            {keywords.map((keyword) => (
              <form action={updateKeyword} className="editable-row" key={keyword.id}>
                <input type="hidden" name="id" value={keyword.id} />
                <div className="form-grid keyword-grid">
                  <label className="field">
                    <span className="label">Topic</span>
                    <input
                      className="input"
                      name="topic"
                      defaultValue={keyword.topic}
                      required
                    />
                  </label>
                  <label className="field">
                    <span className="label">Location</span>
                    <input
                      className="input"
                      name="location"
                      defaultValue={keyword.location ?? ""}
                    />
                  </label>
                  <label className="field">
                    <span className="label">Notes</span>
                    <input
                      className="input"
                      name="notes"
                      defaultValue={keyword.notes ?? ""}
                    />
                  </label>
                  <label className="choice-row">
                    <input
                      type="checkbox"
                      name="active"
                      defaultChecked={keyword.active}
                    />
                    <span>Active</span>
                  </label>
                </div>
                <div className="row-actions">
                  <button className="button button-secondary" type="submit">
                    <Save size={16} aria-hidden="true" />
                    Save
                  </button>
                  <button
                    className="button button-danger"
                    formAction={deleteKeyword}
                    type="submit"
                  >
                    <Trash2 size={16} aria-hidden="true" />
                    Delete
                  </button>
                </div>
              </form>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <h3>No keywords yet</h3>
            <p>Create one row or import a CSV to prepare future search inputs.</p>
          </div>
        )}
      </section>
    </div>
  );
}
