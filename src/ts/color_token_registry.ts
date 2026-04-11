import { Signal, signal } from '@preact/signals';
import { RGBA } from './pixel_utils';

export const MAX_TOKENS = 8;

export interface ColorToken {
    index: number;
    canvas: HTMLCanvasElement;
    context: CanvasRenderingContext2D;
    color: Signal<RGBA>;
    dirty: Signal<number>;
}

const DEFAULT_COLORS: RGBA[] = [
    [220, 50,  50,  255],
    [50,  120, 220, 255],
    [50,  180, 70,  255],
    [220, 180, 50,  255],
    [180, 50,  220, 255],
    [50,  200, 200, 255],
    [220, 120, 50,  255],
    [100, 100, 100, 255],
];

function make_token(index: number, width: number, height: number): ColorToken {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d', { willReadFrequently: true }) as CanvasRenderingContext2D;
    context.imageSmoothingEnabled = false;
    return {
        index,
        canvas,
        context,
        color: signal<RGBA>([...DEFAULT_COLORS[index]] as RGBA),
        dirty: signal<number>(0),
    };
}

export class ColorTokenRegistry {
    tokens: ColorToken[] = [];
    active_index: Signal<number | null> = signal<number | null>(null);

    constructor(width: number = 1, height: number = 1) {
        for (let i = 0; i < MAX_TOKENS; i++) {
            this.tokens.push(make_token(i, width, height));
        }
    }

    select(index: number): void {
        this.active_index.value = this.active_index.value === index ? null : index;
    }

    deselect(): void {
        this.active_index.value = null;
    }

    resize_all(new_w: number, new_h: number, offset_x: number = 0, offset_y: number = 0): void {
        for (const token of this.tokens) {
            const img = token.context.getImageData(0, 0, token.canvas.width, token.canvas.height);
            token.canvas.width = new_w;
            token.canvas.height = new_h;
            token.context.imageSmoothingEnabled = false;
            token.context.putImageData(img, offset_x, offset_y);
        }
    }
}

export const color_token_registry = new ColorTokenRegistry();
