
import { WebGLRenderer, Scene, Camera, OrthographicCamera, ShaderMaterial, Mesh, PlaneGeometry, Texture, CanvasTexture, MeshBasicMaterial } from "three"
import { FRAGMENT_SHADER_CODE, VERTEX_SHADER_CODE } from "./glsl_shader_code"
import { disposeScene } from "./utils";
import { signal, computed, effect, Signal } from "@preact/signals";
import { Rect } from "./types";

export class ScribRenderer {
    document_canvas: HTMLCanvasElement;
    document_context: CanvasRenderingContext2D;
    editor: any;
    view_canvas: HTMLCanvasElement;
    overlay_canvas_signal: Signal<HTMLCanvasElement>;
    overlay_canvas_bounds_signal: Signal<Rect>;
    constructor(overlay_canvas_signal: Signal<HTMLCanvasElement>,
        overlay_canvas_bounds_signal: Signal<Rect>) {
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
            -w / 2, // left
            w / 2,  // right
            -h / 2,           // top
            h / 2,          // bottom
            0,                  // near
            10                    // far
        );
        camera.position.z = 1;
        camera.lookAt(0, 0, 10);
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
            this.view_canvas.width * 2,
            this.view_canvas.height * 2
        );
        const document_rectangle = new Mesh(document_geometry,
            new MeshBasicMaterial({ color: 0x00ff00 }));

        document_rectangle.position.set(0, 0, 2);
        const overlay_material = new ShaderMaterial({
            uniforms: {
                uTexture: { value: overlay_texture },
            },
            vertexShader: VERTEX_SHADER_CODE,
            fragmentShader: FRAGMENT_SHADER_CODE,
            transparent: true
        });
        const rect = this.overlay_canvas_bounds_signal.value
        const w = rect.w;
        const h = rect.h;
        console.log('Got w ', w)
        const overlay_geometry = new PlaneGeometry(w, h);
        const uvs = overlay_geometry.attributes.uv.array;
        // Map the UVs so that (0,0) on the plane maps to (0,0) on the texture,
        // and (w1,h1) on the plane maps to (w2,h2) on the texture.

        const newUVs = new Float32Array([
            10, h - 10,   // bottom left
            w - 10, h - 10,   // bottom right
            10, 10,   // top left
            w - 10, 10    // top right
        ]);

        // overlay_geometry.attributes.uv.array.set(newUVs);
        //overlay_geometry.attributes.uv.needsUpdate = true;

        const overlay_rectangle = new Mesh(overlay_geometry,
            new MeshBasicMaterial({ color: 0xff0000 }));
        //overlay_material);
        //console.log(this.overlay_canvas_bounds_signal.value);
        overlay_rectangle.position.set(
            rect.x + w / 2,
            this.view_canvas.height / 2 - (
                rect.y +
                h / 2),
            2);

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
            overlay_texture.flipY = true;
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