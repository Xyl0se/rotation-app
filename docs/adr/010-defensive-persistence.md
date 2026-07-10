# ADR 010: Defensive Persistence — StorageQuotaError und Type Guards

## Kontext

Die Anwendung speichert alle Nutzerdaten im Browser-`localStorage`. Dies birgt zwei Risiken:

1. **Speicherplatz erschöpft:** `localStorage` hat ein hartes Limit (typisch 5–10 MB). Beim Überschreiten wirft der Browser `QuotaExceededError` (Chrome) bzw. `NS_ERROR_DOM_QUOTA_REACHED` (Firefox).
2. **Korrupte Daten:** Nutzer können den Speicher manuell manipulieren, oder Migrationen können fehlschlagen. Bisher führte invalider JSON direkt zu App-Crashes.

## Entscheidung

Wir führen zwei Verteidigungsmechanismen ein:

### 1. StorageQuotaError

Ein eigener Fehlertyp, der den betroffenen `key` mitführt:

```ts
class StorageQuotaError extends Error {
    key: string
}
```

Der `localStorageAdapter` fängt Quota-Fehler ab und wirft `StorageQuotaError` statt des rohen Browser-Fehlers. Nicht-Quota-Fehler werden durchgereicht.

### 2. Defensive Type Guards in Repositories

Jedes Repository validiert geladene Daten mit expliziten Type Guards statt blindem Casting:

- `albumRepository`: prüft `id`, `title`, `artist`, `year`, `category` auf Typ `string`, `roleHistory` auf Array-Struktur
- `rotationPlanRepository`: prüft `items[].albumId`, `albumIds[]`, `roleQuotas[].role`, `status`
- `listenEventRepository`: prüft `id`, `albumId`, `timestamp`, `type`

Ungültige Einträge werden **still ignoriert** (`warn`-only in der Konsole), statt die gesamte App zu crashen. Das Repository gibt den restlichen validen Datensatz zurück.

## Konsequenzen

**Positiv:**
- Die App startet auch mit korrupten Einträgen im `localStorage`.
- Speicherplatz-Fehler sind explizit erkennbar und können zukünftig in der UI behandelt werden.
- Tests können Quota-Fehler deterministisch simulieren (via Memory-Storage-Adapter).

**Negativ:**
- Mehr Boilerplate in den Repositories (Type Guards).
- Stilles Ignorieren kann Datenverlust verschleiern — daher `console.warn` bei jedem verworfenen Eintrag.
- `StorageQuotaError` wird aktuell noch nicht in der UI gefangen (technische Schuld).

## Alternativen

- **Schema-Validierung mit Zod:** Zu schwer für unseren aktuellen Bedarf; Type Guards sind explizit und ohne Runtime-Dependency.
- **Crash on invalid data:** Sicherer für Entwickler, aber schlechte Nutzererfahrung bei manueller Speichermanipulation.
