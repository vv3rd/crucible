{
  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";
  };
  outputs = inputs: {
    devShell.x86_64-linux = import ./shell.nix {
      pkgs = inputs.nixpkgs.legacyPackages.x86_64-linux;
    };
  };
}
