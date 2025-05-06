{
  description = "Sample express node app using Dream2nix";

  inputs = {
    dream2nix = {
      url = "github:nix-community/dream2nix";
      inputs.nixpkgs.follows = "nixpkgs";
    };
    flake-parts.url = "github:hercules-ci/flake-parts";
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";
    systems.url = "github:nix-systems/default";
  };
  outputs = inputs @ {
    dream2nix,
    flake-parts,
    systems,
    nixpkgs,
    ...
  }:
    flake-parts.lib.mkFlake {inherit inputs;} {
      systems = import systems;
      perSystem = {
        lib,
        pkgs,
        system,
        self',
        ...
      }: {
        apps = {
          backend = {
            type = "app";
            program = lib.getExe self'.packages.default;
          };
        };
        packages = let
          evalModules = module:
            dream2nix.lib.evalModules {
              packageSets.nixpkgs = nixpkgs.legacyPackages.${system};
              modules = [
                module
                {
                  paths.projectRoot = ./.;
                  paths.projectRootFile = "flake.nix";
                  paths.package = ./.;
                }
              ];
            };
        in {
          ccc = evalModules ./default.nix;
          default = self'.packages.ccc;
        };
      };
    };
}
