/**
 * Callback-based undo/redo history.  Each entry is an UndoableAction with
 * undo() and redo() methods, so pixel patches and layer-level operations can
 * coexist in a single timeline.
 */
export interface UndoableAction {
    undo(): void;
    redo(): void;
}
export declare class ActionHistory {
    private _stack;
    private _index;
    push(action: UndoableAction): void;
    undo(): boolean;
    redo(): boolean;
    clear(): void;
}
//# sourceMappingURL=action_history.d.ts.map