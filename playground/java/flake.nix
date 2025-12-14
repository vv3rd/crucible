{
  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";
  };

  outputs =
    { nixpkgs, ... }:
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

      packages.${system}.default = pkgs.stdenv.mkDerivation {
        name = "simple-http-java";
        src = ./.;
        buildInputs = [ pkgs.jdk ];
        buildPhase = ''
          javac ./App.java;
        '';
        installPhase = ''
          mkdir -p $out/bin
          echo "#! ${pkgs.stdenv.shell}" >> "pkg"
          echo "exec ${pkgs.jdk}/bin/java $out/bin/App.class" >> "pkg"
          chmod 0755 "pkg"
          cp pkg $out/bin/simple-http-java
        '';
      };
    };
}
