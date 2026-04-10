export interface UndoPatch {
    x: number;
    y: number;
    before: ImageData;
    after: ImageData;
}
export interface UndoAction {
    x: number;
    y: number;
    data: ImageData;
}
export declare class UndoRedoBuffer {
    private stack;
    private next_index;
    private high_water_mark;
    constructor();
    undo(): UndoAction | null;
    redo(): UndoAction | null;
    push(patch: UndoPatch): void;
}
//# sourceMappingURL=undo_redo_buffer.d.ts.map