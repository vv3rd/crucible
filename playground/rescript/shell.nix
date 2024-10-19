{
  pkgs ? import <nixpkgs> { },
}:
pkgs.mkShell {
  packages = [
    pkgs.bun
    pkgs.biome
    pkgs.nodejs
  ];

  shellHook = ''
    export PATH="$PWD/node_modules/.bin:$PATH"
    echo "Bun: $(bun --version) Node: $(node --version | awk '{gsub(/v/, "");}1') Biome: $(biome --version | awk '{print $2}')" \
          | ${pkgs.cowsay}/bin/cowsay | ${pkgs.lolcat}/bin/lolcat
  '';
}
