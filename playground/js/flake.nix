{
  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";
    utils.url = "github:numtide/flake-utils";
  };

  outputs = { utils, nixpkgs, ... }: utils.lib.eachDefaultSystem (system:
    let
      pkgs = import nixpkgs { inherit system; };
      node = pkgs.nodejs;
    in
    {
      devShell = pkgs.mkShell {
        packages = [
          pkgs.bun
          pkgs.biome
          node
        ];

        shellHook = ''
          export PATH="$PWD/node_modules/.bin:$PATH"
        '';
      };
    });
}

