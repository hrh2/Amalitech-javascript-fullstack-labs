import './style.css';

/**
 * Developer Dashboard — a card-catalog style browser for developer resources.
 * Each resource carries a category (used for the colored tab + filter) and a
 * type (article, video, docs) so it can be searched and filtered client-side.
 */
const resources = [
  {
    name: 'About npm',
    category: 'package',
    type: 'docs',
    desc: 'Official rundown of what npm is and how it manages Node.js packages.',
    link: 'https://docs.npmjs.com/about-npm',
  },
  {
    name: 'Yarn — Getting Started',
    category: 'package',
    type: 'docs',
    desc: 'Installation and first steps for the Yarn package manager.',
    link: 'https://yarnpkg.com/getting-started',
  },
  {
    name: 'npm vs Yarn',
    category: 'package',
    type: 'video',
    desc: 'Web Dev Simplified compares the two package managers and when to pick each.',
    link: 'https://www.youtube.com/watch?v=BiBjuphZQxA',
  },
  {
    name: 'Vite — Guide',
    category: 'build',
    type: 'docs',
    desc: 'Official guide to the dev server, build pipeline, and modern browser tricks Vite leans on.',
    link: 'https://vite.dev/guide/',
  },
  {
    name: 'Webpack — Guides',
    category: 'build',
    type: 'docs',
    desc: 'Reference docs for the bundler that came before Vite — useful context for older codebases.',
    link: 'https://webpack.js.org/guides/',
  },
  {
    name: 'Vite Crash Course',
    category: 'build',
    type: 'video',
    desc: 'freeCodeCamp walkthrough of scaffolding, dev-server features, and production builds.',
    link: 'https://www.youtube.com/watch?v=do62-z3z6FM',
  },
  {
    name: 'Configure ESLint',
    category: 'quality',
    type: 'docs',
    desc: 'How to set rule sets and environments for a project-specific lint config.',
    link: 'https://eslint.org/docs/latest/use/configure/',
  },
  {
    name: 'ESLint + Prettier + Husky + Lint-Staged',
    category: 'quality',
    type: 'video',
    desc: 'IterateX shows how linting, formatting, and git-hook automation fit together in a Vite project.',
    link: 'https://www.youtube.com/watch?v=kbvL7SWvjY0',
  },
];

const CATEGORY_PREFIX = {
  package: 'PKG',
  build: 'BLD',
  quality: 'QC',
};

// Stable per-item call number, e.g. "PKG.001", derived from category + index.
function callNumber(item, index) {
  const prefix = CATEGORY_PREFIX[item.category] ?? 'GEN';
  return `${prefix}.${String(index + 1).padStart(3, '0')}`;
}

const state = {
  query: '',
  category: 'all',
};

function matches(item) {
  const inCategory = state.category === 'all' || item.category === state.category;
  const q = state.query.trim().toLowerCase();
  const inQuery =
    q === '' ||
    item.name.toLowerCase().includes(q) ||
    item.desc.toLowerCase().includes(q) ||
    item.category.toLowerCase().includes(q);
  return inCategory && inQuery;
}

function cardTemplate(item, index) {
  return `
    <article class="card">
      <span class="punch" aria-hidden="true"></span>
      <div class="call-no">${callNumber(item, index)}</div>
      <h3>${item.name}</h3>
      <p class="desc">${item.desc}</p>
      <div class="tag-row">
        <span class="tag ${item.category}">${item.category}</span>
        <span class="tag format">${item.type}</span>
      </div>
      <a class="checkout" href="${item.link}" target="_blank" rel="noopener noreferrer">
        → check out resource
      </a>
    </article>
  `;
}

function render() {
  const grid = document.querySelector('#grid');
  const countEl = document.querySelector('#count');
  const visible = resources.filter(matches);

  countEl.textContent = `${visible.length} of ${resources.length} entries`;

  grid.innerHTML = visible.length
    ? visible.map((item) => cardTemplate(item, resources.indexOf(item))).join('')
    : `<p class="empty">No cards in this drawer match "${state.query}".</p>`;
}

function shell() {
  return `
    <div class="drawer">
      <div class="drawer-label">
        <span class="pin" aria-hidden="true"></span>
        <span>DRAWER · FEM08 TOOLING</span>
      </div>
      <h1>Developer Dashboard</h1>
      <p class="sub">A small card catalog of the package managers, bundlers, and
      quality tools covered in this module — searchable like a real drawer.</p>
    </div>

    <div class="rail">
      <input
        id="search"
        type="search"
        placeholder="Search the catalog… (e.g. lint, vite, yarn)"
        aria-label="Search developer resources"
      />
      <button class="tab-btn" data-cat="all" aria-pressed="true">All</button>
      <button class="tab-btn" data-cat="package" aria-pressed="false">Package Mgmt</button>
      <button class="tab-btn" data-cat="build" aria-pressed="false">Build Tools</button>
      <button class="tab-btn" data-cat="quality" aria-pressed="false">Code Quality</button>
      <span id="count" class="count"></span>
    </div>

    <section id="grid" class="grid" aria-live="polite"></section>

    <footer>Filed under Tooling &amp; Build Systems — FEM08</footer>
  `;
}

function bindEvents() {
  document.querySelector('#search').addEventListener('input', (event) => {
    state.query = event.target.value;
    render();
  });

  document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.category = btn.dataset.cat;
      document
        .querySelectorAll('.tab-btn')
        .forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
      render();
    });
  });
}

function init() {
  const app = document.querySelector('#app');
  app.innerHTML = shell();
  bindEvents();
  render();
}

init();
