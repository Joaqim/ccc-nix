import Htb from "htb";

export default Htb("body", {}, () => [
  Htb("noscript", {}, "You need to enable JavaScript to run this app."),
  Htb("main", {}, () => [  
    Htb("button", { id: "button" }, "count"),
    Htb("div", {id: "counter" }, "0")
  ]),
]);


