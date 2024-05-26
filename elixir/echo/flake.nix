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
          pkgs.elixir-ls
          pkgs.elixir
          pkgs.erlang
          pkgs.postgresql
          pkgs.inotify-tools
        ];
        MIX_XDG="true";
      };
    }
  );
}
