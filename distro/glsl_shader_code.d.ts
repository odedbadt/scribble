export declare const VERTEX_SHADER_CODE = "\nvarying vec2 vUv;\nvoid main() {\n  vUv = uv;\n  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);\n}\n";
export declare const FRAGMENT_SHADER_CODE = "\nvarying vec2 vUv;\nuniform sampler2D uTexture;\nvoid main() {\n  vec4 rgba = texture2D(uTexture, vUv);\n  gl_FragColor = rgba;\n}\n";
/** Fragment shader that generates an 8-px grey checkerboard pattern.
 *  uDocSize must be set to (canvas_width, canvas_height) so pixel coordinates are exact. */
export declare const CHECKER_FRAGMENT_SHADER_CODE = "\nvarying vec2 vUv;\nuniform vec2 uDocSize;\nvoid main() {\n  vec2 pos = vUv * uDocSize;\n  float tile = 8.0;\n  float checker = mod(floor(pos.x / tile) + floor(pos.y / tile), 2.0);\n  float c = (checker < 1.0) ? (180.0 / 255.0) : (220.0 / 255.0);\n  gl_FragColor = vec4(c, c, c, 1.0);\n}\n";
//# sourceMappingURL=glsl_shader_code.d.ts.map