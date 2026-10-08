import { dateKey, parseDate, parseCsv } from './countdown.js';
import { initializeDatabase, getAbsences, saveAbsences, deleteAbsence } from './db.js';
import './pwa.js';

const form = document.querySelector('#absence-form');
const startInput = document.querySelector('#start-date');
const endInput = document.querySelector('#end-date');
const noteInput = document.querySelector('#note');
const status = document.querySelector('#status');
const formatDate = new Intl.DateTimeFormat('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' });
let records = [];
let ready = false;
let busy = false;

function lockControls(locked) {
  busy = locked;
  for (const button of document.querySelectorAll('main button')) button.disabled = locked || !ready;
}

function render() {
  const upcoming = document.querySelector('#date-filter').value === 'upcoming';
  const filtered = records.filter(record => !upcoming || record.date >= dateKey(new Date()));
  const list = document.querySelector('#absence-list');
  list.replaceChildren();
  for (const record of filtered) {
    const row = document.createElement('tr');
    const dateCell = document.createElement('td');
    const noteCell = document.createElement('td');
    const actionCell = document.createElement('td');
    dateCell.textContent = formatDate.format(parseDate(record.date));
    noteCell.textContent = record.note;
    const edit = document.createElement('button');
    edit.type = 'button';
    edit.textContent = 'Bearbeiten';
    edit.setAttribute('aria-label', `${dateCell.textContent} bearbeiten`);
    edit.addEventListener('click', () => {
      startInput.value = record.date;
      endInput.value = record.date;
      noteInput.value = record.note;
      startInput.focus();
    });
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'danger';
    remove.textContent = 'Entfernen';
    remove.setAttribute('aria-label', `${dateCell.textContent} entfernen`);
    remove.addEventListener('click', () => {
      if (!confirm(`Abwesenheit am ${dateCell.textContent} entfernen?`)) return;
      runOperation(async () => {
        await deleteAbsence(record.date);
        return 'Abwesenheit entfernt.';
      });
    });
    actionCell.append(edit, remove);
    row.append(dateCell, noteCell, actionCell);
    list.append(row);
  }
  document.querySelector('#record-count').textContent = `${filtered.length} Tage`;
  document.querySelector('#empty-state').hidden = filtered.length !== 0;
  document.querySelector('table').hidden = filtered.length === 0;
  lockControls(busy);
}

async function runOperation(operation) {
  if (busy || !ready) return;
  lockControls(true);
  try {
    const message = await operation();
    records = await getAbsences();
    render();
    status.textContent = message;
  } catch (error) {
    status.textContent = `Nicht gespeichert: ${error.message || 'Lokaler Speicher nicht verfuegbar.'}`;
  } finally {
    lockControls(false);
  }
}

startInput.value = dateKey(new Date());
endInput.value = startInput.value;
startInput.addEventListener('change', () => {
  if (endInput.value < startInput.value) endInput.value = startInput.value;
});
form.addEventListener('submit', event => {
  event.preventDefault();
  runOperation(async () => {
    const start = parseDate(startInput.value);
    const end = parseDate(endInput.value);
    if (end < start) throw new Error('Das Enddatum liegt vor dem Startdatum.');
    if (end - start > 366 * 86400000) throw new Error('Bitte maximal ein Jahr auf einmal eintragen.');
    const additions = [];
    const cursor = new Date(start);
    while (cursor <= end) {
      additions.push({ date: dateKey(cursor), note: noteInput.value.trim() || 'Abwesenheit' });
      cursor.setDate(cursor.getDate() + 1);
    }
    await saveAbsences(additions);
    return `${additions.length} ${additions.length === 1 ? 'Tag gespeichert' : 'Tage gespeichert'}.`;
  });
});
document.querySelector('#date-filter').addEventListener('change', render);
const fileInput = document.querySelector('#csv-file');
document.querySelector('#import-button').addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', () => {
  const file = fileInput.files[0];
  if (!file) return;
  runOperation(async () => {
    if (file.size > 1024 * 1024) throw new Error('Die CSV-Datei darf maximal 1 MB gross sein.');
    const dates = parseCsv(await file.text());
    const existing = new Set(records.map(record => record.date));
    await saveAbsences(dates.filter(date => !existing.has(date)).map(date => ({ date, note: 'Abwesenheit' })));
    fileInput.value = '';
    return `${dates.length} Tage importiert; vorhandene Eintraege bleiben erhalten.`;
  });
});
document.querySelector('#export-button').addEventListener('click', () => {
  const lines = records.map(record => record.date.split('-').reverse().join('.'));
  const url = URL.createObjectURL(new Blob([`# Abwesenheiten: Tag.Monat.Jahr\n${lines.join('\n')}\n`], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'abwesend.csv';
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  status.textContent = 'CSV mit allen gespeicherten Tagen exportiert.';
});

try {
  await initializeDatabase();
  records = await getAbsences();
  ready = true;
  render();
  status.textContent = '';
} catch {
  status.textContent = 'Lokale Daten konnten nicht geladen werden. Bitte den Browserspeicher freigeben und die Seite neu laden.';
}