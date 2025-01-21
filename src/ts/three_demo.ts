import * as THREE from "three";

function createScene() {
  // Create a WebGLRenderer with WebGL2 context
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);

  // Scene and orthographic camera
  const scene = new THREE.Scene();
  const aspect = window.innerWidth / window.innerHeight;;
  const cameraSize = 1; // Adjust this to control how much of the scene is visible
  const camera = new THREE.OrthographicCamera(
    -cameraSize * aspect, // left
    cameraSize * aspect,  // right
    cameraSize,           // top
    -cameraSize,          // bottom
    0.1,                  // near
    10                    // far
  );
  camera.position.z = 1;

  // 2D canvas as the source for texture
  const canvas2D = document.createElement("canvas");
  document.body.appendChild(canvas2D);
  document.body.appendChild(renderer.domElement);
  const ctx = canvas2D.getContext("2d")!;
  const canvasSize = 256;
  canvas2D.width = canvasSize;
  canvas2D.height = canvasSize;

  // Draw something on the 2D canvas
  ctx.fillStyle = "blue";
  ctx.fillRect(0, 0, canvasSize, canvasSize);
  ctx.strokeStyle = "black"
  ctx.moveTo(0,256)
  ctx.lineTo(256,0)
  ctx.stroke()

  // Create a texture from the 2D canvas
  const canvasTexture = new THREE.Texture(canvas2D);
  canvasTexture.needsUpdate = true;

  // GLSL material using the canvas texture
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTexture: { value: canvasTexture },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec2 vUv;
      uniform sampler2D uTexture;
      void main() {
        gl_FragColor = texture2D(uTexture, 
          vec2(floor(vUv*10.0)/10.0)
        );
      }
    `,
  });

  // Geometry for the rectangle
  const geometry = new THREE.PlaneGeometry(2, 2); // Dimensions match orthographic projection
  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  // Animation loop
  function animate() {
    // Update the canvas texture
    ctx.fillStyle = "blue";
    ctx.fillRect(0, 0, canvasSize, canvasSize);
    ctx.strokeStyle = "black"
    ctx.moveTo(0,0)
    ctx.lineTo(256,256)
    ctx.stroke()
  //    ctx.fillText(`Time: ${Date.now() % 10000}`, 50, 100);
    canvasTexture.needsUpdate = true;

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }

  animate();
}
window.addEventListener('load', createScene);


