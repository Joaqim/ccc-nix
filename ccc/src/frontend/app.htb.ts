import Htb from "htb";

export default Htb("body", {}, () => [
  Htb("noscript", {}, "You need to enable JavaScript to run this app."),
  
  Htb("div", {class: "settings-container"}, () => [
    Htb("h1", {class: "settings-title"}, "Commands"),
    Htb("div", {class: "player-container"}, () => [
      Htb("div", {class: "player-item" }, "Player 1"),
      Htb("div", {class: "player-item" }, "Player 2"),
    ]),
    Htb("div", {class: "setting-item"}, () => [
      Htb("textarea", {id: "textarea", class: "setting-item", readonly: true, disabled: true, cols:"30", rows: "2" }, " "),
    ]),
  ]),
]);

