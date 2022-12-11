{ env, port, pkgs }:

let
  prisma = pkgs.prisma-engines;
  launcher = pkgs.writeShellScriptBin "prisma-studio-start" ''
    cd "$WORKDIR/backend"
    dotenv -c ${env} -v BROWSER=none -- prisma studio --port ${port 300}
  '';
in

{
  launcher = "${launcher}/bin/prisma-studio-start";
  buildInputs = [
    prisma
  ];
  shellHook = ''
    export PRISMA_MIGRATION_ENGINE_BINARY="${prisma}/bin/migration-engine"
    export PRISMA_QUERY_ENGINE_BINARY="${prisma}/bin/query-engine"
    export PRISMA_QUERY_ENGINE_LIBRARY="${prisma}/lib/libquery_engine.node"
    export PRISMA_INTROSPECTION_ENGINE_BINARY="${prisma}/bin/introspection-engine"
    export PRISMA_FMT_BINARY="${prisma}/bin/prisma-fmt"
  '';
}
