{}:

let
  env = "development";
  port = import ./port.nix 3000;

  pkgs = import ./nixpkgs.nix;

  postgres = import ./postgres.nix { inherit env pkgs; };
  node = import ./node.nix { inherit env pkgs; };
  rust = import ./rust.nix { inherit pkgs; };
  overmind = import ./overmind.nix { inherit port pkgs; };

  nix-env = with pkgs; [
    rnix-lsp
    nixpkgs-fmt
  ];

  admin-launcher = pkgs.writeShellScriptBin "admin-start" ''
    cd "$WORKDIR/admin"
    PORT=${port 0} yarn start
  '';

  server-launcher = pkgs.writeShellScriptBin "server-start" ''
    cd "$WORKDIR/server"
    PORT=${port 1} cargo watch -x run
  '';

  procfile = overmind.mkProcfile ''
    postgres: ${postgres.launcher}
    admin: ${admin-launcher}/bin/admin-start
    server: ${server-launcher}/bin/server-start
  '';

in
pkgs.mkShell {
  buildInputs = nix-env
    ++ postgres.buildInputs
    ++ node.buildInputs
    ++ rust.buildInputs
    ++ overmind.buildInputs;
  shellHook = ''
    export WORKDIR="$PWD"
  ''
  + postgres.shellHook
  + node.shellHook
  + overmind.shellHook procfile;
}
