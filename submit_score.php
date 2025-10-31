
<?php
// Configuration - REPLACE WITH YOUR ACTUAL CREDENTIALS
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "pacman_leaderboard_db";

// Connect to the database
$conn = new mysqli($servername, $username, $password, $dbname);
if ($conn->connect_error) {
    die(json_encode(["success" => false, "message" => "Connection failed: " . $conn->connect_error]));
}

// Get data from the POST request
$data = json_decode(file_get_contents('php://input'), true);
$playerName = $data['playerName'] ?? 'Anonymous';
$scoreValue = $data['score'] ?? 0;

// Sanitize inputs
$playerName = $conn->real_escape_string($playerName);
$scoreValue = (int)$scoreValue;

// Insert data
$sql = "INSERT INTO high_scores (player_name, score) VALUES (?, ?)";
$stmt = $conn->prepare($sql);
$stmt->bind_param("si", $playerName, $scoreValue);

header('Content-Type: application/json');
if ($stmt->execute()) {
    echo json_encode(["success" => true, "message" => "Score submitted successfully."]);
} else {
    echo json_encode(["success" => false, "message" => "Error submitting score: " . $stmt->error]);
}

$stmt->close();
$conn->close();
?>