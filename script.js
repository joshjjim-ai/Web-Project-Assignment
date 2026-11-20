// ============================================================
// Cougar Commons: one script for every page.
// Parts: 1) navigation  2) booking form  3) hours board
// Each part checks that its page elements exist before running.
// ============================================================

// ---------- 1. Navigation ----------
// Builds the top navigation on every page so the links live in ONE place.
// To add or rename a page, edit the PAGES list below.
const SITE_NAME = "Cougar Commons";

const PAGES = [
  { href: "index.html",          label: "Home" },
  { href: "FAQ.html",            label: "FAQ" },
  { href: "roombooking.html",    label: "Book a room" },
  { href: "transportation.html", label: "Getting here" },
  { href: "reference.html",      label: "References" },
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

// ---------- 2. Booking form (roombooking.html only) ----------
// Client-side validation only.
// The server (Node/Express) comes later; see the TODO in the submit handler.
function initBooking() {
  const form = document.getElementById("booking-form");
  if (!form) return; // not the booking page

  const confirmBox = document.getElementById("confirmation");
  const CLOSING_HOUR = 22; // 10 PM, matches the library's latest closing time

  const fieldNames = ["name", "email", "room", "date", "start", "duration", "guests"];

  // ---------- Helpers ----------
  function formatHour(h) {
    return `${h % 12 || 12}:00 ${h >= 12 ? "PM" : "AM"}`;
  }
  function toISO(d) { // local date as yyyy-mm-dd (avoids the UTC shift of toISOString)
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${d.getFullYear()}-${m}-${day}`;
  }

  // ---------- Fill in the start-time dropdown and the date limits ----------
  for (let h = 8; h < CLOSING_HOUR; h++) {
    form.elements.start.add(new Option(formatHour(h), String(h)));
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + 14);
  form.elements.date.min = toISO(today);
  form.elements.date.max = toISO(maxDate);

  // ---------- Validation rules: each returns an error message, or "" when valid ----------
  const validators = {
    name(v) {
      return v.trim().length >= 2 ? "" : "Enter your full name.";
    },
    email(v) {
      return /^[^\s@]+@(cougarnet\.)?uh\.edu$/i.test(v.trim())
        ? "" : "Enter your UH email. It ends in @uh.edu or @cougarnet.uh.edu.";
    },
    room(v) {
      return v ? "" : "Choose a study room.";
    },
    date(v) {
      if (!v) return "Choose a date.";
      const picked = new Date(v + "T00:00");
      if (picked < today) return "Choose today or a later date.";
      if (picked > maxDate) return "Rooms can be booked up to 14 days ahead.";
      return "";
    },
    start(v) {
      return v ? "" : "Choose a start time.";
    },
    duration(v) {
      if (!v) return "Choose how long you need the room.";
      const start = Number(form.elements.start.value);
      if (start && start + Number(v) > CLOSING_HOUR) {
        return `The room must be free by ${formatHour(CLOSING_HOUR)}. Pick a shorter time or an earlier start.`;
      }
      return "";
    },
    guests(v) {
      const n = Number(v);
      if (!v || !Number.isInteger(n) || n < 1) return "Enter how many people will use the room.";
      const selected = form.elements.room.selectedOptions[0];
      const capacity = Number(selected.dataset.capacity);
      if (capacity && n > capacity) return `${selected.value} holds up to ${capacity} people.`;
      return "";
    },
  };

  function validateField(name) {
    const field = form.elements[name];
    const message = validators[name](field.value);
    document.getElementById(`${name}-error`).textContent = message;
    field.setAttribute("aria-invalid", message ? "true" : "false");
    return message === "";
  }

  // Check a field when the person leaves it, and re-check fields that depend on it
  fieldNames.forEach((name) => {
    form.elements[name].addEventListener("blur", () => validateField(name));
  });
  form.elements.room.addEventListener("change", () => {
    if (form.elements.guests.value) validateField("guests");
  });
  form.elements.start.addEventListener("change", () => {
    if (form.elements.duration.value) validateField("duration");
  });

  // ---------- Submit ----------
  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const results = fieldNames.map((name) => ({ name, ok: validateField(name) }));
    const firstBad = results.find((r) => !r.ok);
    if (firstBad) {
      form.elements[firstBad.name].focus();
      return;
    }

    const booking = {
      name: form.elements.name.value.trim(),
      email: form.elements.email.value.trim(),
      room: form.elements.room.value,
      guests: Number(form.elements.guests.value),
      date: form.elements.date.value,
      start: Number(form.elements.start.value),
      duration: Number(form.elements.duration.value),
    };

    // TODO (server phase): send the booking to the Express API, e.g.
    // fetch("/api/bookings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(booking) })

    const dateText = new Date(booking.date + "T00:00").toLocaleDateString("en-US", {
      weekday: "long", month: "long", day: "numeric",
    });
    const heading = document.createElement("h2");
    heading.textContent = "Request received";
    const summary = document.createElement("p");
    summary.textContent =
      `${booking.name}, we have ${booking.room} down for ${booking.guests} ` +
      `${booking.guests === 1 ? "person" : "people"} on ${dateText}, ` +
      `${formatHour(booking.start)} to ${formatHour(booking.start + booking.duration)}.`;
    confirmBox.replaceChildren(heading, summary);
    confirmBox.hidden = false;
    confirmBox.focus();

    form.reset();
    fieldNames.forEach((name) => form.elements[name].setAttribute("aria-invalid", "false"));
  });
}

initBooking();

// ---------- 3. Hours board (index.html only) ----------
// Shows whether the library and café are open right now.
// week[] is indexed by getDay(): 0 = Sunday ... 6 = Saturday.
// Each entry is [opens, closes] in 24-hour decimals (7.5 = 7:30 AM) or null when closed all day.
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const PLACES = [
  { name: "Library", week: [[12, 20], [8, 22], [8, 22], [8, 22], [8, 22], [8, 18], [10, 16]] },
  { name: "Café",    week: [null, [7.5, 15], [7.5, 15], [7.5, 15], [7.5, 15], [7.5, 15], null] },
];

function formatTime(h) {
  const hour = Math.floor(h);
  const minutes = Math.round((h - hour) * 60);
  const suffix = hour >= 12 ? "PM" : "AM";
  const h12 = hour % 12 || 12;
  return minutes ? `${h12}:${String(minutes).padStart(2, "0")} ${suffix}` : `${h12} ${suffix}`;
}

function getStatus(place, now) {
  const t = now.getHours() + now.getMinutes() / 60;
  const today = place.week[now.getDay()];

  if (today && t >= today[0] && t < today[1]) {
    return { open: true, text: `Open until ${formatTime(today[1])}` };
  }

  // Closed: find the next day (starting with today) that it opens
  for (let i = 0; i <= 7; i++) {
    const day = (now.getDay() + i) % 7;
    const hours = place.week[day];
    if (!hours) continue;
    if (i === 0 && t >= hours[0]) continue; // already closed for today
    const when = i === 0 ? "today" : i === 1 ? "tomorrow" : DAYS[day];
    return { open: false, text: `Closed. Opens ${when} at ${formatTime(hours[0])}` };
  }
  return { open: false, text: "Closed" };
}

function renderHours() {
  const list = document.getElementById("hours-board");
  if (!list) return;
  const now = new Date();
  list.innerHTML = PLACES.map((place) => {
    const s = getStatus(place, now);
    return `<li class="hours-row" data-open="${s.open}"><h4>${place.name}</h4>${s.text}</li>`;
  }).join("");
}

renderHours();
setInterval(renderHours, 60 * 1000); // refresh every minute