// FillOutlineState.ts
// Enum and helpers for fill/outline tristate toggle

export enum FillOutlineState {
    Both = 0, // filled + outline
    FillOnly = 1,
    OutlineOnly = 2,
}

export function nextFillOutlineState(current: FillOutlineState): FillOutlineState {
    return (current + 1) % 3;
}

export function fillOutlineClass(state: FillOutlineState): string {
    switch (state) {
        case FillOutlineState.Both:
            return 'tristate';
        case FillOutlineState.FillOnly:
            return 'filled';
        case FillOutlineState.OutlineOnly:
            return '';
        default:
            return '';
    }
}
