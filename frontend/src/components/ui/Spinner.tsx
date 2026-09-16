export const Spinner = ({ label = "Loading" }: { label?: string }) => (
  <div className="flex items-center justify-center gap-2 py-8 text-muted" role="status">
    <span className="h-5 w-5 animate-spin rounded-full border-2 border-line border-t-accent" />
    <span>{label}</span>
  </div>
);
