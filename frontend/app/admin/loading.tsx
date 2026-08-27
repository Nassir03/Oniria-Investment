export default function Loading() {
  return (
    <main className="adminStandalone">
      <div className="adminRouteLoading" role="status" aria-live="polite">
        <span className="adminPulse" />
        <div><strong>Opening workspace</strong><small>Loading the next view…</small></div>
      </div>
    </main>
  );
}
