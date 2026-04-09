export function SectionTitle({ title, description }: { title: string; description: string }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <h2 style={{ margin: 0, fontSize: 26 }}>{title}</h2>
      <div className="muted" style={{ marginTop: 6 }}>{description}</div>
    </div>
  );
}
