// On récupère le canvas
const canvas = document.getElementById("gameCanvas");
const restartBtn = document.getElementById('restartBtn');
const ctx = canvas.getContext("2d");
let startTime = performance.now();
// -------------------------- INIT ------------------------------------
let gameRunning = true;
const canvasWidth = 800;
const canvasHeight = 600;
let angle = 0;
let scorefinal = 5;
let leftPoint = 0;
let rightPoint = 0;
const centerX = canvasWidth / 2;
const centerY = canvasHeight / 2;
const paddleWidth = 10;
const paddleHeight = 100;
let ballX = centerX;
let ballY = centerY;
const timebeforenewball = 3000;
let paddleSpeed = 8.5;
let ballSpeed = 4.5;
const increase_vitesse = 8000;
let isPaused = false;
let paused = false;
let waitingToServe = false;
// Positions initiales des raquettes
let leftPaddleY = (canvasHeight - paddleHeight) / 2;
let rightPaddleY = (canvasHeight - paddleHeight) / 2;
// Variables de direction de la balle
let balldirX;
let balldirY;
// ------------------------ INIT TOUCHES CLAVIER -----------------------
// Entrées clavier
const keysPressed = {};
// Écouteur pour les touches pressées
document.addEventListener("keydown", (e) => {
    if (e.code === "Space")
        paused = !paused;
    else if (e.key === "b")
        console.log("BalldirX = ", balldirX, ", BalldirY = ", balldirY);
    else
        keysPressed[e.key] = true;
});
// Écouteur pour les touches relâchées
document.addEventListener("keyup", (e) => {
    keysPressed[e.key] = false;
});
// ------------------------ CALCUL ENVOI BALL RANDOM ------------------
function getRandomPlayableAngle() {
    let angle = 0;
    while (true) {
        angle = Math.random() * 2 * Math.PI;
        // Plages interdites (trop verticales ou trop horizontales)
        const isTooVertical = ((angle >= 1.2 && angle <= 1.9) || // proche de π/2
            (angle >= 4.4 && angle <= 5.1) // proche de 3π/2
        );
        const isTooHorizontal = ((angle >= 0 && angle <= 0.4) || // proche de 0
            (angle >= 2 * Math.PI - 0.4 && angle <= 2 * Math.PI) || // proche de 2π
            (angle >= Math.PI - 0.4 && angle <= Math.PI + 0.4) // proche de π
        );
        if (isTooVertical || isTooHorizontal) {
            continue; // Angle rejeté
        }
        return angle;
    }
}
function initBallDirection() {
    angle = getRandomPlayableAngle();
    //angle =  Math.PI;
    balldirX = ballSpeed * Math.cos(angle);
    balldirY = ballSpeed * Math.sin(angle);
    //console.log(`🎯 Nouvelle direction - Vitesse: ${calculateBallSpeed().toFixed(3)}`);
}
function normalizeBallSpeed() {
    const currentSpeed = Math.sqrt(balldirX * balldirX + balldirY * balldirY);
    if (currentSpeed !== 0) {
        balldirX = (balldirX / currentSpeed) * ballSpeed;
        balldirY = (balldirY / currentSpeed) * ballSpeed;
    }
}
initBallDirection();
// --------------------------- TEST VITESSE --------------------------
// Fonction pour calculer la vitesse actuelle
function calculateBallSpeed() {
    return Math.sqrt(balldirX * balldirX + balldirY * balldirY);
}
// Fonction pour afficher les infos de vitesse
function displaySpeedInfo(context) {
    const speed = calculateBallSpeed();
    //console.log(`${context} - Vitesse: ${speed.toFixed(3)} (attendue: ${ballSpeed})`);
}
// --------------------------- FONCTIONS -----------------------------
function getTime() {
    return performance.now() - startTime;
}
function endGame() {
    const endMessageDiv = document.getElementById('endMessage');
    let message = '';
    if (leftPoint == 10)
        message = '🏆 Joueur 1 gagne la partie !';
    else
        message = '🏆 Joueur 2 gagne la partie !';
    if (endMessageDiv) {
        endMessageDiv.textContent = message;
        endMessageDiv.style.display = 'block';
    }
    gameRunning = false;
}
function update_score() {
    const scoreP1 = document.getElementById('scoreP1');
    const scoreP2 = document.getElementById('scoreP2');
    if (ballX < 45)
        rightPoint++;
    else
        leftPoint++;
    if (scoreP1)
        scoreP1.textContent = `Joueur 1 : ${leftPoint}`;
    if (scoreP2)
        scoreP2.textContent = `Joueur 2 : ${rightPoint}`;
}
function update_paddle() {
    if (keysPressed["w"] && leftPaddleY > 0) {
        leftPaddleY -= paddleSpeed;
    }
    if (keysPressed["s"] && leftPaddleY < canvasHeight - paddleHeight) {
        leftPaddleY += paddleSpeed;
    }
    // Joueur droit : flèches ↑ et ↓
    if (keysPressed["ArrowUp"] && rightPaddleY > 0) {
        rightPaddleY -= paddleSpeed;
    }
    if (keysPressed["ArrowDown"] && rightPaddleY < canvasHeight - paddleHeight) {
        rightPaddleY += paddleSpeed;
    }
}
function updateBalldir(side) {
    let paddleY = side === 0 ? leftPaddleY : rightPaddleY;
    let relativeImpact = (ballY - paddleY) / paddleHeight;
    let maxBounceAngle = Math.PI / 3;
    // Convertit l'impact en angle [-max, +max]
    let bounceAngle = (relativeImpact - 0.5) * 2 * maxBounceAngle;
    balldirX = ballSpeed * Math.cos(bounceAngle);
    balldirY = ballSpeed * Math.sin(bounceAngle);
    // Inverse la direction horizontale selon le côté
    if (side === 1)
        balldirX = -balldirX;
}
function display_time() {
    if (!ctx)
        return;
    ctx.fillStyle = "black";
    ctx.font = "16px Arial";
    ctx.fillText("yoooo", paddleWidth / 2, paddleHeight / 2);
}
function update_ball() {
    if (isPaused)
        return;
    if (leftPoint == scorefinal || rightPoint == scorefinal)
        endGame();
    ballX += balldirX;
    ballY += balldirY;
    if (ballX < 0 || ballX > canvasWidth) {
        console.log(`🎯 BUT ! ballX = ${ballX}`);
        isPaused = true;
        display_time();
        setTimeout(() => {
            update_score();
            ballX = canvasWidth / 2;
            ballY = canvasHeight / 2;
            ballSpeed = 4.5;
            paddleSpeed = 8.5;
            initBallDirection();
            startTime = performance.now();
            isPaused = false;
        }, timebeforenewball);
        return;
    }
    // Rebonds sur les murs haut et bas
    if (ballY <= 0 || ballY >= canvasHeight) {
        balldirY *= -1;
        normalizeBallSpeed();
    }
    // raquette gauche
    if (ballX <= 40 &&
        ballX >= 25 &&
        ballY >= leftPaddleY - 5 &&
        ballY <= leftPaddleY + paddleHeight + 5 &&
        balldirX < 0) {
        if (performance.now() - startTime >= increase_vitesse && ballSpeed < 12) {
            ballSpeed += 1.5;
            paddleSpeed += 0.5;
            startTime = performance.now();
        }
        console.log(`🏓 Rebond raquette gauche à x=${ballX} et y=${ballY}`);
        if (ballSpeed == 4.5)
            ballSpeed = 9;
        updateBalldir(0);
        normalizeBallSpeed();
    }
    // raquette droite
    if (ballX >= canvasWidth - 40 &&
        ballX <= canvasWidth - 25 &&
        ballY >= rightPaddleY - 5 &&
        ballY <= rightPaddleY + paddleHeight + 5 &&
        balldirX > 0) {
        if (performance.now() - startTime >= increase_vitesse && ballSpeed < 12) {
            ballSpeed += 1.5;
            paddleSpeed += 0.5;
            startTime = performance.now();
        }
        console.log(`🏓 Rebond raquette droite à x=${ballX} et y=${ballY}`);
        if (ballSpeed == 4.5)
            ballSpeed = 9;
        updateBalldir(1);
        normalizeBallSpeed();
    }
}
function draw() {
    if (!ctx)
        return;
    // Effacer le canvas
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    // Dessiner les raquettes
    ctx.fillStyle = "blue";
    ctx.fillRect(30, leftPaddleY, paddleWidth, paddleHeight); // gauche
    ctx.fillStyle = "red";
    ctx.fillRect(canvasWidth - 30 - paddleWidth, rightPaddleY, paddleWidth, paddleHeight); // droite
    // Dessiner la balle
    ctx.fillStyle = "black";
    ctx.beginPath();
    ctx.arc(ballX, ballY, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "black";
    ctx.font = "16px Arial";
    const currentSpeed = calculateBallSpeed();
    ctx.fillText(`Vitesse: ${currentSpeed.toFixed(3)}`, 10, 30);
    // Indicateur de vitesse correcte
    if (Math.abs(currentSpeed - ballSpeed) < 0.001) {
        ctx.fillStyle = "green";
        ctx.fillText("✅ Vitesse OK", 10, 50);
    }
    else {
        ctx.fillStyle = "red";
        ctx.fillText("❌ Vitesse incorrecte", 10, 50);
    }
    ctx.fillStyle = "black";
    ctx.font = "16px Arial";
    ctx.fillText(`⏱️ Temps : ${getTime().toFixed(0)} ms`, 10, 70);
    ctx.fillStyle = "black",
        ctx.font = "16px Arial";
    ctx.fillText(`Vitesse: ${currentSpeed.toFixed(3)}`, 10, 30);
}
// Fonction exportée pour démarrer le jeu
export function startGameLoop() {
    initBallDirection();
    gameLoop();
}
// Boucle principale
function gameLoop() {
    if (!paused) {
        update_paddle();
        update_ball();
        draw();
    }
    if (gameRunning == true)
        requestAnimationFrame(gameLoop); // boucle infinie à 60 FPS
    else {
        if (restartBtn) {
            restartBtn.style.display = 'inline-block';
            restartBtn.onclick = () => {
                location.reload(); // ou bien tu réinitialises manuellement tous les éléments du jeu
            };
        }
    }
}
//# sourceMappingURL=game_without_classes.js.map