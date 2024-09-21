{
  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";
    utils.url = "github:numtide/flake-utils";
  };

  outputs =
    { nixpkgs, utils, ... }:
    utils.lib.eachDefaultSystem (
      system:
      let
        pkgs = import nixpkgs { system = system; };
      in
      {
        devShell = pkgs.mkShell {
          packages = with pkgs; [
            gleam
            erlang_27
            rebar3
            inotify-tools
            pkgs.nodejs_22.pkgs.pnpm
            pkgs.nodejs_22
          ];

        };
      }
    );
}
