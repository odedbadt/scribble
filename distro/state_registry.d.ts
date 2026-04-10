import { Signal } from '@preact/signals-core';
export declare enum StateValue {
    SelectedToolName = 0
}
type Entry<T> = {
    current: Signal<T>;
    previous: T | undefined;
};
declare class StateRegistry {
    state_store: Map<StateValue, Entry<any>>;
    constructor();
    use_signal<T>(key: StateValue, initial: T): Signal<T>;
    set<T>(key: StateValue, value: T): void;
    peek<T>(key: StateValue): T | undefined;
    pop<T>(key: StateValue): T | undefined;
}
export declare const state_registry: StateRegistry;
export {};
//# sourceMappingURL=state_registry.d.ts.map