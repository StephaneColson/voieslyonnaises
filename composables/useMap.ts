import maplibregl from 'maplibre-gl';

type Properties = {
  type: 'Feature';
  properties: {
    line: number;
    color: string;
    name: string;
    distance: number;
    status: string;
    doneAt?: string;
  };
  geometry: {
    type: 'LineString';
    coordinates: [number, number][];
  };
};

function getCrossIconUrl(color: string): string {
  const canvas = document.createElement('canvas');
  canvas.width = 8; // Set the desired width of your icon
  canvas.height = 8; // Set the desired height of your icon
  const context = canvas.getContext('2d');

  // Draw the first diagonal line of the "X"
  context.beginPath();
  context.moveTo(0, 0);
  context.lineTo(canvas.width, canvas.height);
  context.lineWidth = 2;
  context.strokeStyle = color; // Set the strokeStyle to apply the color
  context.stroke();

  // Draw the second diagonal line of the "X"
  context.beginPath();
  context.moveTo(0, canvas.height);
  context.lineTo(canvas.width, 0);
  context.lineWidth = 2;
  context.strokeStyle = color; // Set the strokeStyle to apply the color
  context.stroke();

  return canvas.toDataURL();
}

function groupFeaturesByColor(features: Properties[]) {
  const featuresByColor = {};
  for (const feature of features) {
    const color = feature.properties.color;

    if (featuresByColor[color]) {
      featuresByColor[color].push(feature);
    } else {
      featuresByColor[color] = [feature];
    }
  }
  return featuresByColor;
}

export const useMap = () => {
  function plotDoneSections({ map, features }) {
    const sections = features.filter(feature => feature.properties.status === 'done');
    if (sections.length === 0) {
      return;
    }
    map.addSource('done-sections', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: sections }
    });
    map.addLayer({
      id: 'done-sections',
      type: 'line',
      source: 'done-sections',
      paint: {
        'line-width': 4,
        'line-color': ['get', 'color']
      }
    });

    map.on('mouseenter', 'done-sections', () => (map.getCanvas().style.cursor = 'pointer'));
    map.on('mouseleave', 'done-sections', () => (map.getCanvas().style.cursor = ''));
  }

  function plotWipSections({ map, features }) {
    const sections = features.filter(feature => feature.properties.status === 'wip');
    if (sections.length === 0) {
      return;
    }
    map.addSource('wip-sections', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: sections }
    });
    map.addLayer({
      id: 'wip-sections',
      type: 'line',
      source: 'wip-sections',
      paint: {
        'line-width': 4,
        'line-color': ['get', 'color'],
        'line-dasharray': [0, 2, 2]
      }
    });

    const dashArraySequence = [
      [0, 2, 2],
      [0.5, 2, 1.5],
      [1, 2, 1],
      [1.5, 2, 0.5],
      [2, 2, 0],
      [0, 0.5, 2, 1.5],
      [0, 1, 2, 1],
      [0, 1.5, 2, 0.5]
    ];
    let step = 0;
    function animateDashArray(timestamp) {
      // Update line-dasharray using the next value in dashArraySequence. The
      // divisor in the expression `timestamp / 50` controls the animation speed.
      const newStep = parseInt((timestamp / 45) % dashArraySequence.length);

      if (newStep !== step) {
        map.setPaintProperty('wip-sections', 'line-dasharray', dashArraySequence[step]);
        step = newStep;
      }

      // Request the next frame of the animation.
      requestAnimationFrame(animateDashArray);
    }
    animateDashArray(0);

    map.on('mouseenter', 'wip-sections', () => (map.getCanvas().style.cursor = 'pointer'));
    map.on('mouseleave', 'wip-sections', () => (map.getCanvas().style.cursor = ''));
  }

  function plotPlannedSections({ map, features }) {
    const sections = features.filter(feature => feature.properties.status === 'planned');
    if (sections.length === 0) {
      return;
    }
    map.addSource('not-done-sections', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: sections }
    });
    map.addLayer({
      id: 'not-done-sections',
      type: 'line',
      source: 'not-done-sections',
      paint: {
        'line-width': 4,
        'line-color': ['get', 'color'],
        'line-dasharray': [2, 2]
      }
    });

    map.on('mouseenter', 'not-done-sections', () => (map.getCanvas().style.cursor = 'pointer'));
    map.on('mouseleave', 'not-done-sections', () => (map.getCanvas().style.cursor = ''));
  }

  function plotVarianteSections({ map, features }) {
    const sections = features.filter(feature => feature.properties.status === 'variante');
    if (sections.length === 0) {
      return;
    }
    map.addSource('variante-sections', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: sections }
    });
    map.addLayer({
      id: 'variante-sections',
      type: 'line',
      source: 'variante-sections',
      paint: {
        'line-width': 4,
        'line-color': ['get', 'color'],
        'line-dasharray': [2, 2],
        'line-opacity': 0.5
      }
    });
    map.addLayer({
      id: 'variante-symbols',
      type: 'symbol',
      source: 'variante-sections',
      paint: {
        'text-halo-color': '#fff',
        'text-halo-width': 4
      },
      layout: {
        'symbol-placement': 'line',
        'symbol-spacing': 120,
        'text-font': ['Open Sans Regular'],
        'text-field': ['coalesce', ['get', 'text'], 'variante'],
        'text-size': 14
      }
    });

    map.on('mouseenter', 'variante-sections', () => (map.getCanvas().style.cursor = 'pointer'));
    map.on('mouseleave', 'variante-sections', () => (map.getCanvas().style.cursor = ''));
  }

  function plotVariantePostponedSections({ map, features }) {
    const sections = features.filter(feature => feature.properties.status === 'variante-postponed');
    if (sections.length === 0) {
      return;
    }
    map.addSource('variante-postponed-sections', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: sections }
    });
    map.addLayer({
      id: 'variante-postponed-sections',
      type: 'line',
      source: 'variante-postponed-sections',
      paint: {
        'line-width': 4,
        'line-color': ['get', 'color'],
        'line-dasharray': [2, 2],
        'line-opacity': 0.5
      }
    });
    map.addLayer({
      id: 'variante-postponed-symbols',
      type: 'symbol',
      source: 'variante-postponed-sections',
      paint: {
        'text-halo-color': '#fff',
        'text-halo-width': 4
      },
      layout: {
        'symbol-placement': 'line',
        'symbol-spacing': 120,
        'text-font': ['Open Sans Regular'],
        'text-field': ['coalesce', ['get', 'text'], 'variante reportée'],
        'text-size': 14
      }
    });

    map.on('mouseenter', 'variante-postponed-sections', () => (map.getCanvas().style.cursor = 'pointer'));
    map.on('mouseleave', 'variante-postponed-sections', () => (map.getCanvas().style.cursor = ''));
  }

  function plotUnknownSections({ map, features }) {
    const sections = features.filter(feature => feature.properties.status === 'unknown');
    if (sections.length === 0) {
      return;
    }
    map.addSource('unknown-sections', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: sections }
    });
    map.addLayer({
      id: 'unknown-sections',
      type: 'line',
      source: 'unknown-sections',
      layout: {
        'line-cap': 'round'
      },
      paint: {
        'line-width': [
          'interpolate',
          ['linear'],
          ['zoom'],
          11,
          4, // width 4 at low zoom
          14,
          25 // progressively reach width 25 at high zoom
        ],
        'line-color': ['get', 'color'],
        'line-opacity': [
          'interpolate',
          ['linear'],
          ['zoom'],
          11,
          0.5, // opacity 0.4 at low zoom
          14,
          0.35 // opacity 0.35 at high zoom
        ]
      }
    });
    map.addLayer({
      id: 'unknown-symbols',
      type: 'symbol',
      source: 'unknown-sections',
      paint: {
        'text-halo-color': '#fff',
        'text-halo-width': 3
      },
      layout: {
        'symbol-placement': 'line',
        'symbol-spacing': 120,
        'text-font': ['Open Sans Regular'],
        'text-field': 'tracé à définir',
        'text-size': 14
      }
    });

    map.on('mouseenter', 'unknown-sections', () => (map.getCanvas().style.cursor = 'pointer'));
    map.on('mouseleave', 'unknown-sections', () => (map.getCanvas().style.cursor = ''));
  }

  function plotPostponedSections({ map, features }) {
    const sections = features.filter(feature => feature.properties.status === 'postponed');
    if (sections.length === 0) {
      return;
    }

    const featuresByColor = groupFeaturesByColor(sections);
    for (const [color, sameColorFeatures] of Object.entries(featuresByColor)) {
      map.addSource(`postponed-sections-${color}`, {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: sameColorFeatures }
      });

      const iconUrl = getCrossIconUrl(color);
      map.loadImage(iconUrl, (error, image) => {
        if (error) {
          throw error;
        }
        map.addImage(`cross-${color}`, image);

        map.addLayer({
          id: `postponed-symbols-${color}`,
          type: 'symbol',
          source: `postponed-sections-${color}`,
          layout: {
            'symbol-placement': 'line',
            'symbol-spacing': 1,
            'icon-image': `cross-${color}`,
            'icon-size': 1
          }
        });
        map.addLayer({
          id: `postponed-text-${color}`,
          type: 'symbol',
          source: `postponed-sections-${color}`,
          paint: {
            'text-halo-color': '#fff',
            'text-halo-width': 3
          },
          layout: {
            'symbol-placement': 'line',
            'symbol-spacing': 150,
            'text-font': ['Open Sans Regular'],
            'text-field': 'reporté',
            'text-size': 14
          }
        });

        map.on('mouseenter', `postponed-symbols-${color}`, () => (map.getCanvas().style.cursor = 'pointer'));
        map.on('mouseleave', `postponed-symbols-${color}`, () => (map.getCanvas().style.cursor = ''));
      });
    }
  }

  function plotPois({ map, features }) {
    const pois = features.filter(feature => feature.geometry.type === 'Point');
    if (pois.length === 0) {
      return;
    }
    map.addSource('pois', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: pois
      }
    });

    map.loadImage('/icons/camera.png', (error, image) => {
      if (error) {
        throw error;
      }
      map.addImage('camera-icon', image, { sdf: true });
      map.addLayer({
        id: 'pois',
        source: 'pois',
        type: 'symbol',
        layout: {
          'icon-image': 'camera-icon',
          'icon-size': 0.5,
          'icon-offset': [-25, -25]
        },
        paint: {
          'icon-color': ['get', 'color']
        }
      });
      map.setLayoutProperty('pois', 'visibility', 'none');
      map.on('zoom', () => {
        const zoomLevel = map.getZoom();
        if (zoomLevel > 14) {
          map.setLayoutProperty('pois', 'visibility', 'visible');
        } else {
          map.setLayoutProperty('pois', 'visibility', 'none');
        }
      });
    });
  }

  function fitBounds({ map, features }) {
    const allCoordinates = features
      .filter(feature => feature.geometry.type === 'LineString')
      .map(feature => feature.geometry.coordinates)
      .flat();
    const bounds = new maplibregl.LngLatBounds(allCoordinates[0], allCoordinates[0]);
    for (const coord of allCoordinates) {
      bounds.extend(coord);
    }
    map.fitBounds(bounds, { padding: 20 });
  }

  return {
    plotDoneSections,
    plotWipSections,
    plotPlannedSections,
    plotVarianteSections,
    plotVariantePostponedSections,
    plotUnknownSections,
    plotPostponedSections,
    plotPois,
    fitBounds
  };
};
