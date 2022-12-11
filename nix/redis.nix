{ env, pkgs }:

let
  config = pkgs.writeText "redis.conf" ''
    dbfilename .redis.${env}.rdb
  '';
  launcher = pkgs.writeShellScriptBin "redis-start" ''
    cd "$WORKDIR"
    redis-server "${config}"
  '';

in
{
  launcher = "${launcher}/bin/redis-start";
  buildInputs = with pkgs; [
    redis
  ];
}
