import { Signal, signal } from '@preact/signals';

export enum SettingName {
    ForeColor = 'fore_color',
    FillColor = 'fill_color',
    BackColor = 'back_color',
    LineWidth = 'line_width',
    Filled = 'filled',
    HeartSouth = 'heart_south',  // 'smooth' | 'straight'
    BezierClosed = 'bezier_closed',   // boolean: multi-section closed spline mode
    BezierManualCP = 'bezier_manual_cp', // boolean: click+drag sets tangent handles
    EraserMode = 'eraser_mode',          // 'backcolor' | 'hole'
}
type GenericSettingName = SettingName | string
class SettingsRegistry {
    private store = new Map<GenericSettingName | string, Signal<any>>();

    get<T = any>(key: GenericSettingName): Signal<T> {
        if (!this.store.has(key)) {
            this.store.set(key, signal<T>(undefined as any));
        }
        return this.store.get(key)!;
    }

    set<T = any>(key: GenericSettingName, value: T): void {
        this.get<T>(key).value = value;
    }

    peek<T = any>(key: GenericSettingName): T {
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
}


export const settings = new SettingsRegistry();
