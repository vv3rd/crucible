{
  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";
    utils.url = "github:numtide/flake-utils";
  };

  outputs = { nixpkgs, utils, self, ... }: utils.lib.eachDefaultSystem (system:
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
          pkgs.cowsay
          pkgs.lolcat
        ];
        MIX_XDG = "true";

        shellHook = ''
          # echo "execute 'docker run --rm --name elixir-pg -e POSTGRES_PASSWORD=docker -d -p 5432:5432 -v \$DB_VOLUME:/var/lib/postgresql/data postgres" | cowsay | lolcat
          export DB_VOLUME="$PWD/db"
        '';
      };
    }
  );
}
