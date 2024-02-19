{ pkgs ? import <nixpkgs> {} }:

pkgs.mkShell 
{
  packages = [
    pkgs.clojure-lsp
    pkgs.jdk
    pkgs.clojure
  ];
}
