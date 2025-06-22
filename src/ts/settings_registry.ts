import { Signal, signal } from '@preact/signals';

class SettingsRegistry {
    private store = new Map<string, Signal<any>>();

    get<T = any>(key: string): Signal<T> {
        if (!this.store.has(key)) {
            this.store.set(key, signal<T>(undefined as any));
        }
        return this.store.get(key)!;
    }

    set<T = any>(key: string, value: T): void {
        this.get<T>(key).value = value;
    }

    peek<T = any>(key: string): T {
        return this.get<T>(key).value;
    }

    bulkSet(obj: Record<string, any>, prefix: string = ''): void {
        for (const [key, value] of Object.entries(obj)) {
            const fullKey = prefix ? `${prefix}.${key}` : key;

            if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
                this.bulkSet(value, fullKey);
            } else {
                this.set(fullKey, value);
            }
        }
    }

    sub(prefix: string): SettingsRegistry {
        return {
            get: <T>(key: string) => this.get<T>(`${prefix}.${key}`),
            set: <T>(key: string, value: T) => this.set<T>(`${prefix}.${key}`, value),
            peek: <T>(key: string) => this.peek<T>(`${prefix}.${key}`),
            bulkSet: (obj: Record<string, any>) => {
                const prefixed: Record<string, any> = {};
                for (const [k, v] of Object.entries(obj)) {
                    prefixed[`${prefix}.${k}`] = v;
                }
                this.bulkSet(prefixed);
            },
            sub: (nestedPrefix: string) => this.sub(`${prefix}.${nestedPrefix}`),
        } as SettingsRegistry;
    }
}


export const settings = new SettingsRegistry();
