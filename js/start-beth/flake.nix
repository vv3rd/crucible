{
  description = "Bun dev env";

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
        packages = [
          pkgs.bun
        ];

        shellHook = ''
          echo "bun verstion $(bun --version)" | ${pkgs.cowsay}/bin/cowsay | ${pkgs.lolcat}/bin/lolcat
          export PATH="./node_modules/.bin:$PATH"
        '';
      };
  };
}
