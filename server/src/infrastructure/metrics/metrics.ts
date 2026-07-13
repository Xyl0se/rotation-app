export interface MetricSnapshot {
    name: string
    value: number
    unit: string
    labels?: Record<string, string>
    timestamp: string
}

export interface MetricsStore {
    record(name: string, value: number, unit: string, labels?: Record<string, string>): void
    get(name: string): MetricSnapshot | undefined
    getAll(): MetricSnapshot[]
    exportJson(): Record<string, unknown>
}

const store = new Map<string, MetricSnapshot>()

export function createMetricsStore(): MetricsStore {
    return {
        record(name: string, value: number, unit: string, labels?: Record<string, string>): void {
            store.set(name, {
                name,
                value,
                unit,
                labels,
                timestamp: new Date().toISOString(),
            })
        },

        get(name: string): MetricSnapshot | undefined {
            return store.get(name)
        },

        getAll(): MetricSnapshot[] {
            return Array.from(store.values())
        },

        exportJson(): Record<string, unknown> {
            const result: Record<string, unknown> = {}
            for (const [name, snapshot] of store.entries()) {
                result[name] = {
                    value: snapshot.value,
                    unit: snapshot.unit,
                    labels: snapshot.labels,
                    timestamp: snapshot.timestamp,
                }
            }
            return result
        },
    }
}

// Global singleton for the application
let globalStore: MetricsStore | null = null

export function getGlobalMetricsStore(): MetricsStore {
    if (!globalStore) {
        globalStore = createMetricsStore()
    }
    return globalStore
}

export function resetGlobalMetricsStore(): void {
    globalStore = null
    store.clear()
}
