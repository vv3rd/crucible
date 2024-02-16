{
  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";
    utils.url = "github:numtide/flake-utils";
  };

  outputs = { nixpkgs, utils, ... }: utils.lib.eachDefaultSystem (system:
    let
      pkgs = import nixpkgs { inherit system; };
    in
    {
      devShell = pkgs.mkShell {
        packages = [
          pkgs.bun
        ];

        shellHook = ''
          echo "bun verstion $(bun --version)" | ${pkgs.cowsay}/bin/cowsay | ${pkgs.lolcat}/bin/lolcat
          export PATH="$PWD/node_modules/.bin:$PATH"
        '';
      };
    });
}
