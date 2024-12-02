    const canvas = document.getElementById("gameCanvas");
    const ctx = canvas.getContext("2d");
    const popup = document.getElementById("popup");
    const popupMessage = document.getElementById("popupMessage");
    const playAgainButton = document.getElementById("playAgainButton");
    const nextLevelButton = document.getElementById("nextLevelButton");
    const startButton = document.getElementById("startButton");
    const gameTitle = document.getElementById("gameTitle");

    let isGameActive = false;
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
    const totalLevelsToPlay = 5;
    nextLevelButton.disabled = true;
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    const playerImg = new Image();
    playerImg.src = 'files/images/player.jpg';

    const enemyImg = new Image();
    enemyImg.src = 'files/images/enemy.jpg';

    const bulletImg = new Image();
    bulletImg.src = 'files/images/bullet.jpg';

    const enemyCounter = document.getElementById("enemyCounter");

    // End game popup for when all levels are completed
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
        levelsCompleted = [];
        currentLevelIndex = 0;
        localStorage.removeItem('gameProgress');
        endGamePopup.classList.add("hidden");
        startButton.classList.remove("hidden");
        console.log("Progress reset, game restarted.");
    }

    document.getElementById("restartGameButton").addEventListener("click", restartGame);

    function excludeElements(arr1, arr2) {
        return arr1.filter(element => !arr2.includes(element));
    }

    function getRandomNumberFromArray(array) {
        const randomIndex = Math.floor(Math.random() * array.length);
        return array[randomIndex];
    }

    function getStyledDifficultyElement(difficulty) {
        const span = document.createElement("span");
        switch (difficulty) {
            case "low":
                span.style.color = "green";
                span.textContent = " (easy)";
                break;
            case "medium":
                span.style.color = "yellow";
                span.textContent = " (medium)";
                break;
            case "hard":
                span.style.color = "red";
                span.textContent = " (hard)";
                break;
            default:
                span.textContent = "Unknown";
        }
        span.id = "difficultyLabel";
        return span;
    }

    async function loadLevelConfig() {
        try {
            const response = await fetch('files/pages/levels-settings/tasks.json');
            const data = await response.json();
    
            if (levelsCompleted.length >= totalLevelsToPlay) {
                console.log("All levels completed.");
                handleZeroLevels();
                return;
            }
    
            let possibleDifficulties = [];
            if (currentLevelIndex < 2) {
                possibleDifficulties = ["low", "medium"];
            } else if (currentLevelIndex < 4) {
                possibleDifficulties = ["medium", "hard"];
            } else {
                possibleDifficulties = ["hard"];
            }
    
            currentDifficulty = getRandomNumberFromArray(possibleDifficulties);
            const levels = data[currentDifficulty];
    
            const unfinishedLevels = excludeElements(levels.map(level => level.id), levelsCompleted);
    
            if (unfinishedLevels.length === 0) {
                console.log("No more unfinished levels!");
                handleZeroLevels();
                return;
            }
    
            const randomLevelId = getRandomNumberFromArray(unfinishedLevels);
            currentLevelConfig = levels.find(level => level.id === randomLevelId);
    
            // Update the title
            const existingDifficulty = document.getElementById("difficultyLabel");
            if (existingDifficulty) {
                gameTitle.removeChild(existingDifficulty); // Remove old difficulty label
            }
            gameTitle.appendChild(getStyledDifficultyElement(currentDifficulty)); // Add new difficulty label
    
            console.log(`Loaded level ${currentLevelConfig.id} from ${currentDifficulty}`);
        } catch (error) {
            console.error("Failed to load level configurations:", error);
        }
    }

    function loadProgress() {
        const savedProgress = localStorage.getItem('gameProgress');
        if (savedProgress) {
            const progress = JSON.parse(savedProgress);
            levelsCompleted = progress.levelsCompleted || [];
            currentLevelIndex = progress.currentLevelIndex || 0;
            console.log("Progress loaded:", levelsCompleted, currentLevelIndex);
        } else {
            console.log("No saved progress, starting fresh.");
        }
    }

    function saveProgress() {
        if (!levelsCompleted.includes(currentLevelConfig.id)) {
            levelsCompleted.push(currentLevelConfig.id);
            currentLevelIndex++;
            const progress = {
                levelsCompleted: levelsCompleted,
                currentLevelIndex: currentLevelIndex,
            };
            localStorage.setItem('gameProgress', JSON.stringify(progress));
            console.log("Progress saved:", progress);
        }
    }

    function showPopup(message) {
        popupMessage.textContent = message;
        popup.classList.remove("hidden");
    }

    playAgainButton.addEventListener("click", () => {
        popup.classList.add("hidden");
        killedEnemiesCount = 0;
        resetGame();
        isGameActive = true;
        gameLoop();
    });

    function handleZeroLevels() {
        isGameActive = false;
        clearGameObjects();
        console.log("All levels are completed!");
        endGamePopup.classList.remove("hidden");
    }

    async function holdEndGamePopup() {
        loadProgress();
        const response = await fetch('files/pages/levels-settings/tasks.json');
        const data = await response.json();
        const allLevelIds = [].concat(...Object.values(data).map(levels => levels.map(level => level.id)));
        const unfinishedLevels = excludeElements(allLevelIds, levelsCompleted);
    
        if (!unfinishedLevels.length) {
            handleZeroLevels();
        }
    }

    nextLevelButton.addEventListener("click", async () => {
        popup.classList.add("hidden");
    
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

    startButton.addEventListener("click", async () => {
        startButton.classList.add("hidden");
        loadProgress();
    
        if (levelsCompleted.length >= totalLevelsToPlay) {
            handleZeroLevels();
            return;
        }
    
        await loadLevelConfig();
        resetGame();
        isGameActive = true;
        gameLoop();
    });

    function resetGame() {
        resizeCanvas();
        createPlayer();
        createEnemies();
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
            speed: currentLevelConfig.playerSpeed || Math.max(2, canvas.width * 0.007)
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
            cols = currentLevelConfig.mobileEnemies || cols;
        }

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                enemies.push({
                    x: startX + col * gap,
                    y: startY + row * gap,
                    width: enemyWidth,
                    height: enemyHeight,
                    speed: currentLevelConfig.enemySpeed || Math.max(1, canvas.width * 0.002)
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
        if (!isGameActive) return;

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

        bullets.forEach(bullet => {
            ctx.drawImage(bulletImg, bullet.x, bullet.y, bullet.width, bullet.height);
        });

        enemies.forEach(enemy => {
            ctx.drawImage(enemyImg, enemy.x, enemy.y, enemy.width, enemy.height);
        });
    }

    function createBullet() {
        if (canShoot && player) {
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
            }, currentLevelConfig.bulletCooldown || 500);
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
                        nextLevelButton.disabled = false;
                        saveProgress();
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
                nextLevelButton.disabled = true;
                showPopup("Game Over");
            }
        });
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
