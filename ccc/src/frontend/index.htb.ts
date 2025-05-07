import Htb from "htb";
import App from "./app.htb";

export default (css: string) =>
  Htb("!DOCTYPE", { html: true })("html", {}, () => [
    Htb("head", {}, () => [
      Htb("meta", { charset: "utf-8" }),
      Htb("link", { rel: "icon", href: "/favicon.ico" }),
      Htb("script", { type: "module", src: "/app.js" }, " "), // Empty string required to properly close <script></script>
      Htb("style", { type: "text/css" }, css),
      Htb("meta", {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      }),
      Htb("title", {}, "CCC"),
    ]),
    App,
  ]).html;
