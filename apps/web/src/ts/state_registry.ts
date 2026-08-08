import { signal, Signal } from '@preact/signals-core';
export enum StateValue {
    SelectedToolName,
}
type Entry<T> = {
    current: Signal<T>;
    previous: T | undefined;
};

const state_store = new Map<StateValue, Entry<any>>();
class StateRegistry {
    state_store: Map<StateValue, Entry<any>>;

    constructor() {
        this.state_store = new Map<StateValue, Entry<any>>();
    }
    use_signal<T>(key: StateValue, initial: T): Signal<T> {
        if (!state_store.has(key)) {
            state_store.set(key, {
                current: signal(initial),
                previous: undefined,
            });
        }
        return state_store.get(key)!.current;
    }

    set<T>(key: StateValue, value: T): void {
        let entry = state_store.get(key);
        if (!entry) {
            entry = {
                current: signal(value),
                previous: undefined,
            };
            state_store.set(key, entry);
        } else {

            entry.previous = entry.current.value;

            entry.current.value = value;
        }
    }

    peek<T>(key: StateValue): T | undefined {
        return state_store.get(key)?.current.value;
    }

    pop<T>(key: StateValue): T | undefined {
        const entry = state_store.get(key);
        if (!entry || entry.previous === undefined) {
            return undefined;
        }

        const prev = entry.previous;
        entry.current.value = prev;
        entry.previous = undefined;
        return prev;
    }
}

export const state_registry = new StateRegistry();