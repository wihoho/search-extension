// Builds one store screenshot. make-screenshots.cjs calls renderShot(n, data),
// where data holds address bar suggestions produced by the real background.js.

const ICON = '../icons/icon16.png';

function el(html) {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

// Omnibox description markup (<match>, <dim>, <url>) -> HTML.
function omni(description) {
  return description
    .replace(/<match>/g, '<b>').replace(/<\/match>/g, '</b>')
    .replace(/<dim>/g, '<span class="dim">').replace(/<\/dim>/g, '</span>')
    .replace(/<url>/g, '<span class="url">').replace(/<\/url>/g, '</span>');
}

const chip = `<span class="chip"><img src="${ICON}">OmniSearch</span>`;

function head(title, sub, cls = '') {
  return `<div class="head ${cls}"><h1>${title}</h1><p>${sub}</p></div>`;
}

function browser({ tabs, address, activeInput, dropdown = '', content }) {
  const tabHtml = tabs.map((t, i) => `<div class="tab${i === 0 ? ' on' : ''}">
      <div class="fav" style="background:${t.color}"></div><span>${t.title}</span></div>`).join('');
  const box = activeInput !== undefined
    ? `<div class="omnibox active">${chip}<span>${activeInput}</span><span class="caret"></span>${dropdown}</div>`
    : `<div class="omnibox"><span class="lock">🔒</span><span>${address.host}</span><span class="host">${address.path || ''}</span></div>`;
  return `<div class="browser">
    <div class="tabstrip">${tabHtml}</div>
    <div class="toolbar"><span class="nav">←</span><span class="nav">→</span><span class="nav">⟳</span>${box}
      <img class="ext-icon" src="${ICON}"><span class="nav">⋮</span></div>
    <div class="content">${content}</div>
  </div>`;
}

const sidepanel = `<div class="sidepanel">
  <div class="sp-head"><img src="${ICON}"><span>OmniSearch</span><span class="dim">▾</span><span class="grow"></span><span class="x">✕</span></div>
  <iframe src="../sidepanel.html"></iframe>
</div>`;

const blog = `<div class="page blog">
  <div class="kicker">Baking</div>
  <h2>Sourdough basics: a starter, a weekend and a hot oven</h2>
  <div class="meta">Weekend Kitchen · 8 min read</div>
  <div class="hero"></div>
  <p>Good bread needs very little: flour, water, salt and time. The trick is a lively starter and a dough that has had the chance to rise slowly.</p>
  <p>Feed your starter the night before, mix in the morning, fold every half hour, then let the fridge do the rest overnight.</p>
</div>`;

const SHOTS = {
  1: ({ hero }) => {
    const rows = [hero.description, ...hero.suggestions.map((s) => s.description)]
      .map((d, i) => `<div class="row${i === 0 ? ' sel' : ''}"><img src="${ICON}"><span>${omni(d)}</span></div>`).join('');
    document.body.append(
      el(head('Search any site from the address bar',
        'Type <kbd>os</kbd>, a keyword and your search, then press <kbd>Enter</kbd>.')),
      el(browser({
        tabs: [{ title: 'Sourdough basics – Weekend Kitchen', color: '#e9a86a' }, { title: 'New Tab', color: '#c4c7c5' }],
        activeInput: hero.input,
        dropdown: `<div class="dropdown">${rows}</div>`,
        content: blog,
      })),
      el('<div class="callout" style="left:760px; top:327px">Press ↓ to run the same search on another site</div>'),
    );
  },

  2: ({ cards }) => {
    const labels = [
      ['Just the keyword', 'opens the site'],
      ['Shortened keywords', 'work when they\'re unique'],
      ['Several sites at once', 'join keywords with +'],
      ['No matching keyword?', 'you get a normal web search'],
    ];
    const html = cards.map((c, i) => `<div class="card">
        <div class="box">
          <div class="input">${chip}<span>${c.input}</span></div>
          <div class="row sel"><img src="${ICON}"><span>${omni(c.description)}</span></div>
        </div>
        <div class="label">${labels[i][0]}<small>${labels[i][1]}</small></div>
      </div>`).join('');
    document.body.append(
      el(head('It understands what you mean', 'One trigger, <kbd>os</kbd>, for everything you search.')),
      el(`<div class="cards">${html}</div>`),
    );
  },

  3: () => {
    document.body.append(
      el(head('All your shortcuts in Chrome\'s side panel',
        'Open it from the toolbar or with <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>S</kbd>. Turn shortcuts on or off, edit them, filter them.')),
      el(browser({
        tabs: [{ title: 'Sourdough basics – Weekend Kitchen', color: '#e9a86a' }],
        address: { host: 'weekendkitchen.example', path: '/sourdough-basics' },
        content: blog + sidepanel,
      })),
    );
  },

  4: () => {
    const card = (name, bg) => `<div class="recipe"><div class="img" style="background:${bg}"></div><div class="t">${name}</div></div>`;
    const page = `<div class="page">
      <div class="site-bar"><span class="logo">Recipe Box</span>
        <span class="links"><span>Dinners</span><span>Baking</span><span>Quick</span></span>
        <span class="searchbox">🔍 Search recipes</span></div>
      <div class="grid">
        ${card('Lemon herb chicken', 'linear-gradient(135deg,#f3d27a,#d98c3f)')}
        ${card('Weeknight ramen', 'linear-gradient(135deg,#f0b38a,#b5543a)')}
        ${card('Green shakshuka', 'linear-gradient(135deg,#b9d98a,#5f8f3e)')}
        ${card('Berry crumble', 'linear-gradient(135deg,#d7a1c9,#7d3f74)')}
        ${card('Miso salmon', 'linear-gradient(135deg,#f6b59a,#d0623f)')}
        ${card('Focaccia', 'linear-gradient(135deg,#f2dc9b,#c49a4a)')}
      </div></div>`;
    const menu = `<div class="menu" style="left:520px; top:338px">
      <div class="item">Emoji<span class="k">Win+Period</span></div><div class="sep"></div>
      <div class="item dis">Undo<span class="k">Ctrl+Z</span></div>
      <div class="item">Paste<span class="k">Ctrl+V</span></div>
      <div class="item">Select all<span class="k">Ctrl+A</span></div><div class="sep"></div>
      <div class="item hl"><img src="${ICON}">Add a keyword for this search…</div><div class="sep"></div>
      <div class="item">Inspect</div></div>`;
    const pointer = `<svg class="pointer" style="left:508px; top:318px" viewBox="0 0 24 24"><path d="M3 2l7 19 2.6-7.4L20 11z" fill="#fff" stroke="#000" stroke-width="1.4" stroke-linejoin="round"/></svg>`;
    document.body.append(
      el(head('Add any site with one right-click',
        'Right-click a site\'s search box and choose <b>Add a keyword for this search</b>. OmniSearch finds the search address for you.')),
      el(browser({
        tabs: [{ title: 'Recipe Box – Easy recipes', color: '#2e5e3e' }],
        address: { host: 'recipebox.example' },
        content: page + sidepanel,
      })),
      el(menu),
      el(pointer),
    );
  },

  5: () => {
    const features = [
      ['🧭', 'Suggested sites by category', 'Search, AI, shopping, video, reference, developer and regional sites.'],
      ['🔁', 'Export and import', 'Back up your shortcuts or move them to another computer.'],
      ['☁️', 'Syncs with Chrome', 'Your shortcuts follow your Chrome profile.'],
      ['🔒', 'Private by design', 'No account, no ads, no tracking. Your search goes only to the site you pick.'],
    ].map(([ic, b, s]) => `<li><div class="ic">${ic}</div><div><b>${b}</b><span>${s}</span></div></li>`).join('');
    document.body.append(
      el(head('50+ ready-made shortcuts', 'Or add your own in seconds.', 'narrow')),
      el(`<ul class="features">${features}</ul>`),
      el(`<div class="panel-card">
        <div class="sp-head"><img src="${ICON}"><span>OmniSearch</span><span class="dim">▾</span><span class="grow"></span><span class="x">✕</span></div>
        <iframe src="../sidepanel.html"></iframe></div>`),
    );
  },
};

window.renderShot = (n, data = {}) => SHOTS[n](data);
