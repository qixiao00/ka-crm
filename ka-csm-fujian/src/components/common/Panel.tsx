export function Panel({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <section className="panel">
      <div className="mb-5">
        <h2 className="panel-title">{title}</h2>
        <p className="panel-subtitle mt-1 text-sm">{subtitle}</p>
      </div>
      {children}
    </section>
  );
}
