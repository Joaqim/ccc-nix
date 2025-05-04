# Example Typescript Express Node App using Dream2nix

Simple express node app in typescript with nix convenience builder Dream2nix. 

Basic node express application in [./express-node-app](./express-node-app) implemented with boilerplate from:
[gitlab/bhdouglass/node-test-runner-express-example](https://gitlab.com/bhdouglass/node-test-runner-express-example)

With [related Blog Post](https://bhdouglass/blog/test-an-expressjs-app-with-nodetest/)

To build/run
```sh
$ nix build
$ ./result/bin/express-node-app
🚀 http://localhost:8080
```
or simply:
```sh
$ nix run .
🚀 http://localhost:8080
```