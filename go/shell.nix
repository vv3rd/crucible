{ pkgs ? import <nixpkgs> {} }:

pkgs.mkShell 
{
  packages = with pkgs; [
    go
    gopls
  ];

  shellHook = ''
    export GOPATH=${toString ./.go}
    go version | ${pkgs.cowsay}/bin/cowsay | ${pkgs.lolcat}/bin/lolcat
  '';
}
