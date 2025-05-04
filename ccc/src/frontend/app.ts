const postCmd = (command: string) => {
	return fetch("/rcon-cli", {
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
    const main = document.querySelector("#main") as HTMLElement;

	const createBtn = (
		txtBox: HTMLElement,
		command: string,
		commandName?: string,
	) => {
        const btn = document.createElement("button")
        main.appendChild(btn) 

		if (!commandName) {
			let sanitizedName = "";

			for (const word of command.trim().split(" ")) {
				sanitizedName += `${upcase(word)} `;
			}
			btn.textContent = sanitizedName.trimEnd();
		} else {
			btn.textContent = commandName;
		}
        
		btn.addEventListener("click", () => {
            btn.disabled = true;
			txtBox.textContent = command;

            setTimeout(() => {
                if (btn.disabled) {
                    txtBox.textContent += "\r\nLoading...";
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
					txtBox.textContent = `Successfully ${downcase(text)}`;
				})
				.catch((err) => {
                    console.error(err)
					txtBox.textContent = `Failed to execute '${command}'\r\nError: ${err.message}`;
				})
				.finally(() => {
					btn.disabled = false;
				});
		});
	};

	createBtn(textarea, "/weather clear", "Weather: Clear ☀️");
    createBtn(textarea, "/clear weather", "Intentionally wrong command");
})();
