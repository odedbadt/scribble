import { signal, Signal } from '@preact/signals-core';

type Entry<T> = {
    current: Signal<T>;
    previous: T | undefined;
};

const state_store = new Map<string, Entry<any>>();

export function useSignal<T>(key: string, initial: T): Signal<T> {
    if (!state_store.has(key)) {
        state_store.set(key, {
            current: signal(initial),
            previous: undefined,
        });
    }
    return state_store.get(key)!.current;
}

export function set<T>(key: string, value: T): void {
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

export function pop<T>(key: string): T | undefined {
    const entry = state_store.get(key);
    if (!entry || entry.previous === undefined) {
        return undefined;
    }

    const prev = entry.previous;
    entry.current.value = prev;
    entry.previous = undefined;
    return prev;
}
