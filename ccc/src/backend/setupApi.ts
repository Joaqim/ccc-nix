import path from "node:path";
import express from "express";
import { execute } from "./utils/execute";

const root = path.join(__dirname, "../frontend");

const verifyCommand = (command: string) => !(/&>\/`!#$%^&\*;\\\|/.test(command));

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

	app.post("/rcon-cli", async (req, res) => {
		if (!req.body) {
			res.status(400).send({ message: "No body" });
			return;
		}
		if (!req.body.command) {
			res.status(400).send({ message: "No command provided"});
			return;
		}

		const command = req.body.command.startsWith("/")
			? req.body.command.slice(1)
			: req.body.command;

		if (!verifyCommand(command)) {
			res.status(400).send({ message: `Invalid command: ${command}`});
			return;
		}

    if (command === "clear weather") {
      res.status(400).send({ message: "Did you mean '/weather clear'?"} );
      return;
    }

		execute(`env docker exec minecraft-server rcon-cli '${command}'`)
			.then((result) => {
				if (result.startsWith("Unknown")) {
					throw new Error(result);
				}
				return res.send({ message: result });
			})
			.catch((err) => {
				return res.status(500).send({ message: err.message});
			});
	});

	return app;
}
