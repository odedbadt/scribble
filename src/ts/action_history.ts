/**
 * Callback-based undo/redo history.  Each entry is an UndoableAction with
 * undo() and redo() methods, so pixel patches and layer-level operations can
 * coexist in a single timeline.
 */
export interface UndoableAction {
    undo(): void;
    redo(): void;
}

export class ActionHistory {
    private _stack: UndoableAction[] = [];
    private _index = 0;

    push(action: UndoableAction): void {
        this._stack.length = this._index; // truncate redo branch
        this._stack[this._index] = action;
        this._index++;
    }

    undo(): boolean {
        if (this._index <= 0) return false;
        this._index--;
        this._stack[this._index].undo();
        return true;
    }

    redo(): boolean {
        if (this._index >= this._stack.length) return false;
        this._stack[this._index].redo();
        this._index++;
        return true;
    }

    clear(): void {
        this._stack = [];
        this._index = 0;
    }
}
