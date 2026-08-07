'use client';

import React, { useRef } from 'react';
import dynamic from 'next/dynamic';
import { ControlHeader } from '@/components/Navigation/ControlHeader';
import { BreadcrumbBar } from '@/components/Navigation/BreadcrumbBar';
import { MultiDistrictCard } from '@/components/Cards/MultiDistrictCard';
import { ElectionMetricsCard } from '@/components/Cards/ElectionMetricsCard';
import { BubbleLegendCard } from '@/components/Cards/BubbleLegendCard';
import { ElectionMapRefHandle } from '@/components/Map/ElectionMap';

const ElectionMapClient = dynamic(
  () => import('@/components/Map/ElectionMap').then(mod => mod.ElectionMap),
  { ssr: false }
);

const ElectionMap = React.forwardRef<ElectionMapRefHandle, any>((props, ref) => (
  <ElectionMapClient {...props} innerRef={ref} />
));
ElectionMap.displayName = 'ElectionMap';

export default function Home() {
  const mapRef = useRef<ElectionMapRefHandle>(null);

  const handleSearchSelect = (loc: { lng: number; lat: number; label: string }) => {
    if (mapRef.current) {
      mapRef.current.flyToLocation(loc);
    }
  };

  const handleResetView = () => {
    if (mapRef.current) {
      mapRef.current.resetView();
    }
  };

  return (
    <main className="relative w-screen h-screen overflow-hidden">
      {/* Top Navigation Header with Address Search, 2026 Midterm Selector & Theme Toggle */}
      <ControlHeader onSearchSelect={handleSearchSelect} />

      {/* Kornacki Breadcrumb Navigation Bar */}
      <BreadcrumbBar onResetView={handleResetView} />

      {/* 2D Planar Vector Map Engine with 2026 Midterm Choropleth Fills */}
      <ElectionMap ref={mapRef} />

      {/* Overlapping Multi-District Summary Card */}
      <MultiDistrictCard />

      {/* 2026 Midterm Election Analytics & Pinned Inspector Card */}
      <ElectionMetricsCard />

      {/* NYT-Style Proportional Lead Bubble Size Legend */}
      <BubbleLegendCard />
    </main>
  );
}
