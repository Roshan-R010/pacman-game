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
    "X         X         X",
    "X XX XXX X XXX XX X",
    "X                 X",
    "X XX X XXXXX X XX X",
    "X    X       X    X",
    "XXXX XXXX XXXX XXXX",
    "OOOX X       X XOOO",
    "XXXX X XXrXX X XXXX",
    "O      bpo       O",
    "XXXX X XXXXX X XXXX",
    "OOOX X       X XOOO",
    "XXXX X XXXXX X XXXX",
    "X         X         X",
    "X XX XXX X XXX XX X",
    "X X    P      X  X",
    "XX X X XXXXX X X XX",
    "X    X   X   X    X",
    "X XXXXXX X XXXXXX X",
    "X                 X",
    "XXXXXXXXXXXXXXXXXXX"
];

const walls = new Set();
const foods = new Set();
const ghosts = new Set();
let pacman;

const directions = ['U', 'D', 'L', 'R']; //up down left right
let score = 0;
let lives = 3;
let gameOver = false;

window.onload = function() {
    board = document.getElementById("board");
    board.height = boardHeight;
    board.width = boardWidth;
    context = board.getContext("2d"); //used for drawing on the board

    loadImages();
    loadMap();
    
    // Set initial random direction for ghosts
    for (let ghost of ghosts.values()) {
        const newDirection = directions[Math.floor(Math.random() * 4)];
        ghost.updateDirection(newDirection);
    }
    
    update();
    
    // Keyboard controls
    document.addEventListener("keyup", handleInput);

    // ✅ On-screen D-pad controls (FIXED: Using touchend/click with preventDefault)
    document.getElementById('up-btn').addEventListener('click', (e) => { e.preventDefault(); handleInput({code: 'ArrowUp'}); });
    document.getElementById('down-btn').addEventListener('click', (e) => { e.preventDefault(); handleInput({code: 'ArrowDown'}); });
    document.getElementById('left-btn').addEventListener('click', (e) => { e.preventDefault(); handleInput({code: 'ArrowLeft'}); });
    document.getElementById('right-btn').addEventListener('click', (e) => { e.preventDefault(); handleInput({code: 'ArrowRight'}); });
    // Also attach touchstart listeners to improve mobile feel
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

function loadMap() {
    walls.clear();
    foods.clear();
    ghosts.clear();

    for (let r = 0; r < rowCount; r++) {
        for (let c = 0; c < columnCount; c++) {
            const row = tileMap[r];
            const tileMapChar = row[c];

            const x = c * tileSize;
            const y = r * tileSize;

            if (tileMapChar == 'X') { //block wall
                const wall = new Block(wallImage, x, y, tileSize, tileSize);
                walls.add(wall);
            }
            else if (tileMapChar == 'b') { //blue ghost
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
            else if (tileMapChar == ' ') { //empty is food
                const food = new Block(null, x + 14, y + 14, 4, 4);
                foods.add(food);
            }
        }
    }
}

function update() {
    if (gameOver) {
        return;
    }
    move();
    draw();
    setTimeout(update, 50); //1000/50 = 20 FPS
}

function draw() {
    context.clearRect(0, 0, board.width, board.height);
    
    // Draw walls
    for (let wall of walls.values()) {
        context.drawImage(wall.image, wall.x, wall.y, wall.width, wall.height);
    }
    
    // Draw food (must be after clearRect)
    context.fillStyle = "white";
    for (let food of foods.values()) {
        context.fillRect(food.x, food.y, food.width, food.height);
    }

    // Draw Pacman
    context.drawImage(pacman.image, pacman.x, pacman.y, pacman.width, pacman.height);
    
    // Draw Ghosts
    for (let ghost of ghosts.values()) {
        context.drawImage(ghost.image, ghost.x, ghost.y, ghost.width, ghost.height);
    }
    
    // Score and Lives
    context.fillStyle = "white";
    context.font = "14px sans-serif";
    if (gameOver) {
        context.fillText("Game Over: " + String(score), tileSize / 2, tileSize / 2);
    }
    else {
        context.fillText("x" + String(lives) + " " + String(score), tileSize / 2, tileSize / 2);
    }
}

function move() {
    
    // 1. APPLY CURRENT VELOCITY (Movement)

    pacman.x += pacman.velocityX;
    pacman.y += pacman.velocityY;

    // 2. CHECK WALL COLLISION (Stop if running into a wall or map boundary)
    // Map boundary check: Ensure Pacman stays within the defined tileMap area
    if (pacman.x < 0 || pacman.x + pacman.width > boardWidth || pacman.y < 0 || pacman.y + pacman.height > boardHeight) {
        pacman.x -= pacman.velocityX;
        pacman.y -= pacman.velocityY;
        pacman.velocityX = 0;
        pacman.velocityY = 0;
    }

    // Wall collision check
    for (let wall of walls.values()) {
        if (collision(pacman, wall)) {
            pacman.x -= pacman.velocityX;
            pacman.y -= pacman.velocityY;
            // Stop Pacman movement completely if blocked
            pacman.velocityX = 0;
            pacman.velocityY = 0;
            break;
        }
    }

    // --- REST OF THE LOGIC REMAINS THE SAME ---

    //check ghosts collision
    for (let ghost of ghosts.values()) {
        if (collision(ghost, pacman)) {
            lives -= 1;
            if (lives == 0) {
                gameOver = true;
                
                // Prompt for name and submit score on Game Over
                const playerName = prompt("Game Over! Enter your name for the leaderboard:", "Player");
                if (playerName) {
                    sendScore(playerName, score);
                }
                
                return;
            }
            resetPositions();
        }

        // Ghost Movement Logic
        // Simple logic to escape the ghost house initially (row 9 = 9*32 = 288)
        if (ghost.y == tileSize * 9 && ghost.direction != 'U' && ghost.direction != 'D') {
            ghost.updateDirection('U');
        }

        ghost.x += ghost.velocityX;
        ghost.y += ghost.velocityY;
        
        // Ghost collision with wall logic
        for (let wall of walls.values()) {
            if (collision(ghost, wall) || ghost.x <= 0 || ghost.x + ghost.width >= boardWidth) {
                ghost.x -= ghost.velocityX;
                ghost.y -= ghost.velocityY;
                
                // Change direction randomly
                const newDirection = directions[Math.floor(Math.random() * 4)];
                ghost.updateDirection(newDirection);
            }
        }
    }

    //check food collision
    let foodEaten = null;
    for (let food of foods.values()) {
        if (collision(pacman, food)) {
            foodEaten = food;
            score += 10;
            break;
        }
    }
    if (foodEaten) {
        foods.delete(foodEaten);
    }

    //next level
    if (foods.size == 0) {
        loadMap();
        resetPositions();
    }
}

// Unified input handler for both keyboard and on-screen buttons
function handleInput(e) {
    if (gameOver) {
        loadMap();
        resetPositions();
        lives = 3;
        score = 0;
        gameOver = false;
        update(); //restart game loop
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

    // Attempt to execute the new direction immediately with grid centering and collision check
    pacman.attemptDirectionChange(newDirection);
    
    // Update pacman images based on the successfully set direction
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
    return a.x < b.x + b.width &&    //a's top left corner doesn't reach b's top right corner
        a.x + a.width > b.x &&      //a's top right corner passes b's top left corner
        a.y < b.y + b.height &&     //a's top left corner doesn't reach b's bottom left corner
        a.y + a.height > b.y;       //a's bottom left corner passes b's top left corner
}

function resetPositions() {
    pacman.reset();
    pacman.velocityX = 0;
    pacman.velocityY = 0;
    for (let ghost of ghosts.values()) {
        ghost.reset();
        const newDirection = directions[Math.floor(Math.random() * 4)];
        ghost.updateDirection(newDirection);
    }
}

// ===================================
// LEADERBOARD FUNCTIONS
// ===================================

function sendScore(playerName, finalScore) {
    if (finalScore <= 0) return; // Only submit positive scores

    // Uses relative path, assuming submit_score.php is in the same directory
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
    // Uses relative path, assuming get_leaderboard.php is in the same directory
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
    tableBody.innerHTML = ''; // Clear previous entries

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
    
    // NEW METHOD for instant, precise movement
    attemptDirectionChange(newDirection) {
        const originalDirection = this.direction;
        const originalX = this.x;
        const originalY = this.y;
        
        // 1. Calculate the nearest perfect grid cell corner (top-left)
        // We use Math.round to snap to the closest grid line
        const col = Math.round(this.x / tileSize);
        const row = Math.round(this.y / tileSize);
        
        const snapX = col * tileSize;
        const snapY = row * tileSize;

        // 2. Temporarily snap to the grid and apply the new direction
        this.x = snapX;
        this.y = snapY;

        this.direction = newDirection;
        this.updateVelocity();

        // 3. Test for collision in the new direction
        this.x += this.velocityX;
        this.y += this.velocityY;

        let collisionDetected = false;
        
        // Check map boundaries first (This prevents Pacman from moving off the map edges)
        if (this.x < 0 || this.x + this.width > boardWidth || this.y < 0 || this.y + this.height > boardHeight) {
            collisionDetected = true;
        } else {
            // Then check wall collision
            for (let wall of walls.values()) {
                if (collision(this, wall)) {
                    collisionDetected = true;
                    break;
                }
            }
        }

        // 4. Restore or finalize the state
        this.x -= this.velocityX; // Reset back to the snapped grid position
        this.y -= this.velocityY;
        
        if (collisionDetected) {
            // If blocked, revert to original state
            this.direction = originalDirection;
            this.updateVelocity();
            this.x = originalX;
            this.y = originalY; 
            
            // Stop movement instantly if the path is blocked
            this.velocityX = 0;
            this.velocityY = 0;

        } else {
            // Path is clear! Keep the new direction and the snapped position.
            // The new velocity is now active and will be used in the next move() loop.
        }
    }

    updateDirection(direction) {
        const prevDirection = this.direction;
        this.direction = direction;
        this.updateVelocity();

        // Ghost Movement Logic (Pacman bypasses this logic as it uses attemptDirectionChange)
        if (this === pacman) {
            return;
        }
        
        // Ghost checks wall immediately
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
        // Pacman Speed: tileSize/4 = 32/4 = 8 pixels per update (20 FPS)
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
        this.direction = 'R'; // Default direction
    }
};