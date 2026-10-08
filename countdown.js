export const TARGET_DATE = '2026-12-31';

export function dateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function parseDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error('Ungueltiges Datum.');
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  if (dateKey(date) !== value) throw new Error('Ungueltiges Datum.');
  return date;
}

export function parseCsv(text) {
  const dates = new Set();
  for (const [index, line] of text.split(/\r?\n/).entries()) {
    const value = line.trim();
    if (!value || value.startsWith('#')) continue;
    const match = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(value);
    if (!match) throw new Error(`Ungueltiges Datum in Zeile ${index + 1}.`);
    const key = `${match[3]}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}`;
    try {
      parseDate(key);
    } catch {
      throw new Error(`Ungueltiges Datum in Zeile ${index + 1}.`);
    }
    dates.add(key);
  }
  return [...dates].sort();
}

export function calculateCountdown(now, absentDates, target = TARGET_DATE) {
  const targetDate = parseDate(target);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const absence = new Set(absentDates);
  const isWorkday = date => date.getDay() !== 0 && date.getDay() !== 6 && !absence.has(dateKey(date));
  const utcDay = date => Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  const calendarDays = Math.max(0, Math.round((utcDay(targetDate) - utcDay(today)) / 86400000));
  let workdays = 0;
  const cursor = new Date(today);
  cursor.setDate(cursor.getDate() + 1);
  while (cursor <= targetDate) {
    if (isWorkday(cursor)) workdays += 1;
    cursor.setDate(cursor.getDate() + 1);
  }
  let secondsToday = 0;
  if (today <= targetDate && isWorkday(today)) {
    const start = new Date(today);
    const end = new Date(today);
    start.setHours(8, 30, 0, 0);
    end.setHours(16, 30, 0, 0);
    secondsToday = Math.max(0, Math.floor((end - Math.max(now.getTime(), start.getTime())) / 1000));
  }
  return { calendarDays, workdays, secondsToday, finished: today > targetDate };
}