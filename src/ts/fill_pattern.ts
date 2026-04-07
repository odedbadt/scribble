import { signal } from "@preact/signals";

/** Global fill-pattern state. When enabled, fillable tools tile this ImageData
 *  as the fill color instead of using a flat solid color. */
export const fill_pattern = {
    enabled: signal(false),
    data: null as ImageData | null,
};
