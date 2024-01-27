{
  inputs =
  {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";
  };

  outputs = { self, nixpkgs, ... }:
  let
    system = "x86_64-linux";
    pkgs = import nixpkgs { inherit system; };
  in
  {
    devShells.${system}.default = pkgs.mkShell {
        packages = [
          pkgs.jdk
          pkgs.java-language-server
          pkgs.google-java-format
        ];

        shellHook = ''
          echo "$(java --version)" | ${pkgs.cowsay}/bin/cowsay | ${pkgs.lolcat}/bin/lolcat
        '';
      };
  };
}
