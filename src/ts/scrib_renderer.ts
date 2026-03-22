
import { WebGLRenderer, Scene, Camera, OrthographicCamera, ShaderMaterial, DoubleSide, Mesh, PlaneGeometry, Texture, CanvasTexture, MeshBasicMaterial, NearestFilter } from "three"
import { FRAGMENT_SHADER_CODE, VERTEX_SHADER_CODE } from "./glsl_shader_code"
import { disposeScene } from "./utils";
import { signal, computed, effect, Signal } from "@preact/signals";
import { Rect, RectToRectMapping, rbottom, rleft, rright, rtop } from "./types";
import { from } from "rxjs";

export class ScribRenderer {
    document_canvas: HTMLCanvasElement;
    document_context: CanvasRenderingContext2D;
    editor: any;
    view_canvas: HTMLCanvasElement;
    overlay_canvas_signal: Signal<HTMLCanvasElement>;
    overlay_canvas_bounds_signal: Signal<RectToRectMapping>;
    document_dirty_signal: Signal<number>;
    view_port_signal: Signal<Rect>;
    constructor(overlay_canvas_signal: Signal<HTMLCanvasElement>,
        overlay_canvas_bounds_signal: Signal<RectToRectMapping>,
        document_dirty_signal: Signal<number>,
        view_port_signal: Signal<Rect>) {
        this.document_canvas = document.getElementById('document-canvas')! as HTMLCanvasElement;
        this.view_canvas = document.getElementById('view-canvas')! as HTMLCanvasElement;
        this.document_context = this.document_canvas.getContext('2d', { willReadFrequently: true, texImage3d: false }) as CanvasRenderingContext2D;
        this.document_context.imageSmoothingEnabled = false;
        this.document_context.globalCompositeOperation = 'source-over';
        this.overlay_canvas_signal = overlay_canvas_signal;
        this.overlay_canvas_bounds_signal = overlay_canvas_bounds_signal;
        this.document_dirty_signal = document_dirty_signal;
        this.view_port_signal = view_port_signal;
    }
    init() {
        this.init_render_loop();
    }

    init_camera(vp: Rect): Camera {
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
    build_scene(overlay_texture: CanvasTexture | null, bounds_mapping: RectToRectMapping): Scene {
        // Scene and orthographic camera
        const scene = new Scene();
        const document_texture = new CanvasTexture(
            this.document_canvas);
        document_texture.flipY = false;
        // Use nearest-neighbor filtering for pixel-perfect rendering
        document_texture.minFilter = NearestFilter;
        document_texture.magFilter = NearestFilter;
        const document_material = new ShaderMaterial({
            uniforms: {
                uTexture: { value: document_texture },
            },
            vertexShader: VERTEX_SHADER_CODE,
            fragmentShader: FRAGMENT_SHADER_CODE,
        });
        const document_geometry = new PlaneGeometry(
            this.document_canvas.width,
            this.document_canvas.height

        );
        const document_rectangle = new Mesh(document_geometry,
            document_material);

        document_rectangle.position.set(this.document_canvas.width * 0.5,
            this.document_canvas.height * 0.5, -5);
        document_material.side = DoubleSide;

        if (overlay_texture != null) {
            const overlay_material = new ShaderMaterial({
                uniforms: {
                    uTexture: { value: overlay_texture },
                },
                vertexShader: VERTEX_SHADER_CODE,
                fragmentShader: FRAGMENT_SHADER_CODE,
                transparent: true
            });
            overlay_texture.minFilter = NearestFilter;
            overlay_texture.magFilter = NearestFilter;
            overlay_texture.needsUpdate = true;
            overlay_material.side = DoubleSide;
            const rect_mapping: RectToRectMapping = bounds_mapping;
            const from_rect: Rect = rect_mapping.from;
            const to_rect: Rect = rect_mapping.to;

            const overlay_geometry = new PlaneGeometry(to_rect.w, to_rect.h);
            // Map the UVs so that (0,0) on the plane maps to (0,0) on the texture,
            // and (w1,h1) on the plane maps to (w2,h2) on the texture.


            const newUVs = new Float32Array([
                rleft(from_rect), rbottom(from_rect),   // bottom left
                rright(from_rect), rbottom(from_rect),    // bottom right
                rleft(from_rect), rtop(from_rect),    // top left
                rright(from_rect), rtop(from_rect)     // top right
            ]);
            //console.log(rleft(from_rect), rtop(from_rect));


            overlay_geometry.attributes.uv.array.set(newUVs);
            overlay_geometry.attributes.uv.needsUpdate = true;
            //        console.log(from_rect, newUVs2);
            //       overlay_geometry.attributes.uv.array.set(newUVs2);
            //overlay_geometry.attributes.uv.needsUpdate = true;

            const flat_material = new MeshBasicMaterial({ color: 0xff00ff, side: DoubleSide });
            const overlay_rectangle = new Mesh(overlay_geometry,
                overlay_material);


            overlay_rectangle.position.set(
                to_rect.x + to_rect.w / 2,
                to_rect.y + to_rect.h / 2,
                -2);
            scene.add(document_rectangle);
            scene.add(overlay_rectangle);
        } else {
            scene.add(document_rectangle);

        }
        //overlay_material);
        //console.log(this.overlay_canvas_bounds_signal.value);


        return scene


    }
    init_render_loop() {
        const renderer = new WebGLRenderer({
            antialias: false,
            canvas: this.view_canvas
        });

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

        // Overlay mesh — geometry/material/mesh reused; texture recreated each frame
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

        const scene = new Scene();
        scene.add(docMesh);
        scene.add(overlayMesh);

        effect(() => {
            const overlay_canvas = this.overlay_canvas_signal.value;
            const bounds_mapping = this.overlay_canvas_bounds_signal.value;
            this.document_dirty_signal.value; // subscribe so document-only changes trigger re-render
            const vp = this.view_port_signal.value;

            // Recreate texture and geometry if canvas was resized (e.g. after image load)
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

            // Dispose previous overlay texture to avoid leaking GPU memory
            if (overlayMaterial.uniforms.uTexture.value) {
                overlayMaterial.uniforms.uTexture.value.dispose();
                overlayMaterial.uniforms.uTexture.value = null;
            }

            if (overlay_canvas != null) {
                const to_rect = bounds_mapping.to;

                // Fresh texture from current canvas state — always picks up correct dimensions
                const overlayTexture = new CanvasTexture(overlay_canvas);
                overlayTexture.flipY = false;
                overlayTexture.minFilter = NearestFilter;
                overlayTexture.magFilter = NearestFilter;
                overlayMaterial.uniforms.uTexture.value = overlayTexture;

                overlayMesh.scale.set(to_rect.w, to_rect.h, 1);
                overlayMesh.position.set(to_rect.x + to_rect.w / 2, to_rect.y + to_rect.h / 2, -2);
                overlayMesh.visible = true;
            } else {
                overlayMesh.visible = false;
            }

            renderer.render(scene, this.init_camera(vp));
        });
    }

}