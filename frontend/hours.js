// Home page: shows whether the library and café are open right now.
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
    return `<li class="hours-row" data-open="${s.open}"><strong>${place.name}</strong>${s.text}</li>`;
  }).join("");
}

renderHours();
setInterval(renderHours, 60 * 1000); // refresh every minute