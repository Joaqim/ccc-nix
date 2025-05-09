import path from "node:path";
import express from "express";
import { execute } from "./utils/execute";
import type { Gamemode, Player, ResponseBody } from "../shared";

const root = path.join(__dirname, "../frontend");

const verifyCommand = (command: string) => !/&>\/`!#$%^&\*;\\\|/.test(command);

export default function setupApi() {
  const app = express();

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.get("/", (_req, res) => {
    res.sendFile("/index.html", { root });
  });

  app.get("/app.js", (_req, res) => {
    res.sendFile("/app.js", { root });
  });

  app.post("/post", (_req, res) => {
    res.send("Post Received");
  });

  app.get("/get", (_req, res) => {
    res.send("Get Received");
  });

  app.post(
    "/rcon-cli",
    async (
      req: express.Request<{ body: { command: string } }>,
      res: express.Response<ResponseBody>
    ) => {
      if (!req.body) {
        res.status(400).send({ message: "No body" });
        return;
      }
      if (!req.body.command) {
        res.status(400).send({ message: "No command provided" });
        return;
      }

      if (typeof req.body.command !== "string") {
        res.status(400).send({ message: "Command must be a string" });
        return;
      }

      let command: string = req.body.command.startsWith("/")
        ? req.body.command.slice(1)
        : req.body.command;

      if (!verifyCommand(command)) {
        res.status(400).send({ message: `Invalid command: ${command}` });
        return;
      }

      if (command === "clear weather") {
        res.status(400).send({ message: "Did you mean '/weather clear'?" });
        return;
      }
      const getPlayerNames = (result: string) =>
        result.trim() !== ""
          ? result
              .slice(result.indexOf(": ") + 2)
              .split(", ")
              .map((p) => p.trim())
          : [];
      const getPlayersByGamemode = (gamemode: Gamemode, playerName = "@p") =>
        execute(
          `env docker exec minecraft-server rcon-cli /execute at @p[${
            playerName !== "@p" ? `name=${playerName},` : ""
          }gamemode=${gamemode}] run list`
        ).then(getPlayerNames);

      if (command === "list players") {
        execute("env docker exec minecraft-server rcon-cli /list")
          .then(async (result) => {
            if (result.startsWith("There are 0 ")) {
              return res.send({ message: result, players: [] });
            }

            const playerNames = getPlayerNames(result);

            // TODO: Use reduce pattern to avoid uneccesarry calls when all players are accounted for: players.length >= playerName.length
            const players: Player[] = await Promise.all(
              (["survival", "creative", "spectator"] as Gamemode[]).map(
                async (gamemode) => {
                  const playersInGamemode = await getPlayersByGamemode(
                    gamemode
                  );
                  for (const playerName of playerNames) {
                    if (playersInGamemode.includes(playerName)) {
                      playerNames.splice(playerNames.indexOf(playerName), 1);
                      return {
                        name: playerName,
                        gamemode,
                      };
                    }
                  }
                }
              )
            ).then((players) => players.filter(Boolean) as Player[]);

            return res.send({
              message: result,
              players,
            });
          })
          .catch((err) => {
            console.log(err);
            if (/No such container/.test(err)) {
              return res.status(404).send({
                message:
                  "Failed to connect to `rcon-cli` make sure minecraft-server docker container is running",
              });
            }
            return res.status(500).send({ message: err });
          });
        return;
      }
      let player: Player | undefined;
      if (/^gamemode \w+ (\w+|@p)$/.test(command)) {
        const gameMode = command.split(" ").at(1) as Gamemode;

        let playerName = command.split(" ").at(2) as string;

        const matchingPlayers = await getPlayersByGamemode(
          gameMode,
          playerName
        );

        playerName =
          matchingPlayers.length === 1
            ? (matchingPlayers.at(0) as string)
            : matchingPlayers.includes(playerName)
            ? playerName
            : "";

        if (playerName !== "") {
          player = {
            name: playerName,
            gamemode: gameMode as Gamemode,
          };

          command = `gamemode ${gameMode} ${playerName} false`;
        }
      }

      if (/^gamemode \w+ \w+ (true|false)$/.test(command)) {
        const gameMode = command.split(" ").at(1) as Gamemode;
        const playerName = command.split(" ").at(2) as string;
        const toggleValue = command.split(" ").at(3)?.trimEnd() as
          | "true"
          | "false";
        let newGameMode: Gamemode = gameMode;
        if (toggleValue && toggleValue === "false") {
          if (gameMode === "survival") {
            newGameMode = "creative";
          } else if (gameMode === "creative") {
            newGameMode = "survival";
          } else if (gameMode === "spectator") {
            newGameMode = "survival";
          }
          command = `/execute at @p[name=${playerName},gamemode=${gameMode}] run gamemode ${newGameMode} ${playerName}`;
          player = {
            name: playerName,
            gamemode: newGameMode,
          };
        } else {
          command = `/gamemode ${gameMode} ${playerName}`;
        }
      }

      execute(`env docker exec minecraft-server rcon-cli '${command}'`)
        .then((result) => result.trimEnd())
        .then((result) => {
          console.log(`'${command}'`);
          console.log(`'${result}'`);
          if (result.startsWith("Unknown or incomplete command")) {
            return res.status(400).send({ message: result });
          }
          if (result.startsWith("No player was found")) {
            return res.status(404).send({ message: "No player found" });
          }
          return res.send({
            message: result,
            players: player !== undefined ? [player] : undefined,
          });
        })
        .catch((err) => {
          return res.status(500).send({ message: err.message });
        });
    }
  );

  return app;
}
