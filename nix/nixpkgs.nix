let
  overlays = [ (import (builtins.fetchTarball "https://github.com/oxalica/rust-overlay/archive/master.tar.gz")) ];
  rev = "ce6aa13369b667ac2542593170993504932eb836";
  nixpkgs = builtins.fetchTarball {
    name = "nixpkgs-22.05";
    url = "https://github.com/nixos/nixpkgs/archive/${rev}.tar.gz";
  };

in
import nixpkgs { inherit overlays; }
