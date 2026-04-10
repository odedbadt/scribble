export declare enum FillOutlineState {
    Both = 0,// filled + outline
    FillOnly = 1,
    OutlineOnly = 2
}
export declare function nextFillOutlineState(current: FillOutlineState): FillOutlineState;
export declare function fillOutlineClass(state: FillOutlineState): string;
//# sourceMappingURL=FillOutlineState.d.ts.map