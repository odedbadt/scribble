
import { WebGLRenderer, Scene, OrthographicCamera, ShaderMaterial, DoubleSide, Mesh, PlaneGeometry, CanvasTexture, NearestFilter } from "three"
import { FRAGMENT_SHADER_CODE, VERTEX_SHADER_CODE, CHECKER_FRAGMENT_SHADER_CODE } from "./glsl_shader_code"
import { effect, Signal } from "@preact/signals";
import { Rect, RectToRectMapping } from "./types";
import { LayerStack } from "./layer_stack";

export class ScribRenderer {
    layer_stack: LayerStack;
    view_canvas: HTMLCanvasElement;
    overlay_canvas_signal: Signal<HTMLCanvasElement>;
    overlay_canvas_bounds_signal: Signal<RectToRectMapping>;
    document_dirty_signal: Signal<number>;
    view_port_signal: Signal<Rect>;
    anchor_canvas_signal: Signal<HTMLCanvasElement>;
    constructor(layer_stack: LayerStack,
        overlay_canvas_signal: Signal<HTMLCanvasElement>,
        overlay_canvas_bounds_signal: Signal<RectToRectMapping>,
        document_dirty_signal: Signal<number>,
        view_port_signal: Signal<Rect>,
        anchor_canvas_signal: Signal<HTMLCanvasElement>) {
        this.layer_stack = layer_stack;
        this.view_canvas = document.getElementById('view-canvas')! as HTMLCanvasElement;
        this.overlay_canvas_signal = overlay_canvas_signal;
        this.overlay_canvas_bounds_signal = overlay_canvas_bounds_signal;
        this.document_dirty_signal = document_dirty_signal;
        this.view_port_signal = view_port_signal;
        this.anchor_canvas_signal = anchor_canvas_signal;
    }
    init() {
        this.init_render_loop();
    }

    init_camera(vp: Rect): OrthographicCamera {
        const camera = new OrthographicCamera(
            vp.x,         // left
            vp.x + vp.w,  // right
            vp.y,         // top
            vp.y + vp.h,  // bottom
            0,
            10
        );
        camera.position.set(0, 0, 1);
        camera.lookAt(0, 0, 0);
        return camera;
    }
    init_render_loop() {
        const renderer = new WebGLRenderer({
            antialias: false,
            canvas: this.view_canvas
        });
        renderer.setClearColor(0xd0d0c8, 1); // gray background outside document

        // Document mesh — texture and geometry recreated when canvas dimensions change
        const composite_canvas = this.layer_stack.composite_canvas;
        const above_composite_canvas = this.layer_stack.above_composite_canvas;
        let docTexW = composite_canvas.width;
        let docTexH = composite_canvas.height;
        const makeDocTexture = () => {
            const t = new CanvasTexture(composite_canvas);
            t.flipY = false;
            t.minFilter = NearestFilter;
            t.magFilter = NearestFilter;
            return t;
        };
        const makeAboveTexture = () => {
            const t = new CanvasTexture(above_composite_canvas);
            t.flipY = false;
            t.minFilter = NearestFilter;
            t.magFilter = NearestFilter;
            return t;
        };
        let docTexture = makeDocTexture();
        const docMaterial = new ShaderMaterial({
            uniforms: { uTexture: { value: docTexture } },
            vertexShader: VERTEX_SHADER_CODE,
            fragmentShader: FRAGMENT_SHADER_CODE,
            transparent: true,
            side: DoubleSide,
        });
        let docGeometry = new PlaneGeometry(docTexW, docTexH);
        const docMesh = new Mesh(docGeometry, docMaterial);
        docMesh.position.set(docTexW * 0.5, docTexH * 0.5, -5);

        // Checkerboard background mesh — sits behind docMesh at z=-8.
        // Shows through transparent holes punched in the bottommost layer.
        const checkerMaterial = new ShaderMaterial({
            uniforms: { uDocSize: { value: { x: docTexW, y: docTexH } } },
            vertexShader: VERTEX_SHADER_CODE,
            fragmentShader: CHECKER_FRAGMENT_SHADER_CODE,
            side: DoubleSide,
        });
        let checkerGeometry = new PlaneGeometry(docTexW, docTexH);
        const checkerMesh = new Mesh(checkerGeometry, checkerMaterial);
        checkerMesh.position.set(docTexW * 0.5, docTexH * 0.5, -8);

        // Above-active-layer mesh — renders on top of the overlay stroke
        let aboveTexture = makeAboveTexture();
        const aboveMaterial = new ShaderMaterial({
            uniforms: { uTexture: { value: aboveTexture } },
            vertexShader: VERTEX_SHADER_CODE,
            fragmentShader: FRAGMENT_SHADER_CODE,
            transparent: true,
            side: DoubleSide,
        });
        let aboveGeometry = new PlaneGeometry(docTexW, docTexH);
        const aboveMesh = new Mesh(aboveGeometry, aboveMaterial);
        aboveMesh.position.set(docTexW * 0.5, docTexH * 0.5, -1);

        // Overlay mesh — geometry/material/mesh reused; texture reused when canvas dimensions match
        const overlayMaterial = new ShaderMaterial({
            uniforms: { uTexture: { value: null } },
            vertexShader: VERTEX_SHADER_CODE,
            fragmentShader: FRAGMENT_SHADER_CODE,
            transparent: true,
            side: DoubleSide,
        });
        const overlayGeometry = new PlaneGeometry(1, 1);
        const overlayMesh = new Mesh(overlayGeometry, overlayMaterial);
        overlayMesh.visible = false;
        let overlayTexture: CanvasTexture | null = null;
        let overlayTexW = 0;
        let overlayTexH = 0;

        // Anchor overlay mesh — full-document-sized, persists across strokes
        const anchorMaterial = new ShaderMaterial({
            uniforms: { uTexture: { value: null } },
            vertexShader: VERTEX_SHADER_CODE,
            fragmentShader: FRAGMENT_SHADER_CODE,
            transparent: true,
            side: DoubleSide,
        });
        const anchorMesh = new Mesh(new PlaneGeometry(1, 1), anchorMaterial);
        anchorMesh.visible = false;
        let anchorTexture: CanvasTexture | null = null;
        let anchorTexW = 0;
        let anchorTexH = 0;

        // Render is throttled to one call per animation frame to avoid rendering faster
        // than the display can show when pointer events fire at high rate.
        let renderPending = false;

        const scene = new Scene();
        scene.add(checkerMesh);
        scene.add(docMesh);
        scene.add(anchorMesh);
        scene.add(overlayMesh);
        scene.add(aboveMesh);

        effect(() => {
            const overlay_canvas = this.overlay_canvas_signal.value;
            const bounds_mapping = this.overlay_canvas_bounds_signal.value;
            this.document_dirty_signal.value; // subscribe so document-only changes trigger re-render
            this.view_port_signal.value; // subscribe so viewport changes trigger re-render
            const anchor_canvas = this.anchor_canvas_signal.value;
            this.layer_stack.layers.value; // subscribe to layer list changes (add/delete/reorder/visibility)
            this.layer_stack.active_index.value; // subscribe so switching active layer updates split

            // Recomposite visible layers, split at active layer, before updating textures
            this.layer_stack.recomposite();

            // Update anchor mesh — reuse texture when canvas dimensions are unchanged
            if (anchor_canvas != null) {
                if (anchorTexture && anchor_canvas.width === anchorTexW && anchor_canvas.height === anchorTexH) {
                    anchorTexture.needsUpdate = true;
                } else {
                    anchorTexture?.dispose();
                    anchorTexture = new CanvasTexture(anchor_canvas);
                    anchorTexture.flipY = false;
                    anchorTexture.minFilter = NearestFilter;
                    anchorTexture.magFilter = NearestFilter;
                    anchorMaterial.uniforms.uTexture.value = anchorTexture;
                    anchorTexW = anchor_canvas.width;
                    anchorTexH = anchor_canvas.height;
                    anchorMesh.scale.set(anchorTexW, anchorTexH, 1);
                    anchorMesh.position.set(anchorTexW / 2, anchorTexH / 2, -3);
                }
                anchorMesh.visible = true;
            } else {
                if (anchorTexture) {
                    anchorTexture.dispose();
                    anchorTexture = null;
                    anchorMaterial.uniforms.uTexture.value = null;
                }
                anchorMesh.visible = false;
            }

            // Recreate document texture and geometry if canvas was resized (e.g. after image load)
            if (composite_canvas.width !== docTexW || composite_canvas.height !== docTexH) {
                docTexW = composite_canvas.width;
                docTexH = composite_canvas.height;
                docTexture.dispose();
                docTexture = makeDocTexture();
                docMaterial.uniforms.uTexture.value = docTexture;
                docGeometry.dispose();
                docGeometry = new PlaneGeometry(docTexW, docTexH);
                docMesh.geometry = docGeometry;
                docMesh.position.set(docTexW * 0.5, docTexH * 0.5, -5);
                // Keep checker mesh in sync with document size
                checkerGeometry.dispose();
                checkerGeometry = new PlaneGeometry(docTexW, docTexH);
                checkerMesh.geometry = checkerGeometry;
                checkerMesh.position.set(docTexW * 0.5, docTexH * 0.5, -8);
                checkerMaterial.uniforms.uDocSize.value = { x: docTexW, y: docTexH };
            }

            docTexture.needsUpdate = true;

            // Update above-composite mesh — resize geometry when canvas dimensions change
            if (above_composite_canvas.width !== docTexW || above_composite_canvas.height !== docTexH) {
                // above canvas resizes in sync with composite_canvas via resize_all()
                // so this branch fires at the same time as docMesh resize above
                aboveTexture.dispose();
                aboveTexture = makeAboveTexture();
                aboveMaterial.uniforms.uTexture.value = aboveTexture;
                aboveGeometry.dispose();
                aboveGeometry = new PlaneGeometry(docTexW, docTexH);
                aboveMesh.geometry = aboveGeometry;
                aboveMesh.position.set(docTexW * 0.5, docTexH * 0.5, -1);
            }
            aboveTexture.needsUpdate = true;

            // Update overlay mesh — reuse texture when canvas dimensions are unchanged
            if (overlay_canvas != null && bounds_mapping != null) {
                const to_rect = bounds_mapping.to;

                if (overlayTexture && overlay_canvas.width === overlayTexW && overlay_canvas.height === overlayTexH) {
                    // Same size: just mark pixels dirty — no GPU texture reallocation
                    overlayTexture.needsUpdate = true;
                } else {
                    overlayTexture?.dispose();
                    overlayTexture = new CanvasTexture(overlay_canvas);
                    overlayTexture.flipY = false;
                    overlayTexture.minFilter = NearestFilter;
                    overlayTexture.magFilter = NearestFilter;
                    overlayMaterial.uniforms.uTexture.value = overlayTexture;
                    overlayTexW = overlay_canvas.width;
                    overlayTexH = overlay_canvas.height;
                }

                overlayMesh.scale.set(to_rect.w, to_rect.h, 1);
                overlayMesh.position.set(to_rect.x + to_rect.w / 2, to_rect.y + to_rect.h / 2, -2);
                overlayMesh.visible = true;
            } else {
                if (overlayTexture) {
                    overlayTexture.dispose();
                    overlayTexture = null;
                    overlayMaterial.uniforms.uTexture.value = null;
                }
                overlayMesh.visible = false;
            }

            // Throttle renders to one per animation frame; pointer events can fire much faster
            // than the display refresh rate, so batching them avoids redundant GPU work.
            if (!renderPending) {
                renderPending = true;
                requestAnimationFrame(() => {
                    renderPending = false;
                    renderer.render(scene, this.init_camera(this.view_port_signal.peek()));
                });
            }
        });
    }

}