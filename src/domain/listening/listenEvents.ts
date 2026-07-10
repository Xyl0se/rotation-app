/**
 * Listening History
 *
 * Hör-Sessions als eigenständige Ereignisse modelliert.
 * Nicht direkt ins Album eingebettet, sondern als globale Event-Log
 * in lokalem Speicher gehalten.
 *
 * Die Felder listenCount und lastListened am Album bleiben als
 * gespiegelte Ableitungen erhalten — damit bestehende Komponenten
 * und Domain-Logik weiter funktionieren.
 */

export interface ListenEvent {

    id: string

    albumId: string

    listenedAt: string

}
