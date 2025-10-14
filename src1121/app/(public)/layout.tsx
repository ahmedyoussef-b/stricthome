// src/app/(public)/layout.tsx
// This layout applies to all public-facing pages.
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
