import { Toaster } from 'sonner';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="antialiased">
      <Toaster position="top-right" richColors />
      {children}
    </div>
  );
}