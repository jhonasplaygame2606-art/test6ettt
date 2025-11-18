// Runner Turbo 3D - Corrigido

let scene, camera, renderer;
let player, ground;
let obstacles = [];
let clock = new THREE.Clock();
let spawnTimer = 0;
let spawnInterval = 1.2;
let speed = 8;
let score = 0;
let running = false;
let canJump = true;
let lane = 0;

const lanesX = [-3, 0, 3];

// --------------------------------
// Inicialização
// --------------------------------
function init() {
  const container = document.getElementById('game-container');

  scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x0b1220, 10, 90);

  camera = new THREE.PerspectiveCamera(60, window.innerWidth/window.innerHeight, 0.1, 200);
  camera.position.set(0, 4, 10);

  renderer = new THREE.WebGLRenderer({ antialias:true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  container.appendChild(renderer.domElement);

  // Luzes
  scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 0.9));
  const dir = new THREE.DirectionalLight(0xffffff, 0.6);
  dir.position.set(10, 20, 10);
  scene.add(dir);

  // Player (cubo azul)
  const geoP = new THREE.BoxGeometry(1, 2, 1);
  const matP = new THREE.MeshStandardMaterial({ color: 0x22c1c3 });
  player = new THREE.Mesh(geoP, matP);
  player.position.set(0, 1, 0);
  scene.add(player);

  // Chão
  const geoG = new THREE.BoxGeometry(20, 1, 200);
  const matG = new THREE.MeshStandardMaterial({ color: 0x20252b });
  ground = new THREE.Mesh(geoG, matG);
  ground.position.set(0, -0.5, -90);
  scene.add(ground);

  window.addEventListener('resize', onResize);
  window.addEventListener('keydown', onKeyDown);
}

// --------------------------------
// Obstáculos
// --------------------------------
function spawnObstacle() {
  const size = Math.random()*1.2 + 0.8;
  const obs = new THREE.Mesh(
    new THREE.BoxGeometry(size, size, size),
    new THREE.MeshStandardMaterial({ color: 0xff4444 })
  );

  const laneIndex = Math.floor(Math.random()*3);
  obs.position.set(lanesX[laneIndex], size/2, player.position.z - 80);
  scene.add(obs);

  obs.userData.speed = Math.random()*1 + 0.5;
  obstacles.push(obs);
}

// --------------------------------
// Controles
// --------------------------------
function onKeyDown(e) {
  if (!running) return;

  if (e.key === "ArrowLeft") moveLeft();
  if (e.key === "ArrowRight") moveRight();
  if (e.key === " ") jump();
}

function moveLeft() {
  if (lane > -1) lane--;
  player.position.x = lanesX[lane + 1];
}

function moveRight() {
  if (lane < 1) lane++;
  player.position.x = lanesX[lane + 1];
}

function jump() {
  if (!canJump) return;
  canJump = false;

  const startY = player.position.y;
  const peak = startY + 4;

  const tUp = 0.28;
  const tDown = 0.32;

  const t0 = performance.now();

  function upFrame() {
    const t = (performance.now() - t0)/1000;
    if (t < tUp) {
      player.position.y = startY + (peak - startY)*(t/tUp);
      requestAnimationFrame(upFrame);
    } else {
      const d0 = performance.now();
      function downFrame(){
        const td = (performance.now() - d0)/1000;
        if (td < tDown){
          player.position.y = peak - (peak - startY)*(td/tDown);
          requestAnimationFrame(downFrame);
        } else {
          player.position.y = startY;
          canJump = true;
        }
      }
      requestAnimationFrame(downFrame);
    }
  }
  requestAnimationFrame(upFrame);
}

// --------------------------------
// Atualização
// --------------------------------
function update(dt) {
  if (!running) return;

  // Player avança
  player.position.z -= speed * dt * 1.5;

  // Câmera segue o player
  camera.position.z = player.position.z + 12;
  camera.lookAt(player.position);

  // Chão acompanha
  ground.position.z = player.position.z - 100;

  // Obstáculos
  spawnTimer += dt;
  if (spawnTimer > spawnInterval) {
    spawnTimer = 0;
    spawnObstacle();
    spawnInterval = Math.max(0.45, spawnInterval - 0.01);
    speed += 0.05;
  }

  for (let i = obstacles.length - 1; i >= 0; i--) {
    const o = obstacles[i];
    o.position.z += speed * dt * o.userData.speed;

    if (o.position.z > player.position.z + 10) {
      scene.remove(o);
      obstacles.splice(i, 1);
      score += 10;
      document.getElementById("scoreValue").innerText = Math.floor(score);
    }

    const dx = Math.abs(o.position.x - player.position.x);
    const dz = Math.abs(o.position.z - player.position.z);
    const overlapX = dx < 1.2;
    const overlapZ = dz < 1.2;
    const overlapY = player.position.y < (o.geometry.parameters.height + 1);

    if (overlapX && overlapZ && overlapY) {
      gameOver();
    }
  }
}

// --------------------------------
// GAME OVER
// --------------------------------
function gameOver() {
  running = false;
  document.getElementById("restartBtn").style.display = "inline-block";
}

// --------------------------------
// Render Loop
// --------------------------------
function animate() {
  const dt = clock.getDelta();
  update(dt);
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

function onResize(){
  camera.aspect = window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// --------------------------------
// UI
// --------------------------------
window.addEventListener('load', () => {
  init();
  animate();

  document.getElementById('startBtn').onclick = () => {
    running = true;
    score = 0;
    document.getElementById("scoreValue").innerText = "0";
    document.getElementById("startBtn").style.display = "none";
  };

  document.getElementById('restartBtn').onclick = () => {
    obstacles.forEach(o => scene.remove(o));
    obstacles = [];
    score = 0;
    running = true;
    document.getElementById("scoreValue").innerText = "0";
    document.getElementById("restartBtn").style.display = "none";
  };
});
