{ pkgs ? import <nixpkgs> { } }: pkgs.mkShell
{
  packages = with pkgs; [
    man-pages
    man-pages-posix
    gcc
    bear
    clang-tools
    clang
    pkg-config
  ];
}
