/**
 * Copies the shared header, footer, icon sprite and lightbox (partials/*.html)
 * into every page, between marker comments:
 *
 *   <!-- partial:header -->  …generated…  <!-- /partial:header -->
 *
 * Edit a partial once, then run:  npm run sync
 *
 * Placeholders inside partials:
 *   {{base}}        relative path to the site root ("" on the homepage, "../" on sub-pages)
 *   {{homeHref}}    link to the homepage
 *   {{topHref}}     "Back to top" target
 *   {{current:x}}   becomes aria-current="page" on page x, nothing elsewhere
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export const PAGES = [
  { file: "index.html", page: "home", base: "" },
  { file: "menu/index.html", page: "menu", base: "../" },
  { file: "our-coffee/index.html", page: "coffee", base: "../" },
  { file: "our-story/index.html", page: "story", base: "../" },
  { file: "gallery/index.html", page: "gallery", base: "../" },
  { file: "whats-new/index.html", page: "news", base: "../" },
  { file: "contact/index.html", page: "contact", base: "../" },
];

function render(template, { page, base }) {
  const isHome = page === "home";
  return template
    .replaceAll("{{base}}", base)
    .replaceAll("{{homeHref}}", isHome ? "#home" : base)
    .replaceAll("{{topHref}}", isHome ? "#home" : "#top")
    .replace(/\{\{current:(\w+)\}\}/g, (_, name) => (name === page ? ' aria-current="page"' : ""));
}

let changed = 0;
for (const entry of PAGES) {
  const file = path.join(ROOT, entry.file);
  if (!fs.existsSync(file)) { console.warn(`  skip  ${entry.file} (missing)`); continue; }
  const before = fs.readFileSync(file, "utf8");

  const after = before.replace(
    /([ \t]*)<!-- partial:([\w-]+) -->[\s\S]*?<!-- \/partial:\2 -->/g,
    (match, indent, name) => {
      const src = path.join(ROOT, "partials", `${name}.html`);
      if (!fs.existsSync(src)) throw new Error(`Unknown partial "${name}" in ${entry.file}`);
      const body = render(fs.readFileSync(src, "utf8"), entry).replace(/\s+$/, "");
      return `${indent}<!-- partial:${name} -->\n${body}\n${indent}<!-- /partial:${name} -->`;
    }
  );

  if (after !== before) { fs.writeFileSync(file, after); changed++; console.log(`  sync  ${entry.file}`); }
  else console.log(`  ok    ${entry.file}`);
}
console.log(`\n  ${changed} page(s) updated.\n`);
