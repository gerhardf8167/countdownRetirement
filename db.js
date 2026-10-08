import { initialDates } from './seed-data.js';
import { parseDate } from './countdown.js';

let databasePromise;

function openDatabase() {
  if (!databasePromise) {
    databasePromise = new Promise((resolve, reject) => {
      const request = indexedDB.open('index.db', 1);
      request.onupgradeneeded = () => {
        request.result.createObjectStore('absences', { keyPath: 'date' });
        request.result.createObjectStore('metadata');
      };
      request.onsuccess = () => {
        request.result.onversionchange = () => request.result.close();
        resolve(request.result);
      };
      request.onerror = () => reject(request.error);
      request.onblocked = () => reject(new Error('Bitte andere Fenster dieser App schliessen.'));
    });
  }
  return databasePromise;
}

function transactionDone(transaction) {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error || new Error('Speichern abgebrochen.'));
  });
}

export async function initializeDatabase() {
  const database = await openDatabase();
  const transaction = database.transaction(['absences', 'metadata'], 'readwrite');
  const done = transactionDone(transaction);
  const metadata = transaction.objectStore('metadata');
  const request = metadata.get('initialized');
  request.onsuccess = () => {
    if (request.result) return;
    const absences = transaction.objectStore('absences');
    for (const date of initialDates) absences.put({ date, note: 'Abwesenheit' });
    metadata.put(true, 'initialized');
  };
  await done;
}

export async function getAbsences() {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const request = database.transaction('absences').objectStore('absences').getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveAbsences(records) {
  for (const record of records) parseDate(record.date);
  const database = await openDatabase();
  const transaction = database.transaction('absences', 'readwrite');
  const done = transactionDone(transaction);
  const store = transaction.objectStore('absences');
  for (const record of records) store.put({ date: record.date, note: record.note || 'Abwesenheit' });
  await done;
}

export async function deleteAbsence(date) {
  const database = await openDatabase();
  const transaction = database.transaction('absences', 'readwrite');
  const done = transactionDone(transaction);
  transaction.objectStore('absences').delete(date);
  await done;
}