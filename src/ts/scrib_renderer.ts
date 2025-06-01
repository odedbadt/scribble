
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
        // const w = this.view_canvas.width;
        // const h = this.view_canvas.height;
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
        const w = 200;//this.view_canvas.width;
        const h = 200;//this.view_canvas.height;
        const camera = new OrthographicCamera(
            -w, // left
            w,  // right
            -h,           // top
            h,          // bottom
            0,                  // near
            10                    // far
        );
        camera.position.z = 1;

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
            document_material);

        document_rectangle.position.set(
            this.document_canvas.width / 2,
            this.document_canvas.height / 2,
            0
        );
        overlay_texture.flipY = true;
        const overlay_material = new ShaderMaterial({
            uniforms: {
                uTexture: { value: overlay_texture },
            },
            vertexShader: VERTEX_SHADER_CODE,
            fragmentShader: FRAGMENT_SHADER_CODE,
            transparent: true
        });

        document_rectangle.position.set(
            this.document_canvas.width / 2,
            this.document_canvas.height / 2, 0);

        const overlay_geometry = new PlaneGeometry(
            this.overlay_canvas_bounds_signal.value.w,
            this.overlay_canvas_bounds_signal.value.h);
        const uvs = overlay_geometry.attributes.uv.array;

        // Map the UVs so that (0,0) on the plane maps to (0,0) on the texture,
        // and (w1,h1) on the plane maps to (w2,h2) on the texture.
        // const x_ratio = this.editor.tool ? this.editor.tool.staging_canvas.width : 1;
        // const y_ratio = this.editor.tool ? this.editor.tool.staging_canvas.height : 1;
        // console.log(uvs);
        // for (let i = 0; i < uvs.length; i += 2) {
        //     uvs[i] = uvs[i] * x_ratio;
        //     uvs[i + 1] = uvs[i + 1] * y_ratio;
        // }   
        // console.log(uvs);
        overlay_geometry.attributes.uv.needsUpdate = true;

        const overlay_rectangle = new Mesh(overlay_geometry,
            overlay_material);
        overlay_rectangle.position.set(
            this.overlay_canvas_bounds_signal.value.x + this.overlay_canvas_bounds_signal.value.w / 2,
            this.view_canvas.height - (this.overlay_canvas_bounds_signal.value.y +
                this.overlay_canvas_bounds_signal.value.h / 2),
            1)

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