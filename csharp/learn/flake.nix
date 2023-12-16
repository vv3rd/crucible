{

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-23.11";
  };

  outputs = inputs:
    let
      system = "x86_64-linux";
      pkgs = import inputs.nixpkgs { inherit system; };
    in
    {
      formatter.${system} = pkgs.nixpkgs-fmt;

      devShells.${system}.default = pkgs.mkShell {
        name = "dotnet-env";
        packages = [
          pkgs.dotnetCorePackages.sdk_8_0
          pkgs.omnisharp-roslyn
        ];

        shellHook = ''
          export NUGET_PACKAGES="$XDG_CACHE_HOME"/NuGetPackages
          export LD_LIBRARY_PATH="${pkgs.ncurses}/lib:$LD_LIBRARY_PATH"
          export OMNISHARPHOME="$XDG_CONFIG_HOME/omnisharp"
          echo "dotnet version: $(dotnet --version)" | ${pkgs.cowsay}/bin/cowsay | ${pkgs.lolcat}/bin/lolcat
        '';
      };
    };
}
