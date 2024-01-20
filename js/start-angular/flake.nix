{
  description = "test";

  inputs =
  {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";
  };

  outputs = { self, nixpkgs, ... }:
  let
    system = "x86_64-linux";
    pkgs = nixpkgs.legacyPackages.${system};
  in
  {
    devShells.${system}.default = pkgs.mkShell {
        packages =
        let
          node = pkgs.nodejs_21;
          pnpm = node.pkgs.pnpm;
        in [
          node
          pnpm
        ];
        shellHook = ''
          echo "node verstion $(pnpm node --version)" | ${pkgs.cowsay}/bin/cowsay | ${pkgs.lolcat}/bin/lolcat
          export PATH="./node_modules/.bin:$PATH"
        '';
      };
  };
}
