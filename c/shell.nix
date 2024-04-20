{ pkgs ? import <nixpkgs> { } }: pkgs.mkShell
{
  packages = with pkgs; [
    gcc
    bear
    clang-tools
    man-pages
    man-pages-posix
  ];
}
