/**
 * perf-measure — deterministic in-page collector.
 *
 * This file is the SINGLE source of the measurement JS. The skill reads it
 * verbatim every run and injects it via chrome-devtools, so every results row
 * is produced by identical code. Bump COLLECTOR_VERSION whenever you change
 * WHAT is collected (it is stamped into every row).
 *
 * Two pieces:
 *   1. instrumentationSource(config) — JS installed as an init script BEFORE any
 *      page script runs (chrome-devtools `evaluate_script` on new document).
 *      Buffered perf APIs miss SPA candidates after a client route change, so we
 *      must be listening before the app boots.
 *   2. collectSource() — JS evaluated AFTER the page-ready signal to return the
 *      fixed metric set as JSON.
 */

export const COLLECTOR_VERSION = "1.0.0";

/**
 * @param {{ readySelector: string, readyMinCount: number, dataRequestUrlPattern: string|null }} config
 * @returns {string} JS source to run as a pre-page init script.
 */
export function instrumentationSource(config) {
  return `(() => {
    if (window.__perf) return;
    const cfg = ${JSON.stringify(config)};
    const perf = (window.__perf = {
      cfg,
      paint: {},
      lcp: null,
      cls: 0,
      dataRequests: [],   // { url, start, end, dur }
      inflight: 0,
      lastActivity: null, // performance.now() of last data-request settle
      readyAt: null,      // performance.now() when ready signal first satisfied
      readyCount: null,
    });

    // --- paint / LCP / CLS observers (LCP is often null for SPAs — expected) ---
    const obs = (type, cb) => { try { new PerformanceObserver(cb).observe({ type, buffered: true }); } catch (e) {} };
    obs("paint", (l) => { for (const e of l.getEntries()) perf.paint[e.name] = e.startTime; });
    obs("largest-contentful-paint", (l) => { const es = l.getEntries(); if (es.length) perf.lcp = es[es.length - 1].startTime; });
    obs("layout-shift", (l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) perf.cls += e.value; });

    // --- data-request timing via fetch + XHR wrappers ---
    const matches = (u) => cfg.dataRequestUrlPattern ? new RegExp(cfg.dataRequestUrlPattern).test(String(u)) : false;
    const startReq = (url) => { const r = { url: String(url), start: performance.now(), end: null, dur: null }; perf.dataRequests.push(r); perf.inflight++; return r; };
    const endReq = (r) => { r.end = performance.now(); r.dur = r.end - r.start; perf.inflight = Math.max(0, perf.inflight - 1); perf.lastActivity = r.end; };

    const origFetch = window.fetch;
    if (origFetch) {
      window.fetch = function (...args) {
        if (!matches(args[0])) return origFetch.apply(this, args);
        const r = startReq(args[0]);
        return origFetch.apply(this, args).finally(() => endReq(r));
      };
    }
    const origOpen = XMLHttpRequest.prototype.open;
    const origSend = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.open = function (m, u, ...rest) { this.__perfUrl = u; return origOpen.call(this, m, u, ...rest); };
    XMLHttpRequest.prototype.send = function (...args) {
      if (matches(this.__perfUrl)) { const r = startReq(this.__perfUrl); this.addEventListener("loadend", () => endReq(r)); }
      return origSend.apply(this, args);
    };

    // --- page-ready detector: ready when >= readyMinCount nodes match readySelector ---
    const check = () => {
      if (perf.readyAt) return;
      const n = document.querySelectorAll(cfg.readySelector).length;
      if (n >= cfg.readyMinCount) {
        perf.readyAt = performance.now();
        perf.readyCount = n;
        try { performance.mark("perf:ready"); } catch (e) {}
      }
    };
    perf._check = check;
    const mo = new MutationObserver(check);
    const startObserving = () => { try { mo.observe(document.documentElement, { childList: true, subtree: true }); check(); } catch (e) {} };
    if (document.documentElement) startObserving();
    else document.addEventListener("readystatechange", startObserving, { once: true });
  })();`;
}

/**
 * @returns {string} JS expression evaluated after page-ready; resolves to the fixed metric JSON.
 */
export function collectSource() {
  return `(() => {
    const p = window.__perf;
    if (!p) return { error: "instrumentation missing — inject instrumentationSource() before navigation" };
    if (p._check) p._check();
    const nav = performance.getEntriesByType("navigation")[0] || {};
    const reqs = p.dataRequests;
    const slowest = reqs.reduce((m, r) => Math.max(m, r.dur || 0), 0);
    const resources = performance.getEntriesByType("resource");
    const mem = performance.memory ? performance.memory.usedJSHeapSize / 1048576 : null;
    return {
      collectorVersion: ${JSON.stringify(COLLECTOR_VERSION)},
      // headline (content-based)
      timeToDataRenderedMs: p.readyAt == null ? null : Math.round(p.readyAt),
      readyCount: p.readyCount,
      // network-quiet: time of the last data-request settle; null when there are
      // no intercepted data requests (e.g. the current in-memory mock API).
      timeToNetworkQuietMs: reqs.length ? Math.round(p.lastActivity) : null,
      // network waterfall
      dataRequestCount: reqs.length,
      slowestDataRequestMs: reqs.length ? Math.round(slowest) : null,
      // reference (recorded, not ranked on)
      ttfbMs: nav.responseStart != null ? Math.round(nav.responseStart) : null,
      fcpMs: p.paint["first-contentful-paint"] != null ? Math.round(p.paint["first-contentful-paint"]) : null,
      loadEventMs: nav.loadEventEnd ? Math.round(nav.loadEventEnd) : null,
      cls: Math.round(p.cls * 1000) / 1000,
      lcpMs: p.lcp == null ? null : Math.round(p.lcp), // null is expected for SPAs
      // memory + weight
      jsHeapUsedMb: mem == null ? null : Math.round(mem * 10) / 10,
      domNodes: document.getElementsByTagName("*").length,
      resourceCount: resources.length,
      transferKb: Math.round(resources.reduce((s, r) => s + (r.transferSize || 0), 0) / 1024),
    };
  })();`;
}
