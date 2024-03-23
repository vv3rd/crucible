{
  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";
    utils.url = "github:numtide/flake-utils";
    tools.url = "github:vv3rd/tools";
  };

  outputs = { nixpkgs, utils, tools, ... }: utils.lib.eachDefaultSystem (system:
    let
      pkgs = import nixpkgs { inherit system; };
      npmrc = pkgs.writeTextFile {
        name = "npmrc";
        destination = "/npmrc";
        text = ''
          prefix=''${XDG_DATA_HOME}/npm
          cache=''${XDG_CACHE_HOME}/npm
          init-module=''${XDG_CONFIG_HOME}/npm/config/npm-init.js
        '';
      };
      node = pkgs.nodejs_21;
      pnpm = node.pkgs.pnpm;
    in
    {
      devShell = pkgs.mkShell {
        packages = [
          pkgs.bun
          pkgs.biome
          node
          pnpm
          npmrc
          pkgs.go
          pkgs.gopls
          pkgs.gotools
          pkgs.entr
          pkgs.just
        ];

        shellHook = ''
          export PATH="$PWD/node_modules/.bin:$PATH"
          export NPM_CONFIG_USERCONFIG="${npmrc}/npmrc"
          export GOPATH="$XDG_DATA_HOME"/go
        '';
      };
    });
}
