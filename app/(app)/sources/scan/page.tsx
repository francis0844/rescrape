import { ScanPanel } from "@/components/scan-panel";
import { StatusMessage } from "@/components/status-message";
import { getActiveScanJob, getPendingSourceCount } from "@/lib/app-data";

export const dynamic = "force-dynamic";

type ScanPageProps = {
  searchParams: Promise<{
    message?: string;
  }>;
};

export default async function ScanPage({ searchParams }: ScanPageProps) {
  const [{ message }, pendingCount, activeJob] = await Promise.all([
    searchParams,
    getPendingSourceCount(),
    getActiveScanJob()
  ]);

  return (
    <div className="page-frame stack-xl">
      <header className="page-header">
        <h1 className="page-title">Scan</h1>
        <p className="page-kicker">
          Step 2 of 3: crawl each pending site and ask the verification agent for a judgment.
        </p>
      </header>

      <StatusMessage message={message} />

      <ScanPanel
        pendingCount={pendingCount}
        initialJob={
          activeJob
            ? {
                id: activeJob.id,
                status: activeJob.status,
                totalSites: activeJob.total_sites,
                processedSites: activeJob.processed_sites,
                currentSourceId: activeJob.current_source_id
              }
            : null
        }
      />
    </div>
  );
}
