type EmptyPageProps = {
  title: string;
  description: string;
};

export function EmptyPage({ title, description }: EmptyPageProps) {
  return (
    <div className="page-frame">
      <header className="page-header">
        <h1 className="page-title">{title}</h1>
        <p className="page-kicker">{description}</p>
      </header>
      <section className="panel" aria-label={`${title} phase status`}>
        <h2 className="panel-title">Phase 0 baseline</h2>
        <p className="panel-copy">
          This route is intentionally empty until its milestone is started.
        </p>
      </section>
    </div>
  );
}
