{
  inputs = {
    # nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";
    utils.url = "github:numtide/flake-utils";
    tools.url = "github:vv3rd/tools";
  };

  outputs = { utils, tools, ... }: utils.lib.eachDefaultSystem (system:
    {
      devShell = tools.devShells.${system}.javascript;
    });
}
