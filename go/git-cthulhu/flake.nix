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
      devShell = pkgs.mkShell
        {
          packages = with pkgs; [
            go
            gopls
            gotools
            entr
            just
          ];

          shellHook = ''
            export GOPATH="$XDG_DATA_HOME"/go
            go version | ${pkgs.cowsay}/bin/cowsay | ${pkgs.lolcat}/bin/lolcat
          '';
        };
    });
}
