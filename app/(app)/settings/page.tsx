import { Save } from "lucide-react";

import {
  updateAppSettings,
  updateSearchProvider
} from "@/app/actions/settings";
import { StatusMessage } from "@/components/status-message";
import { SubmitButton } from "@/components/submit-button";
import { getAppSettings, getSearchProviders } from "@/lib/app-data";

export const dynamic = "force-dynamic";

type SettingsPageProps = {
  searchParams: Promise<{
    message?: string;
  }>;
};

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  const [{ message }, providers, settings] = await Promise.all([
    searchParams,
    getSearchProviders(),
    getAppSettings()
  ]);

  return (
    <div className="page-frame stack-xl">
      <header className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-kicker">
          Govern where searches may run and keep query and crawl bounds explicit.
        </p>
      </header>

      <StatusMessage message={message} />

      <section className="panel stack-lg" aria-labelledby="provider-title">
        <div className="section-heading">
          <div>
            <h2 className="panel-title" id="provider-title">
              Search provider whitelist
            </h2>
            <p className="panel-copy">
              Enabled providers are the hard boundary for future search runs.
            </p>
          </div>
        </div>

        <div className="provider-list">
          {providers.map((provider) => (
            <form
              action={updateSearchProvider}
              className="editable-row"
              key={provider.id}
            >
              <input type="hidden" name="id" value={provider.id} />
              <div className="row-main">
                <div>
                  <p className="row-title">{provider.name}</p>
                  <p className="row-meta">Key reference: {provider.api_key_env}</p>
                </div>
                <label className="toggle-row">
                  <input
                    type="checkbox"
                    name="enabled"
                    defaultChecked={provider.enabled}
                  />
                  <span>{provider.enabled ? "Enabled" : "Disabled"}</span>
                </label>
              </div>
              <div className="form-grid">
                <label className="field">
                  <span className="label">API key env name</span>
                  <input
                    className="input"
                    name="api_key_env"
                    defaultValue={provider.api_key_env}
                    pattern="[A-Z0-9_]+"
                    required
                  />
                </label>
                <label className="field">
                  <span className="label">Default result cap</span>
                  <input
                    className="input"
                    name="default_result_cap"
                    type="number"
                    min="1"
                    defaultValue={provider.default_result_cap}
                    required
                  />
                </label>
                <label className="field field-wide">
                  <span className="label">Config JSON</span>
                  <textarea
                    className="input textarea"
                    name="config"
                    defaultValue={JSON.stringify(provider.config, null, 2)}
                  />
                </label>
              </div>
              <SubmitButton className="button row-action" pendingLabel="Saving...">
                <Save size={16} aria-hidden="true" />
                Save provider
              </SubmitButton>
            </form>
          ))}
        </div>
      </section>

      <section className="panel stack-lg" aria-labelledby="settings-title">
        <div className="section-heading">
          <div>
            <h2 className="panel-title" id="settings-title">
              Budget and crawl bounds
            </h2>
            <p className="panel-copy">
              These limits shape future discovery and verification work.
            </p>
          </div>
        </div>

        <form action={updateAppSettings} className="stack-lg">
          <input type="hidden" name="id" value={settings.id} />
          <div className="form-grid">
            <label className="field">
              <span className="label">Result cap per query</span>
              <input
                className="input"
                name="result_cap_per_query"
                type="number"
                min="1"
                defaultValue={settings.result_cap_per_query}
                required
              />
            </label>
            <label className="field">
              <span className="label">Crawl max pages</span>
              <input
                className="input"
                name="crawl_max_pages"
                type="number"
                min="1"
                defaultValue={settings.crawl_max_pages}
                required
              />
            </label>
            <label className="field">
              <span className="label">Crawl max depth</span>
              <input
                className="input"
                name="crawl_max_depth"
                type="number"
                min="1"
                defaultValue={settings.crawl_max_depth}
                required
              />
            </label>
            <label className="field">
              <span className="label">Crawl character budget</span>
              <input
                className="input"
                name="crawl_char_budget"
                type="number"
                min="1"
                defaultValue={settings.crawl_char_budget}
                required
              />
            </label>
            <label className="field">
              <span className="label">Chunk size</span>
              <input
                className="input"
                name="chunk_size"
                type="number"
                min="1"
                defaultValue={settings.chunk_size}
                required
              />
            </label>
            <label className="field field-wide">
              <span className="label">Include domains</span>
              <textarea
                className="input textarea"
                name="include_domains"
                defaultValue={settings.include_domains.join("\n")}
                placeholder="One domain per line. Leave empty for open-web search."
              />
            </label>
          </div>
          <SubmitButton className="button fit-content" pendingLabel="Saving...">
            <Save size={16} aria-hidden="true" />
            Save settings
          </SubmitButton>
        </form>
      </section>
    </div>
  );
}
