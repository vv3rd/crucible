{
  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";
    utils.url = "github:numtide/flake-utils";
  };

  outputs = { nixpkgs, utils, ... }:
    utils.lib.eachDefaultSystem (system:
      let pkgs = import nixpkgs { inherit system; };
      in {
        devShell = pkgs.mkShell {
          packages = [
            # 
            pkgs.go
            pkgs.gopls
            pkgs.gotools
            pkgs.entr
            pkgs.just
          ];

          shellHook = ''
            export PATH="$PWD/node_modules/.bin:$PATH"
            export GOPATH="$XDG_DATA_HOME/go"
          '';
        };
      });
}
