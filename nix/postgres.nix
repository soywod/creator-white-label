{ env, pkgs }:

let
  launcher = pkgs.writeShellScriptBin "postgres-start" ''
    mkdir -p "$PGDIR"
    if [ ! -d $PGDATA ]; then
      initdb --auth=trust --no-locale --encoding=UTF8
    fi
    pg_ctl stop
    pg_ctl start -l "$PGLOG" -o "--unix_socket_directories="
    createdb
    trap "pg_ctl stop" EXIT
    psql -c "grant all privileges on all sequences in schema public to $USER"
    tail -f "$PGLOG"
  '';

in
{
  launcher = "${launcher}/bin/postgres-start";
  buildInputs = with pkgs; [
    postgresql_13
  ];
  shellHook = ''
    export PGDIR="$WORKDIR/.pgdir.${env}"
    export PGDATA="$PGDIR/data"
    export PGLOG="$PGDIR/log"
  '';
}
