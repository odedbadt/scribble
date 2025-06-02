
import { WebGLRenderer, Scene, Camera, OrthographicCamera, ShaderMaterial, DoubleSide, Mesh, PlaneGeometry, Texture, CanvasTexture, MeshBasicMaterial } from "three"
import { FRAGMENT_SHADER_CODE, VERTEX_SHADER_CODE } from "./glsl_shader_code"
import { disposeScene } from "./utils";
import { signal, computed, effect, Signal } from "@preact/signals";
import { Rect, RectToRectMapping, bottom, right } from "./types";
import { from } from "rxjs";

export class ScribRenderer {
    document_canvas: HTMLCanvasElement;
    document_context: CanvasRenderingContext2D;
    editor: any;
    view_canvas: HTMLCanvasElement;
    overlay_canvas_signal: Signal<HTMLCanvasElement>;
    overlay_canvas_bounds_signal: Signal<RectToRectMapping>;
    constructor(overlay_canvas_signal: Signal<HTMLCanvasElement>,
        overlay_canvas_bounds_signal: Signal<RectToRectMapping>) {
        this.document_canvas = document.getElementById('document-canvas')! as HTMLCanvasElement;
        this.view_canvas = document.getElementById('view-canvas')! as HTMLCanvasElement;
        this.document_context = this.document_canvas.getContext('2d', { willReadFrequently: true, texImage3d: false }) as CanvasRenderingContext2D;
        this.document_context.imageSmoothingEnabled = false;
        this.document_context.globalCompositeOperation = 'source-over';
        this.overlay_canvas_signal = overlay_canvas_signal;
        this.overlay_canvas_bounds_signal = overlay_canvas_bounds_signal;

        this.init_camera();
        this.init_render_loop();
    }
    init_camera(): Camera {
        // const aspect = this.view_canvas.clientWidth / this.view_canvas.clientHeight;
        // const camera = new OrthographicCamera(
        //     -w, // left
        //     w,  // right
        //     -h,           // top
        //     h,          // bottom
        //     0,                  // near
        //     10                    // far
        // );
        // camera.position.z = 1;
        // return camera
        const aspect = 1;
        const w = this.view_canvas.width;
        const h = this.view_canvas.height;
        const camera = new OrthographicCamera(
            0, // left
            w,  // right
            0,           // top
            h,          // bottom
            0,                  // near
            10                    // far
        );
        camera.position.set(0, 0, 1);
        camera.lookAt(0, 0, 0);
        return camera;
    }
    build_scene(overlay_texture: CanvasTexture): Scene {
        // Scene and orthographic camera
        const scene = new Scene();
        const document_texture = new CanvasTexture(
            this.document_canvas);
        document_texture.flipY = true;
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
            new MeshBasicMaterial({ color: 0x00ff00, side: DoubleSide }));

        document_rectangle.position.set(this.document_canvas.width * 0.5,
            this.document_canvas.width * 0.5, -5);
        const overlay_material = new ShaderMaterial({
            uniforms: {
                uTexture: { value: overlay_texture },
            },
            vertexShader: VERTEX_SHADER_CODE,
            fragmentShader: FRAGMENT_SHADER_CODE,
            transparent: true
        });
        overlay_texture.needsUpdate = true;
        overlay_material.side = DoubleSide;
        const rect_mapping: RectToRectMapping = this.overlay_canvas_bounds_signal.value
        const from_rect: Rect = rect_mapping.from;
        const to_rect: Rect = rect_mapping.to;

        const overlay_geometry = new PlaneGeometry(to_rect.w, to_rect.h);
        // Map the UVs so that (0,0) on the plane maps to (0,0) on the texture,
        // and (w1,h1) on the plane maps to (w2,h2) on the texture.



        //        console.log(from_rect, newUVs2);
        //       overlay_geometry.attributes.uv.array.set(newUVs2);
        //overlay_geometry.attributes.uv.needsUpdate = true;

        const overlay_rectangle = new Mesh(overlay_geometry,
            overlay_material);


        //new MeshBasicMaterial({ color: 0xff00ff, side: DoubleSide }));
        overlay_rectangle.position.set(
            to_rect.x + to_rect.w / 2,
            to_rect.y + to_rect.h / 2,
            -2);
        //overlay_material);
        //console.log(this.overlay_canvas_bounds_signal.value);


        scene.add(document_rectangle);
        scene.add(overlay_rectangle);

        return scene


    }
    init_render_loop() {
        const renderer = new WebGLRenderer({
            antialias: true,
            canvas: this.view_canvas
        });
        let scene: Scene | null = null;
        effect(() => {
            const overlay_canvas = this.overlay_canvas_signal.value;
            if (!overlay_canvas) {
                return;
            }
            const overlay_texture = new CanvasTexture(
                overlay_canvas);
            overlay_texture.flipY = false;
            const v = this.overlay_canvas_signal.value;
            overlay_texture.image = v;
            overlay_texture.needsUpdate = true;
            scene = this.build_scene(overlay_texture)
            renderer.render(scene, this.init_camera());
        });
        if (scene != null) {
            disposeScene(scene);
        }
    }

}