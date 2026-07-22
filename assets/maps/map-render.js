// Data-driven live-map renderer for the journey door. Reads window.JOURNEY_MAPS (built by
// build_journey from each map's resolved geo island) and renders each into its
// .map-live-stage[data-map=<slug>]. Generalized from Paul's Claude's prototype
// (docs/prototypes/paul/journey-live-map-2026-07-19/) — the per-map hand-coded scripts become one
// data loop; the overlay helpers (routes/waypoints/marching-ants) are lifted near-verbatim.
//
// HYBRID self-containment (spec §4): each island entry's `tile_source` decides the primary base —
//   "vendored" -> the local pmtiles:// style (assets/maps/historical.json + the .pmtiles), fully
//                 self-contained, zero live fetch (the cheap local maps, e.g. London).
//   "live"     -> OHM's live historical style + tiles fetched at view time (wide-area maps too big
//                 to vendor; the browser's own UA is fine — the 403 is only bare-urllib).
// HARD FALLBACK (spec §2): WebGL unsupported, context loss, or a base-load failure -> the bundled
// boundary-GeoJSON base (assets/maps/boundaries.geojson), NEVER a blank canvas. All three failure
// branches converge on ONE renderBoundary path. Integrity: unhelpful (a plain outline) is fine;
// quietly-broken (a blank box) is not.
(function () {
  'use strict';
  var maps = window.JOURNEY_MAPS || [];
  if (!maps.length) return;

  // MapLibre uses [lng, lat] (GeoJSON order) — the OPPOSITE of the [lat, lng] our island uses.
  function lngLat(o) { return [o.lon, o.lat]; }

  // maplibregl.supported() existed in v1/v2 but was REMOVED in v3+ (vendored here = v4.7.1). So we
  // can't call it; instead probe WebGL directly. Absent maplibregl entirely -> not usable.
  function glSupported() {
    if (!window.maplibregl) return false;
    if (typeof maplibregl.supported === 'function') return maplibregl.supported();
    try {
      var c = document.createElement('canvas');
      return !!(c.getContext('webgl2') || c.getContext('webgl') ||
                c.getContext('experimental-webgl'));
    } catch (e) { return false; }
  }

  // Register the pmtiles:// protocol once (used by the vendored style's local sources).
  if (window.pmtiles && window.maplibregl && !window.__pmtilesRegistered) {
    var protocol = new pmtiles.Protocol();
    maplibregl.addProtocol('pmtiles', protocol.tile);
    window.__pmtilesRegistered = true;
  }

  var OHM_LIVE_STYLE =
    'https://www.openhistoricalmap.org/map-styles/historical/historical.json';

  // ---- overlay helpers (lifted from the prototype's map-common-gl.js) ----------------------
  var _MARCHING = [
    [0, 4, 3], [0.5, 4, 2.5], [1, 4, 2], [1.5, 4, 1.5], [2, 4, 1], [2.5, 4, 0.5], [3, 4, 0],
    [0, 0.5, 3, 3.5], [0, 1, 3, 3], [0, 1.5, 3, 2.5], [0, 2, 3, 2], [0, 2.5, 3, 1.5],
    [0, 3, 3, 1], [0, 3.5, 3, 0.5],
  ];
  function animateAnts(map, layerId, stepMs) {
    var step = 0, last = 0;
    function frame(now) {
      if (!map.getLayer(layerId)) return;   // layer gone (navigated away) — stop quietly
      if (now - last > (stepMs || 60)) {
        step = (step + 1) % _MARCHING.length;
        map.setPaintProperty(layerId, 'line-dasharray', _MARCHING[step]);
        last = now;
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  var _routeSeq = 0;
  function addRoute(map, fromO, toO, opts) {
    opts = opts || {};
    var id = 'route-' + (_routeSeq++);
    // An optional `via` bow-point (cosmetic line-bend, e.g. two routes between the same two cities
    // -- "more than once," not a specific count) bends the line through a 3rd point instead of a
    // straight 2-point path. Matches the reference prototype's back-and-forth treatment.
    var coords = opts.via ? [lngLat(fromO), lngLat(opts.via), lngLat(toO)]
                          : [lngLat(fromO), lngLat(toO)];
    try {
      map.addSource(id, { type: 'geojson',
        data: { type: 'Feature', geometry: { type: 'LineString', coordinates: coords } } });
      map.addLayer({ id: id + '-glow', type: 'line', source: id,
        paint: { 'line-color': '#a8391a', 'line-width': 5, 'line-blur': 3, 'line-opacity': 0.3 } });
      map.addLayer({ id: id + '-line', type: 'line', source: id,
        paint: { 'line-color': '#a8391a', 'line-width': 2, 'line-dasharray': [2, 1.5] } });
      if (opts.animated) animateAnts(map, id + '-line', opts.stepMs);
    } catch (e) { /* style not ready — caller retries on idle */ }
  }

  function addWaypoint(map, o) {
    var dot = document.createElement('div');
    dot.className = 'origin-dot';
    // Reverse-edit stamp: a waypoint that came from a place: node carries data-item + data-field so
    // edit_route maps a coord correction back to places.json (nodes[place:...].lat/lon). Inline
    // fine-detail waypoints (no place_ref — the London street addresses) get no stamp (honest-omit).
    if (o.place_ref) {
      dot.setAttribute('data-item', o.place_ref);
      dot.setAttribute('data-field', 'lat');
    }
    new maplibregl.Marker({ element: dot, anchor: 'center' }).setLngLat(lngLat(o)).addTo(map);
    if (o.label) {
      var el = document.createElement('div');
      el.className = 'waypoint-label-gl';
      el.innerHTML = o.label;   // authored (intentional &middot;/&ndash;) — rendered raw, like the copy
      // Optional per-waypoint anchor/offset (data-driven; defaults match the original prototype's
      // single fixed placement) -- lets a crowded cluster of pins fan labels out in different
      // directions instead of colliding, same as the reference prototype's London map.
      new maplibregl.Marker({ element: el, anchor: o.anchor || 'left', offset: o.offset || [8, -6] })
        .setLngLat(lngLat(o)).addTo(map);
    }
  }

  function addOverlays(map, spec) {
    (spec.routes || []).forEach(function (r) {
      addRoute(map, r.from, r.to, { animated: r.animated, via: r.via });
    });
    (spec.waypoints || []).forEach(function (w) { addWaypoint(map, w); });
  }

  function fitToSpec(map, spec) {
    var pts = (spec.waypoints || []).map(lngLat);
    if (!pts.length && spec.center) pts = [lngLat(spec.center)];
    if (pts.length < 2) return;
    var b = pts.reduce(function (acc, ll) { return acc.extend(ll); },
      new maplibregl.LngLatBounds(pts[0], pts[0]));
    map.fitBounds(b, { padding: { top: 50, bottom: 50, left: 60, right: 90 }, duration: 0 });
  }

  // ---- the fallback base: bundled boundary GeoJSON, no tiles ---------------------------------
  var _boundaryCache = null;
  function loadBoundary() {
    if (_boundaryCache) return Promise.resolve(_boundaryCache);
    return fetch('assets/maps/boundaries.geojson').then(function (r) { return r.json(); })
      .then(function (g) { _boundaryCache = g; return g; });
  }
  function renderBoundary(el, spec) {
    el.innerHTML = '';
    if (!glSupported()) {
      el.className += ' map-live-unavailable';
      el.setAttribute('role', 'img');
      el.setAttribute('aria-label', 'Map unavailable in this browser');
      return;
    }
    var map = new maplibregl.Map({
      container: el, center: lngLat(spec.center), zoom: spec.zoom || 2,
      attributionControl: false,
      style: { version: 8, sources: {},
        layers: [{ id: 'bg', type: 'background', paint: { 'background-color': '#cdd9c8' } }] },
    });
    map.addControl(new maplibregl.AttributionControl({
      customAttribution: 'Boundaries: aourednik/historical-basemaps (GPL-3.0)' }));
    map.on('load', function () {
      // The boundary land-fill goes on FIRST (best-effort); then the overlays UNCONDITIONALLY on top.
      // Overlays don't depend on the boundary source, so a boundaries.geojson failure still leaves a
      // framed map with waypoint pins + routes, not a bare cream rectangle. (Waypoints are DOM
      // markers — always visible regardless — but routes are GL layers, so overlays-after-boundary
      // keeps the routes above the land-fill too.)
      loadBoundary().then(function (data) {
        map.addSource('bnd', { type: 'geojson', data: data });
        map.addLayer({ id: 'land', type: 'fill', source: 'bnd',
          paint: { 'fill-color': '#ddceA3', 'fill-opacity': 0.92 } });
        map.addLayer({ id: 'edge', type: 'line', source: 'bnd',
          paint: { 'line-color': '#4a3b22', 'line-width': 1 } });
      }).catch(function () { /* boundary failed — the overlays below still frame the map, never blank */ })
        .then(function () { addOverlays(map, spec); fitToSpec(map, spec); });
    });
  }

  // ---- the primary base: vendored pmtiles style OR live OHM style ---------------------------
  // OHM's raw "historical" style JSON hardcodes localhost:8888 glyph/sprite URLs -- a dev-only
  // artifact of how that style repo is built (found + patched in the reference prototype,
  // docs/prototypes/paul/journey-live-map-2026-07-19/map-common-ohm.js). Passing the style URL
  // straight to MapLibre (as a string) skips this patch entirely, so every "live" map fails to
  // load glyphs/sprite and falls back to the plain boundary base -- fetch + patch it here instead.
  var _liveStyleCache = null;
  function loadLiveStyle() {
    if (_liveStyleCache) return _liveStyleCache;
    _liveStyleCache = fetch(OHM_LIVE_STYLE).then(function (r) { return r.json(); })
      .then(function (style) {
        style.glyphs = 'https://www.openhistoricalmap.org/map-styles/fonts/{fontstack}/{range}.pbf';
        style.sprite = 'https://www.openhistoricalmap.org/map-styles/historical/historical_spritesheet';
        return style;
      });
    return _liveStyleCache;
  }

  // Fetch + parse the vendored style ourselves too, matching loadLiveStyle()'s pattern -- passing a
  // bare style URL STRING to `new maplibregl.Map({style: ...})` left MapLibre to fetch/parse it
  // internally, and for this vendored (pmtiles://-sourced) style that internal load silently never
  // resolved to 'load' OR 'error' (found via debug instrumentation, 2026-07-19) -- fetching it
  // ourselves gives us a real Promise we can .catch() and guarantees a plain object either way.
  var _vendoredStyleCache = null;
  function loadVendoredStyle() {
    if (_vendoredStyleCache) return _vendoredStyleCache;
    _vendoredStyleCache = fetch('assets/maps/historical.json').then(function (r) { return r.json(); });
    return _vendoredStyleCache;
  }

  function styleFor(spec) {
    return spec.tile_source === 'vendored'
      ? loadVendoredStyle()   // local pmtiles:// sources (self-contained)
      : loadLiveStyle();      // live OHM (wide-area maps), glyph-patched
  }

  function attributionFor(spec) {
    var base = 'Historical map data © OpenHistoricalMap contributors (ODbL)';
    return spec.tile_source === 'live' ? base + ' — tiles fetched live from OpenHistoricalMap'
                                       : base;
  }

  function renderLive(el, spec) {
    styleFor(spec).then(function (style) {
      var map;
      try {
        map = new maplibregl.Map({
          container: el, style: style,
          center: lngLat(spec.center), zoom: spec.zoom || 2,
          attributionControl: false,
        });
      } catch (e) { return renderBoundary(el, spec); }
      attachMapHandlers(map, el, spec);
    }).catch(function () { renderBoundary(el, spec); });
  }

  function attachMapHandlers(map, el, spec) {

    // Zoom +/- buttons: London only (Paul's ask, 2026-07-21) -- the other maps are wide-area
    // route/scatter overviews where zoom controls add UI without adding value; London is the one
    // map a reader might actually want to zoom into (street-level addresses).
    if (spec.map === 'map-london') {
      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    }
    map.addControl(new maplibregl.AttributionControl({ customAttribution: attributionFor(spec) }));
    map.scrollZoom.disable();   // the map sits inside a scrolling page, not a dedicated viewer

    var failed = false;
    function fallback() {
      if (failed) return;
      failed = true;
      // DESTROY the failed map first (frees its WebGL context + stops its animation loops). Without
      // this, up to 5 maps each leak a context on fallback -> the browser's ~16-context cap can be
      // hit, and the BOUNDARY map's getContext then fails -> a blank box (the thing we must avoid).
      // It also stops any marching-ants rAF loop bound to the dead map's layers.
      try { map.remove(); } catch (e) { /* already gone */ }
      renderBoundary(el, spec);
    }
    map.on('error', fallback);
    map.on('webglcontextlost', fallback);

    // Don't gate purely on 'load': for a style backed by several pmtiles:// custom-protocol sources
    // (the vendored London map), every individual source reliably reaches isSourceLoaded===true (per
    // 'sourcedata') but the map's own aggregate 'load'/'idle' event can simply never fire -- a real,
    // reproduced MapLibre-vs-custom-protocol gap, not a data or CSS bug. Same lesson as the
    // isStyleLoaded() race fixed earlier in this project: don't trust one aggregate async lifecycle
    // signal as the sole gate. Track each named source's own completion instead, and proceed the
    // moment they're ALL loaded -- whichever signal (this, or a normal 'load') arrives first wins.
    var ready = false;
    function proceed() {
      if (ready || failed) return;
      ready = true;
      if (spec.year && map.filterByDate) {
        try { map.filterByDate(spec.year + '-01-01'); } catch (e) { /* date filter best-effort */ }
      }
      addOverlays(map, spec);
      fitToSpec(map, spec);
    }
    map.on('load', proceed);

    var pendingSources = null;   // filled in once the style object is available
    map.on('styledata', function () {
      if (ready || pendingSources) return;
      var style = map.getStyle();
      if (!style || !style.sources) return;
      pendingSources = Object.keys(style.sources);
      if (!pendingSources.length) return proceed();
      map.on('sourcedata', function (e) {
        if (ready || !e.isSourceLoaded || pendingSources.indexOf(e.sourceId) === -1) return;
        pendingSources = pendingSources.filter(function (id) { return id !== e.sourceId; });
        if (!pendingSources.length) proceed();
      });
    });
  }

  function renderOne(spec) {
    var el = document.querySelector('.map-live-stage[data-map="' + spec.map + '"]');
    if (!el) return;
    if (!glSupported()) return renderBoundary(el, spec);
    try { renderLive(el, spec); } catch (e) { renderBoundary(el, spec); }
  }

  // Run after the DOM is parsed: map-render.js is injected mid-body but the .map-live-stage mounts
  // may follow it (the JOURNEY_MAPS island JSON sits between), so a bare synchronous pass could miss
  // stages that aren't in the DOM yet. DOMContentLoaded guarantees every mount exists.
  function run() { maps.forEach(renderOne); }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})();
