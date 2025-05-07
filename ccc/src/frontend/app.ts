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
  const playerToggles: HTMLInputElement[] = [];

  const initPlayerToggles = async (): Promise<{ players: string[] }> => {
    return postCmd("list players").then((response: Response) => {
      if (!response.ok) {
        throw new Error(response.statusText);
      }
      if (response.status !== 200) {
        return { players: [] };
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

  const createBtn = (command: string, commandName?: string) => {
    const btn = document.createElement("input");
    btn.type = "button";
    btn.className = "setting-toggle";

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

    btn.addEventListener("click", () => {
      btn.disabled = true;
      const commandToExecute = insertPlayerIntoCommand(command);
      textarea.textContent = commandToExecute;

      const loadingFeedback = setTimeout(() => {
        if (btn.disabled) {
          textarea.textContent += `\r\n${localize("Loading")}...`;
        }
      }, 1000);

      postCmd(command)
        .then(async (response) => {
          if (response.status !== 200) {
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
        .then((text) => {
          textarea.textContent = `${localize("Successfully ")}${downcase(
            text
          )}`;
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
    });
  };

  const initButtons = () => {
    //createBtn("/clear weather", "Test Failure Button");
    createBtn("/time set day", `${localize("Set time to day")} 🌅`);
    createBtn("/time set night", `${localize("Set time to night")} 🌃`);
    createBtn(
      "/weather clear",
      `${localize("Weather")}: ${localize("Clear")} ☀️`
    );
    createBtn(
      "/weather thunder",
      `${localize("Weather")}: ${localize("Thunder")} 🌩️`
    );
    createBtn(
      "/weather rain",
      `${localize("Weather")}: ${localize("Rain")} 🌧️`
    );
  };

  initPlayerToggles()
    .then(({ players }) => {
      if (players.length > 0) {
        createBtn(
          "/gamemode survival @p",
          `${localize("Gamemode")}: ${localize("Survival")} 💔`
        );

        createBtn(
          "/gamemode creative @p",
          `${localize("Gamemode")}: ${localize("Creative")} 🖌️`
        );
        createBtn(
          "/gamemode spectator @p",
          `${localize("Gamemode")}: ${localize("Spectator")} 🎥`
        );
      }
    })
    .catch(console.error)
    .finally(() => {
      initButtons();
    });
})();
