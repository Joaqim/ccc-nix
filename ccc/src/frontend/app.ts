import { localize } from "../shared";

type AvailableEndpoints = "rcon-cli";

const upcase = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);
const downcase = (str: string) => str.charAt(0).toLowerCase() + str.slice(1);

export default (() => {
  const textarea = document.querySelector("#textarea") as HTMLElement;
  const container = document.querySelector(
    ".settings-container"
  ) as HTMLElement;

  new EventSource("/esbuild").addEventListener("change", () =>
    location.reload()
  );

  let selectedPlayer: string | undefined;

  const postCmd = (
    command: string,
    endpoint: AvailableEndpoints = "rcon-cli"
  ) => {
    return fetch(`/${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        command,
      }),
    });
  };
  const gameruleTextResponseAsBoolean = (message: string) => {
    const returnValue = message.slice(message.indexOf(": ") + 2);
    if (!/true|false/.test(returnValue)) {
      throw new Error(`Failed to get boolean from value: '${message}'`);
    }
    return /true/.test(returnValue);
  };

  const getCurrentGamerule = (gamerule: "doDaylightCycle") => {
    return postCmd(`/gamerule ${gamerule}`)
      .then(async (response) => {
        if (!response.ok || response.status !== 200) {
          let message = "";
          try {
            message = (await response.json()).message;
          } catch {
            message = response.statusText;
          }
          throw new Error(message);
        }
        return response.json();
      })
      .then(({ message }: { message: string }) => {
        return gameruleTextResponseAsBoolean(message);
      });
  };

  const playerToggles: HTMLInputElement[] = [];

  const initPlayerToggles = async (): Promise<{ players: string[] }> => {
    return postCmd("list players").then((response: Response) => {
      if (!response.ok || response.status !== 200) {
        return response.json().then(({ message }) => message);
      }

      return response.json().then(({ players }: { players: string[] }) => {
        if (players.length < 2) {
          selectedPlayer = players.at(0);
        } else {
          const playerContainer = document.querySelector(
            ".player-container"
          ) as HTMLElement;

          if (playerContainer.classList.contains("hidden")) {
            playerContainer.classList.toggle("hidden");
          }
          for (const playerName of players) {
            const playerToggle = document.createElement("input");
            playerToggles.push(playerToggle);

            playerToggle.type = "checkbox";
            playerToggle.className = "player-item";
            playerToggle.textContent = playerName;
            playerContainer.appendChild(playerToggle);

            playerToggle.addEventListener("click", () => {
              for (const pt of playerToggles) {
                if (pt.textContent !== playerName && pt.checked) {
                  pt.checked = false;
                  break;
                }
              }
              if (!playerToggle.checked) {
                selectedPlayer = undefined;
              } else {
                selectedPlayer = playerName;
              }
            });
          }
        }
        return { players };
      });
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
  const commandButtonAction = (
    command: string,
    btn: HTMLInputElement,
    silentSuccess = false
  ) => {
    btn.disabled = true;
    const commandToExecute = insertPlayerIntoCommand(command);
    textarea.textContent = commandToExecute;

    const loadingFeedback = setTimeout(() => {
      if (btn.disabled) {
        textarea.textContent += `\r\n${localize("Loading")}...`;
      }
    }, 1000);

    return postCmd(command)
      .then(async (response) => {
        if (!response.ok) {
          let message = "";
          try {
            const json = await response.json();
            message = json.message;
          } catch {
            message = response.statusText;
          }
          throw new Error(message);
        }

        return (await response.json()).message;
      })
      .then((text: string) => {
        if (!silentSuccess) {
          textarea.textContent = `${localize("Successfully ")}${downcase(
            text
          )}`;
        }
        return text;
      })
      .catch((err) => {
        console.error(err);
        textarea.textContent = `${localize(
          "Failed to execute"
        )} '${commandToExecute}',\r\n${err.message}`;
        btn.classList.toggle("error");
        setTimeout(() => {
          btn.classList.toggle("error");
        }, 1000);
      })
      .finally(() => {
        clearTimeout(loadingFeedback);
        setTimeout(() => {
          btn.disabled = false;
        }, 1000);
      });
  };
  const initGameruleButton = (
    gamerule: "doDaylightCycle",
    buttonLabel?: string
  ) => {
    const silentSuccess = true;
    let toggleStatus = false;
    const action = (command: string, btn: HTMLInputElement) => {
      commandButtonAction(`${command} ${!toggleStatus}`, btn, silentSuccess)
        .then((result) => {
          if (typeof result !== "string") {
            throw new Error("Invalid response when toggling gamerule");
          }
          return gameruleTextResponseAsBoolean(result);
        })
        .then((result) => {
          textarea.textContent += `\r\n${localize(gamerule)}: ${localize(
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
    createBtn(
      "/time set day",
      commandButtonAction,
      `${localize("Set time to day")} 🌅`
    );
    createBtn(
      "/time set night",
      commandButtonAction,
      `${localize("Set time to night")} 🌃`
    );
    createBtn(
      "/weather clear",
      commandButtonAction,
      `${localize("Weather")}: ${localize("Clear")} ☀️`
    );
    createBtn(
      "/weather thunder",
      commandButtonAction,
      `${localize("Weather")}: ${localize("Thunder")} 🌩️`
    );
    createBtn(
      "/weather rain",
      commandButtonAction,
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
      if (players?.length > 0) {
        createBtn(
          "/gamemode survival @p",
          commandButtonAction,
          `${localize("Gamemode")}: ${localize("Survival")} 💔`
        );

        createBtn(
          "/gamemode creative @p",
          commandButtonAction,
          `${localize("Gamemode")}: ${localize("Creative")} 🖌️`
        );
        createBtn(
          "/gamemode spectator @p",
          commandButtonAction,
          `${localize("Gamemode")}: ${localize("Spectator")} 🎥`
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
