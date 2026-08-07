import maplibregl from 'maplibre-gl';

export function initMapSourcesAndLayers(map: maplibregl.Map) {
  if (!map.getSource('boundary-source')) {
    map.addSource('boundary-source', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] }
    });
  }

  if (!map.getSource('centroid-label-source')) {
    map.addSource('centroid-label-source', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] }
    });
  }

  if (!map.getLayer('boundary-fill')) {
    map.addLayer({
      id: 'boundary-fill',
      type: 'fill',
      source: 'boundary-source',
      paint: {
        'fill-color': ['case', ['has', 'fillColor'], ['get', 'fillColor'], '#cbd5e1'],
        'fill-opacity': ['case', ['boolean', ['feature-state', 'hover'], false], 0.95, ['has', 'fillOpacity'], ['get', 'fillOpacity'], 0.88]
      }
    });
  }

  if (!map.getLayer('boundary-stroke')) {
    map.addLayer({
      id: 'boundary-stroke',
      type: 'line',
      source: 'boundary-source',
      paint: {
        'line-color': ['case', ['boolean', ['feature-state', 'hover'], false], '#000000', ['boolean', ['get', 'isDimmed'], false], '#475569', ['has', 'strokeColor'], ['get', 'strokeColor'], '#1e3a8a'],
        'line-width': ['case', ['boolean', ['feature-state', 'hover'], false], 2.5, ['boolean', ['get', 'isDimmed'], false], 0.5, ['has', 'strokeWidth'], ['get', 'strokeWidth'], 0.8],
        'line-opacity': ['case', ['boolean', ['get', 'isZeroVotes'], false], 0, ['boolean', ['feature-state', 'hover'], false], 1.0, ['boolean', ['get', 'isDimmed'], false], 0.35, ['has', 'strokeOpacity'], ['get', 'strokeOpacity'], 0.60]
      }
    });
  }

  if (!map.getLayer('proportional-bubbles')) {
    map.addLayer({
      id: 'proportional-bubbles',
      type: 'circle',
      source: 'centroid-label-source',
      paint: {
        'circle-radius': [
          'case',
          ['boolean', ['feature-state', 'hover'], false],
          ['+', ['case', ['has', 'bubbleRadius'], ['get', 'bubbleRadius'], 0], 4.0],
          ['case', ['has', 'bubbleRadius'], ['get', 'bubbleRadius'], 0]
        ],
        'circle-color': ['case', ['has', 'fillColor'], ['get', 'fillColor'], '#3b82f6'],
        'circle-opacity': ['case', ['boolean', ['feature-state', 'hover'], false], 0.95, 0.65],
        'circle-stroke-width': ['case', ['boolean', ['feature-state', 'hover'], false], 3.0, 1.5],
        'circle-stroke-color': ['case', ['boolean', ['feature-state', 'hover'], false], '#0f172a', ['case', ['has', 'fillColor'], ['get', 'fillColor'], '#1e3a8a']],
        'circle-stroke-opacity': 1.0
      }
    });
  }

  if (!map.getLayer('boundary-labels')) {
    map.addLayer({
      id: 'boundary-labels',
      type: 'symbol',
      source: 'centroid-label-source',
      layout: {
        'text-field': ['get', 'labelText'],
        'text-size': 11,
        'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
        'text-allow-overlap': false,
        'text-ignore-placement': false
      },
      paint: {
        'text-color': '#0f172a',
        'text-halo-color': '#ffffff',
        'text-halo-width': 3.0,
        'text-opacity': ['interpolate', ['linear'], ['zoom'], 14.0, 0, 14.5, 0.90]
      }
    });
  }
}
