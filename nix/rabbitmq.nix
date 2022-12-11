{ env, pkgs }:

let
  plugins = pkgs.writeText "rabbitmq-plugins.erl" ''
    [rabbitmq_management].
  '';
  launcher = pkgs.writeShellScriptBin "rabbitmq-start" ''
    rabbitmq-server start_app
  '';

in
{
  launcher = "${launcher}/bin/rabbitmq-start";
  buildInputs = with pkgs; [
    rabbitmq-server
  ];
  shellHook = ''
    export RABBITMQ_HOME="$WORKDIR/.rabbitmq.${env}"
    export RABBITMQ_MNESIA_BASE="$RABBITMQ_HOME/mnesia"
    export RABBITMQ_LOG_BASE="$RABBITMQ_HOME/logs"
    export RABBITMQ_ENABLED_PLUGINS_FILE="${plugins}"
  '';
}
