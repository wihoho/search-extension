// Functions injected with chrome.scripting.executeScript({ func }). Each one
// runs inside the page, so it must be self-contained: no imports, no closures.

// Advanced shortcuts: type the query into the page's text box, then click the
// button (or press Enter when no button selector is set).
export async function fillAndSubmit(query, inputSelector, buttonSelector) {
  const find = (selector) => {
    if (!selector) return null;
    try {
      if (selector.startsWith('/') || selector.startsWith('(/')) {
        return document.evaluate(selector, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
      }
      return document.querySelector(selector);
    } catch {
      return null;
    }
  };
  const waitFor = (check, timeout) => new Promise((resolve) => {
    const start = Date.now();
    const tick = () => {
      const value = check();
      if (value) return resolve(value);
      if (Date.now() - start > timeout) return resolve(null);
      setTimeout(tick, 150);
    };
    tick();
  });

  const input = await waitFor(() => find(inputSelector), 15000);
  if (!input) return { ok: false, error: `Couldn't find the text box "${inputSelector}" on the page.` };

  input.focus();
  if (input.isContentEditable) {
    // Rich-text editors (ProseMirror, Lexical, Quill) only react to real edits.
    document.execCommand('selectAll', false);
    document.execCommand('insertText', false, query);
  } else {
    // Use the native setter so frameworks like React notice the new value.
    const proto = input instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, 'value').set.call(input, query);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }

  if (buttonSelector) {
    const usable = (el) => el && !el.disabled && el.getAttribute('aria-disabled') !== 'true';
    const button = await waitFor(() => {
      const el = find(buttonSelector);
      return usable(el) ? el : null;
    }, 10000);
    if (!button) return { ok: false, error: `Couldn't find the button "${buttonSelector}" on the page.` };
    button.click();
    return { ok: true };
  }

  const key = { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true, cancelable: true };
  const unhandled = input.dispatchEvent(new KeyboardEvent('keydown', key));
  input.dispatchEvent(new KeyboardEvent('keypress', key));
  input.dispatchEvent(new KeyboardEvent('keyup', key));
  if (unhandled && input.form) input.form.requestSubmit();
  return { ok: true };
}

// "Add a keyword for this search": work out the site's search URL from the
// search box the user right-clicked (or, from the toolbar icon menu, from the
// page's first search box or its OpenSearch description).
export async function detectSearchUrl(preferFocused) {
  const enc = encodeURIComponent;
  const siteName = (document.querySelector('meta[property="og:site_name"]')?.content
    || document.querySelector('meta[name="application-name"]')?.content
    || location.hostname.replace(/^www\./, '')).trim().slice(0, 80);

  const isTextField = (el) => el && el.form && el.name
    && (el.tagName === 'TEXTAREA' || (el.tagName === 'INPUT'
      && ['text', 'search', ''].includes((el.getAttribute('type') || '').toLowerCase())));

  const fromForm = (field) => {
    const form = field.form;
    if ((form.getAttribute('method') || 'get').toLowerCase() !== 'get') return null;
    const action = new URL(form.action || location.href, location.href);
    if (!/^https?:$/.test(action.protocol)) return null;
    const params = [];
    for (const el of form.elements) {
      if (!el.name || el.disabled) continue;
      if (el === field) {
        params.push(`${enc(el.name)}=%s`);
        continue;
      }
      const type = (el.type || '').toLowerCase();
      if (['submit', 'button', 'image', 'reset', 'file', 'password'].includes(type)) continue;
      if ((type === 'checkbox' || type === 'radio') && !el.checked) continue;
      if (el.tagName === 'SELECT' && el.multiple) {
        for (const option of el.selectedOptions) params.push(`${enc(el.name)}=${enc(option.value)}`);
        continue;
      }
      params.push(`${enc(el.name)}=${enc(el.value)}`);
    }
    action.search = '';
    action.hash = '';
    return action.href + '?' + params.join('&');
  };

  const fromOpenSearch = async () => {
    const link = document.querySelector('link[rel="search"][type="application/opensearchdescription+xml"]');
    if (!link) return null;
    try {
      const xml = new DOMParser().parseFromString(await (await fetch(link.href)).text(), 'application/xml');
      const node = [...xml.getElementsByTagName('Url')].find((u) => (u.getAttribute('type') || '') === 'text/html');
      const template = node?.getAttribute('template');
      if (!template || !template.includes('{searchTerms}')) return null;
      const url = new URL(template.replace('{searchTerms}', '__OMNISEARCH__'), link.href);
      // Drop the other OpenSearch parameters, such as {startPage?} or {language}.
      for (const [name, value] of [...url.searchParams]) {
        if (/^\{.*\}$/.test(value)) url.searchParams.delete(name);
      }
      return url.href.replace('__OMNISEARCH__', '%s');
    } catch {
      return null;
    }
  };

  const focused = document.activeElement;
  if (preferFocused && isTextField(focused)) {
    const url = fromForm(focused);
    if (url) return { name: siteName, url, how: 'form' };
  }
  const openSearch = await fromOpenSearch();
  if (openSearch) return { name: siteName, url: openSearch, how: 'opensearch' };
  const box = [...document.querySelectorAll('form input[type="search"], form input[name="q"], form input[name="query"], form input[name="search"], form input[name="s"]')]
    .find(isTextField);
  if (box) {
    const url = fromForm(box);
    if (url) return { name: siteName, url, how: 'form' };
  }
  return { name: siteName, url: null, how: null, origin: location.origin };
}
