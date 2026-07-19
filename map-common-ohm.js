// Base-map setup for the OpenHistoricalMap variants. Reuses addWaypoint/addRoute/ll2lnglat from
// map-common-gl.js unchanged (they only depend on the `maplibregl` global, not on what style/tiles
// are loaded underneath) -- load that file BEFORE this one.
//
// Unlike the other two variants, this one is NOT self-contained: the style, its sprite/glyphs, and
// the map tiles themselves are fetched live from openhistoricalmap.org and unpkg.com at view time.
// That's inherent to vector-tile historical mapping at this scale -- there's no realistic way to
// vendor a full multi-zoom tile pyramid offline. Requires an internet connection to view, unlike
// the other two variants.

const OHM_STYLES = {
  // The print-style "woodblock" variant -- closest to the site's archival aesthetic.
  woodblock: 'https://unpkg.com/@openhistoricalmap/map-styles@0.9.16/dist/woodblock/woodblock.json',
  // The richer, more conventional-cartography "historical" default style -- the one
  // openhistoricalmap.org itself shows by default (Paul's reference link, 2026-07-19). Its raw
  // package JSON hardcodes localhost:8888 glyph/sprite URLs (a dev-only artifact of how the style
  // repo is built) -- patched to the real hosted paths below.
  historical: 'https://unpkg.com/@openhistoricalmap/map-styles@0.9.16/historical/historical.json',
};

async function loadStyle(which, suppressLabels) {
  const url = OHM_STYLES[which];
  const style = await (await fetch(url)).json();
  if (which === 'historical') {
    style.glyphs = 'https://www.openhistoricalmap.org/map-styles/fonts/{fontstack}/{range}.pbf';
    style.sprite = 'https://www.openhistoricalmap.org/map-styles/historical/historical_spritesheet';
  }
  // Our own highlighted-place labels (KORSOVKA, LONDON, etc.) are added separately as real DOM
  // markers via addWaypoint() -- they live outside this style entirely. So dropping every
  // `symbol`-type layer here (the base style's OWN place/road/water name labels, ~56 of them on
  // "historical") suppresses all the ambient text clutter at the default view while leaving our
  // highlighted waypoints exactly as visible as before. Removed before the map ever loads them,
  // so there's no flash of label text before it's hidden.
  if (suppressLabels) {
    style.layers = style.layers.filter((l) => l.type !== 'symbol');
  }
  return style;
}

// `styleName` -- 'woodblock' or 'historical' (default). `suppressLabels` (default true) drops the
// base style's own text/icon layers, per above. `onReady(map)` fires once the map object exists
// (style may still be loading) -- callers add their own layers inside it via `map.on('load', ...)`.
// `containerId` (default 'map') lets a page embed more than one independent map instance.
function initMapOHM(center, zoom, year, styleName, onReady, suppressLabels, containerId) {
  styleName = styleName || 'historical';
  if (suppressLabels === undefined) suppressLabels = true;
  loadStyle(styleName, suppressLabels).then((style) => {
    const map = new maplibregl.Map({
      container: containerId || 'map',
      style: style,
      center: ll2lnglat(center),
      zoom: zoom,
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');

    if (year) {
      map.on('styledata', function once() {
        if (map.filterByDate) {
          map.filterByDate(`${year}-01-01`);
        }
      });
    }
    if (onReady) onReady(map);
  });
}
