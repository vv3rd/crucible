{
  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";
    utils.url = "github:numtide/flake-utils";
  };

  outputs = { nixpkgs, utils, ... }: utils.lib.eachDefaultSystem (system:
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
          node
          pnpm
          npmrc
        ];

        shellHook = ''
          pnpm node --version | ${pkgs.cowsay}/bin/cowsay | ${pkgs.lolcat}/bin/lolcat
          export PATH="./node_modules/.bin:$PATH"
          export NPM_CONFIG_USERCONFIG="${npmrc}/npmrc"
        '';
      };
    }
  );
}
