{ port, pkgs }:

{
  mkProcfile = pkgs.writeText "procfile";
  buildInputs = with pkgs; [
    overmind
  ];
  shellHook = (procfile: ''
    export OVERMIND_PROCFILE="${procfile}"
    export OVERMIND_NETWORK="tcp"
    export OVERMIND_SOCKET="127.0.0.1:${port 999}"
    export OVERMIND_AUTO_RESTART="backend"
  '');
}  
