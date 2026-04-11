import { Signal } from '@preact/signals';
import { RGBA } from './pixel_utils';
export declare const MAX_TOKENS = 8;
export interface ColorToken {
    index: number;
    canvas: HTMLCanvasElement;
    context: CanvasRenderingContext2D;
    color: Signal<RGBA>;
    dirty: Signal<number>;
}
export declare class ColorTokenRegistry {
    tokens: ColorToken[];
    active_index: Signal<number | null>;
    constructor(width?: number, height?: number);
    select(index: number): void;
    deselect(): void;
    resize_all(new_w: number, new_h: number, offset_x?: number, offset_y?: number): void;
}
export declare const color_token_registry: ColorTokenRegistry;
//# sourceMappingURL=color_token_registry.d.ts.map