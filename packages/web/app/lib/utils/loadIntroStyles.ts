let loaded = false;

/** Lazily inject intro.js stylesheets into the document head. */
export async function loadIntroStyles() {
  if (loaded) return;
  loaded = true;

  const [introjsCss, introjsCustomCss] = await Promise.all([
    import('intro.js/introjs.css?url').then(m => m.default),
    import('@/app/introjs-custom.css?url').then(m => m.default),
  ]);

  for (const href of [introjsCss, introjsCustomCss]) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
  }
}
