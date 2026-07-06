type SkeletonPanelProps = {
  tall?: boolean;
};

export function SkeletonPageHeader() {
  return (
    <div className="skeleton-header" aria-hidden="true">
      <div className="skeleton skeleton-title" />
      <div className="skeleton skeleton-kicker" />
    </div>
  );
}

export function SkeletonPanel({ tall }: SkeletonPanelProps) {
  return (
    <div
      className={`skeleton ${tall ? "skeleton-panel--tall" : "skeleton-panel"}`}
      aria-hidden="true"
    />
  );
}

type PageLoadingSkeletonProps = {
  panels?: number;
};

export function PageLoadingSkeleton({ panels = 3 }: PageLoadingSkeletonProps) {
  return (
    <div className="page-frame stack-xl" role="status" aria-label="Loading page">
      <SkeletonPageHeader />
      {Array.from({ length: panels }).map((_, index) => (
        <SkeletonPanel key={index} tall={index === panels - 1} />
      ))}
    </div>
  );
}
