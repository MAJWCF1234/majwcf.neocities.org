'use strict';

// ======== Canvas Setup ========
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
let waterLine;

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight - document.getElementById('ui').offsetHeight;
    waterLine = canvas.height * 0.6;
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// ======== Environment / Fluid-Like Params ========
const ENV = {
    BUOYANCY_FACTOR: 0.05,
    FRICTION_AIR: 0.96,
    FRICTION_WATER: 0.88,
    GRAVITY: 0.2
};

// ======== Hydra Structure & Data ========
const HYDRA_PARAMS = {
    TRUNK_SEGMENTS: 15,
    TRUNK_SEGMENT_LEN: 10,
    TRUNK_STIFFNESS: 0.6,
    ARM_COUNT: 6,
    ARM_SEGMENTS: 10,
    ARM_SEGMENT_LEN: 8,
    ARM_STIFFNESS: 0.5,
    ARM_BASE_OFFSET: 15,
};

let trunk = [];
let arms = [];
let anchorX, anchorY;
let anchorIsFixed = false;
let isFrozen = false;

// ======== Draggable Circle ========
let circleX, circleY;
const circleRadius = 80;
let isDragging = false;
let dragOffsetX = 0, dragOffsetY = 0;
let repelStrength = 0.5;

// ======= Neural Network Parameters =======
let muscleAmp = 0.3;
let muscleFreq = 0.005;

// ======== Basic Neural Net For Muscle Control ========
const NN = {
    INPUT_SIZE: 5,
    HIDDEN_SIZE: 12,
    OUTPUT_SIZE: () => HYDRA_PARAMS.ARM_COUNT * 2,
    W1: [],
    B1: [],
    W2: [],
    B2: [],
};


function initNetwork() {
    const randVal = () => (Math.random() * 2 - 1) * 0.6;
    NN.W1 = Array.from({length: NN.HIDDEN_SIZE}, () =>
        Array.from({length: NN.INPUT_SIZE}, () => randVal()));
    NN.B1 = Array.from({length: NN.HIDDEN_SIZE}, randVal);

    NN.W2 = Array.from({length: NN.OUTPUT_SIZE()}, () =>
        Array.from({length: NN.HIDDEN_SIZE}, () => randVal()));
    NN.B2 = Array.from({length: NN.OUTPUT_SIZE()}, randVal);
}

function activation(x) {
    return Math.tanh(x);
}

function forwardNN(inputs) {
    let hidden = new Array(NN.HIDDEN_SIZE).fill(0);
    for (let h = 0; h < NN.HIDDEN_SIZE; h++) {
        let sum = NN.B1[h];
        for (let i = 0; i < NN.INPUT_SIZE; i++) {
            sum += NN.W1[h][i] * inputs[i];
        }
        hidden[h] = activation(sum);
    }
    let outs = new Array(NN.OUTPUT_SIZE()).fill(0);
    for (let o = 0; o < NN.OUTPUT_SIZE(); o++) {
        let sum = NN.B2[o];
        for (let h2 = 0; h2 < NN.HIDDEN_SIZE; h2++) {
            sum += NN.W2[o][h2] * hidden[h2];
        }
        outs[o] = activation(sum);
    }
    return outs;
}

// ======== UI Interaction ========
function randomHydraParameters() {
    document.getElementById('trunkSegSlider').value = Math.floor(Math.random() * (25 - 5 + 1) + 5);
    document.getElementById('armCountSlider').value = Math.floor(Math.random() * (10 - 2 + 1) + 2);
    document.getElementById('repelSlider').value = (Math.random() * (2 - -2) + -2).toFixed(1);
    document.getElementById('muscleAmpSlider').value = (Math.random() * (2 - -2) + -2).toFixed(1);
    document.getElementById('muscleFreqSlider').value = (Math.random() * (0.01 - 0.001) + 0.001).toFixed(3);

    updateUIValues();
}

function updateUIValues() {
    document.getElementById('trunkSegInput').value = document.getElementById('trunkSegSlider').value;
    document.getElementById('armCountInput').value = document.getElementById('armCountSlider').value;
    document.getElementById('repelInput').value = document.getElementById('repelSlider').value;
    document.getElementById('muscleAmpInput').value = document.getElementById('muscleAmpSlider').value;
    document.getElementById('muscleFreqInput').value = document.getElementById('muscleFreqSlider').value;

    HYDRA_PARAMS.TRUNK_SEGMENTS = parseInt(document.getElementById('trunkSegSlider').value);
    HYDRA_PARAMS.ARM_COUNT = parseInt(document.getElementById('armCountSlider').value);
    repelStrength = parseFloat(document.getElementById('repelSlider').value);
    muscleAmp = parseFloat(document.getElementById('muscleAmpSlider').value);
    muscleFreq = parseFloat(document.getElementById('muscleFreqSlider').value);
}

// ======== Hydra Initialization ========
function setupHydra() {
    anchorX = canvas.width * 0.5;
    anchorY = canvas.height - 200;

    trunk = [];
    for (let i = 0; i < HYDRA_PARAMS.TRUNK_SEGMENTS; i++) {
        let x = anchorX;
        let y = anchorY - i * HYDRA_PARAMS.TRUNK_SEGMENT_LEN;
        let taperFactor = 1 - (i / HYDRA_PARAMS.TRUNK_SEGMENTS) * 0.6;
        x += (Math.random() - 0.5) * 5 * taperFactor;
        y -= (Math.random() - 0.5) * 5 * taperFactor;
        trunk.push({x: x, y: y, px: x, py: y});
    }

    arms = [];
    const topNode = trunk[trunk.length - 1];
    for (let a = 0; a < HYDRA_PARAMS.ARM_COUNT; a++) {
        let chain = [];
        let angleDeg = -60 + (120 / (HYDRA_PARAMS.ARM_COUNT - 1)) * a;
        let angle = angleDeg * (Math.PI / 180);
        let baseX = topNode.x + HYDRA_PARAMS.ARM_BASE_OFFSET * Math.cos(angle);
        let baseY = topNode.y + HYDRA_PARAMS.ARM_BASE_OFFSET * Math.sin(angle);
        chain.push({x: baseX, y: baseY, px: baseX, py: baseY});

        for (let s = 1; s < HYDRA_PARAMS.ARM_SEGMENTS; s++) {
            let sx = baseX + s * HYDRA_PARAMS.ARM_SEGMENT_LEN * Math.cos(angle);
            let sy = baseY + s * HYDRA_PARAMS.ARM_SEGMENT_LEN * Math.sin(angle);
            chain.push({x: sx, y: sy, px: sx, py: sy});
        }
        arms.push(chain);
    }

    circleX = canvas.width * 0.3;
    circleY = canvas.height * 0.5;
}

// ======== Physics / Update ========
let hydraVx = 0;
let hydraVy = 0;
let hydraOrientation = 0;

function updateHydra() {
    if (isFrozen) return;
    updateUIValues();
    initNetwork();
    updateHydraPhysics();
    solveConstraints();
    handleCollisions();
    updateInfoDisplay();
    updateDebug();

}
function updateHydraPhysics(){
    let base = trunk[0];
    hydraVx = base.x - base.px;
    hydraVy = base.y - base.py;

    let dx = trunk[trunk.length - 1].x - trunk[trunk.length - 2].x;
    let dy = trunk[trunk.length - 1].y - trunk[trunk.length - 2].y;
    hydraOrientation = Math.atan2(dy, dx);

    let speed = Math.sqrt(hydraVx * hydraVx + hydraVy * hydraVy);
    let normVx = hydraVx / (speed || 1);
    let normVy = hydraVy / (speed || 1);
    let timeOsc = Math.sin(performance.now() * 0.001);

    // Adaptive Learning Inputs
    let circleDx = trunk[0].x - circleX;
    let circleDy = trunk[0].y - circleY;
    let circleDist = Math.sqrt(circleDx * circleDx + circleDy * circleDy);
    let circleProximity = 1 / (1 + circleDist / 300);
    let depthFactor = (trunk[0].y / canvas.height);

    let inputs = [normVx, normVy, hydraOrientation, timeOsc, circleProximity];

    let nnOutputs = forwardNN(inputs);
        //Update Trunk positions
    for (let i = 0; i < trunk.length; i++) {
        if (anchorIsFixed && i === 0) continue;

        let p = trunk[i];
        let vx = (p.x - p.px) * ((p.y > waterLine) ? ENV.FRICTION_WATER : ENV.FRICTION_AIR);
        let vy = (p.y - p.py) * ((p.y > waterLine) ? ENV.FRICTION_WATER : ENV.FRICTION_AIR);

        p.px = p.x;
        p.py = p.y;
        vy += ENV.GRAVITY;

        if (p.y > waterLine) {
            vy -= ENV.BUOYANCY_FACTOR;
        }

        if (i === 0 && !anchorIsFixed) {
          let totalAmp = 0;
          let totalPhase = 0;
          for (let a = 0; a < HYDRA_PARAMS.ARM_COUNT; a++) {
            let amp = nnOutputs[a * 2];
            let phase = nnOutputs[a * 2 + 1];
            totalAmp += amp;
            totalPhase += phase;
        }

          let avgAmp = totalAmp / HYDRA_PARAMS.ARM_COUNT;
          let avgPhase = totalPhase / HYDRA_PARAMS.ARM_COUNT;
          let forceX = avgAmp * Math.cos(avgPhase + hydraOrientation) * 0.5;
          let forceY = avgAmp * Math.sin(avgPhase + hydraOrientation) * 0.5;
          vx += forceX;
          vy += forceY;
      }

        let [deltaVx, deltaVy] = applyCircleForce(p);
        vx += deltaVx;
        vy += deltaVy;
        p.x += vx;
        p.y += vy;
        collideWithContainer(p);
    }
    //Update Arm Positions
    for (let a = 0; a < arms.length; a++) {
        let chain = arms[a];
        for (let i = 0; i < chain.length; i++) {
            if (i === 0) continue;
            let p = chain[i];
            let vx = (p.x - p.px) * ((p.y > waterLine) ? ENV.FRICTION_WATER : ENV.FRICTION_AIR);
            let vy = (p.y - p.py) * ((p.y > waterLine) ? ENV.FRICTION_WATER : ENV.FRICTION_AIR);

            p.px = p.x;
            p.py = p.y;
            vy += ENV.GRAVITY;
            if (p.y > waterLine) {
                vy -= ENV.BUOYANCY_FACTOR;
            }
            let amp = nnOutputs[a * 2] * muscleAmp;
            let phase = nnOutputs[a * 2 + 1];
            let t = i;
            let wave = amp * Math.sin((t * 0.5) + performance.now() * muscleFreq + phase);

            let base = chain[i - 1];
            let dx = p.x - base.x;
            let dy = p.y - base.y;
            let len = Math.sqrt(dx * dx + dy * dy) || 0.0001;
            let nx = -dy / len;
            let ny = dx / len;
            vx += wave * nx;
            vy += wave * ny;


            let [deltaVxArm, deltaVyArm] = applyCircleForce(p);
            vx += deltaVxArm;
            vy += deltaVyArm;

            p.x += vx;
            p.y += vy;
            collideWithContainer(p);
        }
    }
}

function solveConstraints(){
    solveTrunkConstraints();
    solveArmConstraints();
    attachArms();

}
function handleCollisions(){
  handleSelfCollisions();
  collideChainWithCircle(trunk);
  for (let chain of arms) {
    collideChainWithCircle(chain);
  }
}

function applyCircleForce(p) {
    let dx = p.x - circleX;
    let dy = p.y - circleY;
    let dist2 = dx * dx + dy * dy;
    let r2 = circleRadius * circleRadius;

    if (dist2 < r2 * 4) {
        let dist = Math.sqrt(dist2) || 0.0001;
        let fMag = repelStrength / dist;
        let deltaVx = dx * fMag;
        let deltaVy = dy * fMag;
        return [deltaVx, deltaVy];
    }
    return [0, 0];
}

function collideWithContainer(p) {
    if (p.x < 0) p.x = 0;
    if (p.x > canvas.width) p.x = canvas.width;
    if (p.y < 0) p.y = 0;
    if (p.y > canvas.height) p.y = canvas.height;
}

function solveTrunkConstraints() {
    const iterations = 6;
    for (let iter = 0; iter < iterations; iter++) {
        for (let i = 0; i < trunk.length - 1; i++) {
            let p1 = trunk[i];
            let p2 = trunk[i + 1];
            let dx = p2.x - p1.x;
            let dy = p2.y - p1.y;
            let dist = Math.sqrt(dx * dx + dy * dy) || 0.0001;
            let diff = (dist - HYDRA_PARAMS.TRUNK_SEGMENT_LEN) / dist;
            let offset = 0.5 * HYDRA_PARAMS.TRUNK_STIFFNESS * diff;
            if (anchorIsFixed && i === 0) {
                p2.x -= dx * offset * 2;
                p2.y -= dy * offset * 2;
            } else {
                p1.x += dx * offset;
                p1.y += dy * offset;
                p2.x -= dx * offset;
                p2.y -= dy * offset;
            }
        }
    }
}

function solveArmConstraints() {
    const iterations = 4;
    for (let iter = 0; iter < iterations; iter++) {
        for (let chain of arms) {
            for (let i = 0; i < chain.length - 1; i++) {
                let p1 = chain[i];
                let p2 = chain[i + 1];
                let dx = p2.x - p1.x;
                let dy = p2.y - p1.y;
                let dist = Math.sqrt(dx * dx + dy * dy) || 0.0001;
                let diff = (dist - HYDRA_PARAMS.ARM_SEGMENT_LEN) / dist;
                let offset = 0.5 * HYDRA_PARAMS.ARM_STIFFNESS * diff;
                p1.x += dx * offset;
                p1.y += dy * offset;
                p2.x -= dx * offset;
                p2.y -= dy * offset;
            }
        }
    }
}

function attachArms() {
    const topNode = trunk[trunk.length - 1];
    for (let chain of arms) {
        let base = chain[0];
        let dx = base.x - topNode.x;
        let dy = base.y - topNode.y;
        base.x -= dx * 0.5;
        base.y -= dy * 0.5;
        topNode.x += dx * 0.5;
        topNode.y += dy * 0.5;
    }
}

function collideChainWithCircle(chain) {
    for (let p of chain) {
        let dx = p.x - circleX;
        let dy = p.y - circleY;
        let dist2 = dx * dx + dy * dy;
        let r2 = circleRadius * circleRadius;
        if (dist2 < r2) {
            let dist = Math.sqrt(dist2) || 0.0001;
            let overlap = circleRadius - dist;
            let nx = dx / dist;
            let ny = dy / dist;
            p.x += nx * overlap;
            p.y += ny * overlap;
        }
    }
}

function handleSelfCollisions() {
    const collisionRadius = 10;
    //Trunk Collisions
    for (let i = 0; i < trunk.length; i++) {
        for (let j = i + 2; j < trunk.length; j++) {
            let p1 = trunk[i];
            let p2 = trunk[j];
            let dx = p2.x - p1.x;
            let dy = p2.y - p1.y;
            let dist2 = dx * dx + dy * dy;
            if (dist2 < collisionRadius * collisionRadius) {
                let dist = Math.sqrt(dist2) || 0.0001;
                let overlap = collisionRadius - dist;
                let nx = dx / dist;
                let ny = dy / dist;
                p1.x -= nx * overlap * 0.5;
                p1.y -= ny * overlap * 0.5;
                p2.x += nx * overlap * 0.5;
                p2.y += ny * overlap * 0.5;
            }
        }
    }

    //Arm / Trunk Collisions
    for (let chain of arms) {
        for (let pArm of chain) {
            for (let pTrunk of trunk) {
                let dx = pArm.x - pTrunk.x;
                let dy = pArm.y - pTrunk.y;
                let dist2 = dx * dx + dy * dy;
                if (dist2 < collisionRadius * collisionRadius) {
                    let dist = Math.sqrt(dist2) || 0.0001;
                    let overlap = collisionRadius - dist;
                    let nx = dx / dist;
                    let ny = dy / dist;
                    pArm.x += nx * overlap * 0.3;
                    pArm.y += ny * overlap * 0.3;
                    pTrunk.x -= nx * overlap * 0.3;
                    pTrunk.y -= ny * overlap * 0.3;
                }
            }
        }
    }

    //Arm on Arm Collisions
  for (let chain of arms) {
    for (let i = 0; i < chain.length; i++) {
        for (let j = i + 2; j < chain.length; j++) {
            let p1 = chain[i];
            let p2 = chain[j];
            let dx = p2.x - p1.x;
            let dy = p2.y - p1.y;
            let dist2 = dx * dx + dy * dy;
            if (dist2 < collisionRadius * collisionRadius) {
                let dist = Math.sqrt(dist2) || 0.0001;
                let overlap = collisionRadius - dist;
                let nx = dx / dist;
                let ny = dy / dist;
                p1.x -= nx * overlap * 0.5;
                p1.y -= ny * overlap * 0.5;
                p2.x += nx * overlap * 0.5;
                p2.y += ny * overlap * 0.5;
            }
        }
      }
    }
}

// ======== Rendering ========
function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, "#003");
    grad.addColorStop(0.6, "#00a");
    grad.addColorStop(1, "#002");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "rgba(255,255,255,0.05)";
    ctx.fillRect(0, waterLine, canvas.width, canvas.height - waterLine);

    let hydraColor = document.getElementById('hydraColor').value;

    ctx.lineWidth = 10;
    ctx.strokeStyle = hydraColor;
    ctx.beginPath();
    ctx.moveTo(trunk[0].x, trunk[0].y);
    for (let i = 1; i < trunk.length; i++) {
        ctx.lineTo(trunk[i].x, trunk[i].y);
    }
    ctx.stroke();

    ctx.lineWidth = 6;
    for (let chain of arms) {
        ctx.beginPath();
        ctx.moveTo(chain[0].x, chain[0].y);
        for (let i = 1; i < chain.length; i++) {
            ctx.lineTo(chain[i].x, chain[i].y);
        }
        ctx.stroke();
    }

    ctx.save();
    let cgrad = ctx.createRadialGradient(circleX, circleY, circleRadius * 0.3, circleX, circleY, circleRadius);
    cgrad.addColorStop(0, "rgba(255,255,255,0.4)");
    cgrad.addColorStop(1, "rgba(255,255,255,0.05)");
    ctx.beginPath();
    ctx.arc(circleX, circleY, circleRadius, 0, 2 * Math.PI);
    ctx.fillStyle = cgrad;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(255,255,255,0.7)";
    ctx.stroke();
    ctx.restore();
}

function updateDebug() {
    const debugTextElement = document.getElementById('debugText');
    debugTextElement.textContent = `
    Trunk Segments: ${HYDRA_PARAMS.TRUNK_SEGMENTS}
    Arm Count: ${HYDRA_PARAMS.ARM_COUNT}
    Repel/Attract: ${repelStrength.toFixed(1)}
    Muscle Amplitude: ${muscleAmp.toFixed(1)}
    Muscle Frequency: ${muscleFreq.toFixed(3)}
    Hydra Orientation: ${hydraOrientation.toFixed(2)}
    `;
}

function updateInfoDisplay(){
  let base = trunk[0];
  hydraVx = base.x - base.px;
  hydraVy = base.y - base.py;
  let velocityElement = document.getElementById('velocity');
  velocityElement.textContent = `Velocity: ${Math.sqrt(hydraVx * hydraVx + hydraVy * hydraVy).toFixed(2)}`;
  let orientationElement = document.getElementById('orientation');
  let angleDeg = (hydraOrientation * 180 / Math.PI).toFixed(1);
  orientationElement.textContent = `Orientation: ${angleDeg}°`;
}
// ======== Main Loop ========
function animate() {
    requestAnimationFrame(animate);
    updateHydra();
    render();
}

// ======== Draggable Circle Events ========
canvas.addEventListener('mousedown', e => {
    let uiHeight = document.getElementById('ui').offsetHeight;
    let mx = e.clientX;
    let my = e.clientY - uiHeight;
    let dx = mx - circleX;
    let dy = my - circleY;
    if (dx * dx + dy * dy <= circleRadius * circleRadius) {
        isDragging = true;
        dragOffsetX = dx;
        dragOffsetY = dy;
    }
});
canvas.addEventListener('mousemove', e => {
    if (isDragging) {
        let uiHeight = document.getElementById('ui').offsetHeight;
        let mx = e.clientX;
        let my = e.clientY - uiHeight;
        circleX = mx - dragOffsetX;
        circleY = my - dragOffsetY;
    }
});
canvas.addEventListener('mouseup', e => {
    isDragging = false;
});
canvas.addEventListener('mouseleave', e => {
    isDragging = false;
});
// Touch Events for Mobile Support
canvas.addEventListener('touchstart', e => {
    let t = e.touches[0];
    let uiHeight = document.getElementById('ui').offsetHeight;
    let mx = t.clientX;
    let my = t.clientY - uiHeight;
    let dx = mx - circleX;
    let dy = my - circleY;
    if (dx * dx + dy * dy <= circleRadius * circleRadius) {
        isDragging = true;
        dragOffsetX = dx;
        dragOffsetY = dy;
    }
});
canvas.addEventListener('touchmove', e => {
    e.preventDefault();
    if (isDragging) {
        let t = e.touches[0];
        let uiHeight = document.getElementById('ui').offsetHeight;
        let mx = t.clientX;
        let my = t.clientY - uiHeight;
        circleX = mx - dragOffsetX;
        circleY = my - dragOffsetY;
    }
}, {passive: false});
canvas.addEventListener('touchend', e => {
    isDragging = false;
});

// ======== Freeze Button ========
document.getElementById('freezeBtn').addEventListener('click', () => {
    isFrozen = !isFrozen;
});

// ======== Randomize Button ========
document.getElementById('randomizeBtn').addEventListener('click', () => {
    randomHydraParameters();
});

// ======== Input Change Event ========
const inputElements = document.querySelectorAll('input[type="number"]');
inputElements.forEach(input => {
    input.addEventListener('input', (e) => {
        const sliderId = e.target.id.replace('Input', 'Slider');
        const slider = document.getElementById(sliderId);

        if (slider) {
            slider.value = e.target.value;
        }
        updateUIValues();
    });
});
const sliderElements = document.querySelectorAll('input[type="range"]');
sliderElements.forEach(slider => {
    slider.addEventListener('input', (e) => {
        const inputId = e.target.id.replace('Slider', 'Input');
        const input = document.getElementById(inputId);

        if (input) {
            input.value = e.target.value;
        }
        updateUIValues();
    });
});

// ======== Reset Hydra Button ========
document.getElementById('resetBtn').addEventListener('click', () => {
    setupHydra();
    initNetwork();
    document.getElementById('velocity').textContent = `Velocity: 0.00`;
    document.getElementById('orientation').textContent = `Orientation: 0°`;
});


// ======== Start ========
initNetwork();
setupHydra();
animate();