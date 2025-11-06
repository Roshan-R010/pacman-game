// board
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

// ⭐ NEW: Holds the image object of the ghost currently doing the "chase" AI
let chaserImage; 

// X = wall, O = skip, P = pac man, ' ' = food
// Ghosts: b = blue, o = orange, p = pink, r = red
const tileMap = [
    "XXXXXXXXXXXXXXXXXXX",
    "X                 X",
    "X XX XXX X XXX XX X",
    "X                 X",
    "X XX X XXXXX X XX X",
    "X X    X           ", 
    "XXXX XXXX XXXX XXXX",
    "OOOX X    X        ",
    "XXXX X XXrXX X XXXX",
    "    bpo            ", 
    "XXXX X XXXXX X XXXX",
    "OOOX X    X        ",
    "XXXX X XXXXX X XXXX",
    "X           X      X", 
    "X XX XXX X XXX XX X",
    "X X  P          X X", 
    "XX X X XXXXX X X XX",
    "X      X      XX  X",
    "X XXXXXX   XXXXXX X",
    "X                 X",
    "XXXXXXXXXXXXXXXXXXX"
];

const walls = new Set();
const foods = new Set();
const ghosts = new Set();
let pacman = null; 

const directions = ['U', 'D', 'L', 'R']; //up down left right

// ===================================
// ⭐ SOUND OBJECTS
// ===================================
const deathSound = new Audio('./pacman_death.wav');
const beginningSound = new Audio('./pacman_beginning.wav'); 
const chompSound = new Audio('./chomping.mp3'); 
chompSound.volume = 0.2; // Reduced chomping sound volume by 80%
const sirenSound = new Audio('./siren.mp3'); 
sirenSound.loop = true; 
sirenSound.volume = 0.4;


let score = 0;
let lives = 3;
let gameOver = false;
let gameStarted = false; 
let gameLoopTimeout; 
let scoreSubmitted = false; 
let gamePausedAfterDeath = false; 
let showStartMessage = true; 

// 🚩 API Base URL for MongoDB Node.js Server
// REMINDER: Change this to your DEPLOYED server's URL before deploying the game!
const API_BASE_URL = 'https://pacman-server.onrender.com'; 


window.onload = function() {
    board = document.getElementById("board");
    board.height = boardHeight;
    board.width = boardWidth;
    context = board.getContext("2d"); //used for drawing on the board

    loadImages();
    
    // Load map with NO entities for the initial black screen.
    loadMap(false, false); 
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

    // START/RESET BUTTON LOGIC (Main button on the page)
    document.getElementById('start-btn').addEventListener('click', () => {
        if (!gameStarted) {
            // Hide the start message and initialize all game entities
            showStartMessage = false;
            loadMap(true, false); // Load the maze, dots, pacman, ghosts
            draw(); // Redraw immediately with the maze visible
            
            startGame(false); // New Game, full reset
            document.getElementById('start-btn').textContent = 'Reset'; 
            document.getElementById('start-btn').classList.remove('bg-green-600');
            document.getElementById('start-btn').classList.add('bg-red-600');
        } else {
            // Reset the game if it is currently running
            resetGame();
        }
    });
    
    // ⭐ FIX APPLIED HERE: Restart button event listener (inside Game Over Modal)
    document.getElementById('restartGameBtn').addEventListener('click', () => {
        document.getElementById('gameOverModal').classList.add('hidden');
        showStartMessage = false; 
        // Perform a full game reset (score=0, lives=3)
        resetGame(true); // Flag added to resetGame to prevent it from going to the Start Screen
    });

    // Exit to Main Menu button event listener (inside Game Over Modal)
    document.getElementById('exitToMenuBtn').addEventListener('click', () => {
        document.getElementById('gameOverModal').classList.add('hidden');
        resetGame(); // Full reset to initial "Press Start" state
    }); 

    // Submit Score button listener (inside Game Over Modal)
    document.getElementById('submitScoreBtn').addEventListener('click', submitFinalScore); 
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

// ⭐ NEW FUNCTION: Assigns one ghost the chasing role randomly
function assignChaser() {
    const ghostImages = [blueGhostImage, orangeGhostImage, pinkGhostImage, redGhostImage];
    const randomIndex = Math.floor(Math.random() * ghostImages.length);
    chaserImage = ghostImages[randomIndex];
    
    console.log(`New Chaser assigned: ${chaserImage.src}`);
}


// Function to initialize/reset the game state
function startGame(isRestart = false) {
    clearTimeout(gameLoopTimeout);
    
    // 1. Reset positions (entities were loaded in the start-btn handler or resetGame)
    resetPositions();
    
    // 2. Reset game variables
    // Only reset score/lives if this is a brand new game or a full restart after game over
    if (!isRestart) {
        score = 0; 
        lives = 3; 
    }
    gameOver = false;
    scoreSubmitted = false;
    gamePausedAfterDeath = false; // Reset death pause
    
    // ⭐ NEW: Assign a new chaser role on every game start/reset
    assignChaser(); 

    // 3. Stop siren and play the beginning sound
    sirenSound.pause();
    sirenSound.currentTime = 0;
    beginningSound.currentTime = 0;
    
    beginningSound.play();
    
    // 4. Update status displays
    document.getElementById('scoreDisplay').textContent = `Score: ${score}`;
    document.getElementById('livesDisplay').textContent = `Lives: ${lives}`;
    document.getElementById('statusMessage').textContent = 'Ready!';
    document.getElementById('gameOverModal').classList.add('hidden');
    
    // 5. Start Game Loop after beginning sound (approx. 4 seconds)
    const beginningSoundDuration = 4000; 

    gameLoopTimeout = setTimeout(() => {
        sirenSound.play();
        gameStarted = true;
        document.getElementById('statusMessage').textContent = 'Go!';
        
        // 5b. Set initial random direction for ghosts (and initial velocity)
        for (let ghost of ghosts.values()) {
            ghost.chooseNewDirection(); // Use the new function to set a valid initial direction/velocity
        }

        // Use recursive call to 'update' loop instead of setting another timeout here
        update(); 
    }, beginningSoundDuration); 
    
    // 6. Set initial zero velocity for entities 
    if (pacman) {
        pacman.velocityX = 0;
        pacman.velocityY = 0;
    }
    for (let ghost of ghosts.values()) {
        ghost.velocityX = 0; 
        ghost.velocityY = 0;
    }
}

// Resets the entire game state. If keepMapLoaded is true, it skips the "Press START" screen transition.
function resetGame(keepMapLoaded = false) {
    // 1. Stop the game loop and sounds
    clearTimeout(gameLoopTimeout);
    sirenSound.pause(); 
    sirenSound.currentTime = 0;
    
    // 2. Clear ALL entities and reload the map (if not keeping map loaded)
    loadMap(keepMapLoaded, false); 
    
    // 3. Reset game state variables
    score = 0;
    lives = 3;
    gameOver = false;
    gameStarted = false; 
    scoreSubmitted = false;
    gamePausedAfterDeath = false;
    // Set flag to show start message only if returning to the menu screen
    showStartMessage = !keepMapLoaded; 

    // 4. Reset UI
    document.getElementById('scoreDisplay').textContent = `Score: ${score}`;
    document.getElementById('livesDisplay').textContent = `Lives: ${lives}`;
    document.getElementById('statusMessage').textContent = 'Ready!';
    document.getElementById('gameOverModal').classList.add('hidden'); // Ensure modal is hidden
    
    // 5. Reset button to "Start" state if returning to menu
    if (!keepMapLoaded) {
        document.getElementById('start-btn').textContent = 'Start';
        document.getElementById('start-btn').classList.remove('bg-red-600');
        document.getElementById('start-btn').classList.add('bg-green-600');
        // 6. Redraw the board to show "Press START to Play!" on a black background
        draw(); 
    } else {
        // If the map is kept loaded (i.e., immediate restart after Game Over)
        // Re-start the game immediately with fresh score/lives.
        loadMap(true, false);
        draw();
        startGame(false); // <--- Starts a new game with score=0, lives=3
    }
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

            // Only load Walls if fullLoad is true OR if wallsOnly is true
            if (tileMapChar == 'X' && (fullLoad || wallsOnly)) { 
                const wall = new Block(wallImage, x, y, tileSize, tileSize);
                walls.add(wall);
            }
            
            // Only create other entities (Ghosts, Pacman, Food) if fullLoad is true AND wallsOnly is false
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
                
                // Add food if it's an empty space, and not 'O' (skip/no food zone)
                if (tileMapChar === ' ' || tileMapChar === 'P' || 
                    ['b', 'o', 'p', 'r'].includes(tileMapChar)) {
                    // Food added slightly offset to be centered in tile
                    const food = new Block(null, x + tileSize / 2 - 2, y + tileSize / 2 - 2, 4, 4);
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
        
        // This is the Game Over Modal display logic (from previous step)
        if (!scoreSubmitted) {
            document.getElementById('statusMessage').textContent = 'Game Over!';
            document.getElementById('modalTitle').textContent = 'Game Over';
            document.getElementById('modalScore').textContent = `Final Score: ${score}`;
            document.getElementById('playerNameInput').value = '';
            document.getElementById('gameOverModal').classList.remove('hidden'); 
            scoreSubmitted = true;
        }

        // Ensure START/RESET button reverts its state
        document.getElementById('start-btn').textContent = 'Start';
        document.getElementById('start-btn').classList.remove('bg-red-600');
        document.getElementById('start-btn').classList.add('bg-green-600');
        return; 
    }
    
    // Only continue the loop if the game has started AND is not paused after death
    if (!gameStarted || gamePausedAfterDeath) { 
        return; 
    }

    gameLoopTimeout = setTimeout(update, 50); 
    move();
    draw();
}

function draw() {
    // This clears the canvas to black
    context.clearRect(0, 0, board.width, board.height); 
    
    // Draw walls (only drawn if they exist)
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
    
    // Update Score and Lives on the HTML elements
    document.getElementById('scoreDisplay').textContent = `Score: ${score}`;
    document.getElementById('livesDisplay').textContent = `Lives: ${lives}`;
    
    // Initial status text on the board
    // Text is only shown if the game hasn't started AND the flag is set.
    if (!gameStarted && showStartMessage) { 
        context.fillStyle = "yellow";
        context.font = "20px Rubik";
        context.textAlign = "center";
        context.fillText("Press START to Play!", boardWidth / 2, boardHeight / 2);
    }
}

// 🎯 HELPER FUNCTION for Ghost AI 🎯
function chooseBestChaseDirection(ghost) {
    if (!pacman) return null;

    // Use current position and desired movement (speed) for collision check
    const speed = tileSize / 4; 
    let bestDirection = ghost.direction;
    let minDistance = Infinity;
    
    const possibleDirections = ['U', 'D', 'L', 'R'];

    for (const direction of possibleDirections) {
        // Prevent immediate reversal 
        if (direction === ghost.getOppositeDirection()) {
            continue;
        }

        let tempX = ghost.x;
        let tempY = ghost.y;

        // Project position based on potential direction
        if (direction === 'U') tempY -= speed;
        else if (direction === 'D') tempY += speed;
        else if (direction === 'L') tempX -= speed;
        else if (direction === 'R') tempX += speed;

        // Create a temporary block for collision check
        const tempBlock = { x: tempX, y: tempY, width: ghost.width, height: ghost.height };
        let collidesWithWall = false;

        for (let wall of walls.values()) {
            if (collision(tempBlock, wall)) {
                collidesWithWall = true;
                break;
            }
        }
        
        // Skip this direction if it leads to a wall collision
        if (collidesWithWall) continue;
        
        // Calculate Manhattan distance to Pacman 
        const newDist = Math.abs(tempX - pacman.x) + Math.abs(tempY - pacman.y);

        if (newDist < minDistance) {
            minDistance = newDist;
            bestDirection = direction;
        }
    }

    return bestDirection;
}


function move() {
    if (!gameStarted || !pacman || gamePausedAfterDeath) return; 
    
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
        
        // Ghost-Pacman Collision Check
        if (collision(ghost, pacman)) { 
            clearTimeout(gameLoopTimeout); // Stop game loop immediately

            // Game Over
            if (lives <= 1) {
                deathSound.play();
                lives = 0;
                document.getElementById('livesDisplay').textContent = `Lives: ${lives}`;
                gameOver = true;
                gameStarted = false; 
                gameLoopTimeout = setTimeout(update, 50); // Re-start loop once to trigger Game Over modal
                return;
            }
            
            // Player Death (Loss of 1 life)
            lives -= 1;
            document.getElementById('livesDisplay').textContent = `Lives: ${lives}`;

            // PAUSE AND DEATH LOGIC
            gamePausedAfterDeath = true;
            sirenSound.pause(); 
            deathSound.play(); 
            
            document.getElementById('statusMessage').textContent = 'Ready!'; 
            draw(); 
            
            // Pause for 2 seconds 
            setTimeout(() => {
                resetPositions();
                document.getElementById('statusMessage').textContent = 'Go!';
                gamePausedAfterDeath = false;

                sirenSound.currentTime = 0;
                sirenSound.play(); 
                
                gameLoopTimeout = setTimeout(update, 50); // Resume the game loop
            }, 2000); 

            return; 
        }

        // --- GHOST MOVEMENT LOGIC (Fixed and Upgraded) ---
        
        // Ghost House Exit 
        const currentTileCol = Math.round(ghost.x / tileSize);
        const currentTileRow = Math.round(ghost.y / tileSize);

        // If in the center of the ghost box, force move up to exit
        if (currentTileRow === 9 && (currentTileCol === 8 || currentTileCol === 9 || currentTileCol === 10)) {
            if (ghost.canMoveInDirection('U')) {
                ghost.direction = 'U';
                ghost.updateVelocity();
            }
        }

        // 1. Apply current velocity
        ghost.x += ghost.velocityX;
        ghost.y += ghost.velocityY;
        
        // 2. PATHING LOGIC (Intersection check)
        // Check if ghost is near the center of a tile to attempt a turn (4 pixel buffer)
        if (Math.abs(ghost.x % tileSize) < 4 && Math.abs(ghost.y % tileSize) < 4) { 
            // Snap to center for clean movement before turning
            const col = Math.round(ghost.x / tileSize);
            const row = Math.round(ghost.y / tileSize);
            ghost.x = col * tileSize;
            ghost.y = row * tileSize;

            // ⭐ CHECK CHASER ROLE
            if (ghost.image === chaserImage) {
                // CHASER GHOST: Uses targeted AI (Blinky's behavior)
                const bestDirection = chooseBestChaseDirection(ghost);
                if (bestDirection) {
                    ghost.direction = bestDirection;
                    ghost.updateVelocity();
                }
            } else {
                // OTHER GHOSTS: Use random movement
                ghost.chooseNewDirection(); 
            }
        }
        
        // 3. Ghost collision with wall logic (Rollback if collision occurs)
        let hitWall = false;
        for (let wall of walls.values()) {
            if (collision(ghost, wall) || ghost.x < 0 || ghost.x + ghost.width > boardWidth || ghost.y < 0 || ghost.y + ghost.height > boardHeight) {
                
                // Rollback position
                ghost.x -= ghost.velocityX;
                ghost.y -= ghost.velocityY;
                
                // Stop movement and force a random change
                ghost.velocityX = 0;
                ghost.velocityY = 0;
                
                // Choose a new random direction immediately upon hitting a wall
                ghost.chooseNewDirection();
                hitWall = true;
                break;
            }
        }
        // --- END GHOST MOVEMENT LOGIC ---
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
            loadMap(true, false); 
            resetPositions();
            startGame(true); // Restart logic without resetting score/lives (Next Level)
        }, 1000); 
    }
}

function handleInput(e) {
    if (!gameStarted || gameOver || !pacman || gamePausedAfterDeath) {
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
        // Use new ghost direction logic
        ghost.chooseNewDirection(); 
    }
}

// ===================================
// LEADERBOARD FUNCTIONS (MODIFIED FOR MONGODB API)
// ===================================

function submitFinalScore() {
    const playerName = document.getElementById('playerNameInput').value.trim();
    const finalScore = score; 

    if (!playerName || playerName.length < 2) {
        alert("Please enter a name with at least 2 characters.");
        return;
    }
    
    document.getElementById('gameOverModal').classList.add('hidden'); 
    sendScore(playerName, finalScore); 
}

function sendScore(playerName, finalScore) {
    if (finalScore <= 0) return; 

    // NEW API ENDPOINT
    fetch(`${API_BASE_URL}/api/submit_score`, {
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
        } else {
            console.error('Error on submit:', data.message);
            alert('Could not submit score: ' + data.message);
        }
    })
    .catch((error) => {
        console.error('Error submitting score. Is your server running?', error);
        alert('Connection error submitting score. Check server console.');
    });
}

function fetchLeaderboard() {
    // NEW API ENDPOINT
    fetch(`${API_BASE_URL}/api/get_leaderboard`)
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

        row.cells[0].classList.add("popupnumber");
        row.cells[1].classList.add("popupname");
        row.cells[2].classList.add("popuppoints");

    });

        
    document.getElementById('leaderboardContainer').style.display = 'block';
}


// ===================================
// BLOCK CLASS 
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

    // ⭐ GHOST LOGIC METHOD 1: Random, non-colliding direction chooser
    chooseNewDirection() {
        const currentDirection = this.direction;
        const oppositeDirection = this.getOppositeDirection();
        
        // Prioritize turns, exclude the reverse direction initially
        let potentialDirections = directions.filter(dir => dir !== oppositeDirection);

        // Shuffle for randomness
        potentialDirections.sort(() => Math.random() - 0.5);

        let newDirection = null;

        // Try to find a valid direction (Non-reversing directions first)
        for (const dir of potentialDirections) {
            if (this.canMoveInDirection(dir)) {
                newDirection = dir;
                break; 
            }
        }
        
        if (!newDirection) {
            // Last resort: If stuck, try reversing
             if (this.canMoveInDirection(oppositeDirection)) {
                newDirection = oppositeDirection;
             }
        }

        if (newDirection) {
             this.direction = newDirection;
             this.updateVelocity();
        } else {
            // If completely stuck, stop movement
             this.velocityX = 0;
             this.velocityY = 0;
        }
    }
    
    // ⭐ GHOST LOGIC METHOD 2: Get opposite direction
    getOppositeDirection() {
        if (this.direction === 'U') return 'D';
        if (this.direction === 'D') return 'U';
        if (this.direction === 'L') return 'R';
        if (this.direction === 'R') return 'L';
        return null; 
    }
    
    // ⭐ GHOST LOGIC METHOD 3: Check if a direction is valid/non-colliding
    canMoveInDirection(testDirection) {
        const originalX = this.x;
        const originalY = this.y;
        const originalDir = this.direction;
        
        // Temporarily set new direction and velocity
        this.direction = testDirection;
        this.updateVelocity(); 
        
        const testX = originalX + this.velocityX;
        const testY = originalY + this.velocityY;

        let collisionDetected = false;

        // Check against board boundaries
        if (testX < 0 || testX + this.width > boardWidth || testY < 0 || testY + this.height > boardHeight) {
            collisionDetected = true;
        } else {
            // Create a temporary object for collision checking
            const tempBlock = { x: testX, y: testY, width: this.width, height: this.height };
            
            // Check against walls
            for (let wall of walls.values()) {
                if (collision(tempBlock, wall)) {
                    collisionDetected = true;
                    break;
                }
            }
        }

        // Restore original state and velocity
        this.direction = originalDir;
        this.updateVelocity(); // Recalculate velocity based on restored direction

        return !collisionDetected;
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
        this.velocityX = 0;
        this.velocityY = 0;
        
        // If this is Pacman, reset to facing right.
        if (this.image === pacmanUpImage || this.image === pacmanDownImage || 
            this.image === pacmanLeftImage || this.image === pacmanRightImage) {
            this.image = pacmanRightImage;
        }
    }
}