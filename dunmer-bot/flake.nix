{
  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";
    utils.url = "github:numtide/flake-utils";
  };

  outputs = { nixpkgs, utils, ... }:
    utils.lib.eachDefaultSystem (system:
      let
        lib = nixpkgs.lib;
        pkgs = import nixpkgs {
          system = system;
          config.allowUnfreePredicate = pkg:
            builtins.elem (lib.getName pkg) [ "redisinsight" ];
        };
      in {
        devShell = pkgs.mkShell {
          packages = with pkgs; [ go gopls gotools entr just redis ];

          shellHook = ''
            export PATH="$PWD/node_modules/.bin:$PATH"
            export GOPATH="$XDG_DATA_HOME/go"
          '';
        };
      });
}
