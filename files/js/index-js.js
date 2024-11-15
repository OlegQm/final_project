const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const popup = document.getElementById("popup");
const popupMessage = document.getElementById("popupMessage");
const playAgainButton = document.getElementById("playAgainButton");
const nextLevelButton = document.getElementById("nextLevelButton");

let isGameActive = false;
let player;
let bullets = [];
let enemies = [];
let enemyDirection = 1;
let isMovingLeft = false;
let isMovingRight = false;
let canShoot = true;
let killedEnemiesCount = 0;
let nextLevel = "index.html";
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

const playerImg = new Image();
playerImg.src = 'files/images/player.jpg';

const enemyImg = new Image();
enemyImg.src = 'files/images/enemy.jpg';

const bulletImg = new Image();
bulletImg.src = 'files/images/bullet.jpg';

const enemyCounter = document.getElementById("enemyCounter");

function loadProgress() {
    const savedProgress = localStorage.getItem('gameProgress');
    if (savedProgress) {
        const progress = JSON.parse(savedProgress);
        nextLevel = progress.lastCompletedLevel || "index.html";
        console.log("Progress loaded from localStorage:", nextLevel);
    } else {
        console.log("No saved progress found, starting from level 1.");
    }
}

function saveProgress() {
    const progress = {
        lastCompletedLevel: nextLevel
    };
    localStorage.setItem('gameProgress', JSON.stringify(progress));
    console.log("Progress saved to localStorage:", progress);
}

window.addEventListener("load", () => {
    loadProgress();
    if (nextLevel === "index.html") {
        console.log("This is the first level.");
        nextLevelButton.disabled = true;
    } else {
        console.log("This is not the first level.");
        if (!sessionStorage.getItem("firstLoadDone")) {
            sessionStorage.setItem("firstLoadDone", "true");
            window.location.href = "files/pages/pages-html/" + nextLevel;
        }
    }
    resizeCanvas();
    updateEnemyCounter();
});

function resizeCanvas() {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
}

window.addEventListener("resize", resizeCanvas);

playAgainButton.addEventListener("click", () => {
    popup.classList.add("hidden");
    killedEnemiesCount = 0;
    resetGame();
    isGameActive = true;
    gameLoop();
});

nextLevelButton.addEventListener("click", () => {
    popup.classList.add("hidden");
    saveProgress();
    window.location.href = "files/pages/pages-html/" + nextLevel;
});

function showPopup(message) {
    popupMessage.textContent = message;
    popup.classList.remove("hidden");
}

function createPlayer() {
    player = {
        x: canvas.width / 2 - 15,
        y: canvas.height - 30,
        width: 30,
        height: 30,
        speed: Math.max(2, canvas.width * 0.007)
    };
}

function createEnemies() {
    enemies = [];
    const enemyWidth = 30;
    const enemyHeight = 30;
    const startX = 50;
    const startY = 30;
    const gap = 40;

    const rows = isMobile ? 3 : 4;
    const cols = isMobile ? 6 : 10;

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            enemies.push({
                x: startX + col * gap,
                y: startY + row * gap,
                width: enemyWidth,
                height: enemyHeight,
                speed: Math.max(1, canvas.width * 0.002)
            });
        }
    }
}

function gameLoop() {
    if (!isGameActive) return;

    update();
    draw();

    if (isGameActive) {
        requestAnimationFrame(gameLoop);
    }
}

function update() {
    if (isMovingLeft && player.x > 0) {
        player.x -= player.speed;
    }
    if (isMovingRight && player.x < canvas.width - player.width) {
        player.x += player.speed;
    }

    bullets.forEach((bullet, index) => {
        bullet.y -= bullet.speed;
        if (bullet.y < 0) {
            bullets.splice(index, 1);
        }
    });

    let hitWall = false;
    enemies.forEach(enemy => {
        enemy.x += enemyDirection * enemy.speed;

        if (enemy.x <= 0 || enemy.x + enemy.width >= canvas.width) {
            hitWall = true;
        }
    });

    if (hitWall) {
        enemyDirection *= -1;
        enemies.forEach(enemy => {
            enemy.y += 20;
            if (enemy.y + enemy.height >= canvas.height - player.height) {
                isGameActive = false;
                showPopup("Game Over");
                saveProgress();
            }
        });
    }

    checkCollisions();
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.drawImage(playerImg, player.x, player.y, player.width, player.height);

    bullets.forEach(bullet => {
        ctx.drawImage(bulletImg, bullet.x, bullet.y, bullet.width, bullet.height);
    });

    enemies.forEach(enemy => {
        ctx.drawImage(enemyImg, enemy.x, enemy.y, enemy.width, enemy.height);
    });
}

function createBullet() {
    if (canShoot) {
        bullets.push({
            x: player.x + player.width / 2 - 2,
            y: player.y,
            width: 4,
            height: 10,
            speed: Math.max(4, canvas.height * 0.01)
        });
        canShoot = false;
        setTimeout(() => {
            canShoot = true;
        }, 1); // BULLET SPEED 500 ms
    }
}

function checkCollisions() {
    bullets.forEach((bullet, bIndex) => {
        enemies.forEach((enemy, eIndex) => {
            if (
                bullet.x < enemy.x + enemy.width &&
                bullet.x + bullet.width > enemy.x &&
                bullet.y < enemy.y + enemy.height &&
                bullet.y + bullet.height > enemy.y
            ) {
                enemies.splice(eIndex, 1);
                bullets.splice(bIndex, 1);
                killedEnemiesCount++;
                updateEnemyCounter();

                if (enemies.length === 0) {
                    isGameActive = false;
                    showPopup("You Win!");
                    nextLevel = "second-level-page.html";
                    saveProgress();
                    nextLevelButton.disabled = false;
                }
            }
        });
    });

    enemies.forEach(enemy => {
        if (
            player.x < enemy.x + enemy.width &&
            player.x + player.width > enemy.x &&
            player.y < enemy.y + enemy.height &&
            player.y + player.height > enemy.y
        ) {
            isGameActive = false;
            showPopup("Game Over");
            saveProgress();
        }
    });
}

function resetGame() {
    resizeCanvas();
    createPlayer();
    createEnemies();
    bullets = [];
    killedEnemiesCount = 0;
    updateEnemyCounter();
    isGameActive = true;
}

function updateEnemyCounter() {
    enemyCounter.textContent = killedEnemiesCount;
}

document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
        isMovingLeft = true;
    }
    if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
        isMovingRight = true;
    }
    if (e.key === " " && !isMobile) {
        createBullet();
    }
});

document.addEventListener("keyup", (e) => {
    if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
        isMovingLeft = false;
    }
    if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
        isMovingRight = false;
    }
});

const startButton = document.getElementById("startButton");

startButton.addEventListener("click", () => {
    startButton.classList.add("hidden");
    resetGame();
    isGameActive = true;
    gameLoop();
});

if (isMobile) {
    window.addEventListener("devicemotion", (event) => {
        if (!isGameActive) return;

        const { x } = event.accelerationIncludingGravity;

        if (x > 1) {
            player.x -= player.speed;
        } else if (x < -1) {
            player.x += player.speed;
        }

        player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));
    });

    canvas.addEventListener("click", () => {
        if (isGameActive) {
            createBullet();
        }
    });
}

resetGame();
