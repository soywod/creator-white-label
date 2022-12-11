let
  rev = "950e2db322d7f12a8bf1a7620f84bf432f6c6b94";
  nixpkgs-unstable = builtins.fetchTarball {
    name = "nixpkgs-unstable";
    url = "https://github.com/nixos/nixpkgs/archive/${rev}.tar.gz";
  };

in
import nixpkgs-unstable { }
