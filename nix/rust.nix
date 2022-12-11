{ pkgs }:

let
  rust-bin = pkgs.rust-bin.fromRustupToolchainFile ../rust-toolchain.toml;

in
{
  buildInputs = with pkgs; [
    diesel-cli
    openssl.dev
    pkg-config
    rust-bin
    rust-analyzer
    cargo-watch
  ];
}
