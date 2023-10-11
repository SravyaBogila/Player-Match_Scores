const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());

const convertSnakeCaseToCamelCaseForPlayerDetails = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

const convertSnakeCaseToCamelCaseForMatchDetails = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};

const convertSnakeCaseToCamelCaseForStats = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
    totalScore: dbObject.totalScore,
    totalFours: dbObject.totalFours,
    totalSixes: dbObject.totalSixes,
  };
};

let dbPath = path.join(__dirname, "cricketMatchDetails.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3004, () => {
      console.log("Server Running at http://localhost/3004/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
  }
};

initializeDBAndServer();

app.get("/players/", async (request, response) => {
  const getPlayersQuery = `
        SELECT 
            *
        FROM
            player_details
        ORDER BY
            player_id;
    `;
  const playersQueryResponse = await db.all(getPlayersQuery);
  response.send(
    playersQueryResponse.map((eachObject) =>
      convertSnakeCaseToCamelCaseForPlayerDetails(eachObject)
    )
  );
});

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `
        SELECT
            *
        FROM
            player_details
        WHERE
            player_id = ${playerId};
    `;
  const playerQueryResponse = db.get(getPlayerQuery);
  response.send(
    playerQueryResponse.map((eachObject) =>
      convertSnakeCaseToCamelCaseForPlayerDetails(eachObject)
    )
  );
});

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerDetails = request.body;
  const { playerName } = playerDetails;
  const updatePlayerQuery = `
        UPDATE
            players_details
        SET
            player_name = "${playerName}"
        WHERE
            player_id = ${playerId};
    `;
  await db.run(updatePlayerQuery);
  response.send("Player Details Updated");
});

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchQuery = `
        SELECT
            *
        FROM
            match_details
        WHERE
            match_id = ${matchId};
    `;
  const matchQueryResponse = await db.get(getMatchQuery);
  response.send(
    matchQueryResponse.map((eachObject) =>
      convertSnakeCaseToCamelCaseForMatchDetails(eachObject)
    )
  );
});

app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getMatchesQuery = `
        SELECT
            match_details.match_id AS matchId, match_details.match AS match, match_details.year AS year
        FROM 
            player_match_score Natural Join match_details
        WHERE
            player_id = ${playerId};
    `;
  const matchesQueryResponse = await db.all(getMatchesQuery);
  response.send(
    matchesQueryResponse.map((eachObject) =>
      convertSnakeCaseToCamelCaseForMatchDetails(eachObject)
    )
  );
});

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getPlayersQuery = `
        SELECT
            players_details.player_id AS playerId, players_details.player_name AS playerName
        FROM
            player_details NATURAL JOIN player_match_score
        WHERE
            match_id = ${matchId};
        `;
  const playersQueryResponse = await db.all(getPlayersQuery);
  response.send(
    playersQueryResponse.map((eachObject) =>
      convertSnakeCaseToCamelCaseForPlayerDetails(eachObject)
    )
  );
});

app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getStatsQuery = `
        SELECT
            player_id AS playerId, player_name AS playerName, SUM(score) AS totalScore, SUM(fours) AS totalFours, SUM(sixes) AS totalSixes
        FROM
            players_details INNER JOIN player_match_score
            ON players_details.player_id = player_match_score.player_id
        WHERE
            player_id = ${playerId};
    `;
  const statsQueryResponse = await db.all(getStatsQuery);
  response.send(
    statsQueryResponse.map((eachObject) =>
      convertSnakeCaseToCamelCaseForStats(eachObject)
    )
  );
});

module.exports = app;
