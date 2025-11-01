//board
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
    "X  X         X   X",
    "XXXX XXXX XXXX XXXX",
    "OOOX X       X XOOO",
    "XXXX X XXrXX X XXXX",
    "O    bpo         O",
    "XXXX X XXXXX X XXXX",
    "OOOX X       X XOOO",
    "XXXX X XXXXX X XXXX",
    "X          X       X",
    "X XX XXX X XXX XX X",
    "X X    P       X X",
    "XX X X XXXXX X X XX",
    "X  X   X X   X   X",
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
const begningSound = new Audio('./pacman_beginning.wav');
let score = 0;
let lives = 3;
let gameOver = false;
let gamePausedAfterDeath = false;
let gameStarted = false; // Initial game state
let gameLoopTimeout; // Define the game loop variable globally

window.onload = function() {
    board = document.getElementById("board");
    board.height = boardHeight;
    board.width = boardWidth;
    context = board.getContext("2d"); //used for drawing on the board

    loadImages();
    
    // Load map only for WALLS if gameStarted is false (i.e., when loading the page or resetting)
    loadMap(false); 
    draw(); 
    
    // Keyboard controls
    document.addEventListener("keyup", handleInput);

    // On-screen D-pad controls
    document.getElementById('up-btn').addEventListener('click', (e) => { e.preventDefault(); handleInput({code: 'ArrowUp'}); });
    document.getElementById('down-btn').addEventListener('click', (e) => { e.preventDefault(); handleInput({code: 'ArrowDown'}); });
    document.getElementById('left-btn').addEventListener('click', (e) => { e.preventDefault(); handleInput({code: 'ArrowLeft'}); });
    document.getElementById('right-btn').addEventListener('click', (e) => { e.preventDefault(); handleInput({code: 'ArrowRight'}); });
    document.getElementById('up-btn').addEventListener('touchstart', (e) => { e.preventDefault(); handleInput({code: 'ArrowUp'}); });
    document.getElementById('down-btn').addEventListener('touchstart', (e) => { e.preventDefault(); handleInput({code: 'ArrowDown'}); });
    document.getElementById('left-btn').addEventListener('touchstart', (e) => { e.preventDefault(); handleInput({code: 'ArrowLeft'}); });
    document.getElementById('right-btn').addEventListener('touchstart', (e) => { e.preventDefault(); handleInput({code: 'ArrowRight'}); });

    // Leaderboard button event listeners
    document.getElementById('showLeaderboardBtn').addEventListener('click', () => {
        fetchLeaderboard();
    });
    
    document.getElementById('closeLeaderboardBtn').addEventListener('click', () => {
        document.getElementById('leaderboardContainer').style.display = 'none';
    });

    // START/RESET BUTTON LOGIC 
    document.getElementById('start-btn').addEventListener('click', () => {
        if (!gameStarted) {
            // Start the game
            startGame();
            document.getElementById('start-btn').textContent = 'Reset'; 
            document.getElementById('start-btn').classList.remove('bg-green-600');
            document.getElementById('start-btn').classList.add('bg-red-600');
            document.getElementById('statusMessage').textContent = 'Go!';
        } else {
            // Reset the game if it is currently running
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

// Function to initialize/reset the game state
function startGame(isRestart = false) {
    // 1. Reset map and create ALL entities (passing true for full load)
    loadMap(true); 
    
    // 2. Reset game variables
    resetPositions();
    score = 0;
    lives = 3;
    gameOver = false;
    gameStarted = true;
    begningSound.play();
    
    // 3. Set initial random direction and zero velocity for ghosts
    for (let ghost of ghosts.values()) {
        ghost.velocityX = 0; 
        ghost.velocityY = 0;
        const newDirection = directions[Math.floor(Math.random() * 4)];
        ghost.direction = newDirection; 
    }
    
    // 4. Update status displays
    document.getElementById('scoreDisplay').textContent = `Score: ${score}`;
    document.getElementById('livesDisplay').textContent = `Lives: ${lives}`;
    document.getElementById('statusMessage').textContent = 'Go!';

    // 5. Start the game loop
    if (isRestart) {
        
        update();
    } else {
        gameLoopTimeout = setTimeout(update, 50);
    }
}

// Resets the entire game state to the "Press START" screen
function resetGame() {
    // 1. Stop the game loop
    clearTimeout(gameLoopTimeout);
    
    // 2. Clear entities (passing false for walls-only load, which now creates NO entities)
    loadMap(false); 
    
    // 3. Reset game state variables
    score = 0;
    lives = 3;
    gameOver = false;
    gameStarted = false; 

    // 4. Reset UI
    document.getElementById('scoreDisplay').textContent = `Score: ${score}`;
    document.getElementById('livesDisplay').textContent = `Lives: ${lives}`;
    document.getElementById('statusMessage').textContent = 'Ready!';
    
    // 5. Reset button to "Start" state
    document.getElementById('start-btn').textContent = 'Start';
    document.getElementById('start-btn').classList.remove('bg-red-600');
    document.getElementById('start-btn').classList.add('bg-green-600');
    
    // 6. Redraw the board with only black background and "Press START" message
    draw(); 
}

// fullLoad: true means create Walls, Pacman, Ghosts, Food. false means clear all entities.
function loadMap(fullLoad = true) {
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

            // ⭐️ FIX: Only create walls if fullLoad is true
            if (fullLoad && tileMapChar == 'X') { //block wall
                const wall = new Block(wallImage, x, y, tileSize, tileSize);
                walls.add(wall);
            }
            
            // Only create other entities if fullLoad is true
            if (fullLoad) {
                if (tileMapChar == 'b') { //blue ghost
                    const ghost = new Block(blueGhostImage, x, y, tileSize, tileSize);
                    ghosts.add(ghost);
                }
                else if (tileMapChar == 'o') { //orange ghost
                    const ghost = new Block(orangeGhostImage, x, y, tileSize, tileSize);
                    ghosts.add(ghost);
                }
                else if (tileMapChar == 'p') { //pink ghost
                    const ghost = new Block(pinkGhostImage, x, y, tileSize, tileSize);
                    ghosts.add(ghost);
                }
                else if (tileMapChar == 'r') { //red ghost
                    const ghost = new Block(redGhostImage, x, y, tileSize, tileSize);
                    ghosts.add(ghost);
                }
                else if (tileMapChar == 'P') { //pacman
                    pacman = new Block(pacmanRightImage, x, y, tileSize, tileSize);
                }
                else if (tileMapChar == ' ') { //empty is food (pellets)
                    const food = new Block(null, x + 14, y + 14, 4, 4);
                    foods.add(food);
                }
            }
        }
    }
}

function update() {
    if (!gameStarted) {
        draw(); 
        return; 
    }
    
    if (gameOver) {
        document.getElementById('statusMessage').textContent = 'Game Over!';
        document.getElementById('modalTitle').textContent = 'Game Over';
        document.getElementById('modalScore').textContent = `Final Score: ${score}`;
        document.getElementById('gameOverModal').classList.remove('hidden');
        
        // Ensure button reverts to Start state on game over
        document.getElementById('start-btn').textContent = 'Start';
        document.getElementById('start-btn').classList.remove('bg-red-600');
        document.getElementById('start-btn').classList.add('bg-green-600');
        
        const playerName = prompt("Game Over! Enter your name for the leaderboard:", "Player");
        if (playerName) {
            sendScore(playerName, score);
        }
        return;
    }
    gameLoopTimeout = setTimeout(update, 50); 
    move();
    draw();
}

function draw() {
    context.clearRect(0, 0, board.width, board.height);
    
    // ⭐️ FIX: Only draw walls if the game has started (or if walls exist, which now only happens on start)
    if (gameStarted) {
        // Draw walls
        for (let wall of walls.values()) {
            context.drawImage(wall.image, wall.x, wall.y, wall.width, wall.height);
        }

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
    }
    
    // Update Score and Lives on the HTML elements
    document.getElementById('scoreDisplay').textContent = `Score: ${score}`;
    document.getElementById('livesDisplay').textContent = `Lives: ${lives}`;
    
    // Initial status text on the board
    if (!gameStarted) {
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
        
        // ... in move() function, inside the loop over ghosts ...

         if (collision(ghost, pacman) && !gamePausedAfterDeath) { // Check for collision and if not already paused
            clearTimeout(gameLoopTimeout); // Stop the main update loop
            lives -= 1;
            document.getElementById('livesDisplay').textContent = `Lives: ${lives}`;
            
            if (lives == 0) {
                gameOver = true;
                gameStarted = false; 
                // Game Over logic is handled in the next update() call, so we just return
                gameLoopTimeout = setTimeout(update, 50); // One final call to trigger the game over modal
                return;
            }
            
            // PAUSE AND DEATH MESSAGE LOGIC
            gamePausedAfterDeath = true;
            deathSound.play(); // Play death sound effect
            
            
            // Pause for 3 seconds
            setTimeout(() => {
                resetPositions();
                document.getElementById('statusMessage').textContent = 'Go!';
                gamePausedAfterDeath = false;
                
                // Restart the game loop
                gameLoopTimeout = setTimeout(update, 50);
            }, 2000); // 3000 milliseconds = 3 seconds

            return; // Exit move() immediately
        }

// ... rest of the move() function ...

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
                
                // Change direction randomly
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
        document.getElementById('statusMessage').textContent = 'Level Clear!';
        setTimeout(() => {
            loadMap(true); // Full load for next level
            resetPositions();
            gameStarted = true;
            document.getElementById('statusMessage').textContent = 'Go!';
            
            // Set initial velocity for ghosts on new level start
            for (let ghost of ghosts.values()) {
                ghost.updateVelocity();
            }
        }, 1000); // 1 second pause
    }
}

// Unified input handler for both keyboard and on-screen buttons
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

    // Attempt to execute the new direction
    pacman.attemptDirectionChange(newDirection);
    
    // Update pacman images
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
// LEADERBOARD FUNCTIONS (unchanged for core game logic)
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
    
    // NEW METHOD for instant, precise movement
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