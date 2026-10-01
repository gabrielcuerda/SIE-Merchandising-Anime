export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="page-container py-12">
      <div className="mx-auto max-w-3xl">{children}</div>
    </div>
  );
}
