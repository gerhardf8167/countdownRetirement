import { calculateCountdown, dateKey, parseDate } from './countdown.js';
import { initializeDatabase, getAbsences } from './db.js';
import './pwa.js';

const formatDate = new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
let records = null;

function render() {
  const now = new Date();
  document.querySelector('#current-date').textContent = new Intl.DateTimeFormat('de-DE', { dateStyle: 'full' }).format(now);
  if (!records) return;
  const result = calculateCountdown(now, records.map(record => record.date));
  document.querySelector('#calendar-days').textContent = result.calendarDays;
  document.querySelector('#workdays').textContent = result.workdays;
  const hours = Math.floor(result.secondsToday / 3600);
  const minutes = Math.floor(result.secondsToday % 3600 / 60);
  const seconds = result.secondsToday % 60;
  document.querySelector('#today-time').textContent = [hours, minutes, seconds].map(value => String(value).padStart(2, '0')).join(':');
  const next = records.find(record => record.date >= dateKey(now));
  document.querySelector('#next-absence').textContent = next ? `N\u00e4chste Abwesenheit: ${formatDate.format(parseDate(next.date))}` : 'Keine weitere Abwesenheit eingetragen';
  document.querySelector('#status').textContent = result.finished ? 'Das Zieldatum ist erreicht.' : '';
}

async function refresh() {
  try {
    await initializeDatabase();
    records = await getAbsences();
    render();
  } catch {
    records = null;
    document.querySelector('#status').textContent = 'Lokale Daten konnten nicht geladen werden. Bitte den Browserspeicher freigeben und die Seite neu laden.';
  }
}

await refresh();
setInterval(render, 1000);
window.addEventListener('pageshow', refresh);
window.addEventListener('focus', refresh);