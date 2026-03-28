/*
 * Stores before/after ImageData patches for a dirty rect instead of full
 * canvas snapshots.  Each entry covers only the bounding box that changed,
 * so a thin pencil stroke on a large canvas uses kilobytes instead of megabytes.
 *
 * Stack layout (next_index points at the next free slot):
 *
 *   [patch0, patch1, patch2, ...]
 *          ^
 *     next_index = 2  →  current state = patch1.after has been applied
 *
 *   undo():  apply patch[next_index-1].before, next_index--
 *   redo():  apply patch[next_index].after,    next_index++
 *   push():  write to stack[next_index], next_index++, truncate redo history
 */

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

export class UndoRedoBuffer {
    private stack: UndoPatch[];
    private next_index: number;
    private high_water_mark: number;

    constructor() {
        this.stack = [];
        this.next_index = 0;
        this.high_water_mark = 0;
    }

    undo(): UndoAction | null {
        if (this.next_index <= 0) return null;
        this.next_index--;
        const patch = this.stack[this.next_index];
        return { x: patch.x, y: patch.y, data: patch.before };
    }

    redo(): UndoAction | null {
        if (this.next_index >= this.high_water_mark) return null;
        const patch = this.stack[this.next_index];
        this.next_index++;
        return { x: patch.x, y: patch.y, data: patch.after };
    }

    push(patch: UndoPatch) {
        this.stack[this.next_index] = patch;
        this.next_index++;
        // Truncate any redo history that branched off from this point
        this.high_water_mark = this.next_index;
    }
}