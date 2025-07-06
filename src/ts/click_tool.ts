import { EditingTool } from "./editing_tool"
import { Editor } from "./editor";
import { Vector2, unit_rect } from "./types";

export abstract class ClickTool extends EditingTool {

    select() {
    }
    drag(at: Vector2) {
    }
    start(at: Vector2, buttons: number) {
        //this.context.clearRect(0,0,this.w,this.h);

        this.editing_start(at, buttons);


        //this.editor.undo_redo_buffer.push(this.app.document_context.getImageData(0,0,this.w,this.h))


    }
    abstract editing_start(at: Vector2, buttons: number): void;


}
