import * as THREE from "three";
const VERTEX_SHADER_CODE = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`
const FRAGMENT_SHADER = `
varying vec2 vUv;
uniform sampler2D uTexture;
void main() {
  gl_FragColor = texture2D(uTexture, vUv);
}
`
function createScene() {
  // Create a WebGLRenderer with WebGL2 context
  const renderer = new THREE.WebGLRenderer({ antialias: false });
  renderer.setSize(500,500);

  // Scene and orthographic camera
  const scene = new THREE.Scene();
  const aspect = 1;
  const cameraSize = 1; // Adjust this to control how much of the scene is visible
  const camera = new THREE.OrthographicCamera(
    -cameraSize * aspect, // left
    cameraSize * aspect,  // right
    cameraSize,           // top
    -cameraSize,          // bottom
    0,                  // near
    10                    // far
  );
  camera.position.z = 1;

  // 2D canvas as the source for texture
  const canvas2D = document.createElement("canvas");
  document.body.appendChild(canvas2D);
  const ctx = canvas2D.getContext("2d")!;
  const canvasSize = 25;
  canvas2D.width = canvasSize;
  canvas2D.height = canvasSize;

  // Draw something on the 2D canvas
  ctx.fillStyle = "blue";
  ctx.fillRect(0, 0, canvasSize, canvasSize);
  ctx.strokeStyle = "black"
  ctx.lineWidth=0.5
  ctx.moveTo(0,canvasSize)
  ctx.lineTo(canvasSize,0);
  ctx.moveTo(0,0)
  ctx.lineTo(canvasSize,canvasSize);
  ctx.stroke();

  const canvas2D_front = document.createElement("canvas");
  document.body.appendChild(canvas2D_front);
  const ctx_front = canvas2D_front.getContext("2d")!;
  canvas2D_front.width = canvasSize;
  canvas2D_front.height = canvasSize;

  // Draw something on the 2D canvas
  ctx_front.fillStyle = "green";
  ctx_front.fillRect(0, 0, canvasSize, canvasSize);
  ctx_front.strokeStyle = "white"
  ctx_front.moveTo(0,256)
  ctx_front.lineTo(256,0)
  ctx_front.stroke()


  // Create a texture from the 2D canvas
  const canvasTexture = new THREE.Texture(canvas2D);
  canvasTexture.magFilter = THREE.NearestFilter;
  canvasTexture.needsUpdate = true;
  document.body.appendChild(renderer.domElement);

  // GLSL material using the canvas texture
  
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTexture: { value: canvasTexture },
    },
    vertexShader: VERTEX_SHADER_CODE,
    fragmentShader: FRAGMENT_SHADER,
  });
  const canvasTexture_front = new THREE.Texture(canvas2D_front);
  canvasTexture_front.needsUpdate = true;
  const material_front = new THREE.ShaderMaterial({
    uniforms: {
      uTexture: { value: canvasTexture_front },
    },
    vertexShader: VERTEX_SHADER_CODE,
    fragmentShader: FRAGMENT_SHADER,
  });

  // Geometry for the rectangle
  const geometry = new THREE.PlaneGeometry(2, 2); // Dimensions match orthographic projection
  const mesh = new THREE.Mesh(geometry, material);
  const geometry_front = new THREE.PlaneGeometry(1, 1); // Dimensions match orthographic projection
  const mesh_front = new THREE.Mesh(geometry_front, material_front);
  mesh.position.set(0,0,0)
  mesh_front.position.set(0,0,90);
  scene.add(mesh);
  //scene.add(mesh_front);

  document.body.appendChild(renderer.domElement);

  // Animation loop
  function animate() {
    // Update the canvas texture
    // ctx.fillStyle = "blue";
    // ctx.fillRect(0, 0, canvasSize, canvasSize);
    // ctx.strokeStyle = "black"
    // ctx.moveTo(0,0)
    // ctx.lineTo(256,256)
    // ctx.stroke()
  //    ctx.fillText(`Time: ${Date.now() % 10000}`, 50, 100);
    canvasTexture.needsUpdate = true;
    canvasTexture_front.needsUpdate = true;
    renderer.render(scene, camera);
    setTimeout(animate,1500);

  }

  animate();
}
window.addEventListener('load', createScene);


