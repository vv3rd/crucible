{
  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";
  };

  outputs = inputs: rec {
    pkgs = import inputs.nixpkgs {
      system = "x86_64-linux";
    };
    system = pkgs.stdenv.hostPlatform.system;

    devShell.${system} = pkgs.mkShell {
      packages = with pkgs; [
        haskell.compiler.ghc98
        haskellPackages.haskell-language-server
        # pkgs.ghc
        pkgs.entr
        pkgs.just
      ];

      shellHook = ''
        just | ${pkgs.lib.getExe pkgs.cowsay} | ${pkgs.lib.getExe pkgs.lolcat}
      '';
    };
  };
}
