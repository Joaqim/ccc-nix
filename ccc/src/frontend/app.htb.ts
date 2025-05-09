import Htb from "htb";
import { localize } from "../shared";
export default Htb("body", {}, () => [
  Htb(
    "noscript",
    {},
    localize("You need to enable JavaScript to run this app.")
  ),

  Htb("div", { class: "settings-container" }, () => [
    Htb("h1", { class: "settings-title" }, localize("Commands")),
    Htb("div", { class: "player-container hidden" }, " "),
    Htb("div", { class: "textarea-item" }, () => [
      Htb(
        "textarea",
        {
          id: "textarea",
          name: "textarea", // https://stackoverflow.com/a/16959534
          class: "textarea-item",
          readonly: true,
          disabled: true,
          cols: "30",
          rows: "2",
        },
        " "
      ),
    ]),
  ]),
]);
