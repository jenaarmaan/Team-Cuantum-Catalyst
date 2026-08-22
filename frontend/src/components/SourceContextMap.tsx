import { useEffect, useRef } from 'react';
import L from 'leaflet';

interface GeographicLocation {
  lat: number;
  lng: number;
  label: string;
}

interface EvidenceLocation extends GeographicLocation {
  source: string;
  date: string | null;
  relation: 'matches' | 'contradicts';
}

interface SourceContextMapProps {
  claimedLocation: GeographicLocation | null;
  evidenceLocations: EvidenceLocation[];
}

export default function SourceContextMap({ claimedLocation, evidenceLocations }: SourceContextMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    // 1. Inject Leaflet CDN CSS if not already present
    const linkId = 'leaflet-cdn-css';
    if (!document.getElementById(linkId)) {
      const link = document.createElement('link');
      link.id = linkId;
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    if (!mapContainerRef.current) return;

    // 2. Clear old map instance if HMR occurred or component re-mounted
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // 3. Collect points to determine center/bounds
    const points: L.LatLngExpression[] = [];
    if (claimedLocation) {
      points.push([claimedLocation.lat, claimedLocation.lng]);
    }
    evidenceLocations.forEach((loc) => {
      points.push([loc.lat, loc.lng]);
    });

    if (points.length === 0) return;

    // 4. Initialize map (centered at first point or bounded box)
    const initialCenter = points[0];
    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: 3,
      zoomControl: true,
      attributionControl: false
    });

    mapInstanceRef.current = map;

    // 5. Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
    }).addTo(map);

    // 6. Draw Markers
    let strongestContradictingLoc: EvidenceLocation | null = null;

    // Helper to create circular colored SVG icons for markers
    const createHtmlIcon = (color: string, ringColor: string, isClaim: boolean) => {
      const size = isClaim ? 16 : 12;
      return L.divIcon({
        className: 'custom-leaflet-icon',
        html: `
          <div style="
            width: ${size}px;
            height: ${size}px;
            background-color: ${color};
            border: 2px solid ${ringColor};
            border-radius: 50%;
            box-shadow: 0 0 8px ${color};
            transform: translate(-30%, -30%);
          "></div>
        `,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2]
      });
    };

    // Claimed Location Marker
    if (claimedLocation) {
      const claimIcon = createHtmlIcon('#0284c7', '#ffffff', true);
      L.marker([claimedLocation.lat, claimedLocation.lng], { icon: claimIcon })
        .addTo(map)
        .bindPopup(`
          <div class="font-sans text-xs p-1">
            <p class="font-bold text-nyasa-primary">Claimed Location</p>
            <p class="text-slate-800 font-medium">${claimedLocation.label}</p>
            <p class="text-slate-500 text-[10px]">Lat: ${claimedLocation.lat}, Lng: ${claimedLocation.lng}</p>
          </div>
        `);
    }

    // Evidence Markers
    for (const loc of evidenceLocations) {
      const isContradiction = loc.relation === 'contradicts';
      const color = isContradiction ? '#ef4444' : '#10b981';
      const ringColor = '#ffffff';
      const icon = createHtmlIcon(color, ringColor, false);

      L.marker([loc.lat, loc.lng], { icon })
        .addTo(map)
        .bindPopup(`
          <div class="font-sans text-xs p-1">
            <p class="font-bold ${isContradiction ? 'text-red-600' : 'text-emerald-600'}">
              Evidence (${loc.relation.toUpperCase()})
            </p>
            <p class="text-slate-800 font-semibold">${loc.label}</p>
            <p class="text-slate-600 text-[10px] mt-1">Source: <a href="${loc.source}" target="_blank" class="text-nyasa-primary hover:underline">${loc.source.split('/')[2] || 'SourceLink'}</a></p>
            ${loc.date ? `<p class="text-slate-500 text-[10px]">Date: ${loc.date}</p>` : ''}
          </div>
        `);

      if (isContradiction && !strongestContradictingLoc) {
        strongestContradictingLoc = loc;
      }
    }

    // 7. Draw Connecting Line & Labels between Claim & Strongest Contradiction
    if (claimedLocation && strongestContradictingLoc) {
      const linePoints: L.LatLngExpression[] = [
        [claimedLocation.lat, claimedLocation.lng],
        [strongestContradictingLoc.lat, strongestContradictingLoc.lng]
      ];

      L.polyline(linePoints, {
        color: '#ef4444',
        weight: 1.5,
        dashArray: '5, 5',
        opacity: 0.7
      }).addTo(map);
    }

    // 8. Fit map boundaries if multiple points exist
    if (points.length > 1) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [40, 40] });
    }

    // 9. Cleanup map on unmount
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [claimedLocation, evidenceLocations]);

  if (!claimedLocation && evidenceLocations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-6 bg-slate-50 border border-dashed border-nyasa-border rounded-xl">
        <span className="text-xl text-nyasa-text-dim/60 mb-2">🗺️</span>
        <p className="text-xs text-nyasa-text-dim font-medium">No independent geographic evidence found</p>
        <p className="text-[10px] text-nyasa-text-dim/60 mt-0.5">This content has no verified location constraints</p>
      </div>
    );
  }

  // Label variables
  const contradiction = evidenceLocations.find(l => l.relation === 'contradicts');
  const labelText = claimedLocation && contradiction
    ? `${claimedLocation.label} · Evidence traces this file to: ${contradiction.label}`
    : 'Geographic Context Map';

  return (
    <div className="space-y-3">
      {/* Dynamic connecting line text label */}
      {claimedLocation && contradiction && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200/50 rounded-lg p-2.5 text-xs text-red-800 font-medium">
          <span className="shrink-0 text-red-600 mt-0.5">🚨</span>
          <p className="leading-snug">{labelText}</p>
        </div>
      )}

      {/* The Leaflet Map Container */}
      <div className="relative rounded-xl border border-nyasa-border overflow-hidden bg-slate-50 shadow-inner">
        <div 
          ref={mapContainerRef} 
          className="w-full h-64 md:h-80 z-10"
        />
      </div>
    </div>
  );
}
