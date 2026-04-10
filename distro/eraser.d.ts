import { ScribbleTool } from "./scribble";
import { RGBA } from "./pixel_utils";
export declare class EraserTool extends ScribbleTool {
    constructor();
    editing_start(): void;
    commit_to_document(_color?: string | null): void;
    hover_color(): RGBA;
}
//# sourceMappingURL=eraser.d.ts.map