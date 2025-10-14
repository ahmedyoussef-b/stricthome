// The specific full-screen styling has been removed from this layout.
// This ensures that the session room correctly inherits the main dashboard layout,
// which includes the Navbar and Sidebar, preventing display issues when navigating
// away from the session page.

export default function SessionPageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
