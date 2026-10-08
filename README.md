# Countdown PWA

Statische, deutschsprachige Progressive Webapp der Python-Anwendung. Keine API,
kein Backend, keine externen Schriften, CDNs oder Analysedienste.

## Starten

Node.js ab Version 20 verwenden. Im Ordner countdown_PWA:

```powershell
npm start
```

Danach http://localhost:4173 oeffnen. Der mitgelieferte Server liefert nur
statische Dateien; Abwesenheiten werden niemals an ihn uebertragen.
Alternativ den Ordner auf einem beliebigen statischen HTTPS-Webserver bereitstellen.
Direktes Oeffnen per file:// unterstuetzt keine installierbare Offline-PWA.
Bei belegtem Port in PowerShell `$env:PORT = '4174'` vor `npm start` setzen.

## Daten und Berechnung

- Ziel: 31.12.2026, Arbeitszeit: 08:30 bis 16:30 in der lokalen Zeitzone.
- Arbeitstage: Montag bis Freitag, ohne eingetragene Abwesenheiten.
- Heute wird nicht als voller Arbeitstag gezaehlt; seine Restarbeitszeit wird separat angezeigt.
- Feiertage werden nur durch explizite Abwesenheiten beruecksichtigt.
- Die 17 Daten aus der vorhandenen abwesend.csv sind in seed-data.js uebernommen.
  Sie werden pro Browserspeicher genau einmal angelegt, auch nach dem Loeschen
  einzelner oder aller Eintraege nicht erneut.
- Die Seite Abwesenheiten speichert einzelne Tage oder Zeitraeume und erlaubt
  Bearbeiten, Entfernen, CSV-Import und CSV-Export. Erneutes Speichern eines
  vorhandenen Datums aktualisiert dessen Bezeichnung. Ein geaendertes Datum
  wird als neuer Eintrag angelegt; den alten Eintrag gegebenenfalls entfernen.
- CSV-Import ergaenzt Tage ohne bestehende Bezeichnungen zu ueberschreiben.
  Format wie bisher: ein Datum pro Zeile (Tag.Monat.Jahr), Kommentare mit #.
  Der CSV-Export sichert die Daten, nicht die optionalen Bezeichnungen.

## Lokale Speicherung

Die IndexedDB-Datenbank heisst **index.db**. Dies ist eine Browserdatenbank,
keine sichtbare SQLite-Datei im Projektordner. Daten bleiben im jeweiligen
Browserprofil und sind an die Adresse einschliesslich Port gebunden.
Ein anderer Browser, Port oder Rechner hat einen eigenen Datenbestand.
Das Loeschen von Website-Daten oder die Nutzung privater Fenster kann Daten
entfernen. Regelmaessig per CSV exportieren. Die Python-Datei und ihre CSV
werden von der PWA nicht veraendert.

## Installation und Offline-Nutzung

Nach dem ersten vollstaendigen Laden speichert der Service Worker beide Seiten
und alle benoetigten Ressourcen. Danach funktioniert die App ohne Verbindung.
In Edge/Chrome ueber Installieren oder das Browsermenue installieren;
auf iOS ueber Teilen > Zum Home-Bildschirm. Installation setzt localhost oder
HTTPS voraus. Fuer andere Geraete reicht eine unverschluesselte LAN-Adresse nicht.
Bei Aenderungen an App-Dateien die Cache-Version in sw.js erhoehen.

## Tests

```powershell
npm test
```