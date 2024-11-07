/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/ts/circle.ts":
/*!**************************!*\
  !*** ./src/ts/circle.ts ***!
  \**************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   CircleTool: () => (/* binding */ CircleTool)
/* harmony export */ });
/* harmony import */ var _click_and_drag_tool__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./click_and_drag_tool */ "./src/ts/click_and_drag_tool.ts");

class CircleTool extends _click_and_drag_tool__WEBPACK_IMPORTED_MODULE_0__.ClickAndDragTool {
    constructor(context, editor) {
        super(context, editor, false);
    }
    editing_action(at) {
        if (this.from == null) {
            return false;
        }
        const r = Math.sqrt((at.x - this.from.x) * (at.x - this.from.x) +
            (at.y - this.from.y) * (at.y - this.from.y));
        this.context.ellipse(this.from.x, this.from.y, r, r, 0, 0, Math.PI * 2);
        if (this.app.settings.filled) {
            this.context.fill();
        }
        else {
            this.context.stroke();
        }
        return true;
    }
}


/***/ }),

/***/ "./src/ts/clearall.ts":
/*!****************************!*\
  !*** ./src/ts/clearall.ts ***!
  \****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   ClearAllTool: () => (/* binding */ ClearAllTool)
/* harmony export */ });
/* harmony import */ var _on_select_tool__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./on_select_tool */ "./src/ts/on_select_tool.ts");

class ClearAllTool extends _on_select_tool__WEBPACK_IMPORTED_MODULE_0__.OnSelectTool {
    start(at, buttons) {
        throw new Error("Method not implemented.");
    }
    action(at) {
        throw new Error("Method not implemented.");
    }
    stop(at) {
        throw new Error("Method not implemented.");
    }
    constructor(context, editor) {
        super(context, editor);
        this.context = context;
        this.editor = editor;
        this.app = editor.app;
    }
    select_action() {
        const w = this.context.canvas.clientWidth;
        const h = this.context.canvas.clientHeight;
        this.context.fillStyle = this.app.settings.back_color;
        this.context.fillRect(0, 0, w, h);
    }
    hover() {
        return false;
    }
}


/***/ }),

/***/ "./src/ts/click_and_drag_tool.ts":
/*!***************************************!*\
  !*** ./src/ts/click_and_drag_tool.ts ***!
  \***************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   ClickAndDragTool: () => (/* binding */ ClickAndDragTool)
/* harmony export */ });
/* harmony import */ var _editing_tool__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./editing_tool */ "./src/ts/editing_tool.ts");

class ClickAndDragTool extends _editing_tool__WEBPACK_IMPORTED_MODULE_0__.EditingTool {
    constructor(context, editor, incremental, tmp_context) {
        super(context, editor, tmp_context);
        this.is_incremental = !!incremental;
        this.start = this.start.bind(this);
        this.action = this.action.bind(this);
        this.stop = this.stop.bind(this);
        this.dirty = false;
        this.from = null;
    }
    select() {
    }
    start(at, buttons) {
        this.context.clearRect(0, 0, this.w, this.h);
        this.context.fillStyle = this.app.settings.fore_color;
        this.context.strokeStyle = this.app.settings.fore_color;
        this.context.lineWidth = this.app.settings.line_width;
        this.context.lineCap = 'round';
        this.dirty = this.editing_start();
        this.from = at;
        return false;
    }
    editing_start() {
        // nop, implemenet me
        return false;
    }
    action(at) {
        this.editor.art_to_staging();
        this.editor.app.tool_context.beginPath();
        this.dirty = !!this.editing_action(at) || this.dirty;
        if (!this.is_incremental) {
            this.editor.staging_to_art();
        }
        this.editor.art_to_staging();
        this.editor.tool_to_staging();
        this.editor.staging_to_view();
        this.editor.tmp_tool_to_view();
        if (!this.is_incremental) {
            this.context.clearRect(0, 0, this.w, this.h);
        }
        return true;
    }
    hover(at) {
        if (!this.tmp_context) {
            return false;
        }
        this.tmp_context.clearRect(0, 0, this.w, this.h);
        const dirty = this.hover_action(at);
        if (dirty) {
            this.editor.tool_to_view();
            return true;
        }
        return false;
    }
    hover_action(at) {
        // nop
        return false;
    }
    editing_action(at) {
        throw new Error("Not fully implemented tool");
    }
    stop(at) {
        this.dirty = !!this.editing_stop(at) || this.dirty;
        if (this.dirty) {
            this.editor.staging_to_art();
            this.editor.undo_redo_buffer.push(this.app.art_context.getImageData(0, 0, this.w, this.h));
            this.from = null;
            this.editor.art_to_staging();
            this.editor.tool_to_staging();
            this.editor.staging_to_view();
            this.dirty = false;
            return true;
        }
        return false;
    }
    editing_stop(at) {
        // nop, implemenet me
        return false;
    }
}


/***/ }),

/***/ "./src/ts/click_tool.ts":
/*!******************************!*\
  !*** ./src/ts/click_tool.ts ***!
  \******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   ClickTool: () => (/* binding */ ClickTool)
/* harmony export */ });
/* harmony import */ var _editing_tool__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./editing_tool */ "./src/ts/editing_tool.ts");

class ClickTool extends _editing_tool__WEBPACK_IMPORTED_MODULE_0__.EditingTool {
    constructor(context, editor) {
        super(context, editor);
        this.start = this.start.bind(this);
    }
    select() {
    }
    start(at, buttons) {
        this.context.clearRect(0, 0, this.w, this.h);
        this.editor.art_to_staging();
        this.editing_start(at, buttons);
        this.editor.tool_to_staging();
        this.editor.staging_to_view();
        this.editor.staging_to_art();
        this.editor.undo_redo_buffer.push(this.app.art_context.getImageData(0, 0, this.w, this.h));
        this.editor.art_to_staging();
        this.editor.tool_to_staging();
        this.editor.staging_to_view();
        return true;
    }
}


/***/ }),

/***/ "./src/ts/color_stack.ts":
/*!*******************************!*\
  !*** ./src/ts/color_stack.ts ***!
  \*******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   ColorStack: () => (/* binding */ ColorStack)
/* harmony export */ });
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./utils */ "./src/ts/utils.ts");

class ColorStack {
    constructor(app, depth, pairwise_threshold, adjacent_threshold, color_selector_div_fore, color_selector_div_back, color_stack_items) {
        this._app = app;
        this._depth = depth;
        this._pairwise_threshold = pairwise_threshold;
        this._adjacent_threshold = adjacent_threshold;
        this._stack = new Array();
        this._color_stack_items = color_stack_items;
        this._color_selector_div_fore = color_selector_div_fore;
        this._color_selector_div_back = color_selector_div_back;
    }
    refresh_color_stack() {
        const slots = this._color_stack_items;
        const l = this._stack.length;
        const _this = this;
        for (let j = 0; j < slots.length; ++j) {
            const slot = slots[j];
            if (j < l) {
                const color = this._stack.at(l - 1 - j);
                if (color == undefined) {
                    continue;
                }
                const color_string = `rgba(${color[0]},${color[1]},${color[2]},255)`;
                slot.style.backgroundColor = color_string;
                slot.addEventListener('click', (event) => {
                    _this.select_color(color, event.button == 0, false);
                });
            }
        }
    }
    select_color(color, is_fore, update_stack) {
        if (update_stack) {
            if (this._stack.length == 0 ||
                (0,_utils__WEBPACK_IMPORTED_MODULE_0__.dist2_to_set)(color, this._stack) > this._pairwise_threshold &&
                    (0,_utils__WEBPACK_IMPORTED_MODULE_0__.dist2)(color, this._stack[this._stack.length - 1]) > this._adjacent_threshold) {
                this._stack.push(color);
                if (this._stack.length > this._depth) {
                    this._stack.shift();
                }
            }
            else if (this._stack.length > 0) {
                console.log(color, this._stack[this._stack.length - 1], (0,_utils__WEBPACK_IMPORTED_MODULE_0__.dist2)(color, this._stack[this._stack.length - 1]), (0,_utils__WEBPACK_IMPORTED_MODULE_0__.dist2_to_set)(color, this._stack));
            }
            this.refresh_color_stack();
        }
        const color_string = `rgba(${color[0]},${color[1]},${color[2]},255)`;
        if (is_fore) {
            this._app.settings.fore_color = color_string;
            this._app.view_context.strokeStyle = color_string;
            this._color_selector_div_fore.style.backgroundColor = color_string;
        }
        else {
            this._app.settings.back_color = color_string;
            this._color_selector_div_back.style.backgroundColor = color_string;
        }
    }
}


/***/ }),

/***/ "./src/ts/cursor_size.ts":
/*!*******************************!*\
  !*** ./src/ts/cursor_size.ts ***!
  \*******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   CursorSize: () => (/* binding */ CursorSize)
/* harmony export */ });
/* harmony import */ var _click_and_drag_tool__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./click_and_drag_tool */ "./src/ts/click_and_drag_tool.ts");

class CursorSize extends _click_and_drag_tool__WEBPACK_IMPORTED_MODULE_0__.ClickAndDragTool {
    constructor(context, editor, tmp_context) {
        super(context, editor, false, tmp_context);
    }
    editing_start() {
        if (!this.tmp_context) {
            return false;
        }
        this.tmp_context.fillStyle = this.app.settings.fore_color;
        this.tmp_context.strokeStyle = this.app.settings.fore_color;
        this.tmp_context.lineWidth = this.app.settings.line_width;
        this.tmp_context.lineCap = 'round';
        return false;
    }
    start(at, buttons) {
        this.app.settings.line_width = 1;
        super.start(at, buttons);
        return false;
    }
    editing_action(at) {
        if (this.from == null) {
            return false;
        }
        if (!this.tmp_context) {
            return false;
        }
        this.app.tool_tmp_context.clearRect(0, 0, this.w, this.h);
        this.editor.art_to_staging();
        this.editor.staging_to_view();
        const r = Math.sqrt((at.x - this.from.x) * (at.x - this.from.x) +
            (at.y - this.from.y) * (at.y - this.from.y));
        this.tmp_context.beginPath();
        this.tmp_context.ellipse(this.from.x, this.from.y, r, r, 0, 0, Math.PI * 2);
        this.tmp_context.fill();
        this.app.settings.line_width = 2 * r;
        this.editor.tmp_tool_to_view();
        return false;
    }
    hover(at) {
        return false;
    }
    editing_stop(at) {
        if (this.editor.previous_tool_name) {
            this.app.select_tool(this.editor.previous_tool_name);
        }
        return false;
    }
}


/***/ }),

/***/ "./src/ts/dropper.ts":
/*!***************************!*\
  !*** ./src/ts/dropper.ts ***!
  \***************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Dropper: () => (/* binding */ Dropper)
/* harmony export */ });
/* harmony import */ var _click_tool__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./click_tool */ "./src/ts/click_tool.ts");

class Dropper extends _click_tool__WEBPACK_IMPORTED_MODULE_0__.ClickTool {
    action(at) {
        throw new Error("Method not implemented.");
    }
    stop(at) {
        throw new Error("Method not implemented.");
    }
    constructor(context, editor) {
        super(context, editor);
    }
    editing_start(at, buttons) {
        const color = this.app.art_context.getImageData(at.x, at.y, 1, 1).data;
        const sampled_color = `rgba(${color[0]},${color[1]},${color[2]},255)`;
        this.app.color_stack.select_color(color, !!(buttons & 1), true);
        if (this.editor.previous_tool_name) {
            this.app.select_tool(this.editor.previous_tool_name);
        }
        return false;
    }
    hover(at) {
        return false;
    }
}


/***/ }),

/***/ "./src/ts/editing_tool.ts":
/*!********************************!*\
  !*** ./src/ts/editing_tool.ts ***!
  \********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   EditingTool: () => (/* binding */ EditingTool),
/* harmony export */   NopTool: () => (/* binding */ NopTool)
/* harmony export */ });
class EditingTool {
    constructor(context, editor, tmp_context) {
        this.context = context;
        this.editor = editor;
        this.w = context.canvas.clientWidth;
        this.h = context.canvas.clientHeight;
        this.app = editor.app;
        this.tmp_context = tmp_context;
    }
    select() {
        this.context.clearRect(0, 0, this.w, this.h);
    }
}
class NopTool extends EditingTool {
    constructor(context, editor, tmp_context) {
        super(context, editor, tmp_context);
    }
    select() {
        super.select();
    }
    start(at, buttons) {
        return false;
    }
    action(at) {
        return false;
    }
    stop(at) {
        return false;
    }
    hover(at) {
        return false;
    }
}


/***/ }),

/***/ "./src/ts/editor.ts":
/*!**************************!*\
  !*** ./src/ts/editor.ts ***!
  \**************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Editor: () => (/* binding */ Editor)
/* harmony export */ });
/* harmony import */ var _undo_redo_buffer__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./undo_redo_buffer */ "./src/ts/undo_redo_buffer.ts");
/* harmony import */ var _editing_tool__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./editing_tool */ "./src/ts/editing_tool.ts");
/* harmony import */ var _scribble__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./scribble */ "./src/ts/scribble.ts");
/* harmony import */ var _circle__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./circle */ "./src/ts/circle.ts");
/* harmony import */ var _clearall__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./clearall */ "./src/ts/clearall.ts");
/* harmony import */ var _dropper__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./dropper */ "./src/ts/dropper.ts");
/* harmony import */ var _eraser__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./eraser */ "./src/ts/eraser.ts");
/* harmony import */ var _floodfill__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./floodfill */ "./src/ts/floodfill.ts");
/* harmony import */ var _line__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ./line */ "./src/ts/line.ts");
/* harmony import */ var _rect__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ./rect */ "./src/ts/rect.ts");
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! ./utils */ "./src/ts/utils.ts");
/* harmony import */ var _cursor_size__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! ./cursor_size */ "./src/ts/cursor_size.ts");
/* harmony import */ var _styletogglers__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! ./styletogglers */ "./src/ts/styletogglers.ts");
/* harmony import */ var _mandala__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(/*! ./mandala */ "./src/ts/mandala.ts");














const v = _scribble__WEBPACK_IMPORTED_MODULE_2__.ScribbleTool;
const tool_classes = new Map([
    ["scribble", _scribble__WEBPACK_IMPORTED_MODULE_2__.ScribbleTool],
    ["rect", _rect__WEBPACK_IMPORTED_MODULE_9__.RectTool],
    ["line", _line__WEBPACK_IMPORTED_MODULE_8__.LineTool],
    ["circle", _circle__WEBPACK_IMPORTED_MODULE_3__.CircleTool],
    ["dropper", _dropper__WEBPACK_IMPORTED_MODULE_5__.Dropper],
    ["floodfill", _floodfill__WEBPACK_IMPORTED_MODULE_7__.Floodfill],
    ["eraser", _eraser__WEBPACK_IMPORTED_MODULE_6__.EraserTool],
    ["clearall", _clearall__WEBPACK_IMPORTED_MODULE_4__.ClearAllTool],
    ["cursor_size", _cursor_size__WEBPACK_IMPORTED_MODULE_11__.CursorSize],
    ["fillstyle", _styletogglers__WEBPACK_IMPORTED_MODULE_12__.FillStyleToggler],
    ["mandala", _mandala__WEBPACK_IMPORTED_MODULE_13__.mandala]
]);
class Editor {
    constructor(app) {
        this.app = app;
        this._view_canvas_bounding_rect = {
            x: 0, y: 0, w: this.app.view_canvas.offsetWidth, h: this.app.view_canvas.offsetHeight
        };
        this._art_canvas_bounding_rect = {
            x: 0, y: 0, w: this.app.art_canvas.offsetWidth, h: this.app.art_canvas.offsetHeight
        };
        this.undo_redo_buffer = new _undo_redo_buffer__WEBPACK_IMPORTED_MODULE_0__.UndoRedoBuffer(100);
        this.tool = new _editing_tool__WEBPACK_IMPORTED_MODULE_1__.NopTool(app.tool_context, this, app.tool_tmp_context);
        this._last_hover_spot = null;
    }
    view_coords_to_art_coords(view_coords) {
        return {
            x: this.app.state.view_port.x +
                view_coords.x /
                    this._view_canvas_bounding_rect.w * this.app.state.view_port.w,
            y: this.app.state.view_port.y +
                view_coords.y /
                    this._view_canvas_bounding_rect.h * this.app.state.view_port.h
        };
    }
    view_port_px() {
        const top_left_px = this.view_coords_to_art_coords({
            x: this._view_canvas_bounding_rect.x,
            y: this._view_canvas_bounding_rect.y
        });
        return {
            x: top_left_px.x,
            y: top_left_px.y,
            w: this.app.state.view_port.w,
            h: this.app.state.view_port.h
        };
    }
    staging_to_art() {
        (0,_utils__WEBPACK_IMPORTED_MODULE_10__.override_canvas_context)(this.app.art_context, this.app.staging_canvas, this._art_canvas_bounding_rect, false, false, true);
    }
    staging_to_view() {
        (0,_utils__WEBPACK_IMPORTED_MODULE_10__.override_canvas_context)(this.app.view_context, this.app.staging_canvas, this.app.state.view_port, false, false, false);
    }
    art_to_view() {
        (0,_utils__WEBPACK_IMPORTED_MODULE_10__.override_canvas_context)(this.app.staging_context, this.app.art_canvas, this.app.state.view_port, false, false, false);
    }
    art_to_staging() {
        (0,_utils__WEBPACK_IMPORTED_MODULE_10__.override_canvas_context)(this.app.staging_context, this.app.art_canvas, this._art_canvas_bounding_rect, false, false, true);
    }
    tool_to_staging() {
        (0,_utils__WEBPACK_IMPORTED_MODULE_10__.override_canvas_context)(this.app.staging_context, this.app.tool_canvas, this._view_canvas_bounding_rect, true, true, true);
    }
    tool_to_view() {
        (0,_utils__WEBPACK_IMPORTED_MODULE_10__.override_canvas_context)(this.app.view_context, this.app.tool_canvas, this.app.state.view_port, false, false, false);
    }
    tmp_tool_to_staging() {
        (0,_utils__WEBPACK_IMPORTED_MODULE_10__.override_canvas_context)(this.app.staging_context, this.app.tool_tmp_canvas, this._art_canvas_bounding_rect, true, true, true);
    }
    tmp_tool_to_view() {
        (0,_utils__WEBPACK_IMPORTED_MODULE_10__.override_canvas_context)(this.app.view_context, this.app.tool_tmp_canvas, this.app.state.view_port, true, false, false);
    }
    select_tool(tool_name) {
        this.previous_tool_name = this.current_tool_name;
        this.current_tool_name = tool_name;
        const tool_class = tool_classes.get(tool_name);
        if (!tool_class) {
            return;
        }
        this.tool = new tool_class(this.app.tool_context, this, this.app.tool_tmp_context);
        this.tool.select();
        if (this._last_hover_spot) {
            this.tool.hover(this.view_coords_to_art_coords(this._last_hover_spot));
            this.tmp_tool_to_view();
        }
    }
    deselect_tool() {
        this.tool = null;
    }
    pointerdown(event) {
        event.preventDefault();
        this.art_to_staging();
        this.tool.start(this.view_coords_to_art_coords({ x: event.offsetX, y: event.offsetY }), event.buttons);
    }
    pointermove(event) {
        this._last_hover_spot = { x: event.offsetX, y: event.offsetY };
        if (event.buttons) {
            this.tool.action(this.view_coords_to_art_coords({ x: event.offsetX, y: event.offsetY }));
            this.tool.hover(this.view_coords_to_art_coords({ x: event.offsetX, y: event.offsetY }));
            this.tmp_tool_to_view();
        }
        else {
            this.tool.hover(this.view_coords_to_art_coords({ x: event.offsetX, y: event.offsetY }));
            this.tmp_tool_to_view();
        }
        // Appply action
        this.staging_to_view();
        this.tmp_tool_to_view();
    }
    undo() {
        this.art_to_staging();
        this.app.tool_context.clearRect(0, 0, this._art_canvas_bounding_rect.w, this._art_canvas_bounding_rect.h);
        const undone_image_data = this.undo_redo_buffer.undo();
        this.app.clear_art_canvas();
        if (undone_image_data) {
            this.app.art_context.putImageData(undone_image_data, 0, 0);
        }
        this.art_to_view();
        this.art_to_staging();
    }
    redo() {
        const redone_image_data = this.undo_redo_buffer.redo();
        if (redone_image_data) {
            this.app.staging_context.clearRect(0, 0, this._art_canvas_bounding_rect.w, this._art_canvas_bounding_rect.h);
            this.app.tool_context.clearRect(0, 0, this._art_canvas_bounding_rect.w, this._art_canvas_bounding_rect.h);
            this.app.clear_art_canvas();
            this.app.art_context.putImageData(redone_image_data, 0, 0);
            this.art_to_view();
            this.art_to_staging();
        }
    }
    keydown(event) {
        if (event.code == 'KeyU') {
            this.undo();
        }
        if (event.code == 'KeyR') {
            this.redo();
        }
    }
    pointerup(event) {
        this.tool.hover(this.view_coords_to_art_coords({ x: event.offsetX, y: event.offsetY }));
        this.tool.stop();
    }
    pointerin(event) {
        if (!!event.buttons) {
        }
        //this.pointerup(event);
    }
    pointerleave(event) {
        this.app.tool_tmp_context.clearRect(0, 0, this._art_canvas_bounding_rect.w, this._art_canvas_bounding_rect.h);
        this.art_to_staging();
        this.tool_to_staging();
        this.staging_to_view();
        this._last_hover_spot = null;
    }
}


/***/ }),

/***/ "./src/ts/eraser.ts":
/*!**************************!*\
  !*** ./src/ts/eraser.ts ***!
  \**************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   EraserTool: () => (/* binding */ EraserTool)
/* harmony export */ });
/* harmony import */ var _click_and_drag_tool__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./click_and_drag_tool */ "./src/ts/click_and_drag_tool.ts");

class EraserTool extends _click_and_drag_tool__WEBPACK_IMPORTED_MODULE_0__.ClickAndDragTool {
    constructor(context, editor, tmp_context) {
        super(context, editor, true, tmp_context);
    }
    hover_action(at) {
        if (!this.tmp_context) {
            return false;
        }
        this.tmp_context.fillStyle = this.app.settings.back_color;
        this.tmp_context.strokeStyle = this.app.settings.fore_color;
        this.tmp_context.lineWidth = 1;
        this.tmp_context.beginPath();
        const r = this.app.settings.line_width;
        this.tmp_context.ellipse(at.x, at.y, r, r, 0, 0, Math.PI * 2);
        this.tmp_context.fill();
        this.tmp_context.stroke();
        return true;
    }
    editing_action(to) {
        if (this._recorded_to) {
            this.context.strokeStyle = this.app.settings.back_color;
            this.context.lineWidth = this.app.settings.line_width * 2;
            this.context.moveTo(this._recorded_to.x, this._recorded_to.y);
            this.context.lineTo(to.x, to.y);
        }
        this._recorded_to = to;
        this.context.stroke();
        return true;
    }
    editing_start() {
        return false;
    }
    editing_stop() {
        this._recorded_to = null;
        return false;
    }
}


/***/ }),

/***/ "./src/ts/floodfill.ts":
/*!*****************************!*\
  !*** ./src/ts/floodfill.ts ***!
  \*****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Floodfill: () => (/* binding */ Floodfill)
/* harmony export */ });
/* harmony import */ var _click_tool__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./click_tool */ "./src/ts/click_tool.ts");
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./utils */ "./src/ts/utils.ts");


function _equal_colors(c1, c2) {
    return c1[0] == c2[0] &&
        c1[1] == c2[1] &&
        c1[2] == c2[2];
}
function _floodfill(read_context, write_context, replaced_color, tool_color, x, y, w, h) {
    const context_image_data = read_context.getImageData(0, 0, w, h);
    const context_data = context_image_data.data;
    let safety = w * h * 4;
    let stack = [{ x: Math.floor(x), y: Math.floor(y) }];
    while (stack.length > 0 && safety-- > 0) {
        const dot = stack.pop();
        if (!dot) {
            break;
        }
        const x = dot.x;
        const y = dot.y;
        if (x < 0 ||
            y < 0 ||
            x > w ||
            y >= h) {
            continue;
        }
        const offset = (w * y + x) * 4;
        const color_at_xy = context_data.slice(offset, offset + 4);
        if (!_equal_colors(replaced_color, color_at_xy)) {
            continue;
        }
        context_data[offset + 0] = tool_color[0];
        context_data[offset + 1] = tool_color[1];
        context_data[offset + 2] = tool_color[2];
        context_data[offset + 3] = 255;
        stack.push({ x: x + 1, y: y });
        stack.push({ x: x - 1, y: y });
        stack.push({ x: x, y: y - 1 });
        stack.push({ x: x, y: y + 1 });
    }
    write_context.putImageData(context_image_data, 0, 0);
}
class Floodfill extends _click_tool__WEBPACK_IMPORTED_MODULE_0__.ClickTool {
    action(at) {
        return false;
        throw new Error("Method not implemented.");
    }
    stop(at) {
        return false;
        throw new Error("Method not implemented.");
    }
    constructor(context, editor) {
        super(context, editor);
        this.context = context;
        this.editor = editor;
        this.app = editor.app;
    }
    editing_start(at) {
        const replaced_color = this.app.art_context.getImageData(at.x, at.y, 1, 1).data;
        const parsed_fore_color = (0,_utils__WEBPACK_IMPORTED_MODULE_1__.parse_RGBA)(this.app.settings.fore_color);
        _floodfill(this.app.art_context, this.context, replaced_color, parsed_fore_color, at.x, at.y, this.w, this.h);
        return true;
    }
    hover(at) {
        return false;
    }
}


/***/ }),

/***/ "./src/ts/line.ts":
/*!************************!*\
  !*** ./src/ts/line.ts ***!
  \************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   LineTool: () => (/* binding */ LineTool)
/* harmony export */ });
/* harmony import */ var _click_and_drag_tool__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./click_and_drag_tool */ "./src/ts/click_and_drag_tool.ts");

class LineTool extends _click_and_drag_tool__WEBPACK_IMPORTED_MODULE_0__.ClickAndDragTool {
    constructor(context, editor) {
        super(context, editor, false);
    }
    editing_action(at) {
        if (!this.from) {
            return false;
        }
        this.context.moveTo(this.from.x, this.from.y);
        this.context.lineTo(at.x, at.y);
        this.context.stroke();
        return true;
    }
}


/***/ }),

/***/ "./src/ts/mandala.ts":
/*!***************************!*\
  !*** ./src/ts/mandala.ts ***!
  \***************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   mandala: () => (/* binding */ mandala)
/* harmony export */ });
/* harmony import */ var _click_and_drag_tool__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./click_and_drag_tool */ "./src/ts/click_and_drag_tool.ts");

function rotate(v, w, h, a, mirror) {
    const v2 = {
        'x': (mirror ? -1 : 1) * (v.x - (w / 2)),
        'y': v.y - (h / 2)
    };
    const v3 = {
        'x': v2.x * Math.cos(a) - v2.y * Math.sin(a),
        'y': v2.x * Math.sin(a) + v2.y * Math.cos(a)
    };
    const v4 = {
        'x': v3.x + (w / 2),
        'y': v3.y + (h / 2)
    };
    return v4;
}
class mandala extends _click_and_drag_tool__WEBPACK_IMPORTED_MODULE_0__.ClickAndDragTool {
    constructor(context, editor, tmp_context) {
        super(context, editor, true, tmp_context);
        this._n = 8;
        const angles = [];
        for (let j = 0; j < this._n; ++j) {
            angles.push(Math.PI * 2 * (j / this._n));
        }
        this._angles = Array.from(angles);
    }
    hover_action(at) {
        if (!this.tmp_context) {
            return false;
        }
        this.tmp_context.fillStyle = this.app.settings.fore_color;
        const tmp_context = this.tmp_context;
        const _this = this;
        this._angles.forEach((angle) => {
            const rotated = rotate(at, _this.w, _this.h, angle);
            tmp_context.beginPath();
            const r = this.app.settings.line_width / 2;
            tmp_context.ellipse(rotated.x, rotated.y, r, r, 0, 0, Math.PI * 2);
            tmp_context.fill();
        });
        return true;
    }
    editing_action(to) {
        if (this._recorded_to) {
            const _this = this;
            Array.from([true, false]).forEach((mirror) => {
                this._angles.forEach((angle) => {
                    const rotated_recorded = rotate(this._recorded_to, _this.w, _this.h, angle, mirror);
                    const rotated_to = rotate(to, _this.w, _this.h, angle, mirror);
                    _this.context.moveTo(rotated_recorded.x, rotated_recorded.y);
                    _this.context.lineTo(rotated_to.x, rotated_to.y);
                });
            });
        }
        this._recorded_to = to;
        this.context.stroke();
        return true;
    }
    editing_stop(at) {
        this._recorded_to = null;
        return true;
    }
}


/***/ }),

/***/ "./src/ts/on_select_tool.ts":
/*!**********************************!*\
  !*** ./src/ts/on_select_tool.ts ***!
  \**********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   OnSelectTool: () => (/* binding */ OnSelectTool)
/* harmony export */ });
/* harmony import */ var _editing_tool__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./editing_tool */ "./src/ts/editing_tool.ts");

class OnSelectTool extends _editing_tool__WEBPACK_IMPORTED_MODULE_0__.EditingTool {
    constructor(context, editor, tmp_context) {
        super(context, editor, tmp_context);
        this.select = this.select.bind(this);
    }
    select() {
        this.context.clearRect(0, 0, this.w, this.h);
        this.editor.art_to_staging();
        this.select_action();
        this.editor.tool_to_staging();
        this.editor.staging_to_view();
        this.editor.staging_to_art();
        this.editor.undo_redo_buffer.push(this.app.art_context.getImageData(0, 0, this.w, this.h));
        this.editor.art_to_staging();
        this.editor.tool_to_staging();
        this.editor.staging_to_view();
        if (this.editor.previous_tool_name) {
            this.app.select_tool(this.editor.previous_tool_name);
        }
    }
    hover() {
        return false;
    }
}


/***/ }),

/***/ "./src/ts/palette.ts":
/*!***************************!*\
  !*** ./src/ts/palette.ts ***!
  \***************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Palette: () => (/* binding */ Palette)
/* harmony export */ });
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./utils */ "./src/ts/utils.ts");

class Palette {
    constructor(hl_canvas, sat_canvas, initial_color_hsl) {
        this._hl_canvas = hl_canvas;
        this._hl_w = hl_canvas.width;
        this._hl_h = hl_canvas.height;
        this._sat_canvas = sat_canvas;
        this._rgb_color = (0,_utils__WEBPACK_IMPORTED_MODULE_0__.hsl_to_rgb)(initial_color_hsl);
        this._hsl_color = initial_color_hsl;
        this._sat_w = sat_canvas.width;
        this._sat_h = sat_canvas.height;
    }
    _plot_hl() {
        const hl_context = this._hl_canvas.getContext('2d', { willReadFrequently: true });
        const hl_image_data = hl_context.getImageData(0, 0, this._hl_w, this._hl_h);
        const hl_data = hl_image_data.data;
        for (let y = 0; y < this._hl_h; ++y) {
            for (let x = 0; x < this._hl_w; ++x) {
                const hl = this._hl_canvas_xy_to_hl(x, y);
                const h = hl[0];
                const l = hl[1];
                const hsl_val = [h, this._hsl_color[1], l];
                const rgb_val = (0,_utils__WEBPACK_IMPORTED_MODULE_0__.hsl_to_rgb)(hsl_val);
                if ((Math.abs(h - this._hsl_color[0]) <= 1 / this._hl_w) ||
                    (Math.abs(l - this._hsl_color[2]) <= 1 / this._hl_h)) {
                    // negative color
                    const negative = (0,_utils__WEBPACK_IMPORTED_MODULE_0__.vec_diff)([255, 255, 255], rgb_val);
                    rgb_val[0] = negative[0];
                    rgb_val[1] = negative[1];
                    rgb_val[2] = negative[2];
                }
                const offset = 4 * (x + y * this._hl_w);
                hl_data[offset] = rgb_val[0];
                hl_data[offset + 1] = rgb_val[1];
                hl_data[offset + 2] = rgb_val[2];
                hl_data[offset + 3] = 255;
            }
        }
        hl_context.putImageData(hl_image_data, 0, 0);
    }
    _plot_sat() {
        const sat_context = this._sat_canvas.getContext('2d', { willReadFrequently: true });
        const sat_image_data = sat_context.getImageData(0, 0, this._sat_w, this._sat_h);
        const sat_data = sat_image_data.data;
        for (let y = 0; y < this._sat_h; ++y) {
            for (let x = 0; x < this._sat_w; ++x) {
                const sat = this._sat_canvas_to_sat(x, y);
                const rgb_val = (0,_utils__WEBPACK_IMPORTED_MODULE_0__.hsl_to_rgb)([this._hsl_color[0], sat, this._hsl_color[2]]);
                if (Math.abs(sat - this._hsl_color[1]) <= 0.01) {
                    rgb_val[0] = 0;
                    rgb_val[1] = 0;
                    rgb_val[2] = 0;
                }
                const offset = 4 * (x + y * this._sat_w);
                sat_data[offset] = rgb_val[0];
                sat_data[offset + 1] = rgb_val[1];
                sat_data[offset + 2] = rgb_val[2];
                sat_data[offset + 3] = 255;
            }
        }
        sat_context.putImageData(sat_image_data, 0, 0);
    }
    plot() {
        this._plot_hl();
        this._plot_sat();
    }
    get_rgb_color_at(x, y) {
        const context = this._hl_canvas.getContext('2d');
        const data = context.getImageData(x, y, 1, 1).data;
        return data;
    }
    get_rgb_color() {
        return this._rgb_color;
    }
    _hl_canvas_xy_to_hl(x, y) {
        const h = 2 * ((x / this._hl_w + 2.5) % 1);
        const l = Math.min(1.0, Math.max(0, 0.5 + (y / this._hl_h - 0.5) * 1.25));
        return [h, l];
    }
    _sat_canvas_to_sat(x, y) {
        return y / this._sat_h;
    }
    hl_click(x, y) {
        const hl = this._hl_canvas_xy_to_hl(x, y);
        this._hsl_color = [hl[0], this._hsl_color[1], hl[1]];
        this._rgb_color = (0,_utils__WEBPACK_IMPORTED_MODULE_0__.hsl_to_rgb)(this._hsl_color);
        this.plot();
    }
    sat_click(x, y) {
        this._hsl_color = [this._hsl_color[0], this._sat_canvas_to_sat(x, y), this._hsl_color[2]];
        this._rgb_color = (0,_utils__WEBPACK_IMPORTED_MODULE_0__.hsl_to_rgb)(this._hsl_color);
        this.plot();
    }
}


/***/ }),

/***/ "./src/ts/rect.ts":
/*!************************!*\
  !*** ./src/ts/rect.ts ***!
  \************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   RectTool: () => (/* binding */ RectTool)
/* harmony export */ });
/* harmony import */ var _click_and_drag_tool__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./click_and_drag_tool */ "./src/ts/click_and_drag_tool.ts");

class RectTool extends _click_and_drag_tool__WEBPACK_IMPORTED_MODULE_0__.ClickAndDragTool {
    constructor(context, editor) {
        super(context, editor, false);
    }
    editing_action(to) {
        if (!this.from) {
            return false;
        }
        this.context.rect(this.from.x, this.from.y, to.x - this.from.x, to.y - this.from.y);
        if (this.app.settings.filled) {
            this.context.fill();
        }
        else {
            this.context.stroke();
        }
        return true;
    }
}


/***/ }),

/***/ "./src/ts/scribble.ts":
/*!****************************!*\
  !*** ./src/ts/scribble.ts ***!
  \****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   ScribbleTool: () => (/* binding */ ScribbleTool)
/* harmony export */ });
/* harmony import */ var _click_and_drag_tool__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./click_and_drag_tool */ "./src/ts/click_and_drag_tool.ts");

class ScribbleTool extends _click_and_drag_tool__WEBPACK_IMPORTED_MODULE_0__.ClickAndDragTool {
    constructor(context, editor, tmp_context) {
        super(context, editor, true, tmp_context);
    }
    hover_action(at) {
        if (!this.tmp_context) {
            return false;
        }
        this.tmp_context.fillStyle = this.app.settings.fore_color;
        this.tmp_context.beginPath();
        const r = this.app.settings.line_width / 2;
        this.tmp_context.ellipse(at.x, at.y, r, r, 0, 0, Math.PI * 2);
        this.tmp_context.fill();
        return true;
    }
    editing_action(to) {
        if (this._recorded_to) {
            this.context.moveTo(this._recorded_to.x, this._recorded_to.y);
            this.context.lineTo(to.x, to.y);
        }
        this._recorded_to = to;
        this.context.stroke();
        return true;
    }
    editing_stop(at) {
        this._recorded_to = null;
        return true;
    }
}


/***/ }),

/***/ "./src/ts/styletogglers.ts":
/*!*********************************!*\
  !*** ./src/ts/styletogglers.ts ***!
  \*********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   FillStyleToggler: () => (/* binding */ FillStyleToggler)
/* harmony export */ });
/* harmony import */ var _on_select_tool__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./on_select_tool */ "./src/ts/on_select_tool.ts");

function _equal_colors(c1, c2) {
    return c1[0] == c2[0] &&
        c1[1] == c2[1] &&
        c1[2] == c2[2];
}
class FillStyleToggler extends _on_select_tool__WEBPACK_IMPORTED_MODULE_0__.OnSelectTool {
    start(at, buttons) {
        throw new Error("Method not implemented.");
    }
    action(at) {
        throw new Error("Method not implemented.");
    }
    stop(at) {
        throw new Error("Method not implemented.");
    }
    constructor(context, editor) {
        super(context, editor);
        this.context = context;
        this.editor = editor;
        this.app = editor.app;
    }
    select_action() {
        this.app.settings.filled = !this.app.settings.filled;
        const styled_buttons = document.getElementsByClassName('fillable');
        for (let j = 0; j < styled_buttons.length; ++j) {
            styled_buttons[j].classList.toggle('filled');
        }
    }
}


/***/ }),

/***/ "./src/ts/undo_redo_buffer.ts":
/*!************************************!*\
  !*** ./src/ts/undo_redo_buffer.ts ***!
  \************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   UndoRedoBuffer: () => (/* binding */ UndoRedoBuffer)
/* harmony export */ });
/*
COMPLETELY EMPTY STACK WITH LINE DRWN:


-1|
 ^

next_index: INDEX: -1
ON SCREEN: A
UNDO: NULL
REDO: NULL

ONLY BLANK CANVAS:

SECOND LINE DRAWN:

A
^

next_index: INDEX 0
ON SCREEN: B
UNDO: -1
REDO: NONE
UNDO = next_index - 2

BLANK CANVAS + FIRST LINE + SECOND LINE:

0123
XAB
 US^

next_index: INDEX 3
ON SCREEN: B (INDEX 2)
UNDO: INDEX 1
REDO: NONE
UNDO = next_index - 2

BLANK CANVAS + FIRST LINE + SECOND LINE + UNDO:

0123
XAB
US^

next_index: INDEX 2
ON SCREEN: A (INDEX 1)
UNDO: INDEX 0
REDO: INDEX 2
UNDO = next_index - 2
REDO = next_index

01
XA
^R

XAB
 ^|

...
...
XABCDEF
    U^|

ABCDEF
  USR


*/
class UndoRedoBuffer {
    constructor(size, log_level) {
        this.stack = new Array(size);
        this.next_index = 0;
        this.high_water_mark = 0; // abuse of notation, h.w.m. of "next" actually
        //, ${v.data[0]}, ${v.data[1]}, ${v.data[2]}`)
    }
    dump_to_canvas() {
        // if (!this._log_level) {
        //     return
        // }
        // const canvas = document.getElementById('dbg-canvas');
        // const context = canvas.getContext('2d');
        // context.fillStyle = 'rgb(128,128,128)';
        // context.fillRect(0,0,800,80)
        // for (let j = 0; j < this.high_water_mark; ++j) {
        //     const v = this.stack[j];
        //     if (v && v.data) {
        //         context.putImageData(v, j*82,0)
        //     } else if (v){
        //         context.fillStyle = 'rgb(255,128,128)';
        //         context.fillRect(j*82,0,80,80)
        //     } else {
        //         context.fillStyle = 'rgb(128,255,128)';
        //         context.fillRect(j*82,0,80,80)
        //     }
        // }
        // context.fillStyle = 'rgb(255,0,0)';
        // context.fillRect(this.next_index*82+20,60,5,10)
        // context.fillStyle = 'rgb(0,0,255)';
        // context.fillRect(this.high_water_mark*82+20,70,5,10)
    }
    log(msg) {
        console.log(msg);
        // if (this._log_level) {
        //     console.log(msg)
        //     try {
        //         document.getElementById('dbg').style.visibility = 50
        //         document.getElementById('dbg').style.visibility = 'visible'
        //         document.getElementById('dbg').innerHTML = msg
        //     } catch {
        //     }
        // }
    }
    undo() {
        if (this.next_index <= 1) {
            if (this.next_index == 1) {
                this.next_index--;
            }
            this.dump_to_canvas();
            return null;
        }
        const v = this.stack[this.next_index - 2] || null;
        this.next_index--;
        this.dump_to_canvas();
        return v;
    }
    redo() {
        if (this.next_index >= this.high_water_mark) {
            this.dump_to_canvas();
            return null;
        }
        const v = this.stack[this.next_index] || null;
        this.next_index++;
        this.dump_to_canvas();
        return v;
    }
    push(v) {
        this.stack[this.next_index] = v;
        this.next_index++;
        if (this.next_index > this.high_water_mark) {
            this.high_water_mark = this.next_index;
        }
        if (this.high_water_mark > this.stack.length) {
            this.stack.length = this.stack.length * 2;
        }
        this.dump_to_canvas();
    }
}


/***/ }),

/***/ "./src/ts/utils.ts":
/*!*************************!*\
  !*** ./src/ts/utils.ts ***!
  \*************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   dist2: () => (/* binding */ dist2),
/* harmony export */   dist2_to_set: () => (/* binding */ dist2_to_set),
/* harmony export */   hsl_to_rgb: () => (/* binding */ hsl_to_rgb),
/* harmony export */   norm2: () => (/* binding */ norm2),
/* harmony export */   override_canvas_context: () => (/* binding */ override_canvas_context),
/* harmony export */   parse_RGBA: () => (/* binding */ parse_RGBA),
/* harmony export */   scale_rect: () => (/* binding */ scale_rect),
/* harmony export */   translate_rect: () => (/* binding */ translate_rect),
/* harmony export */   vec_diff: () => (/* binding */ vec_diff)
/* harmony export */ });
function override_canvas_context(context_to, canvas_from, view_port_from, keep, avoid_native, force_same_view_port) {
    // context_to.putImage(context_to_image_data,0,0);
    if (!keep) {
        context_to.clearRect(0, 0, context_to.canvas.clientWidth, context_to.canvas.clientHeight);
    }
    if (!avoid_native) {
        if (force_same_view_port) {
            context_to.drawImage(canvas_from, 0, 0);
        }
        else {
            context_to.drawImage(canvas_from, view_port_from.x, view_port_from.y, view_port_from.w, view_port_from.h, 0, 0, context_to.canvas.clientWidth, context_to.canvas.clientHeight);
        }
    }
    else {
        const context_from = canvas_from.getContext('2d');
        const context_from_image_data = context_from.getImageData(0, 0, canvas_from.clientWidth, canvas_from.clientHeight);
        const context_from_data = context_from_image_data.data;
        const context_to_image_data = context_to.getImageData(0, 0, canvas_from.clientWidth, canvas_from.clientHeight);
        const context_to_data = context_to_image_data.data;
        const w = context_to.canvas.clientWidth;
        const h = context_to.canvas.offsetHeight;
        for (let y = 0; y < h; ++y) {
            for (let x = 0; x < w; ++x) {
                const offset = (w * y + x) * 4;
                if (context_from_data[offset + 3] > 0) {
                    context_to_data[offset + 0] = context_from_data[offset + 0];
                    context_to_data[offset + 1] = context_from_data[offset + 1];
                    context_to_data[offset + 2] = context_from_data[offset + 2];
                    context_to_data[offset + 3] = 255;
                }
            }
        }
        context_to.putImageData(context_to_image_data, 0, 0);
    }
}
function parse_RGBA(color) {
    if (color instanceof Uint8ClampedArray) {
        return color;
    }
    // Match the pattern for "rgb(r, g, b)"
    let regex = /rgba\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)/;
    // Execute the regex on the input string
    let result = regex.exec(color);
    if (result) {
        // Return the extracted r, g, b values as an array of numbers
        let r = parseInt(result[1]);
        let g = parseInt(result[2]);
        let b = parseInt(result[3]);
        let a = parseInt(result[4]);
        return Uint8ClampedArray.from([r, g, b, a]);
    }
    else {
        throw new Error("Invalid rgb string format");
    }
}
function hsl_to_rgb(hsl) {
    let r, g, b;
    const h = hsl[0];
    const s = hsl[1];
    const l = hsl[2];
    if (s === 0) {
        r = g = b = l; // achromatic
    }
    else {
        const hue2rgb = (p, q, t) => {
            if (t < 0)
                t += 1;
            if (t > 1)
                t -= 1;
            if (t < 1 / 6)
                return p + (q - p) * 6 * t;
            if (t < 1 / 2)
                return q;
            if (t < 2 / 3)
                return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        };
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
    }
    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}
function vec_diff(v1, v2) {
    if (!v1) {
        return v2;
    }
    if (!v2) {
        return v1;
    }
    let res = [];
    for (let j = 0; j < v1.length; ++j) {
        res.push(v1[j] - v2[j]);
    }
    return res;
}
function norm2(v) {
    let res = 0;
    for (let j = 0; j < v.length; ++j) {
        res = res + v[j] * v[j];
    }
    return res;
}
function dist2(v1, v2) {
    return norm2(vec_diff(v1, v2));
}
function dist2_to_set(v, set) {
    let min_dist2 = -1; //dist2(v, set[0]);
    let min_j = 0;
    for (let j = 0; j < set.length; ++j) {
        if (set[j] == undefined) {
            continue;
        }
        const dist2_j = dist2(v, set[j]);
        if (min_dist2 == -1 || dist2_j < min_dist2) {
            min_dist2 = dist2_j;
            min_j = j;
        }
    }
    if (min_dist2 == -1) {
        debugger;
    }
    return min_dist2;
}
function scale_rect(r, scale) {
    return { x: r.x * scale.x,
        y: r.y * scale.y,
        w: r.w * scale.x,
        h: r.h * scale.y };
}
function translate_rect(r, shift) {
    return { x: r.x + shift.x,
        y: r.y + shift.y,
        w: r.w,
        h: r.h };
}


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
/*!****************************!*\
  !*** ./src/ts/main_app.ts ***!
  \****************************/
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   MainApp: () => (/* binding */ MainApp),
/* harmony export */   app_ignite: () => (/* binding */ app_ignite)
/* harmony export */ });
/* harmony import */ var _editor__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./editor */ "./src/ts/editor.ts");
/* harmony import */ var _palette__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./palette */ "./src/ts/palette.ts");
/* harmony import */ var _color_stack__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./color_stack */ "./src/ts/color_stack.ts");



function click_for_a_second(id, callback) {
    const elem = document.getElementById(id);
    if (elem) {
        elem.addEventListener('click', () => {
            elem.classList.add('pressed');
            callback();
            window.setTimeout(() => {
                elem.classList.remove('pressed');
            }, 120);
        });
    }
}
class MainApp {
    constructor() {
        this.art_canvas = document.getElementById('art-canvas');
        this.art_context = this.art_canvas.getContext('2d', { willReadFrequently: true });
        this.view_canvas = document.getElementById('view-canvas');
        this.view_context = this.view_canvas.getContext('2d', { willReadFrequently: true });
        this.staging_canvas = document.getElementById('staging-canvas');
        this.staging_context = this.staging_canvas.getContext('2d', { willReadFrequently: true });
        this.tool_canvas = document.getElementById('tool-canvas');
        this.tool_context = this.tool_canvas.getContext('2d', { willReadFrequently: true });
        this.tool_tmp_canvas = document.getElementById('tool-tmp-canvas');
        this.tool_tmp_context = this.tool_tmp_canvas.getContext('2d', { willReadFrequently: true });
        this.palette_hl_canvas = document.getElementById('hl-selector-canvas');
        this.palette_sat_canvas = document.getElementById('sat-selector-canvas');
        this.palette = new _palette__WEBPACK_IMPORTED_MODULE_1__.Palette(this.palette_hl_canvas, this.palette_sat_canvas, [1, 0.5, 0.5]);
        this.editor = new _editor__WEBPACK_IMPORTED_MODULE_0__.Editor(this);
        this.settings = {
            fore_color: 'rgba(0,0,0,255)',
            back_color: 'rgba(255,255,255,255)',
            line_width: 10,
            filled: true,
        };
        this.state = {
            view_port: {
                x: 0,
                y: 0,
                w: 0.5 * this.art_canvas.clientWidth,
                h: 0.5 * this.art_canvas.clientHeight
            }
        };
        this.art_context.imageSmoothingEnabled = false;
        this.art_context.globalCompositeOperation = 'source-over';
        this.staging_context.imageSmoothingEnabled = false;
        this.staging_context.globalCompositeOperation = 'source-over';
        this.tool_context.globalCompositeOperation = 'source-over';
        this.tool_context.imageSmoothingEnabled = false;
        this.color_stack = new _color_stack__WEBPACK_IMPORTED_MODULE_2__.ColorStack(this, 8, 100, 10000, document.getElementById('color-selector-div-fore'), document.getElementById('color-selector-div-back'), document.getElementsByClassName('color_stack_item'));
    }
    select_tool(tool_name) {
        const _this = this;
        const button = document.getElementsByClassName(tool_name)[0];
        const button_list = document.getElementsByClassName('button');
        Array.from(button_list).forEach(other_button => {
            other_button.classList.remove('pressed');
        });
        button.classList.add('pressed');
        _this.editor.select_tool(tool_name);
    }
    init_load_save() {
        const art_canvas = this.art_canvas;
        const art_context = this.art_context;
        const view_context = this.view_context;
        const staging_context = this.staging_context;
        click_for_a_second('save_button', () => {
            // Generate a PNG from the canvas
            art_canvas.toBlob(function (blob) {
                if (!blob) {
                    alert('invalid choice, not saving');
                    return;
                }
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = 'image.png'; // Set the file name for download
                link.click();
            }, 'image/png');
        });
        const file_input = document.getElementById('file_input');
        file_input.addEventListener('change', (event) => {
            const input = event.target;
            if (input
                && input.files
                && input.files.length > 0
                && input.files[0]
                && input.files[0].type === 'image/png') {
                const file = input.files[0];
                const reader = new FileReader();
                const _this = this;
                reader.onload = function (e) {
                    if (e.target) {
                        const img = new Image();
                        img.onload = function () {
                            // Clear canvas and draw the image
                            art_context.clearRect(0, 0, art_canvas.width, art_canvas.height);
                            art_context.drawImage(img, 0, 0, art_canvas.width, art_canvas.height);
                            _this.editor.art_to_view();
                            _this.editor.art_to_staging();
                        };
                        img.src = e.target.result;
                    }
                };
                reader.readAsDataURL(file);
            }
            else {
                alert("Please select a valid PNG file.");
            }
            file_input.value = '';
        });
        document.getElementById('load_button').addEventListener('click', () => {
            file_input.click();
        });
    }
    init_undo_redo_buttons() {
        const _this = this;
        click_for_a_second('undo_button', () => {
            _this.editor.undo();
        });
        click_for_a_second('redo_button', () => {
            _this.editor.redo();
        });
    }
    init_buttons() {
        const _this = this;
        const button_list = document.getElementsByClassName('button');
        Array.from(button_list).forEach(button => {
            const button_class_list = button.classList;
            if (button_class_list[0] != 'button') {
                button.addEventListener('click', event => {
                    _this.select_tool(button_class_list[0]);
                });
            }
        });
        this.init_undo_redo_buttons();
        this.init_load_save();
    }
    forward_events_to_editor() {
        // canvas
        const fore = document.getElementById('fore');
        const canvas_area = document.getElementById('view-canvas');
        ["pointerdown", "pointerup", "pointerout", "pointerleave", "pointermove", "click", "keydown"].forEach((ename) => {
            canvas_area.addEventListener(ename, (ev) => {
                ev.preventDefault();
                if (this.editor[ename]) {
                    this.editor[ename](ev);
                }
            });
        });
        this.view_canvas.addEventListener('contextmenu', (event) => {
            event.preventDefault();
        });
        // body
        document.body.addEventListener("keydown", (ev) => this.editor.keydown(ev));
    }
    init_color_selector() {
        let img = new Image();
        img.src = "/palette.png";
        this.palette_hl_canvas.width = this.palette_hl_canvas.offsetWidth;
        this.palette_hl_canvas.height = this.palette_hl_canvas.offsetHeight;
        this.palette_sat_canvas.width = this.palette_sat_canvas.offsetWidth;
        this.palette_sat_canvas.height = this.palette_sat_canvas.offsetHeight;
        this.palette.plot();
        const _this = this;
        const palette = this.palette;
        const hl_callback = (event) => {
            if (event.buttons == 0) {
                return;
            }
            event.preventDefault();
            palette.hl_click(event.offsetX, event.offsetY);
            const rgb_color = palette.get_rgb_color();
            _this.color_stack.select_color(rgb_color, !!(event.buttons & 1), true);
        };
        this.palette_hl_canvas.addEventListener('pointermove', hl_callback);
        this.palette_hl_canvas.addEventListener('pointerup', hl_callback);
        this.palette_hl_canvas.addEventListener('pointerdown', hl_callback);
        this.palette_hl_canvas.addEventListener('click', hl_callback);
        const sat_callback = (event) => {
            if (event.buttons == 0) {
                return;
            }
            event.preventDefault();
            palette.sat_click(event.offsetX, event.offsetY);
            const rgb_color = palette.get_rgb_color();
            _this.color_stack.select_color(rgb_color, !!(event.buttons & 1), true);
        };
        this.palette_sat_canvas.addEventListener('pointermove', sat_callback);
        this.palette_sat_canvas.addEventListener('pointerdown', sat_callback);
        this.palette_sat_canvas.addEventListener('pointerup', sat_callback);
        this.palette_sat_canvas.addEventListener('click', sat_callback);
        this.palette_sat_canvas.onpointermove = sat_callback;
        this.palette_sat_canvas.onpointerup = sat_callback;
        this.palette_hl_canvas.addEventListener('contextmenu', (event) => {
            event.preventDefault();
        });
        this.palette_sat_canvas.addEventListener('contextmenu', (event) => {
            event.preventDefault();
        });
        document.getElementById('color-selector-div-back').addEventListener('click', () => {
            const tmp_back = _this.settings.back_color;
            _this.settings.back_color = _this.settings.fore_color;
            _this.settings.fore_color = tmp_back;
            document.getElementById('color-selector-div-fore').style.backgroundColor = _this.settings.fore_color;
            document.getElementById('color-selector-div-back').style.backgroundColor = _this.settings.back_color;
        });
    }
    clear_context(context) {
        context.fillStyle = "rgba(255,255,255,255)";
        context.fillRect(0, 0, this.view_canvas.width, this.view_canvas.height);
        context.fill();
    }
    clear_art_canvas() {
        this.clear_context(this.art_context);
    }
    init_view_canvas_size() {
        const resizeObserver = new ResizeObserver(entries => {
            entries.forEach(entry => {
                // asserting entry == view-canvas
                const view_canvas = entry.target;
                view_canvas.width = entry.contentRect.width;
                view_canvas.height = entry.contentRect.height;
            });
        });
        document.querySelectorAll('#canvas-area canvas').forEach((e) => {
            resizeObserver.observe(e);
        });
    }
    init() {
        // clear
        this.view_context.fillStyle = "rgba(255,255,255,0)";
        this.view_context.fillRect(0, 0, this.view_canvas.width, this.view_canvas.height);
        this.staging_context.fillStyle = "rgba(255,255,255,0)";
        this.staging_context.fillRect(0, 0, this.staging_canvas.width, this.staging_canvas.height);
        this.clear_art_canvas();
        // forward pointer
        // bind pointer
        const _this = this;
        this.init_color_selector();
        this.init_buttons();
        this.forward_events_to_editor();
        this.select_tool('scribble');
        this.init_view_canvas_size();
    }
}
function app_ignite() {
    window.app = new MainApp();
    window.app.init();
}
window.addEventListener('load', () => { app_ignite(); });

})();

/******/ })()
;
//# sourceMappingURL=bundle.js.map