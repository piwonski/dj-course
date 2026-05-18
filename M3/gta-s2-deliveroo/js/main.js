function toggleSection(sectionId) {
    const content = document.getElementById(sectionId + '-content');
    const icon = document.getElementById(sectionId + '-icon');

    if (content.classList.contains('collapsed')) {
        content.classList.remove('collapsed');
        icon.classList.remove('collapsed');
    } else {
        content.classList.add('collapsed');
        icon.classList.add('collapsed');
    }
}

class InputHandler {
    constructor() {
        this.keys = { ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false, Space: false, Enter: false };
        window.addEventListener('keydown', (e) => {
            const code = e.code === 'Space' ? 'Space' : e.code;
            if (this.keys.hasOwnProperty(code)) { this.keys[code] = true; e.preventDefault(); }
            if (e.code === 'Enter') { this.keys.Enter = true; e.preventDefault(); }
        });
        window.addEventListener('keyup', (e) => {
            const code = e.code === 'Space' ? 'Space' : e.code;
            if (this.keys.hasOwnProperty(code)) { this.keys[code] = false; }
            if (e.code === 'Enter') { this.keys.Enter = false; }
        });
    }
}

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const input = new InputHandler();
let game;

function loadNextLevel() {
    const nextLevel = game.currentLevelIdx + 1;
    if (nextLevel < game.levels.length) {
        game.loadLevel(nextLevel);
    } else {
        alert('Gratulacje! Ukończyłeś wszystkie poziomy!');
        game.loadLevel(0);
    }
}

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    if (game && game.state !== 'TITLE_SCREEN' && game.state !== 'LEVEL_COMPLETE') {
        game.loadLevel(game.currentLevelIdx);
    }
}

let lastTime = 0;
function loop(timestamp = 0) {
    if (!game) return;

    // Calculate delta time in seconds
    const deltaTime = lastTime ? Math.min((timestamp - lastTime) / 1000, 0.1) : 0.016;
    lastTime = timestamp;

    game.update(deltaTime);
    game.draw();
    requestAnimationFrame(loop);
}

// Mouse handling for title screen and level complete screen
canvas.addEventListener('mousemove', (e) => {
    if (!game) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Title screen button
    if (game.state === 'TITLE_SCREEN' && game.titleButtonBounds) {
        const btn = game.titleButtonBounds;
        game.titleButtonHover = (
            mouseX >= btn.x && mouseX <= btn.x + btn.width &&
            mouseY >= btn.y && mouseY <= btn.y + btn.height
        );
        canvas.style.cursor = game.titleButtonHover ? 'pointer' : 'default';
    }
    // Level complete button
    else if (game.state === 'LEVEL_COMPLETE' && game.levelCompleteButtonBounds) {
        const btn = game.levelCompleteButtonBounds;
        game.levelCompleteButtonHover = (
            mouseX >= btn.x && mouseX <= btn.x + btn.width &&
            mouseY >= btn.y && mouseY <= btn.y + btn.height
        );
        canvas.style.cursor = game.levelCompleteButtonHover ? 'pointer' : 'default';
    }
    // Reset cursor when not on special screens
    else {
        canvas.style.cursor = 'default';
    }
});

canvas.addEventListener('click', (e) => {
    if (!game) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Title screen button
    if (game.state === 'TITLE_SCREEN' && game.titleButtonBounds) {
        const btn = game.titleButtonBounds;
        const isInButton = (
            mouseX >= btn.x && mouseX <= btn.x + btn.width &&
            mouseY >= btn.y && mouseY <= btn.y + btn.height
        );

        if (isInButton) {
            canvas.style.cursor = 'default';
            game.startGame();
        }
    }

    // Level complete button
    if (game.state === 'LEVEL_COMPLETE' && game.levelCompleteButtonBounds) {
        const btn = game.levelCompleteButtonBounds;
        const isInButton = (
            mouseX >= btn.x && mouseX <= btn.x + btn.width &&
            mouseY >= btn.y && mouseY <= btn.y + btn.height
        );

        if (isInButton) {
            canvas.style.cursor = 'default';
            loadNextLevel();
        }
    }
});

window.onload = function() {
    game = new Game();
    window.addEventListener('resize', resize);
    resize(); // Initial resize and level load
    loop();
};
