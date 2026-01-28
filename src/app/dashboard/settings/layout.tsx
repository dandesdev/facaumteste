interface SettingsLayoutProps {
  children: React.ReactNode;
}

export default function SettingsLayout({ children }: SettingsLayoutProps) {
  // Simplified layout - tabs are now handled in page.tsx
  return <>{children}</>;
}
