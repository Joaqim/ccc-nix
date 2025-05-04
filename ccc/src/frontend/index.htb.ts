// index.htb.js
import Htb from "htb";
import App from "./app.htb";

export default (
  Htb('!DOCTYPE', { html: true })
  ('html', {}, () => [
    Htb('head', {}, () => [
      Htb('meta', { charset: 'utf-8' }),
      Htb('link', { rel: "icon", href: "/favicon.ico" }),
      Htb('meta', { 
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
       }),
      Htb('title', {}, "CCC"),
    ]),
    App
])
).html;