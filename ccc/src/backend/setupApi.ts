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

      const command: string = req.body.command.startsWith("/")
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
          .then((result) => {
            if (result.startsWith("There are 0 ")) {
              return res.send({ players: [] });
            }
            return res.send({
              players: result.slice(result.indexOf(": ") + 2).split(", "),
            });
          })
          .catch((err) => {
            return res.status(500).send({ message: err.message });
          });
        return;
      }

      execute(`env docker exec minecraft-server rcon-cli '${command}'`)
        .then((result) => {
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
