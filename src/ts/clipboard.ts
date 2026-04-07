/** In-memory clipboard for the selection tool. Holds the last copied/cut ImageData and its source rect. */
export const clipboard: { data: ImageData | null; rect: { x: number; y: number } | null } = { data: null, rect: null };
