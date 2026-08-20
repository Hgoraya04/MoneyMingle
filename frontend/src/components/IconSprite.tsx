// Small hand-drawn icon set (Tabler-outline-ish) so the app doesn't depend on an icon font/CDN.
// Rendered once near the root; every icon elsewhere is <svg class="icon"><use href="#i-name"/></svg>.
export function IconSprite() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
      <defs>
        <symbol id="i-home" viewBox="0 0 24 24">
          <path d="M4 11.5 12 4l8 7.5" />
          <path d="M6 10v9a1 1 0 0 0 1 1h4v-6h2v6h4a1 1 0 0 0 1-1v-9" />
        </symbol>
        <symbol id="i-user" viewBox="0 0 24 24">
          <circle cx="12" cy="8" r="3.4" />
          <path d="M5 20c1-3.8 4-5.8 7-5.8s6 2 7 5.8" />
        </symbol>
        <symbol id="i-receipt" viewBox="0 0 24 24">
          <path d="M6 3h12v18l-2.5-1.6L13 21l-1-1.6L11 21l-2.5-1.6L6 21z" />
          <path d="M9 8h6M9 12h6" />
        </symbol>
        <symbol id="i-chart" viewBox="0 0 24 24">
          <path d="M4 20V10M11 20V4M18 20v-7" />
          <path d="M3 20h18" />
        </symbol>
        <symbol id="i-help" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="8.5" />
          <path d="M9.6 9.3a2.5 2.5 0 0 1 4.8.8c0 1.7-2.2 1.9-2.2 3.4" />
          <circle cx="12" cy="16.6" r=".4" fill="currentColor" />
        </symbol>
        <symbol id="i-plus" viewBox="0 0 24 24">
          <path d="M12 5v14M5 12h14" />
        </symbol>
        <symbol id="i-arrow-down" viewBox="0 0 24 24">
          <path d="M12 4v15M6 13l6 6 6-6" />
        </symbol>
        <symbol id="i-arrow-up" viewBox="0 0 24 24">
          <path d="M12 20V5M6 11l6-6 6 6" />
        </symbol>
        <symbol id="i-check" viewBox="0 0 24 24">
          <path d="M4.5 12.5l5 5 10-11" />
        </symbol>
        <symbol id="i-card" viewBox="0 0 24 24">
          <rect x="3" y="6" width="18" height="13" rx="2" />
          <path d="M3 10.5h18" />
        </symbol>
        <symbol id="i-wallet" viewBox="0 0 24 24">
          <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H18a1 1 0 0 1 1 1v2" />
          <rect x="3" y="7.5" width="18" height="12" rx="2.3" />
          <circle cx="16.5" cy="13.6" r="1.2" fill="currentColor" stroke="none" />
        </symbol>
        <symbol id="i-exchange" viewBox="0 0 24 24">
          <path d="M4 8h13M13 4l4 4-4 4" />
          <path d="M20 16H7M11 12l-4 4 4 4" />
        </symbol>
        <symbol id="i-moon" viewBox="0 0 24 24">
          <path d="M20 14.3A8.4 8.4 0 1 1 9.7 4a6.6 6.6 0 0 0 10.3 10.3z" />
        </symbol>
        <symbol id="i-sun" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="4.3" />
          <path d="M12 2.5v2.5M12 19v2.5M4.6 4.6l1.8 1.8M17.6 17.6l1.8 1.8M2.5 12h2.5M19 12h2.5M4.6 19.4l1.8-1.8M17.6 6.4l1.8-1.8" />
        </symbol>
        <symbol id="i-x" viewBox="0 0 24 24">
          <path d="M5 5l14 14M19 5 5 19" />
        </symbol>
        <symbol id="i-sliders" viewBox="0 0 24 24">
          <path d="M4 6h9M17 6h3M4 12h3M11 12h9M4 18h13M21 18h-2" />
          <circle cx="15" cy="6" r="2" />
          <circle cx="7" cy="12" r="2" />
          <circle cx="19" cy="18" r="2" />
        </symbol>
        <symbol id="i-shield" viewBox="0 0 24 24">
          <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" />
          <path d="M9 12l2 2 4-4.5" />
        </symbol>
      </defs>
    </svg>
  );
}
