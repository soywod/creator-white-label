{ pkgs }:

let
  version = "0.45.0";
  vendorSha256 = "KHLknBymDAwr7OxS2Ysx6WU5KQ9kmw0bE2Hlp3CBW0c=";
  sha256 = "cJb5Cac7WDhtNL/7uIIvAz7Kum3Ff2g6tmKyTJWvq00=";

  qovery = pkgs.buildGoModule rec {
    inherit version vendorSha256;
    pname = "qovery-cli";
    src = pkgs.fetchFromGitHub {
      inherit sha256;
      owner = "qovery";
      repo = pname;
      rev = "v${version}";
    };
  };

in
{
  buildInputs = [
    qovery
  ];
}
