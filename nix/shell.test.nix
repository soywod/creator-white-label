{}:

let
  env = "test";
  port = import ./port.nix 4000;

  pkgs = import ./nixpkgs.nix;
  pkgs-unstable = import ./nixpkgs-unstable.nix;

  postgres = import ./postgres.nix { inherit env pkgs; };
  redis = import ./redis.nix { inherit env pkgs; };
  prisma = import ./prisma.nix { inherit env port; pkgs = pkgs-unstable; };
  node = import ./node.nix { inherit env; pkgs = pkgs-unstable; };
  overmind = import ./overmind.nix { inherit port pkgs; };
  mob = import ./mob.nix { inherit pkgs; };

  procfile = overmind.mkProcfile ''
    postgres: ${postgres.launcher}
    redis: ${redis.launcher}
    prisma: ${prisma.launcher}
  '';

in
pkgs.mkShell {
  buildInputs =
    postgres.buildInputs
    ++ redis.buildInputs
    ++ node.buildInputs
    ++ prisma.buildInputs
    ++ overmind.buildInputs
    ++ mob.buildInputs;
  shellHook = ''
    export WORKDIR="$PWD"
  ''
  + postgres.shellHook
  + prisma.shellHook
  + node.shellHook
  + overmind.shellHook procfile;
}
