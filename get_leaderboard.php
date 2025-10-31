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

// Fetch top 10 scores
$sql = "SELECT player_name, score, DATE_FORMAT(date_achieved, '%Y-%m-%d') as date_achieved FROM high_scores ORDER BY score DESC LIMIT 10";
$result = $conn->query($sql);

$leaderboard = [];
if ($result->num_rows > 0) {
    while($row = $result->fetch_assoc()) {
        $leaderboard[] = $row;
    }
}

header('Content-Type: application/json');
echo json_encode(["success" => true, "leaderboard" => $leaderboard]);

$conn->close();
?>