import { Signal } from '@preact/signals';
export declare enum SettingName {
    ForeColor = "fore_color",
    FillColor = "fill_color",
    BackColor = "back_color",
    LineWidth = "line_width",
    FillOutline = "fill_outline",// 0: both, 1: fill only, 2: outline only
    Filled = "filled",
    HeartSouth = "heart_south",// 'smooth' | 'straight'
    BezierClosed = "bezier_closed",// boolean: multi-section closed spline mode
    BezierManualCP = "bezier_manual_cp",// boolean: click+drag sets tangent handles
    EraserMode = "eraser_mode"
}
type GenericSettingName = SettingName | string;
declare class SettingsRegistry {
    private store;
    get<T = any>(key: GenericSettingName): Signal<T>;
    set<T = any>(key: GenericSettingName, value: T): void;
    peek<T = any>(key: GenericSettingName): T;
    bulkSet(obj: Record<string, any>, prefix?: string): void;
}
export declare const settings: SettingsRegistry;
export {};
//# sourceMappingURL=settings_registry.d.ts.map