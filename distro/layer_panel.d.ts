import { Editor } from "./editor";
export declare class LayerPanel {
    private _container;
    private _list;
    private _editor;
    private _layer_stack;
    private _drag_from_index;
    private _drag_placeholder;
    private _drag_item;
    private _drag_start_y;
    private _drag_item_start_top;
    private _open;
    constructor(editor: Editor, container: HTMLElement);
    toggle(): void;
    open(): void;
    close(): void;
    private _clear_pan;
    private _rebuild;
    private _make_item;
    private _toggle_visibility;
    private _toggle_lock;
    private _delete_layer;
    private _on_drag_start;
    private _on_drag_move;
    private _on_drag_end;
}
//# sourceMappingURL=layer_panel.d.ts.map