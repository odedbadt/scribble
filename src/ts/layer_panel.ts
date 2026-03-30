import { LayerStack, Layer } from "./layer_stack";
import { UndoableAction } from "./action_history";
import { Editor } from "./editor";

export class LayerPanel {
    private _container: HTMLElement;
    private _list: HTMLElement;
    private _editor: Editor;
    private _layer_stack: LayerStack;
    private _drag_from_index: number = -1;
    private _drag_placeholder: HTMLElement | null = null;
    private _drag_item: HTMLElement | null = null;
    private _drag_start_y: number = 0;
    private _open = false;

    constructor(editor: Editor, container: HTMLElement) {
        this._editor = editor;
        this._layer_stack = editor.layer_stack;
        this._container = container;
        this._list = container.querySelector('#layer-list')!;

        container.querySelector('#add-layer-btn')!.addEventListener('click', () => {
            this._layer_stack.add_layer();
            // Adding a new blank layer is its own undo action
            const index_added = this._layer_stack.layers.peek().length - 1;
            const ls = this._layer_stack;
            const editor = this._editor;
            editor.push_layer_action({
                undo() {
                    ls.delete_layer(index_added);
                    editor['_mark_dirty']();
                },
                redo() {
                    // layer was already created; this is called on redo after undo
                    // We can't re-add the exact same layer object after deletion, so
                    // just add a fresh one. For redo, this is acceptable.
                    ls.add_layer();
                    editor['_mark_dirty']();
                },
            } satisfies UndoableAction);
            editor['_mark_dirty']();
        });

        // Reactively rebuild the list whenever layers or active index change
        this._layer_stack.layers.subscribe(() => this._rebuild());
        this._layer_stack.active_index.subscribe(() => this._rebuild());
    }

    toggle(): void {
        this._open = !this._open;
        this._container.classList.toggle('open', this._open);
    }

    open(): void {
        this._open = true;
        this._container.classList.add('open');
    }

    close(): void {
        this._open = false;
        this._container.classList.remove('open');
    }

    private _rebuild(): void {
        const layers = this._layer_stack.layers.peek();
        const active_idx = this._layer_stack.active_index.peek();

        // Remove existing items
        this._list.innerHTML = '';

        // Display in reverse so the visually-topmost layer (highest index) is at the top of the panel
        for (let idx = layers.length - 1; idx >= 0; idx--) {
            const item = this._make_item(layers[idx], idx, active_idx === idx);
            this._list.appendChild(item);
        }
    }

    private _make_item(layer: Layer, index: number, is_active: boolean): HTMLElement {
        const item = document.createElement('div');
        item.className = 'layer-item' + (is_active ? ' active' : '');
        item.dataset.index = String(index);

        // Drag handle
        const drag_handle = document.createElement('span');
        drag_handle.className = 'layer-drag-handle';
        drag_handle.textContent = '⣿';
        drag_handle.addEventListener('pointerdown', (e) => this._on_drag_start(e, index));

        // Visibility toggle
        const eye = document.createElement('button');
        eye.className = 'layer-eye' + (layer.visible ? '' : ' hidden');
        eye.textContent = layer.visible ? '👁' : '🚫';
        eye.title = layer.visible ? 'Hide layer' : 'Show layer';
        eye.addEventListener('click', (e) => {
            e.stopPropagation();
            this._toggle_visibility(index);
        });

        // Name — double-click to rename; dir=auto handles RTL (Hebrew etc.)
        const name_input = document.createElement('input');
        name_input.className = 'layer-name';
        name_input.type = 'text';
        name_input.value = layer.name;
        name_input.readOnly = true;
        name_input.dir = 'auto';
        name_input.title = 'Double-click to rename';
        name_input.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            name_input.readOnly = false;
            name_input.classList.add('editing');
            name_input.select();
        });
        const commit_rename = () => {
            const new_name = name_input.value.trim() || layer.name;
            name_input.value = new_name;
            name_input.readOnly = true;
            name_input.classList.remove('editing');
            if (new_name === layer.name) return;
            const old_name = layer.name;
            const ls = this._layer_stack;
            const editor = this._editor;
            // Update the layer name on the object directly (no signal re-render needed)
            const layers = ls.layers.peek();
            layers[index] = { ...layers[index], name: new_name };
            ls.layers.value = layers.slice(); // trigger signal for panel rebuild
            editor.push_layer_action({
                undo() {
                    const ll = ls.layers.peek().slice();
                    ll[index] = { ...ll[index], name: old_name };
                    ls.layers.value = ll;
                },
                redo() {
                    const ll = ls.layers.peek().slice();
                    ll[index] = { ...ll[index], name: new_name };
                    ls.layers.value = ll;
                },
            } satisfies UndoableAction);
        };
        name_input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') { e.preventDefault(); name_input.blur(); }
            if (e.key === 'Escape') {
                name_input.value = layer.name;
                name_input.readOnly = true;
                name_input.classList.remove('editing');
            }
            e.stopPropagation(); // prevent editor keyboard shortcuts while typing
        });
        name_input.addEventListener('blur', commit_rename);
        // Prevent item click from activating layer while editing
        name_input.addEventListener('click', (e) => { if (!name_input.readOnly) e.stopPropagation(); });

        // Delete button
        const del_btn = document.createElement('button');
        del_btn.className = 'layer-delete';
        del_btn.textContent = '✕';
        del_btn.title = 'Delete layer';
        const can_delete = this._layer_stack.layers.peek().length > 1;
        if (!can_delete) del_btn.classList.add('disabled');
        del_btn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (!can_delete) return;
            this._delete_layer(index);
        });

        item.appendChild(drag_handle);
        item.appendChild(eye);
        item.appendChild(name_input);
        item.appendChild(del_btn);

        // Click item body to set active layer
        item.addEventListener('click', () => {
            this._layer_stack.set_active(index);
        });

        return item;
    }

    private _toggle_visibility(index: number): void {
        const was_visible = this._layer_stack.layers.peek()[index].visible;
        this._layer_stack.set_visible(index, !was_visible);
        this._editor['_mark_dirty']();
    }

    private _delete_layer(index: number): void {
        const snapshot = this._layer_stack.delete_layer(index);
        if (!snapshot) return;
        const { layer, index: snap_index } = snapshot;
        const ls = this._layer_stack;
        const editor = this._editor;
        editor.push_layer_action({
            undo() {
                ls.restore_layer(layer, snap_index);
                editor['_mark_dirty']();
            },
            redo() {
                ls.delete_layer(snap_index);
                editor['_mark_dirty']();
            },
        } satisfies UndoableAction);
        this._editor['_mark_dirty']();
    }

    // ── Drag to reorder ──────────────────────────────────────────────────────

    private _on_drag_start(e: PointerEvent, index: number): void {
        e.preventDefault();
        e.stopPropagation();
        this._drag_from_index = index;
        this._drag_start_y = e.clientY;

        // Panel is displayed in reverse: actual index `i` is at panel position `n-1-i`
        const n = this._layer_stack.layers.peek().length;
        const panel_pos = n - 1 - index;
        const source_item = this._list.children[panel_pos] as HTMLElement;
        this._drag_item = source_item;
        source_item.classList.add('dragging');

        const placeholder = document.createElement('div');
        placeholder.className = 'layer-drag-placeholder';
        placeholder.style.height = source_item.offsetHeight + 'px';
        this._drag_placeholder = placeholder;

        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        (e.target as HTMLElement).addEventListener('pointermove', this._on_drag_move);
        (e.target as HTMLElement).addEventListener('pointerup', this._on_drag_end);
        (e.target as HTMLElement).addEventListener('pointercancel', this._on_drag_end);
    }

    private _on_drag_move = (e: PointerEvent): void => {
        if (this._drag_from_index < 0 || !this._drag_item) return;
        const dy = e.clientY - this._drag_start_y;
        this._drag_item.style.transform = `translateY(${dy}px)`;

        // Determine target index based on pointer position in list
        const list_rect = this._list.getBoundingClientRect();
        const relative_y = e.clientY - list_rect.top;
        const item_h = this._drag_item.offsetHeight;
        const n = this._layer_stack.layers.peek().length;
        const panel_pos = Math.max(0, Math.min(n - 1, Math.floor(relative_y / item_h)));
        // Panel is reversed: panel position 0 = actual index n-1
        const to_index = n - 1 - panel_pos;

        // Show placeholder at target panel position
        if (this._drag_placeholder && this._drag_placeholder.dataset.at !== String(to_index)) {
            this._drag_placeholder.dataset.at = String(to_index);
            if (this._drag_placeholder.parentNode === this._list) {
                this._list.removeChild(this._drag_placeholder);
            }
            const ref = this._list.children[panel_pos] as HTMLElement;
            if (ref && ref !== this._drag_item) {
                this._list.insertBefore(this._drag_placeholder, ref);
            } else if (!ref) {
                this._list.appendChild(this._drag_placeholder);
            }

            // Live canvas preview: reorder without mutating the layers signal
            const layers = this._layer_stack.layers.peek().slice();
            const [dragged] = layers.splice(this._drag_from_index, 1);
            layers.splice(to_index, 0, dragged);
            this._layer_stack.preview_order = layers;
            this._editor['_mark_dirty']();
        }
    };

    private _on_drag_end = (e: PointerEvent): void => {
        if (this._drag_from_index < 0) return;

        // Clean up visual state
        if (this._drag_item) {
            this._drag_item.style.transform = '';
            this._drag_item.classList.remove('dragging');
        }
        if (this._drag_placeholder?.parentNode === this._list) {
            this._list.removeChild(this._drag_placeholder);
        }

        // Clear the live preview before committing the real reorder
        this._layer_stack.preview_order = null;

        // Compute target actual index from pointer position (panel is reversed)
        const list_rect = this._list.getBoundingClientRect();
        const relative_y = e.clientY - list_rect.top;
        const item_h = this._drag_item?.offsetHeight ?? 18;
        const n = this._layer_stack.layers.peek().length;
        const panel_pos = Math.max(0, Math.min(n - 1, Math.floor(relative_y / item_h)));
        const to_index = n - 1 - panel_pos;

        const from_index = this._drag_from_index;
        this._drag_from_index = -1;
        this._drag_item = null;
        this._drag_placeholder = null;

        (e.target as HTMLElement).removeEventListener('pointermove', this._on_drag_move);
        (e.target as HTMLElement).removeEventListener('pointerup', this._on_drag_end);
        (e.target as HTMLElement).removeEventListener('pointercancel', this._on_drag_end);

        if (to_index === from_index) return;

        this._layer_stack.move_layer(from_index, to_index);
        const ls = this._layer_stack;
        const editor = this._editor;
        editor.push_layer_action({
            undo() { ls.move_layer(to_index, from_index); editor['_mark_dirty'](); },
            redo() { ls.move_layer(from_index, to_index); editor['_mark_dirty'](); },
        } satisfies UndoableAction);
        editor['_mark_dirty']();
    };
}
