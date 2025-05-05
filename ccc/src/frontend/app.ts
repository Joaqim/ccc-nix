

type AvailableEndpoints = "rcon-cli";
const postCmd = (command: string, endpoint: AvailableEndpoints = "rcon-cli") => {
	return fetch(`/${endpoint}`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ command }),
	});
};

const upcase = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);
const downcase = (str: string) => str.charAt(0).toLowerCase() + str.slice(1);

export default (() => {

	const textarea = document.querySelector("#textarea") as HTMLElement;
    const container = document.querySelector(".settings-container") as HTMLElement;

	const createBtn = (
		command: string,
		commandName?: string,
	) => {
        const btn = document.createElement("input")
		btn.type = "button"
		btn.className = "setting-toggle"
		
		let commandLabel = commandName || "";
		if (!commandName) {
			for (const word of command.trim().split(" ")) {
				commandLabel += `${upcase(word)} `;
			}
		}

		const span = document.createElement("span")
		span.className = "setting-label"
		span.textContent = commandLabel;

		const btnDiv = document.createElement("div")
		btnDiv.className = "setting-item"
		btnDiv.appendChild(span)
		btnDiv.appendChild(btn)
        container.appendChild(btnDiv) 

        
		btn.addEventListener("click", () => {
            btn.disabled = true;
			textarea.textContent = command;

            setTimeout(() => {
                if (btn.disabled) {
                    textarea.textContent += "\r\nLoading...";
                }
            }, 1000)

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
					textarea.textContent = `Successfully ${downcase(text)}`;
				})
				.catch((err) => {
                    console.error(err)
					textarea.textContent = `Failed to execute '${command}',\r\n${err.message}`;
				})
				.finally(() => {
					btn.disabled = false;
				});
		});
	};

	createBtn("/weather clear", "Weather: Clear ☀️");
    createBtn("/clear weather", "Intentionally wrong command");
})();
