'use client';

import { useEffect, useRef } from 'react';
import { calculateDistance } from '@/app/lib/geocoder';

interface DeliveryMapProps {
  pickupLat: number;
  pickupLon: number;
  deliveryLat: number;
  deliveryLon: number;
  pickupName?: string;
  deliveryAddress?: string;
}

/**
 * Interactive map showing pickup location, delivery address, and distance
 * Uses Leaflet with OpenStreetMap tiles (free, no API key needed)
 */
export function DeliveryMap({
  pickupLat,
  pickupLon,
  deliveryLat,
  deliveryLon,
  pickupName = 'Pickup Location',
  deliveryAddress = 'Delivery Address',
}: DeliveryMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    // Load Leaflet CSS dynamically
    if (!document.querySelector('link[href*="leaflet.css"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    // Load Leaflet JS dynamically
    if (!(window as any).L) {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.async = true;
      script.onload = initializeMap;
      document.body.appendChild(script);
    } else {
      initializeMap();
    }

    function initializeMap() {
      if (!mapRef.current || !(window as any).L) return;

      const L = (window as any).L;

      // Create map centered between the two points
      const centerLat = (pickupLat + deliveryLat) / 2;
      const centerLon = (pickupLon + deliveryLon) / 2;

      const map = L.map(mapRef.current, {
        center: [centerLat, centerLon],
        zoom: 14,
        dragging: true,
        zoomControl: true,
      });

      mapInstanceRef.current = map;

      // Add OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      // Add pickup marker (green)
      L.marker([pickupLat, pickupLon], {
        icon: L.icon({
          iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41],
        }),
      })
        .bindPopup(`<strong>🟢 Pickup</strong><br>${pickupName}`)
        .addTo(map);

      // Add delivery marker (red)
      L.marker([deliveryLat, deliveryLon], {
        icon: L.icon({
          iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41],
        }),
      })
        .bindPopup(`<strong>🔴 Delivery</strong><br>${deliveryAddress}`)
        .addTo(map);

      // Draw line between the two points
      const route = L.polyline(
        [
          [pickupLat, pickupLon],
          [deliveryLat, deliveryLon],
        ],
        {
          color: '#22c55e', // Lime green
          weight: 3,
          opacity: 0.8,
          dashArray: '5, 5',
        }
      ).addTo(map);

      // Fit map to show both markers
      const featureGroup = L.featureGroup([
        L.marker([pickupLat, pickupLon]),
        L.marker([deliveryLat, deliveryLon]),
      ]);
      map.fitBounds(featureGroup.getBounds().pad(0.1));

      // Add distance to the map as a label
      const distance = calculateDistance(pickupLat, pickupLon, deliveryLat, deliveryLon);
      const midLat = (pickupLat + deliveryLat) / 2;
      const midLon = (pickupLon + deliveryLon) / 2;

      // Create a custom label
      const label = L.marker([midLat, midLon], {
        icon: L.divIcon({
          className: 'distance-label',
          html: `<div style="background: rgba(34, 197, 94, 0.9); color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 12px; white-space: nowrap; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">📍 ${distance.toFixed(1)}km</div>`,
          iconSize: [0, 0],
        }),
      }).addTo(map);
    }

    return () => {
      // Cleanup if needed
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [pickupLat, pickupLon, deliveryLat, deliveryLon, pickupName, deliveryAddress]);

  return <div ref={mapRef} className="w-full h-full rounded-lg border border-gray-200" />;
}
