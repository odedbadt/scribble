import {UndoRedoBuffer} from "../distro/undo_redo_buffer.js"

function assert(val, msg) {
    if (val) return;
    throw `Assertion failed: ${msg}`
}

// Helper: create a minimal UndoPatch-like object using plain objects instead of ImageData
function mkPatch(before, after) {
    return { x: 0, y: 0, before, after };
}

function test_undo_single() {
    const urb = new UndoRedoBuffer();
    urb.push(mkPatch('blank', 'stroke1'));
    const v = urb.undo();
    assert(v !== null, 'undo should return action');
    assert(v.data === 'blank', `undo data should be 'blank', got '${v?.data}'`);
    const v2 = urb.undo();
    assert(v2 === null, 'undo past beginning should return null');
}

function test_undo_redo_sequence() {
    const urb = new UndoRedoBuffer();
    urb.push(mkPatch('blank', 'a'));
    urb.push(mkPatch('a', 'b'));

    let v = urb.undo();
    assert(v?.data === 'a', `undo#1 should give 'a', got '${v?.data}'`);

    v = urb.undo();
    assert(v?.data === 'blank', `undo#2 should give 'blank', got '${v?.data}'`);

    v = urb.undo();
    assert(v === null, `undo at start should give null, got '${v}'`);

    v = urb.redo();
    assert(v?.data === 'a', `redo#1 should give 'a', got '${v?.data}'`);

    v = urb.redo();
    assert(v?.data === 'b', `redo#2 should give 'b', got '${v?.data}'`);

    v = urb.redo();
    assert(v === null, `redo at end should give null, got '${v}'`);
}

function test_push_truncates_redo() {
    const urb = new UndoRedoBuffer();
    urb.push(mkPatch('blank', 'a'));
    urb.push(mkPatch('a', 'b'));

    urb.undo(); // back to 'a'
    urb.push(mkPatch('a', 'c')); // branch: redo history ('b') is discarded

    const v = urb.redo();
    assert(v === null, `redo after new push should return null (redo history truncated), got '${v?.data}'`);

    const u = urb.undo();
    assert(u?.data === 'a', `undo after branch push should give 'a', got '${u?.data}'`);
}

test_undo_single();
test_undo_redo_sequence();
test_push_truncates_redo();
console.log('All tests passed.');
