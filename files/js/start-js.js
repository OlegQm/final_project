const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const popup = document.getElementById("popup");
const popupMessage = document.getElementById("popupMessage");
const playAgainButton = document.getElementById("playAgainButton");
const nextLevelButton = document.getElementById("nextLevelButton");
const startButton = document.getElementById("startButton");
const enemyCounterContainer = document.getElementById("enemyCounterContainer");
const leftArrow = document.getElementById("leftArrow");
const rightArrow = document.getElementById("rightArrow");

let gameTitle = document.getElementById("gameTitle");
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
let currentDifficulty = "low";
let currentLevelIndex = 0;
let selectedLevelID = -1;
let currentLevelConfig;
let boss;
let bossHealth;
let data;
const totalLevelsToPlay = 6;
nextLevelButton.disabled = true;
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
const newLevelNeededIndex = 999999;

const playerImg = new Image();
playerImg.src = "../images/player.png";

const enemyImg = new Image();
enemyImg.src = "../images/enemy.png";

const bulletImg = new Image();
bulletImg.src = "../images/bullet.png";

const bossImg = new Image();
bossImg.src = "../images/boss.png";

const enemyCounter = document.getElementById("enemyCounter");

const endGamePopup = document.createElement("div");
endGamePopup.id = "endGamePopup";
endGamePopup.classList.add("hidden");

endGamePopup.innerHTML = `
<div class="fireworks fireworks-left"></div>
    <div class="fireworks fireworks-right"></div>
    <img src="../images/final.png" alt="Game Over" style="width: 60%; height: auto; margin-bottom: 10px;">
    <p>Game Over! All levels completed and Boss defeated.</p>
    <button id="restartGameButton">Restart</button>
`;
document.body.appendChild(endGamePopup);
loadProgress();

function getElementTotalHeight(element) {
    const style = window.getComputedStyle(element);
    const marginTop = parseFloat(style.marginTop) || 0;
    const marginBottom = parseFloat(style.marginBottom) || 0;
    return element.offsetHeight + marginTop + marginBottom;
}

function adjustCanvasHeight() {
    const title = document.getElementById("gameTitle");
    const counter = document.getElementById("enemyCounterContainer");

    const totalTopHeight = getElementTotalHeight(title) + getElementTotalHeight(counter);

    const screenHeight = window.innerHeight;

    const canvasHeight = screenHeight - totalTopHeight;

    const canvas = document.getElementById("gameCanvas");
    canvas.style.height = `${canvasHeight}px`;
    canvas.style.width = "100%";
}

adjustCanvasHeight();

function getSelectedIndex() {
    const stringSelectedIndex = localStorage.getItem("selectedLevelIndex");
    if (stringSelectedIndex) {
        const selectedIndex = parseInt(stringSelectedIndex, 10);
        if (selectedIndex >= 0 && selectedIndex < levelsCompleted.length) {
            selectedLevelID = levelsCompleted[selectedIndex];
        }
        localStorage.setItem("selectedLevelIndex", -1);
    }
}

getSelectedIndex();

function restartGame() {
    isGameActive = false;
    isPaused = false;
    levelsCompleted = [];
    currentLevelIndex = 0;
    killedEnemiesCount = 0;
    enemyCounterContainer.classList.add("hidden");
    pauseButton.disabled = false;
    updateEnemyCounter();
    gameTitle.textContent = "T&J";
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
            const enemySpeed = isMobile ? currentLevelConfig.mobileEnemySpeed : currentLevelConfig.enemySpeed;
            newEnemy = {
                x: enemyX,
                y: enemyY,
                width: enemyWidth,
                height: enemyWidth,
                speed: enemySpeed || Math.max(1, canvas.width * 0.002),
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
        saveProgress();
        handleZeroLevels();
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
        <button id="resumeButton" class="pauseWindowButton">Continue</button>
        <button id="nextLevelWindowButton" class="pauseWindowButton">Next level</button>
        <button id="previousLevelButton" class="pauseWindowButton">Previous level</button>
        <button id="homeButton" class="pauseWindowButton">Home</button>
        <button id="levelsListButton" class="pauseWindowButton">Levels list</button>
    </div>
`;
document.body.appendChild(pauseModal);

function getPreviousLevel() {
    const levelsCompletedLength = levelsCompleted.length;
    if (!levelsCompletedLength) {
        return -1;
    }
    if (!levelsCompleted.includes(currentLevelConfig.id)) {
        return levelsCompleted[levelsCompletedLength - 1];
    }
    const currentLevelIndex = levelsCompleted.indexOf(currentLevelConfig.id);
    if (currentLevelIndex !== 0) {
        return levelsCompleted[currentLevelIndex - 1];
    }
    return -1;
}

function getNextLevel() {
    const levelsCompletedLength = levelsCompleted.length;
    if (!levelsCompletedLength || !levelsCompleted.includes(currentLevelConfig.id)) {
        return -1;
    }
    const currentLevelIndex = levelsCompleted.indexOf(currentLevelConfig.id);
    if (currentLevelIndex === levelsCompletedLength - 1) {
        return newLevelNeededIndex;
    }
    return levelsCompleted[currentLevelIndex + 1];
}

const resumeButton = document.getElementById("resumeButton");
const nextLevelWindowButton = document.getElementById("nextLevelWindowButton");
const previousLevelButton = document.getElementById("previousLevelButton");
const homeButton = document.getElementById("homeButton");
const levelsListButton = document.getElementById("levelsListButton");

resumeButton.addEventListener("click", resumeTheGame);
nextLevelWindowButton.addEventListener("click", handleNextLevelWindowButton);
previousLevelButton.addEventListener("click", handlePreviousLevelWindowButton);
homeButton.addEventListener("click", handleHomeButtonClicked);
levelsListButton.addEventListener("click", handleLevelsListButtonClicked);

function handleLevelsListButtonClicked() {
    window.location.href = "level.html"
}

function handleHomeButtonClicked() {
    window.location.href = "../../index.html";
}

async function handleNextLevelWindowButton() {
    const nextLevel = getNextLevel();
    isPaused = false;
    pauseModal.classList.add("hidden");
    pauseButton.disabled = false;
    if (nextLevel !== newLevelNeededIndex) {
        await setupNextLevel(nextLevel);
    } else {
        await loadLevelConfig();
    }
    window.scrollTo(0, document.body.scrollHeight);
    resetGame();
    if (levelsCompleted[levelsCompleted.length - 1] === 16 
        && currentLevelConfig.id === 16) {
        return;
    }
    gameLoop();
}

async function handlePreviousLevelWindowButton() {
    const previousLevel = getPreviousLevel();
    if (previousLevel === -1) {
        return;
    }

    isPaused = false;
    pauseModal.classList.add("hidden");
    pauseButton.disabled = false;

    enemies = [];
    bullets = [];
    boss = null;

    await setupPreviousLevel(previousLevel);
    window.scrollTo(0, document.body.scrollHeight);
    resetGame();
    gameLoop();
}


function resumeTheGame() {
    if (isPaused) {
        isPaused = false;
        pauseModal.classList.add("hidden");
        pauseButton.disabled = false;
        if (isGameActive) gameLoop();
    }
}

function pauseTheGame() {
    if (!isPaused) {
        isPaused = true;
        if (getNextLevel() !== -1) {
            nextLevelWindowButton.disabled = false;
        } else {
            nextLevelWindowButton.disabled = true;
        }

        if (getPreviousLevel() !== -1) {
            previousLevelButton.disabled = false;
        } else {
            previousLevelButton.disabled = true;
        }

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

async function setupNextLevel(nextLevelIndex) {
    const difficulties = ["low", "medium", "hard", "boss"];
    const difficultyNumber = Math.floor((nextLevelIndex - 1) / 5)
    const difficulty = difficulties[difficultyNumber];

    if (!data) {
        const response = await fetch("levels-settings/tasks.json");
        data = await response.json();
    }

    const levels = data[difficulty];
    currentLevelConfig = levels.find((level) => level.id === nextLevelIndex);

    const existingDifficulty = document.getElementById("difficultyLabel");
    if (existingDifficulty && existingDifficulty.parentNode === gameTitle) {
        gameTitle.removeChild(existingDifficulty);
    }
    gameTitle.textContent = "";
    gameTitle.appendChild(getStyledDifficultyElement(difficulty));
}

async function setupPreviousLevel(previousLevelIndex) {
    const difficulties = ["low", "medium", "hard", "boss"];
    const difficultyNumber = Math.floor((previousLevelIndex - 1) / 5)
    const difficulty = difficulties[difficultyNumber];

    if (!data) {
        const response = await fetch("levels-settings/tasks.json");
        data = await response.json();
    }

    const levels = data[difficulty];
    currentLevelConfig = levels.find((level) => level.id === previousLevelIndex);

    const existingDifficulty = document.getElementById("difficultyLabel");
    if (existingDifficulty && existingDifficulty.parentNode === gameTitle) {
        gameTitle.removeChild(existingDifficulty);
    }
    gameTitle.textContent = "";
    gameTitle.appendChild(getStyledDifficultyElement(difficulty));
}

async function loadLevelConfig(nextLevelIndex=-1) {
    try {
        if (!data) {
            const response = await fetch("levels-settings/tasks.json");
            data = await response.json();
        }

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
        let randomLevelId;
        let levels;
        if (nextLevelIndex === -1) {
            currentDifficulty = getRandomNumberFromArray(possibleDifficulties);
            levels = data[currentDifficulty];

            const unfinishedLevels = excludeElements(
                levels.map((level) => level.id),
                levelsCompleted
            );

            if (unfinishedLevels.length === 0) {
                handleZeroLevels();
                return;
            }

            randomLevelId = getRandomNumberFromArray(unfinishedLevels);
        } else {
            randomLevelId = nextLevelIndex;
            const difficulties = ["low", "medium", "hard", "boss"];
            const difficultyNumber = Math.floor((nextLevelIndex - 1) / 5)
            currentDifficulty = difficulties[difficultyNumber];
            levels = data[currentDifficulty];
        }
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
    window.scrollTo(0, document.body.scrollHeight);
    resetGame();
    gameLoop();
});

function handleZeroLevels() {
    isGameActive = false;
    clearGameObjects();
    pauseButton.disabled = true;
    endGamePopup.classList.remove("hidden");
}

nextLevelButton.addEventListener("click", async () => {
    const currentWindowLevelIndex = levelsCompleted.indexOf(currentLevelConfig.id);
    let nextLevelIndex = -1;
    if (currentWindowLevelIndex === -1) {
        return;
    }
    popup.classList.add("hidden");
    pauseButton.disabled = false;
    const completedLevelsLength = levelsCompleted.length;
    if (completedLevelsLength >= totalLevelsToPlay) {
        handleZeroLevels();
        return;
    }
    if (currentWindowLevelIndex !== completedLevelsLength - 1) {
        nextLevelIndex = levelsCompleted[currentWindowLevelIndex + 1];
    } else {
        saveProgress();
    }
    await loadLevelConfig(nextLevelIndex);
    window.scrollTo(0, document.body.scrollHeight);
    resetGame();
    gameLoop();
});

function handleMotion(event) {
    if (!isGameActive || isPaused) return;

    const x = event.accelerationIncludingGravity?.x || 0;

    if (x > 1) {
        player.x = Math.max(0, player.x - player.speed);
        player.isFacingLeft = true;
    } else if (x < -1) {
        player.x = Math.min(canvas.width - player.width, player.x + player.speed);
        player.isFacingLeft = false;
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

    if (levelsCompleted.length >= totalLevelsToPlay) {
        handleZeroLevels();
        return;
    }
    loadLevelConfig(selectedLevelID).then(() => {
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
    window.scrollTo(0, document.body.scrollHeight);
});

function resetGame() {
    boss = null;
    enemies = [];
    resizeCanvas();
    createPlayer();
    console.log("Level position:", currentLevelConfig.id);
    if (currentLevelConfig.id === 16) {
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
    adjustCanvasHeight();
}

window.addEventListener("resize", resizeCanvas);

function createPlayer() {
    player = {
        x: canvas.width / 2 - 75,
        y: canvas.height - 120,
        width: 150,
        height: 120,
        speed: currentLevelConfig.playerSpeed || Math.max(2, canvas.width * 0.007),
        isFacingLeft: true
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
    const enemySpeed = isMobile ? currentLevelConfig.mobileEnemySpeed : currentLevelConfig.enemySpeed;
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            enemies.push({
                x: startX + col * gap,
                y: startY + row * gap,
                width: enemyWidth,
                height: enemyHeight,
                speed: enemySpeed || Math.max(1, canvas.width * 0.002),
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
            const dropSpeed = isMobile ? currentLevelConfig.mobileEnemyDropSpeed : currentLevelConfig.enemyDropSpeed;
            enemy.y += dropSpeed || 20;
            if (enemy.y + enemy.height >= canvas.height - player.height) {
                isGameActive = false;
                nextLevelButton.disabled = true;
                showPopup("Game Over" ,"Game Over");
                pauseButton.disabled = true;
            }
        });
    }

    checkCollisions();
}

function drawPlayer() {
    if (!player) return;

    ctx.save();

    if (!player.isFacingLeft) {
        ctx.translate(player.x + player.width, player.y);
        ctx.scale(-1, 1);
        ctx.drawImage(playerImg, 0, 0, player.width, player.height);
    } else {
        ctx.drawImage(playerImg, player.x, player.y, player.width, player.height);
    }

    ctx.restore();
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (player) {
        drawPlayer();
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
            width: 20,
            height: 20,
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
                saveProgress();
                handleZeroLevels();
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
                    showPopup("You Win!", "You Win!");
                    pauseButton.disabled = true;
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
        if (player) player.isFacingLeft = true;
    }
    else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
        isMovingRight = true;
        if (player) player.isFacingLeft = false;
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

function showPopup(message, outcome) {

    popupMessage.textContent = message;

    const popupImage = document.createElement("img");
    popupImage.style.width = "100%";
    popupImage.style.height = "auto";
    popupImage.style.marginTop = "10px";

    if (outcome === "You Win!") {
        popupImage.src = "../images/victory.png";

        popupImage.classList.add("win-icon");
        popupImage.classList.remove("lose-icon");
    } else if (outcome === "Game Over") {
        popupImage.src = "../images/defeat.png";
        popupImage.classList.add("lose-icon");
        popupImage.classList.remove("win-icon");
    }

    const existingImage = popup.querySelector("img");
    if (existingImage) {
        popup.removeChild(existingImage);
    }
    popup.appendChild(popupImage);
    popup.classList.remove("hidden");
}
