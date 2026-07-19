// Shared helpers for the MapLibre GL variants -- same idea as map-common.js (real GeoJSON
// boundaries + real DOM text labels/markers), rendered via MapLibre's WebGL vector renderer
// instead of Leaflet's canvas/DOM renderer, for smoother lines and richer paint effects (glow,
// blur, halo) than Leaflet's simple styling allows.
//
// NOTE: MapLibre uses [lng, lat] coordinate order (GeoJSON's own order) -- the OPPOSITE of
// Leaflet's [lat, lng]. Every latlng passed into these helpers is [lat, lng] for parity with the
// Leaflet version's call sites; each helper flips it internally.

function ll2lnglat(ll) {
  return [ll[1], ll[0]];
}

function initMap(center, zoom, containerId) {
  const map = new maplibregl.Map({
    container: containerId || 'map',
    style: {
      version: 8,
      sources: {},
      layers: [
        { id: 'water-bg', type: 'background', paint: { 'background-color': '#cdd9c8' } },
      ],
    },
    center: ll2lnglat(center),
    zoom: zoom,
    attributionControl: false,
  });
  map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
  map.addControl(new maplibregl.AttributionControl({
    customAttribution: 'Boundaries: aourednik/historical-basemaps (GPL-3.0)',
  }));
  return map;
}

// Adds the historical-boundaries GeoJSON as a real vector source, with a soft outer glow (a
// blurred duplicate line layer) behind a crisp ink border -- an effect Leaflet's plain stroke
// can't do, and the kind of "illustrated plate" touch WebGL layers make cheap.
function addBoundaries(map, data, onReady) {
  const run = () => {
    map.addSource('boundaries', { type: 'geojson', data });
    map.addLayer({
      id: 'land-fill', type: 'fill', source: 'boundaries',
      paint: { 'fill-color': '#ddceA3', 'fill-opacity': 0.92 },
    });
    map.addLayer({
      id: 'land-border-glow', type: 'line', source: 'boundaries',
      paint: { 'line-color': '#6e5a35', 'line-width': 4, 'line-blur': 3, 'line-opacity': 0.35 },
    });
    map.addLayer({
      id: 'land-border', type: 'line', source: 'boundaries',
      paint: { 'line-color': '#4a3b22', 'line-width': 1 },
    });
    data.features.forEach((f) => {
      if (!f.properties.NAME) return;
      const c = centroidOf(f.geometry);
      addLabel(map, [c[1], c[0]], f.properties.NAME.toUpperCase(), 'country-label-gl');
    });
    if (onReady) onReady();
  };
  // See addRoute() below for why this doesn't gate on isStyleLoaded().
  try {
    run();
  } catch (err) {
    map.once('idle', run);
  }
}

// Rough centroid of a (Multi)Polygon's largest ring -- good enough for label placement at this
// scale; not a real geographic centroid algorithm.
function centroidOf(geom) {
  const rings = geom.type === 'Polygon' ? [geom.coordinates[0]]
    : geom.coordinates.map((p) => p[0]);
  let best = rings[0], bestLen = 0;
  rings.forEach((r) => { if (r.length > bestLen) { best = r; bestLen = r.length; } });
  let x = 0, y = 0;
  best.forEach((p) => { x += p[0]; y += p[1]; });
  return [x / best.length, y / best.length];
}

function addLabel(map, ll, html, className) {
  const el = document.createElement('div');
  el.className = className;
  el.innerHTML = html;
  new maplibregl.Marker({ element: el, anchor: 'center' })
    .setLngLat(ll2lnglat(ll))
    .addTo(map);
}

// A labeled waypoint: a small dot + a real text label offset beside it (both real DOM elements).
function addWaypoint(map, latlng, label, opts) {
  opts = opts || {};
  const dot = document.createElement('div');
  dot.className = 'origin-dot';
  new maplibregl.Marker({ element: dot, anchor: 'center' }).setLngLat(ll2lnglat(latlng)).addTo(map);

  const el = document.createElement('div');
  el.className = 'waypoint-label-gl' + (opts.dim ? ' dim' : '');
  el.innerHTML = label;
  new maplibregl.Marker({ element: el, anchor: opts.anchor || 'left', offset: opts.offset || [8, -6] })
    .setLngLat(ll2lnglat(latlng))
    .addTo(map);
}

// "Marching ants": MapLibre has no native dash-offset paint property (unlike SVG/Canvas
// stroke-dashoffset), so the standard technique -- lifted from Mapbox GL JS's own "Animate a
// line" example -- is to cycle the line-dasharray itself through a sequence of phase-shifted
// patterns. Each step is the same total dash+gap length, just shifted, so it reads as continuous
// motion rather than a flicker. Runs forever via requestAnimationFrame; harmless if the layer is
// later removed (checked each frame).
const _MARCHING_ANTS_SEQUENCE = [
  [0, 4, 3], [0.5, 4, 2.5], [1, 4, 2], [1.5, 4, 1.5], [2, 4, 1], [2.5, 4, 0.5], [3, 4, 0],
  [0, 0.5, 3, 3.5], [0, 1, 3, 3], [0, 1.5, 3, 2.5], [0, 2, 3, 2], [0, 2.5, 3, 1.5], [0, 3, 3, 1], [0, 3.5, 3, 0.5],
];
function animateMarchingAnts(map, layerId, stepMs) {
  let step = 0;
  let last = 0;
  function frame(now) {
    if (!map.getLayer(layerId)) return; // layer gone (e.g. page navigated) -- stop quietly
    if (now - last > (stepMs || 60)) {
      step = (step + 1) % _MARCHING_ANTS_SEQUENCE.length;
      map.setPaintProperty(layerId, 'line-dasharray', _MARCHING_ANTS_SEQUENCE[step]);
      last = now;
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

// A route line, with the same soft-glow + crisp-dash treatment as the boundaries. `opts.animated`
// (default false) turns on the marching-ants loop for this route's line layer.
let _routeId = 0;
function addRoute(map, latlngsLL, opts) {
  opts = opts || {};
  const id = 'route-' + (_routeId++);
  const coords = latlngsLL.map(ll2lnglat);
  const add = () => {
    map.addSource(id, {
      type: 'geojson',
      data: { type: 'Feature', geometry: { type: 'LineString', coordinates: coords } },
    });
    map.addLayer({
      id: id + '-glow', type: 'line', source: id,
      paint: {
        'line-color': opts.color || '#a8391a', 'line-width': 5, 'line-blur': 3, 'line-opacity': 0.3,
      },
    });
    map.addLayer({
      id: id + '-line', type: 'line', source: id,
      paint: {
        'line-color': opts.color || '#a8391a',
        'line-width': opts.weight || 2,
        'line-dasharray': opts.dashArray || [2, 1.5],
      },
    });
    if (opts.animated) animateMarchingAnts(map, id + '-line', opts.animateStepMs);
  };
  // Don't gate on isStyleLoaded(): adding a source/layer can itself flip it back to false for a
  // moment, so a burst of addRoute() calls in the same tick would see later calls falsely defer
  // to 'idle' -- which may fire late, or after the deferred callback was registered too late to
  // catch it. Call sites only ever run this after 'load' has already fired once, so the style
  // object is guaranteed to exist; just add directly, and only fall back if that assumption is
  // ever wrong.
  try {
    add();
  } catch (err) {
    map.once('idle', add);
  }
}
