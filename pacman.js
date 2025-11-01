let board;
const rowCount = 21;
const columnCount = 19;
const tileSize = 32;
const boardWidth = columnCount * tileSize;
const boardHeight = rowCount * tileSize;
let context;

let blueGhostImage;
let orangeGhostImage;
let pinkGhostImage;
let redGhostImage;
let pacmanUpImage;
let pacmanDownImage;
let pacmanLeftImage;
let pacmanRightImage;
let wallImage;

//X = wall, O = skip, P = pac man, ' ' = food
//Ghosts: b = blue, o = orange, p = pink, r = red
const tileMap = [
    "XXXXXXXXXXXXXXXXXXX",
    "X                 X",
    "X XX XXX X XXX XX X",
    "X                 X",
    "X XX X XXXXX X XX X",
    "X X    X X    X  X", 
    "XXXX XXXX XXXX XXXX",
    "OOOX X      X XOOO",
    "XXXX X XXrXX X XXXX",
    "O   bpo          O", 
    "XXXX X XXXXX X XXXX",
    "OOOX X      X XOOO",
    "XXXX X XXXXX X XXXX",
    "X           X      X", 
    "X XX XXX X XXX XX X",
    "X X    P       X X", 
    "XX X X XXXXX X X XX",
    "X X    X X    X  X",
    "X XXXXXX X XXXXXX X",
    "X                 X",
    "XXXXXXXXXXXXXXXXXXX"
];

const walls = new Set();
const foods = new Set();
const ghosts = new Set();
let pacman = null; 

const directions = ['U', 'D', 'L', 'R']; //up down left right

const deathSound = new Audio('./pacman_death.wav');
const beginningSound = new Audio('./pacman_beginning.wav'); 
const chompSound = new Audio('./chomping.mp3'); 
// ⭐ FIX: Reduced chomping sound volume by 50%
chompSound.volume = 0.2;
const sirenSound = new Audio('./siren.mp3'); 
sirenSound.loop = true; 
sirenSound.volume = 0.6;

let score = 0;
let lives = 3;
let gameOver = false;
let gamePausedAfterDeath = false;
let gameStarted = false; 
let gameLoopTimeout; 

window.onload = function() {
    board = document.getElementById("board");
    board.height = boardHeight;
    board.width = boardWidth;
    context = board.getContext("2d"); 

    loadImages();
    
    // Load walls only for initial screen drawing
    loadMap(true, true); 
    draw(); 
    
    // Keyboard controls
    document.addEventListener("keyup", handleInput);

    // On-screen D-pad controls (unchanged)
    document.getElementById('up-btn').addEventListener('click', (e) => { e.preventDefault(); handleInput({code: 'ArrowUp'}); });
    document.getElementById('down-btn').addEventListener('click', (e) => { e.preventDefault(); handleInput({code: 'ArrowDown'}); });
    document.getElementById('left-btn').addEventListener('click', (e) => { e.preventDefault(); handleInput({code: 'ArrowLeft'}); });
    document.getElementById('right-btn').addEventListener('click', (e) => { e.preventDefault(); handleInput({code: 'ArrowRight'}); });
    document.getElementById('up-btn').addEventListener('touchstart', (e) => { e.preventDefault(); handleInput({code: 'ArrowUp'}); });
    document.getElementById('down-btn').addEventListener('touchstart', (e) => { e.preventDefault(); handleInput({code: 'ArrowDown'}); });
    document.getElementById('left-btn').addEventListener('touchstart', (e) => { e.preventDefault(); handleInput({code: 'ArrowLeft'}); });
    document.getElementById('right-btn').addEventListener('touchstart', (e) => { e.preventDefault(); handleInput({code: 'ArrowRight'}); });

    // Leaderboard button event listeners (unchanged)
    document.getElementById('showLeaderboardBtn').addEventListener('click', () => {
        fetchLeaderboard();
    });
    
    document.getElementById('closeLeaderboardBtn').addEventListener('click', () => {
        document.getElementById('leaderboardContainer').style.display = 'none';
    });

    // START/RESET BUTTON LOGIC 
    document.getElementById('start-btn').addEventListener('click', () => {
        if (!gameStarted) {
            startGame();
            document.getElementById('start-btn').textContent = 'Reset'; 
            document.getElementById('start-btn').classList.remove('bg-green-600');
            document.getElementById('start-btn').classList.add('bg-red-600');
            // This will be updated to 'Ready!' inside startGame before the sound
        } else {
            resetGame();
        }
    });
    
    // Restart button event listener
    document.getElementById('restartGameBtn').addEventListener('click', () => {
        document.getElementById('gameOverModal').classList.add('hidden');
        startGame(true); 
    });
}

function loadImages() {
    wallImage = new Image();
    wallImage.src = "./wall.png";

    blueGhostImage = new Image();
    blueGhostImage.src = "./blueGhost.jpg";
    orangeGhostImage = new Image();
    orangeGhostImage.src = "./orangeGhost.jpg"
    pinkGhostImage = new Image()
    pinkGhostImage.src = "./pinkGhost.jpg";
    redGhostImage = new Image()
    redGhostImage.src = "./redGhost.jpg";

    pacmanUpImage = new Image();
    pacmanUpImage.src = "./pacmanUp.jpg";
    pacmanDownImage = new Image();
    pacmanDownImage.src = "./pacmanDown.jpg";
    pacmanLeftImage = new Image();
    pacmanLeftImage.src = "./pacmanLeft.jpg";
    pacmanRightImage = new Image();
    pacmanRightImage.src = "./pacmanRight.jpg";
}

function startGame(isRestart = false) {
    clearTimeout(gameLoopTimeout);
    
    // 1. Reset map and create ALL entities
    loadMap(true); 
    
    // 2. Reset game variables
    resetPositions();
    score = 0;
    lives = 3;
    gameOver = false;

    // 3. Stop siren and play the beginning sound
    sirenSound.pause();
    sirenSound.currentTime = 0;
    beginningSound.currentTime = 0;
    
    // ⭐ FIX: Play sound *after* the initial draw
    beginningSound.play();
    
    // 4. Update status displays and redraw immediately (no "Press START" message)
    document.getElementById('scoreDisplay').textContent = `Score: ${score}`;
    document.getElementById('livesDisplay').textContent = `Lives: ${lives}`;
    document.getElementById('statusMessage').textContent = 'Ready!';
    draw(); 
    
    // 5. Start Game Loop after sound
    const beginningSoundDuration = 4000; 

    gameLoopTimeout = setTimeout(() => {
        sirenSound.play();
        gameStarted = true;
        document.getElementById('statusMessage').textContent = 'Go!';
        
        if (isRestart) {
            update(); 
        } else {
            gameLoopTimeout = setTimeout(update, 50); 
        }
    }, beginningSoundDuration); 
    
    // 6. Set initial random direction and zero velocity for ghosts
    for (let ghost of ghosts.values()) {
        ghost.velocityX = 0; 
        ghost.velocityY = 0;
        const newDirection = directions[Math.floor(Math.random() * 4)];
        ghost.direction = newDirection; 
    }
}

function resetGame() {
    clearTimeout(gameLoopTimeout);
    sirenSound.pause(); 
    sirenSound.currentTime = 0;
    
    // Clear all entities but reload the walls for the starting screen view
    loadMap(false, true); 
    
    score = 0;
    lives = 3;
    gameOver = false;
    gameStarted = false; 

    document.getElementById('scoreDisplay').textContent = `Score: ${score}`;
    document.getElementById('livesDisplay').textContent = `Lives: ${lives}`;
    document.getElementById('statusMessage').textContent = 'Ready!';
    
    document.getElementById('start-btn').textContent = 'Start';
    document.getElementById('start-btn').classList.remove('bg-red-600');
    document.getElementById('start-btn').classList.add('bg-green-600');
    
    draw(); 
}

// fullLoad: true means create Walls, Pacman, Ghosts, Food. false means clear all entities.
// wallsOnly: true means only create walls, ignore other entities (used for initial/reset draw)
function loadMap(fullLoad = true, wallsOnly = false) {
    walls.clear();
    foods.clear();
    ghosts.clear();
    
    pacman = null; 

    for (let r = 0; r < rowCount; r++) {
        for (let c = 0; c < columnCount; c++) {
            const row = tileMap[r];
            const tileMapChar = row[c];

            const x = c * tileSize;
            const y = r * tileSize;

            // Load Walls (always loaded if fullLoad is true)
            if (tileMapChar == 'X') { 
                const wall = new Block(wallImage, x, y, tileSize, tileSize);
                walls.add(wall);
            }
            
            // Only create other entities if fullLoad is true AND wallsOnly is false
            if (fullLoad && !wallsOnly) {
                if (tileMapChar == 'b') { 
                    const ghost = new Block(blueGhostImage, x, y, tileSize, tileSize);
                    ghosts.add(ghost);
                }
                else if (tileMapChar == 'o') { 
                    const ghost = new Block(orangeGhostImage, x, y, tileSize, tileSize);
                    ghosts.add(ghost);
                }
                else if (tileMapChar == 'p') { 
                    const ghost = new Block(pinkGhostImage, x, y, tileSize, tileSize);
                    ghosts.add(ghost);
                }
                else if (tileMapChar == 'r') { 
                    const ghost = new Block(redGhostImage, x, y, tileSize, tileSize);
                    ghosts.add(ghost);
                }
                else if (tileMapChar == 'P') { 
                    pacman = new Block(pacmanRightImage, x, y, tileSize, tileSize);
                }
                else if (tileMapChar == ' ') { 
                    const food = new Block(null, x + 14, y + 14, 4, 4);
                    foods.add(food);
                }
            }
        }
    }
}

function update() {
    if (gameOver) {
        sirenSound.pause();
        sirenSound.currentTime = 0;
        document.getElementById('statusMessage').textContent = 'Game Over!';
        document.getElementById('modalTitle').textContent = 'Game Over';
        document.getElementById('modalScore').textContent = `Final Score: ${score}`;
        document.getElementById('gameOverModal').classList.remove('hidden');
        
        document.getElementById('start-btn').textContent = 'Start';
        document.getElementById('start-btn').classList.remove('bg-red-600');
        document.getElementById('start-btn').classList.add('bg-green-600');
        
        const playerName = prompt("Game Over! Enter your name for the leaderboard:", "Player");
        if (playerName) {
            sendScore(playerName, score);
        }
        return;
    }
    
    // Only continue the loop if the game has started
    if (!gameStarted) {
        return; 
    }
    
    gameLoopTimeout = setTimeout(update, 50); 
    move();
    draw();
}

function draw() {
    context.clearRect(0, 0, board.width, board.height);
    
    // Draw walls (always draw walls if they exist, even before gameStarted = true)
    for (let wall of walls.values()) {
        context.drawImage(wall.image, wall.x, wall.y, wall.width, wall.height);
    }
    
    // ⭐ FIX: Draw game entities ONLY if the map is fully loaded OR game has started
    // Draw food
    context.fillStyle = "white";
    for (let food of foods.values()) {
        context.fillRect(food.x, food.y, food.width, food.height);
    }

    // Draw Pacman
    if (pacman) {
        context.drawImage(pacman.image, pacman.x, pacman.y, pacman.width, pacman.height);
    }
    
    // Draw Ghosts
    for (let ghost of ghosts.values()) {
        context.drawImage(ghost.image, ghost.x, ghost.y, ghost.width, ghost.height);
    }
    
    // Update Score and Lives on the HTML elements
    document.getElementById('scoreDisplay').textContent = `Score: ${score}`;
    document.getElementById('livesDisplay').textContent = `Lives: ${lives}`;
    
    // ⭐ FIX: Only show "Press START" message if gameStarted is explicitly false AND foods are not loaded
    if (!gameStarted && foods.size === 0) {
        context.fillStyle = "yellow";
        context.font = "20px Rubik";
        context.textAlign = "center";
        context.fillText("Press START to Play!", boardWidth / 2, boardHeight / 2);
    }
}

function move() {
    if (!gameStarted || !pacman) return; 
    
    // 1. APPLY CURRENT VELOCITY (Pacman Movement)
    pacman.x += pacman.velocityX;
    pacman.y += pacman.velocityY;

    // 2. CHECK WALL COLLISION (Pacman)
    if (pacman.x < 0 || pacman.x + pacman.width > boardWidth || pacman.y < 0 || pacman.y + pacman.height > boardHeight) {
        pacman.x -= pacman.velocityX;
        pacman.y -= pacman.velocityY;
        pacman.velocityX = 0;
        pacman.velocityY = 0;
    }

    for (let wall of walls.values()) {
        if (collision(pacman, wall)) {
            pacman.x -= pacman.velocityX;
            pacman.y -= pacman.velocityY;
            pacman.velocityX = 0;
            pacman.velocityY = 0;
            break;
        }
    }

    // 3. Ghost Movement and Collision
    for (let ghost of ghosts.values()) {
        // Trigger velocity once the game starts
        if (ghost.velocityX === 0 && ghost.velocityY === 0) {
            ghost.updateVelocity(); 
        }
        
        // Ghost-Pacman Collision Check
        if (collision(ghost, pacman) && !gamePausedAfterDeath) { 
            clearTimeout(gameLoopTimeout); 
            lives -= 1;
            document.getElementById('livesDisplay').textContent = `Lives: ${lives}`;
            
            if (lives == 0) {
                gameOver = true;
                gameStarted = false; 
                gameLoopTimeout = setTimeout(update, 50); 
                return;
            }
            
            // PAUSE AND DEATH MESSAGE LOGIC
            gamePausedAfterDeath = true;
            sirenSound.pause(); 
            deathSound.play(); 
            
            document.getElementById('statusMessage').textContent = 'Ready!'; // Show Ready/Pause message
            draw(); 
            
            // Pause for 2 seconds 
            setTimeout(() => {
                resetPositions();
                document.getElementById('statusMessage').textContent = 'Go!';
                gamePausedAfterDeath = false;

                sirenSound.currentTime = 0;
                sirenSound.play(); 
                
                gameLoopTimeout = setTimeout(update, 50);
            }, 2000); 

            return; 
        }

        // Ghost Movement Logic (simple house exit logic)
        if (ghost.y == tileSize * 9 && ghost.direction != 'U' && ghost.direction != 'D' && ghost.velocityX == 0) {
            ghost.updateDirection('U');
        }

        ghost.x += ghost.velocityX;
        ghost.y += ghost.velocityY;
        
        // Ghost collision with wall logic
        for (let wall of walls.values()) {
            if (collision(ghost, wall) || ghost.x <= 0 || ghost.x + ghost.width >= boardWidth || ghost.y < 0 || ghost.y + ghost.height > boardHeight) {
                ghost.x -= ghost.velocityX;
                ghost.y -= ghost.velocityY;
                
                const newDirection = directions[Math.floor(Math.random() * 4)];
                ghost.updateDirection(newDirection);
            }
        }
    }

    // 4. Check Food Collision
    let foodEaten = null;
    for (let food of foods.values()) {
        if (collision(pacman, food)) {
            foodEaten = food;
            chompSound.currentTime = 0; 
            chompSound.play();
            score += 10;
            document.getElementById('scoreDisplay').textContent = `Score: ${score}`;
            break;
        }
    }
    if (foodEaten) {
        foods.delete(foodEaten);
    }

    // 5. Next Level
    if (foods.size == 0) {
        gameStarted = false;
        sirenSound.pause(); 
        sirenSound.currentTime = 0;
        document.getElementById('statusMessage').textContent = 'Level Clear!';
        setTimeout(() => {
            loadMap(true); 
            resetPositions();
            startGame(true); 
        }, 1000); 
    }
}

function handleInput(e) {
    if (!gameStarted || gameOver || !pacman) {
        return; 
    }

    let newDirection = pacman.direction;

    if (e.code == "ArrowUp" || e.code == "KeyW") {
        newDirection = 'U';
    }
    else if (e.code == "ArrowDown" || e.code == "KeyS") {
        newDirection = 'D';
    }
    else if (e.code == "ArrowLeft" || e.code == "KeyA") {
        newDirection = 'L';
    }
    else if (e.code == "ArrowRight" || e.code == "KeyD") {
        newDirection = 'R';
    }

    pacman.attemptDirectionChange(newDirection);
    
    if (pacman.direction == 'U') {
        pacman.image = pacmanUpImage;
    }
    else if (pacman.direction == 'D') {
        pacman.image = pacmanDownImage;
    }
    else if (pacman.direction == 'L') {
        pacman.image = pacmanLeftImage;
    }
    else if (pacman.direction == 'R') {
        pacman.image = pacmanRightImage;
    }
}

function collision(a, b) {
    return a.x < b.x + b.width &&    
        a.x + a.width > b.x &&      
        a.y < b.y + b.height &&     
        a.y + a.height > b.y;        
}

function resetPositions() {
    if (pacman) {
        pacman.reset();
        pacman.velocityX = 0;
        pacman.velocityY = 0;
    }
    for (let ghost of ghosts.values()) {
        ghost.reset();
        ghost.velocityX = 0;
        ghost.velocityY = 0;
        const newDirection = directions[Math.floor(Math.random() * 4)];
        ghost.direction = newDirection; 
    }
}

// ===================================
// LEADERBOARD FUNCTIONS (unchanged)
// ===================================

function sendScore(playerName, finalScore) {
    if (finalScore <= 0) return; 

    fetch('submit_score.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            playerName: playerName,
            score: finalScore
        }),
    })
    .then(response => response.json())
    .then(data => {
        console.log('Score submission result:', data);
        if (data.success) {
            alert("Score submitted! Check the leaderboard.");
        }
    })
    .catch((error) => {
        console.error('Error submitting score. Is your server running?', error);
        alert('Could not submit score. Server connection error.');
    });
}

function fetchLeaderboard() {
    fetch('get_leaderboard.php')
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            displayLeaderboard(data.leaderboard);
        } else {
            console.error('Failed to fetch leaderboard:', data.message);
            alert('Could not load leaderboard. Check server logs.');
        }
    })
    .catch((error) => {
        console.error('Network error fetching leaderboard:', error);
        alert('Connection error fetching leaderboard.');
    });
}

function displayLeaderboard(leaderboardData) {
    const tableBody = document.getElementById('leaderboardTable').getElementsByTagName('tbody')[0];
    tableBody.innerHTML = ''; 

    leaderboardData.forEach((entry, index) => {
        const row = tableBody.insertRow();
        row.insertCell().textContent = index + 1; // Rank
        row.insertCell().textContent = entry.player_name;
        row.insertCell().textContent = entry.score;
        row.insertCell().textContent = entry.date_achieved;
    });

    document.getElementById('leaderboardContainer').style.display = 'block';
}


// ===================================
// BLOCK CLASS (unchanged)
// ===================================

class Block {
    constructor(image, x, y, width, height) {
        this.image = image;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;

        this.startX = x;
        this.startY = y;

        this.direction = 'R';
        this.velocityX = 0;
        this.velocityY = 0;
    }
    
    attemptDirectionChange(newDirection) {
        if (this.velocityX === 0 && this.velocityY === 0) {
             this.direction = newDirection;
             this.updateVelocity();
             return;
        }

        const originalDirection = this.direction;
        const originalX = this.x;
        const originalY = this.y;
        
        const col = Math.round(this.x / tileSize);
        const row = Math.round(this.y / tileSize);
        
        const snapX = col * tileSize;
        const snapY = row * tileSize;

        this.x = snapX;
        this.y = snapY;

        this.direction = newDirection;
        this.updateVelocity();

        this.x += this.velocityX;
        this.y += this.velocityY;

        let collisionDetected = false;
        
        if (this.x < 0 || this.x + this.width > boardWidth || this.y < 0 || this.y + this.height > boardHeight) {
            collisionDetected = true;
        } else {
            for (let wall of walls.values()) {
                if (collision(this, wall)) {
                    collisionDetected = true;
                    break;
                }
            }
        }

        this.x -= this.velocityX; 
        this.y -= this.velocityY;
        
        if (collisionDetected) {
            this.direction = originalDirection;
            this.updateVelocity();
            this.x = originalX;
            this.y = originalY; 
        } else {
            // Path is clear!
        }
    }

    updateDirection(direction) {
        const prevDirection = this.direction;
        this.direction = direction;
        this.updateVelocity();

        if (this === pacman) {
            return;
        }
        
        this.x += this.velocityX;
        this.y += this.velocityY;

        for (let wall of walls.values()) {
            if (collision(this, wall) || this.x < 0 || this.x + this.width > boardWidth || this.y < 0 || this.y + this.height > boardHeight) {
                this.x -= this.velocityX;
                this.y -= this.velocityY;
                this.direction = prevDirection; 
                this.updateVelocity();
                return;
            }
        }
    }

    updateVelocity() {
        const speed = tileSize / 4; 
        if (this.direction == 'U') {
            this.velocityX = 0;
            this.velocityY = -speed;
        }
        else if (this.direction == 'D') {
            this.velocityX = 0;
            this.velocityY = speed;
        }
        else if (this.direction == 'L') {
            this.velocityX = -speed;
            this.velocityY = 0;
        }
        else if (this.direction == 'R') {
            this.velocityX = speed;
            this.velocityY = 0;
        }
    }

    reset() {
        this.x = this.startX;
        this.y = this.startY;
        this.direction = 'R'; 
    }
};