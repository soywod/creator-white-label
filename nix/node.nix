{ env, pkgs }:

let
  nodejs = pkgs.nodejs-16_x;
  yarn = pkgs.yarn.override { inherit nodejs; };

in
{
  buildInputs = [
    nodejs
    yarn
  ];
  shellHook = ''
    export NODE_ENV="${env}"
    export PATH="$WORKDIR/node_modules/.bin/:$PATH"
  '';
}
