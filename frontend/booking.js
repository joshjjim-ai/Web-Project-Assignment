// Booking form: client-side validation only.
// The server (Node/Express) comes later; see the TODO in the submit handler.
const form = document.getElementById("booking-form");
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