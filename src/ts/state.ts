import { signal, Signal, ReadonlySignal } from '@preact/signals';
import { FillOutlineState } from './FillOutlineState';

export class State {
    readonly fore_color: Signal<string> = signal('rgba(255,0,0,255)');
    readonly fill_color: Signal<string> = signal('rgba(255,255,255,255)');
    readonly back_color: Signal<string> = signal('rgba(255,255,255,255)');
    readonly line_width: Signal<number> = signal(10);
    readonly fill_outline: Signal<FillOutlineState> = signal(FillOutlineState.Both);
    readonly heart_south: Signal<'smooth' | 'straight'> = signal('smooth');
    readonly bezier_closed: Signal<boolean> = signal(false);
    readonly bezier_manual_cp: Signal<boolean> = signal(false);
    readonly selected_tool_name: Signal<string> = signal('scribble');

    private _previous_tool_name: Signal<string | undefined> = signal(undefined);
    readonly previous_tool_name: ReadonlySignal<string | undefined> = this._previous_tool_name;

    constructor() {
        // Auto-track the value that selected_tool_name held just before its current
        // value, regardless of how the change was made (direct assignment or
        // factory wiring).
        let last: string | undefined = undefined;
        this.selected_tool_name.subscribe(v => {
            this._previous_tool_name.value = last;
            last = v;
        });
    }
}
