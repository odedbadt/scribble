"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.override_canvas_context = override_canvas_context;
function override_canvas_context(context_to, canvas_from, keep) {
    if (!keep) {
        context_to.clearRect(0, 0, canvas_from.width, canvas_from.height);
    }
    context_to.drawImage(canvas_from, 0, 0);
}
