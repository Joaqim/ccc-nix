import type { Gamemode, Player, ResponseBody } from "../shared";
import { localize } from "../shared";

type AvailableEndpoints = "rcon-cli";

const upcase = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);
const downcase = (str: string) => str.charAt(0).toLowerCase() + str.slice(1);

export default (() => {
  const textarea = document.querySelector("#textarea") as HTMLElement;
  textarea.textContent = "";
  const container = document.querySelector(
    ".settings-container"
  ) as HTMLElement;

  try {
    new EventSource("/esbuild").addEventListener("change", () =>
      location.reload()
    );
  } catch {
    // ignore
  }

  let selectedPlayer: Player | undefined;

  const playerToggles: Record<string, Record<Gamemode, HTMLInputElement>> = {};

  const postCmd = <TResponse = ResponseBody>(
    command: string,
    btn?: HTMLInputElement,
    silentSuccess = false,
    endpoint: AvailableEndpoints = "rcon-cli"
  ): Promise<TResponse> => {
    const commandToExecute = insertPlayerIntoCommand(command);
    /* if (!silentSuccess) {
      textarea.textContent = commandToExecute;
    } else {
      textarea.textContent = null;
    } */
    textarea.textContent = null;
    const loadingFeedback = setTimeout(() => {
      textarea.textContent += `\r\n${localize("Loading")}...`;
    }, 1000);

    if (btn) {
      btn.disabled = true;
    }

    return fetch(`/${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        command,
      }),
    })
      .then((response) => response.json())
      .then((body) => {
        if (!silentSuccess && body.message !== "") {
          textarea.textContent = `${localize("Successfully ")}${downcase(
            body.message
          )}`;
        }
        if (body.players?.length === 1) {
          selectedPlayer = body.players[0];
        }
        return body;
      })
      .catch((err) => {
        console.error(err);
        textarea.textContent = `${localize(
          "Failed to execute"
        )} '${command}',\r\n${err.message}`;
        if (btn) {
          btn.classList.toggle("error");
          setTimeout(() => {
            btn.classList.toggle("error");
          }, 1000);
        }
      })
      .finally(() => {
        clearTimeout(loadingFeedback);
        if (btn) {
          btn.disabled = false;
        }
      }) as Promise<TResponse>;
  };
  const gameruleTextResponseAsBoolean = (message: string) => {
    const returnValue = message.slice(message.indexOf(": ") + 2);
    if (!/true|false/.test(returnValue)) {
      throw new Error(`Failed to get boolean from value: '${message}'`);
    }
    return /true/.test(returnValue);
  };

  const getCurrentGamerule = (gamerule: "doDaylightCycle") => {
    return postCmd(`/gamerule ${gamerule}`, undefined, true).then(
      ({ message }: { message: string }) => {
        return gameruleTextResponseAsBoolean(message);
      }
    );
  };

  const initPlayerToggles = async (): Promise<ResponseBody> => {
    return postCmd("list players").then(({ message, players }) => {
      if (!players) {
        return { message, players: [] };
      }

      for (const player of players) {
        playerToggles[player.name] = {} as unknown as Record<
          Gamemode,
          HTMLInputElement
        >;
      }

      const playerContainer = document.querySelector(
        ".player-container"
      ) as HTMLElement;
      if (players.length < 2) {
        selectedPlayer = players.at(0);
      } else {
        playerContainer.classList.toggle("hidden");
      }
      for (const player of players) {
        const playerToggle = document.createElement("input");

        playerToggles[player.name][player.gamemode] = playerToggle;

        playerToggle.type = "checkbox";
        playerToggle.className = "player-item";
        playerToggle.textContent = player.name;
        playerContainer.appendChild(playerToggle);

        playerToggle.addEventListener("click", () => {
          for (const pt in playerToggles[player.name]) {
            const elem = playerToggles[player.name][pt];
            if (elem.textContent !== player.name) {
              elem.checked = false;
              break;
            }
          }
          if (!playerToggle.checked) {
            selectedPlayer = undefined;
          } else {
            selectedPlayer = player;
          }
        });
      }

      return { message, players };
    });
  };

  const insertPlayerIntoCommand = (command: string) =>
    command.replace("@p", selectedPlayer ? `"${selectedPlayer}"` : "@p");

  const createBtn = (
    command: string,
    onClick: (
      command: string,
      btn: HTMLInputElement,
      silentSuccess: boolean
    ) => void,
    commandName?: string,
    initialToggleValue = false,
    silentSuccess = false
  ) => {
    const btn = document.createElement("input");
    btn.type = "button";
    btn.className = "setting-toggle";
    if (initialToggleValue) {
      btn.classList.toggle("on");
    }

    let commandLabel = commandName || "";
    if (!commandName) {
      for (const word of command.trim().split(" ")) {
        commandLabel += `${upcase(word)} `;
      }
    }

    const span = document.createElement("span");
    span.className = "setting-label";
    span.textContent = commandLabel;

    const btnDiv = document.createElement("div");
    btnDiv.className = "setting-item";
    btnDiv.appendChild(span);
    btnDiv.appendChild(btn);
    container.appendChild(btnDiv);

    btn.addEventListener("click", () => onClick(command, btn, silentSuccess));
  };

  const initGameruleButton = (
    gamerule: "doDaylightCycle",
    buttonLabel?: string
  ) => {
    let toggleStatus = false;
    const action = (command: string, btn: HTMLInputElement) => {
      postCmd(`${command} ${!toggleStatus}`, btn, true)
        .then(({ message, players }) => {
          if (typeof message !== "string") {
            throw new Error("Invalid response when toggling gamerule");
          }
          return gameruleTextResponseAsBoolean(message);
        })
        .then((result) => {
          textarea.textContent += `${localize(gamerule)}: ${localize(
            result ? "enabled" : "disabled"
          )}`;
          btn.classList.toggle("on");
          toggleStatus = result;
        })
        .catch((err) => {
          console.error(err);
          textarea.textContent = `${localize(
            "Failed to toggle"
          )} '${command}',\r\n${err.message}`;
          btn.classList.toggle("error");
          setTimeout(() => {
            btn.classList.toggle("error");
          }, 1000);
        });
    };
    return getCurrentGamerule(gamerule).then((result) => {
      toggleStatus = result;
      createBtn(`/gamerule ${gamerule}`, action, buttonLabel, result);
    });
  };
  const initGameruleToggles = async () => {
    await initGameruleButton("doDaylightCycle", `${localize("Pause time")} 🕑`);
  };
  const initButtons = () => {
    //createBtn("/clear weather", "Test Failure Button");
    createBtn("/time set day", postCmd, `${localize("Set time to day")} 🌅`);
    createBtn(
      "/time set night",
      postCmd,
      `${localize("Set time to night")} 🌃`
    );
    createBtn(
      "/weather clear",
      postCmd,
      `${localize("Weather")}: ${localize("Clear")} ☀️`
    );
    createBtn(
      "/weather thunder",
      postCmd,
      `${localize("Weather")}: ${localize("Thunder")} 🌩️`
    );
    createBtn(
      "/weather rain",
      postCmd,
      `${localize("Weather")}: ${localize("Rain")} 🌧️`
    );
  };

  initPlayerToggles()
    .catch((error) => {
      console.error(error);
      textarea.textContent += `${"Failed to get players"}`;
      throw new Error(error);
    })
    .then(({ players }) => {
      if ((players?.length || 0) > 0) {
        const onClick = (
          command: string,
          btn: HTMLInputElement,
          silentSuccess: boolean | undefined
        ) =>
          postCmd(command, btn, silentSuccess).then((b) => {
            if (b.players?.at(0)) {
              btn.classList.toggle("on");
            }
          });
        const playerGamemode = players?.at(0)?.gamemode;
        createBtn(
          "/gamemode survival @p",
          onClick,
          `${localize("Gamemode")}: ${localize("Survival")} 💔`,
          playerGamemode === "survival"
        );

        createBtn(
          "/gamemode creative @p",
          onClick,
          `${localize("Gamemode")}: ${localize("Creative")} 🖌️`,
          playerGamemode === "creative"
        );
        createBtn(
          "/gamemode spectator @p",
          onClick,
          `${localize("Gamemode")}: ${localize("Spectator")} 🎥`,
          playerGamemode === "spectator"
        );
      }
    })
    .then(async () => {
      await initGameruleToggles();
      initButtons();
    })
    .catch((error) => {
      textarea.textContent += `\r\n${error}`;
    });
})();
