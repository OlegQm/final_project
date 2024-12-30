function goToMainMenu() {
    window.location.href = '../../index.html';
}

function handleLevelSelection(levelNumber) {
    localStorage.setItem("selectedLevelIndex", levelNumber - 1);
    window.location.href = "start.html";
}

function modifyButton(index, property, action) {
    const button = document.querySelectorAll(".level-button")[index];
    if (!button) return;

    if (action === "removeClass") {
        button.classList.remove(property);
    } else if (action === "removeAttribute") {
        button.removeAttribute(property);
    }
}

function openLevels() {
    const savedProgress = localStorage.getItem("gameProgress");
    let levelsCompleted = [];
    let currentLevelIndex = 0;
    if (savedProgress) {
        const progress = JSON.parse(savedProgress);
        levelsCompleted = progress.levelsCompleted || [];
        currentLevelIndex = progress.currentLevelIndex || 0;
    }
    for(let i = 0; i < levelsCompleted.length; i++) {
        modifyButton(i, "locked", "removeClass");
    }
}

openLevels();