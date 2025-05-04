{
  lib,
  dream2nix,
  ...
}: let
  packageJSON = builtins.fromJSON (builtins.readFile ./ccc/package.json);
in {
  inherit (packageJSON) name version;

  imports = [
    dream2nix.modules.dream2nix.nodejs-package-lock-v3
    dream2nix.modules.dream2nix.nodejs-granular-v3
  ];

  nodejs-package-lock-v3.packageLockFile = ./ccc/package-lock.json;
  nodejs-granular-v3.installMethod = "symlink";

  mkDerivation = {
    src = lib.cleanSource ./ccc;
    checkPhase = ''
      npm run test
    '';
    doCheck = true;
  };
}
