
import { WebGLRenderer, Scene, OrthographicCamera, ShaderMaterial, DoubleSide, Mesh, PlaneGeometry, CanvasTexture, NearestFilter } from "three"
import { FRAGMENT_SHADER_CODE, VERTEX_SHADER_CODE } from "./glsl_shader_code"
import { effect, Signal } from "@preact/signals";
import { Rect, RectToRectMapping } from "./types";

export class ScribRenderer {
    document_canvas: HTMLCanvasElement;
    document_context: CanvasRenderingContext2D;
    editor: any;
    view_canvas: HTMLCanvasElement;
    overlay_canvas_signal: Signal<HTMLCanvasElement>;
    overlay_canvas_bounds_signal: Signal<RectToRectMapping>;
    document_dirty_signal: Signal<number>;
    view_port_signal: Signal<Rect>;
    anchor_canvas_signal: Signal<HTMLCanvasElement>;
    constructor(overlay_canvas_signal: Signal<HTMLCanvasElement>,
        overlay_canvas_bounds_signal: Signal<RectToRectMapping>,
        document_dirty_signal: Signal<number>,
        view_port_signal: Signal<Rect>,
        anchor_canvas_signal: Signal<HTMLCanvasElement>) {
        this.document_canvas = document.getElementById('document-canvas')! as HTMLCanvasElement;
        this.view_canvas = document.getElementById('view-canvas')! as HTMLCanvasElement;
        this.document_context = this.document_canvas.getContext('2d', { willReadFrequently: true, texImage3d: false }) as CanvasRenderingContext2D;
        this.document_context.imageSmoothingEnabled = false;
        this.document_context.globalCompositeOperation = 'source-over';
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
        let docTexW = this.document_canvas.width;
        let docTexH = this.document_canvas.height;
        const makeDocTexture = () => {
            const t = new CanvasTexture(this.document_canvas);
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
            side: DoubleSide,
        });
        let docGeometry = new PlaneGeometry(docTexW, docTexH);
        const docMesh = new Mesh(docGeometry, docMaterial);
        docMesh.position.set(docTexW * 0.5, docTexH * 0.5, -5);

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
        scene.add(docMesh);
        scene.add(anchorMesh);
        scene.add(overlayMesh);

        effect(() => {
            const overlay_canvas = this.overlay_canvas_signal.value;
            const bounds_mapping = this.overlay_canvas_bounds_signal.value;
            this.document_dirty_signal.value; // subscribe so document-only changes trigger re-render
            this.view_port_signal.value; // subscribe so viewport changes trigger re-render
            const anchor_canvas = this.anchor_canvas_signal.value;

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
            if (this.document_canvas.width !== docTexW || this.document_canvas.height !== docTexH) {
                docTexW = this.document_canvas.width;
                docTexH = this.document_canvas.height;
                docTexture.dispose();
                docTexture = makeDocTexture();
                docMaterial.uniforms.uTexture.value = docTexture;
                docGeometry.dispose();
                docGeometry = new PlaneGeometry(docTexW, docTexH);
                docMesh.geometry = docGeometry;
                docMesh.position.set(docTexW * 0.5, docTexH * 0.5, -5);
            }

            docTexture.needsUpdate = true;

            // Update overlay mesh — reuse texture when canvas dimensions are unchanged
            if (overlay_canvas != null) {
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