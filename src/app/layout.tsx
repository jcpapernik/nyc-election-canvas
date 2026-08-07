import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'NYC Election Canvas — Spatial Analysis & RCV Visualizer',
  description: 'High-density client-side election analysis web application for New York City elections featuring MapLibre GL JS, vector basemaps, choropleth heatmaps, and Ranked-Choice Voting round scrubbing.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-background text-slate-100 antialiased overflow-hidden select-none">
        {children}
      </body>
    </html>
  );
}
