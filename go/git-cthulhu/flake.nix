{
  inputs = {
    utils.url = "github:numtide/flake-utils";
    tools.url = "github:vv3rd/tools";
  };

  outputs = { utils, tools, ... }: utils.lib.eachDefaultSystem (system:
    {
      devShell = tools.devShells.${system}.golang;
    });
}
