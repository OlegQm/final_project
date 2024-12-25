const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const popup = document.getElementById("popup");
const popupMessage = document.getElementById("popupMessage");
const playAgainButton = document.getElementById("playAgainButton");
const nextLevelButton = document.getElementById("nextLevelButton");
const startButton = document.getElementById("startButton");
let gameTitle = document.getElementById("gameTitle");
const enemyCounterContainer = document.getElementById("enemyCounterContainer");
const leftArrow = document.getElementById("leftArrow");
const rightArrow = document.getElementById("rightArrow");

let isGameActive = false;
let isPaused = false;
let player;
let bullets = [];
let enemies = [];
let levelsCompleted = [];
let enemyDirection = 1;
let isMovingLeft = false;
let isMovingRight = false;
let canShoot = true;
let killedEnemiesCount = 0;
let currentLevelConfig;
let currentDifficulty = "low";
let currentLevelIndex = 0;
let boss;
let bossHealth;
const totalLevelsToPlay = 6;
nextLevelButton.disabled = true;
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

const playerImg = new Image();
playerImg.src = "../images/player.jpg";

const enemyImg = new Image();
enemyImg.src = "../images/enemy.jpg";

const bulletImg = new Image();
bulletImg.src = "../images/bullet.jpg";

const bossImg = new Image();
bossImg.src = "../images/boss.jpg";

const enemyCounter = document.getElementById("enemyCounter");

const endGamePopup = document.createElement("div");
endGamePopup.id = "endGamePopup";
endGamePopup.classList.add("hidden");
endGamePopup.innerHTML = `
    <p>Game Over! All levels completed.</p>
    <button id="restartGameButton">Restart</button>
`;
document.body.appendChild(endGamePopup);

function restartGame() {
    isGameActive = false;
    isPaused = false;
    levelsCompleted = [];
    currentLevelIndex = 0;
    killedEnemiesCount = 0;
    enemyCounterContainer.classList.add("hidden");
    pauseButton.disabled = false;
    updateEnemyCounter();
    gameTitle.textContent = "Space Invaders";
    localStorage.removeItem("gameProgress");
    bullets = [];
    enemies = [];
    player = null;
    endGamePopup.classList.add("hidden");
    startButton.classList.remove("hidden");
}

function createBoss() {
    const bossWidth = currentLevelConfig.cols * 30;
    const bossHeight = currentLevelConfig.rows * 30;
    const bossX = (canvas.width - bossWidth) / 2;
    const bossY = 50;

    boss = {
        x: bossX,
        y: bossY,
        width: bossWidth,
        height: bossHeight,
        health: currentLevelConfig.health,
        spawnCooldown: 0,
    };

    bossHealth = boss.health;
}

function isOverlapping(x, y, width, height, entities) {
    for (const entity of entities) {
        if (
            x < entity.x + entity.width &&
            x + width > entity.x &&
            y < entity.y + entity.height &&
            y + height > entity.y
        ) {
            return true;
        }
    }
    return false;
}

function teleportEnemy(enemy) {
    let newX, newY;
    const maxAttempts = 100;
    let attempts = 0;

    do {
        newX = Math.random() * (canvas.width - enemy.width - 60) + 30;
        newY = Math.random() * (canvas.height / 2 - enemy.height);
        attempts++;
    } while (isOverlapping(newX, newY, enemy.width, enemy.height, enemies) && attempts < maxAttempts);

    if (attempts < maxAttempts) {
        enemy.x = newX;
        enemy.y = newY;
    }
}

function drawBoss() {
    if (!boss) return;

    ctx.drawImage(bossImg, boss.x, boss.y, boss.width, boss.height);

    ctx.fillStyle = "white";
    ctx.font = "20px Arial";
    ctx.fillText(`Boss HP: ${bossHealth}`, boss.x + boss.width / 2 - 40, boss.y - 10);
}

function spawnEnemies() {
    if (!boss || boss.spawnCooldown > 0 || enemies.length >= 20) return;

    const enemyCount = Math.min(currentLevelConfig.n, 20 - enemies.length);
    const enemyWidth = 30;

    for (let i = 0; i < enemyCount; i++) {
        let attempts = 0;
        let newEnemy;

        do {
            const enemyX = Math.random() * (canvas.width - 4 * enemyWidth) + 2 * enemyWidth;
            const enemyY = Math.random() * (canvas.height / 2 - enemyWidth);

            newEnemy = {
                x: enemyX,
                y: enemyY,
                width: enemyWidth,
                height: enemyWidth,
                speed: currentLevelConfig.enemySpeed || Math.max(1, canvas.width * 0.002),
            };

            attempts++;
        } while (attempts < 10 && enemies.some(enemy => checkOverlap(enemy, newEnemy)));

        if (attempts < 10) {
            enemies.push(newEnemy);
        }
    }

    boss.spawnCooldown = 300;
}

function checkOverlap(enemy1, enemy2) {
    return (
        enemy1.x < enemy2.x + enemy2.width &&
        enemy1.x + enemy1.width > enemy2.x &&
        enemy1.y < enemy2.y + enemy2.height &&
        enemy1.y + enemy1.height > enemy2.y
    );
}

function updateBoss() {
    if (!boss) return;

    boss.x += currentLevelConfig.bossSpeed * enemyDirection;
    if (boss.x <= 0 || boss.x + boss.width >= canvas.width) {
        enemyDirection *= -1;
    }

    if (boss.spawnCooldown > 0) {
        boss.spawnCooldown--;
    }

    if (bossHealth <= 0) {
        boss = null;
        enemies = [];
        isGameActive = false;
        showPopup("Boss defeated! You win!");
        nextLevelButton.disabled = false;
        saveProgress();
    }
}

document.getElementById("restartGameButton").addEventListener("click", restartGame);

const pauseButton = document.createElement("button");
pauseButton.id = "pauseButton";
pauseButton.textContent = "Pause";
enemyCounterContainer.insertAdjacentElement("afterbegin", pauseButton);
enemyCounterContainer.classList.add("hidden");

const pauseModal = document.createElement("div");
pauseModal.id = "pauseModal";
pauseModal.classList.add("hidden");
pauseModal.innerHTML = `
    <div class="pause-modal-content">
        <p>Game Paused</p>
        <button id="resumeButton">Continue</button>
    </div>
`;
document.body.appendChild(pauseModal);

function resumeTheGame() {
    if (isPaused) {
        isPaused = false;
        pauseModal.classList.add("hidden");
        pauseButton.disabled = false;
        if (isGameActive) gameLoop();
    }
}

document.getElementById("resumeButton").addEventListener("click", resumeTheGame);

function pauseTheGame() {
    if (!isPaused) {
        isPaused = true;
        pauseModal.classList.remove("hidden");
        pauseButton.disabled = true;
    }
}

pauseButton.addEventListener("click", pauseTheGame);

function excludeElements(arr1, arr2) {
    return arr1.filter((element) => !arr2.includes(element));
}

function getRandomNumberFromArray(array) {
    const randomIndex = Math.floor(Math.random() * array.length);
    return array[randomIndex];
}

function getStyledDifficultyElement(difficulty) {
    const span = document.createElement("span");
    span.style.fontWeight = "bold";
    console.log("DIFF", difficulty);
    switch (difficulty) {
        case "low":
            span.style.color = "green";
            span.textContent = " easy";
            break;
        case "medium":
            span.style.color = "yellow";
            span.textContent = " medium";
            break;
        case "hard":
            span.style.color = "red";
            span.textContent = " hard";
            break;
        case "boss":
            span.style.color = "red";
            span.textContent = " boss";
            break;
        default:
            span.textContent = "Unknown";
    }
    span.id = "difficultyLabel";
    return span;
}

async function loadLevelConfig() {
    try {
        const response = await fetch("levels-settings/tasks.json");
        const data = await response.json();

        if (levelsCompleted.length >= totalLevelsToPlay) {
            handleZeroLevels();
            return;
        }

        let possibleDifficulties = [];
        switch (currentLevelIndex) {
            case 0:
                possibleDifficulties = ["low"];
                break;
            case 1:
                possibleDifficulties = ["low", "medium"];
                break;
            case 2:
                possibleDifficulties = ["medium"];
                break;
            case 3:
                possibleDifficulties = ["medium", "hard"];
                break;
            case 4:
                possibleDifficulties = ["hard"];
                break;
            case 5:
                possibleDifficulties = ["boss"];
                break;
            default:
                possibleDifficulties = ["boss"];
                break;
        }

        currentDifficulty = getRandomNumberFromArray(possibleDifficulties);
        const levels = data[currentDifficulty];

        const unfinishedLevels = excludeElements(
            levels.map((level) => level.id),
            levelsCompleted
        );

        if (unfinishedLevels.length === 0) {
            handleZeroLevels();
            return;
        }

        const randomLevelId = getRandomNumberFromArray(unfinishedLevels);
        currentLevelConfig = levels.find((level) => level.id === randomLevelId);

        const existingDifficulty = document.getElementById("difficultyLabel");
        if (existingDifficulty && existingDifficulty.parentNode === gameTitle) {
            gameTitle.removeChild(existingDifficulty);
        }
        gameTitle.textContent = "";
        gameTitle.appendChild(getStyledDifficultyElement(currentDifficulty));
    } catch (error) {
        console.error("Failed to load level configurations:", error);
    }
}

function loadProgress() {
    const savedProgress = localStorage.getItem("gameProgress");
    if (savedProgress) {
        const progress = JSON.parse(savedProgress);
        levelsCompleted = progress.levelsCompleted || [];
        currentLevelIndex = progress.currentLevelIndex || 0;
    }
}

function saveProgress() {
    if (!levelsCompleted.includes(currentLevelConfig.id)) {
        levelsCompleted.push(currentLevelConfig.id);
        if (currentLevelIndex != totalLevelsToPlay - 1) {
            currentLevelIndex++;
        }
        const progress = {
            levelsCompleted: levelsCompleted,
            currentLevelIndex: currentLevelIndex,
        };
        localStorage.setItem("gameProgress", JSON.stringify(progress));
    }
}

function showPopup(message) {
    popupMessage.textContent = message;
    popup.classList.remove("hidden");
}

playAgainButton.addEventListener("click", () => {
    popup.classList.add("hidden");
    pauseButton.disabled = false;
    killedEnemiesCount = 0;
    enemies = [];
    resetGame();
    isGameActive = true;
    gameLoop();
});

function handleZeroLevels() {
    isGameActive = false;
    clearGameObjects();
    pauseButton.disabled = true;
    endGamePopup.classList.remove("hidden");
}

nextLevelButton.addEventListener("click", async () => {
    popup.classList.add("hidden");
    pauseButton.disabled = false;

    if (levelsCompleted.length >= totalLevelsToPlay) {
        handleZeroLevels();
        return;
    }

    saveProgress();
    await loadLevelConfig();
    resetGame();
    isGameActive = true;
    gameLoop();
});

function handleMotion(event) {
    if (!isGameActive || isPaused) return;

    const x = event.accelerationIncludingGravity?.x || 0;

    if (x > 1) {
        player.x = Math.max(0, player.x - player.speed);
    } else if (x < -1) {
        player.x = Math.min(canvas.width - player.width, player.x + player.speed);
    }
}

function requestMotionPermission() {
    if (
        typeof DeviceMotionEvent !== "undefined" &&
        typeof DeviceMotionEvent.requestPermission === "function"
    ) {
        return DeviceMotionEvent.requestPermission()
            .then(permissionState => {
                if (permissionState === "granted") {
                    console.log("Permission granted for device motion.");
                    window.addEventListener("devicemotion", handleMotion);
                    return true;
                } else {
                    console.log("Permission denied for device motion.");
                    return false;
                }
            })
            .catch(error => {
                console.error("Error requesting motion permission:", error);
                return false;
            });
    } else {
        console.log("DeviceMotionEvent.requestPermission not supported on this device.");
        window.addEventListener("devicemotion", handleMotion);
        return Promise.resolve(true);
    }
}

function handleStart() {
    startButton.classList.add("hidden");
    enemyCounterContainer.classList.remove("hidden");
    loadProgress();

    if (levelsCompleted.length >= totalLevelsToPlay) {
        handleZeroLevels();
        return;
    }

    loadLevelConfig().then(() => {
        resetGame();
        gameLoop();
    });
}

startButton.addEventListener("click", async () => {
    if (isMobile) {
        requestMotionPermission().then(isGranted => {
            if (!isGranted) return;
            handleStart();
        });
    } else {
        handleStart();
    }
});

function resetGame() {
    resizeCanvas();
    createPlayer();
    if (currentLevelIndex === totalLevelsToPlay - 1) {
        createBoss();
    } else {
        createEnemies();
    }
    bullets = [];
    killedEnemiesCount = 0;
    updateEnemyCounter();
    isGameActive = true;
}

function resizeCanvas() {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
}

window.addEventListener("resize", resizeCanvas);

function createPlayer() {
    player = {
        x: canvas.width / 2 - 15,
        y: canvas.height - 30,
        width: 30,
        height: 30,
        speed: currentLevelConfig.playerSpeed || Math.max(2, canvas.width * 0.007),
    };
}

function createEnemies() {
    enemies = [];
    const enemyWidth = 30;
    const enemyHeight = 30;
    const startX = 50;
    const startY = 30;
    const gap = 40;

    let rows = currentLevelConfig.rows;
    let cols = currentLevelConfig.cols;

    if (isMobile && window.innerWidth >= 281 && window.innerWidth <= 768) {
        cols = currentLevelConfig.mobileEnemiesCols || cols;
        rows = currentLevelConfig.mobileEnemiesRows || rows;
    }

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            enemies.push({
                x: startX + col * gap,
                y: startY + row * gap,
                width: enemyWidth,
                height: enemyHeight,
                speed: currentLevelConfig.enemySpeed || Math.max(1, canvas.width * 0.002),
            });
        }
    }
}

function clearGameObjects() {
    bullets = [];
    enemies = [];
    player = null;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function gameLoop() {
    if (!isGameActive || isPaused) return;

    update();
    draw();

    if (isGameActive) {
        requestAnimationFrame(gameLoop);
    }
}

function update() {
    if (player) {
        if (isMovingLeft && player.x > 0) {
            player.x -= player.speed;
        }
        if (isMovingRight && player.x < canvas.width - player.width) {
            player.x += player.speed;
        }
    }

    bullets.forEach((bullet, index) => {
        bullet.y -= bullet.speed;
        if (bullet.y < 0) {
            bullets.splice(index, 1);
        }
    });

    if (boss) {
        updateBoss();
        spawnEnemies();
    }

    let hitWall = false;

    enemies.forEach((enemy, eIndex) => {
        enemy.x += enemyDirection * enemy.speed;

        if (
            boss &&
            enemy.x < boss.x + boss.width &&
            enemy.x + enemy.width > boss.x &&
            enemy.y < boss.y + boss.height &&
            enemy.y + enemy.height > boss.y
        ) {
            teleportEnemy(enemy);
        }

        for (let otherIndex = 0; otherIndex < enemies.length; otherIndex++) {
            if (eIndex !== otherIndex) {
                const otherEnemy = enemies[otherIndex];
                if (
                    isOverlapping(
                        enemy.x,
                        enemy.y,
                        enemy.width,
                        enemy.height,
                        [otherEnemy]
                    )
                ) {
                    teleportEnemy(enemy);
                    break;
                }
            }
        }

        if (enemy.x <= 0 || enemy.x + enemy.width >= canvas.width) {
            hitWall = true;
        }
    });

    if (hitWall) {
        enemyDirection *= -1;
        enemies.forEach((enemy) => {
            enemy.y += currentLevelConfig.enemyDropSpeed || 20;
            if (enemy.y + enemy.height >= canvas.height - player.height) {
                isGameActive = false;
                nextLevelButton.disabled = true;
                showPopup("Game Over");
            }
        });
    }

    checkCollisions();
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (player) {
        ctx.drawImage(playerImg, player.x, player.y, player.width, player.height);
    }

    bullets.forEach((bullet) => {
        ctx.drawImage(bulletImg, bullet.x, bullet.y, bullet.width, bullet.height);
    });

    enemies.forEach((enemy) => {
        ctx.drawImage(enemyImg, enemy.x, enemy.y, enemy.width, enemy.height);
    });

    if (boss) {
        drawBoss();
    }
}

function createBullet() {
    if (canShoot && player) {
        bullets.push({
            x: player.x + player.width / 2 - 2,
            y: player.y,
            width: 4,
            height: 10,
            speed: Math.max(4, canvas.height * 0.01),
        });
        canShoot = false;
        setTimeout(() => {
            canShoot = true;
        }, currentLevelConfig.bulletCooldown || 500);
    }
}

function checkCollisions() {
    bullets.forEach((bullet, bIndex) => {
        let bulletRemoved = false;
    
        if (
            boss &&
            bullet.x < boss.x + boss.width &&
            bullet.x + bullet.width > boss.x &&
            bullet.y < boss.y + boss.height &&
            bullet.y + bullet.height > boss.y
        ) {
            bullets.splice(bIndex, 1);
            bossHealth--;
            bulletRemoved = true;
    
            if (bossHealth <= 0) {
                boss = null;
                isGameActive = false;
                showPopup("Boss defeated! You win!");
                nextLevelButton.disabled = false;
                saveProgress();
            }
            return;
        }
    
        if (bulletRemoved) return;
    
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

                if (enemies.length === 0 && !boss) {
                    isGameActive = false;
                    showPopup("You Win!");
                    nextLevelButton.disabled = false;
                    saveProgress();
                }
            }
        });
    });    
}

function updateEnemyCounter() {
    enemyCounter.textContent = killedEnemiesCount;
}

leftArrow.addEventListener("mousedown", () => {
    isMovingLeft = true;
});

rightArrow.addEventListener("mousedown", () => {
    isMovingRight = true;
});

leftArrow.addEventListener("mouseup", () => {
    isMovingLeft = false;
});

rightArrow.addEventListener("mouseup", () => {
    isMovingRight = false;
});

document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
        isMovingLeft = true;
    }
    else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
        isMovingRight = true;
    }
    else {
        switch(e.key) {
            case " ":
                createBullet();
                break;
            case "p":
            case "P":
                pauseTheGame();
                break;
            case "c":
            case "C":
                resumeTheGame();
                break;
        }
    }
});

document.addEventListener("keyup", (e) => {
    if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
        isMovingLeft = false;
    }
    else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
        isMovingRight = false;
    }
});

if (isMobile) {
    canvas.addEventListener("click", () => {
        if (isGameActive) {
            createBullet();
        }
    });
}
