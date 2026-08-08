import { EditingTool } from "./editing_tool";
import { SettingName, settings } from "./settings_registry";
import { state_registry, StateValue } from "./state_registry";
import { Vector2 } from "./types";

export class Dropper extends EditingTool {
    private _buttons: number = 0;

    private _pick(at: Vector2) {
        const result = this.layer_stack?.topmost_layer_at(at.x, at.y);
        if (!result) return; // fully transparent at this pixel
        const data = result.layer.context.getImageData(at.x, at.y, 1, 1).data;
        const color_string = `rgba(${data[0]},${data[1]},${data[2]},255)`;
        const settingName = (this._buttons & 4)
            ? SettingName.FillColor
            : (this._buttons & 1)
            ? SettingName.ForeColor
            : SettingName.BackColor;
        settings.set(settingName, color_string);
    }

    start(at: Vector2, buttons: number) {
        this._buttons = buttons;
        this._pick(at);
    }

    drag(at: Vector2) {
        this._pick(at);
    }

    hover(at: Vector2): boolean {
        return false;
    }

    select() {}

    stop(at: Vector2) {
        super.stop(at);
        state_registry.pop(StateValue.SelectedToolName);
    }
}
