// Builds the top navigation on every page so the links live in ONE place.
// To add or rename a page, edit the PAGES list below.
const SITE_NAME = "Cougar Commons"; 

const PAGES = [
  { href: "index.html",          label: "Home" },
  { href: "faq.html",            label: "FAQ" },
  { href: "booking.html",        label: "Book a room" },
  { href: "transportation.html", label: "Getting here" },
  { href: "references.html",     label: "References" },
];

function buildNav() {
  const header = document.getElementById("site-header");
  if (!header) return;

  // Which page are we on? "/" or "" means index.html
  const current = location.pathname.split("/").pop() || "index.html";

  const links = PAGES.map((p) => {
    const active = p.href === current ? ' aria-current="page"' : "";
    return `<li><a class="link" href="${p.href}"${active}>${p.label}</a></li>`;
  }).join("");

  header.innerHTML = `
    <nav aria-label="Main" class="bar">
      <a class="brand" href="index.html">${SITE_NAME}</a>
      <button class="menu-toggle" aria-expanded="false" aria-controls="nav-links">Menu</button>
      <ul id="nav-links">${links}</ul>
    </nav>`;

  // Mobile menu open/close
  const toggle = header.querySelector(".menu-toggle");
  const list = header.querySelector("#nav-links");
  toggle.addEventListener("click", () => {
    const open = list.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(open));
  });
}

buildNav();