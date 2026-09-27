import type { Metadata } from 'next';
import '../index.css';

export const metadata: Metadata = {
  title: 'NANAGRAPHY Photo Booth',
  description: 'NANAGRAPHY Photo Booth kiosk',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="bg-brand-dark text-white">
        <main className="kiosk-container">{children}</main>
      </body>
    </html>
  );
}
