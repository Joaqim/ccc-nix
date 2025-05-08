import path from "node:path";
import express from "express";
import { execute } from "./utils/execute";
import { prototype } from "node:events";

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
    async (req: express.Request<{ body: { command: string } }>, res) => {
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
      if (command === "list players") {
        execute("env docker exec minecraft-server rcon-cli /list")
          .then(async (result) => {
            if (result.startsWith("There are 0 ")) {
              return res.send({ players: [] });
            }
            const getPlayerNames = (result: string) =>
              result.trim() !== ""
                ? result
                    .slice(result.indexOf(": ") + 2)
                    .split(", ")
                    .map((p) => p.trim())
                : [];

            const getPlayerByGamemode = (gamemode: string) =>
              execute(
                `env docker exec minecraft-server rcon-cli /execute at @p[gamemode=${gamemode}] run list`
              );

            const players = getPlayerNames(result);

            const playerGamemodes: Record<string, string[]> = {
              creative: [],
              spectator: [],
              survival: [],
            };
            let playerCount = 0;
            for (const gamemode in playerGamemodes) {
              playerGamemodes[gamemode] = getPlayerNames(
                await getPlayerByGamemode(gamemode)
              );
              if (playerGamemodes[gamemode].length > 0) {
                playerCount += playerGamemodes[gamemode].length;
              }
              if (playerCount >= players.length) {
                break;
              }
            }

            return res.send({
              players,
              playerGamemodes,
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

      if (/^gamemode \w+ \w+ (true|false)$/.test(command)) {
        const gameMode = command.split(" ").at(1);
        const player = command.split(" ").at(2);
        const toggleValue = command.split(" ").at(3);
        let newGameMode = gameMode;
        if (toggleValue && toggleValue === "false") {
          if (gameMode === "survival") {
            newGameMode = "creative";
          } else if (gameMode === "creative") {
            newGameMode = "survival";
          } else if (gameMode === "spectator") {
            newGameMode = "survival";
          }
          command = `/execute at @p[name=${player},gamemode=${gameMode}] run gamemode ${newGameMode} ${player}`;
        } else {
          command = `gamemode ${gameMode} ${player}`;
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
          return res.send({ message: result });
        })
        .catch((err) => {
          return res.status(500).send({ message: err.message });
        });
    }
  );

  return app;
}
