{
  description = "Golang dev environment & tools";

  inputs =
  {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";
  };

  outputs = { self, nixpkgs }: 
  let
    system = "x86_64-linux";
    pkgs = nixpkgs.legacyPackages.${system};
  in
  {
    devShells.${system}.default = pkgs.mkShell 
    {
      packages = with pkgs; [
        go
        gopls
      ];

      shellHook = ''
        go version | ${pkgs.cowsay}/bin/cowsay | ${pkgs.lolcat}/bin/lolcat
      '';
    };
  };
}
