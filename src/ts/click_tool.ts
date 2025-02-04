import { EditingTool } from "./editing_tool"
import { Editor } from "./editor";
import { Vector2, unit_rect } from "./types";

export abstract class ClickTool extends EditingTool {
    constructor(editor:Editor) {
            super(editor);
            this.start = this.start.bind(this);
        }
    select() {
    }
    start(at:Vector2, buttons:number):boolean {
        this.context.clearRect(0,0,this.w,this.h);
        this.editor.art_to_staging()
        this.editing_start(at, buttons);
        this.editor.staging_to_view()
        this.editor.staging_to_art()
        this.editor.undo_redo_buffer.push(this.app.document_context.getImageData(0,0,this.w,this.h))
        this.editor.art_to_staging()
        this.editor.staging_to_view()
        return true;
    }
    abstract editing_start(at:Vector2, buttons:number):boolean

}
