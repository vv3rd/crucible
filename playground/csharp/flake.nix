{
  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-23.11";
    tools.url = "github:vv3rd/tools";
  };

  outputs = inputs:
    let
      system = "x86_64-linux";
    in
    {
      devShells.${system}.default = inputs.tools.devShells.${system}.csharp;
    };
}
