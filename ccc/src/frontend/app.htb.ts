import Htb from "htb";

export default Htb("body", {}, () => [
  Htb("noscript", {}, "You need to enable JavaScript to run this app."),
  Htb("main", { id: "main"}, () => [  
    Htb("textarea", {id: "textarea", cols:"30", rows: "5" }, " ")
  ]),
]);


