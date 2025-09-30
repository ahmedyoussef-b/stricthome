# To learn more about how to use Nix to configure your environment
# see: https://firebase.google.com/docs/studio/customize-workspace
{pkgs}: {
  # Which nixpkgs channel to use.
  channel = "stable-24.11"; # or "unstable"
  # Use https://search.nixos.org/packages to find packages
  packages = [
    pkgs.nodejs_20
    pkgs.zulu
    pkgs.openssl_3
    pkgs.pkg-config
  ];
  # Sets environment variables in the workspace
  env = {
    # Configuration pour Prisma avec OpenSSL 3
    PRISMA_CLI_BINARY_TARGET = "debian-openssl-3.0.x";
    # Variables pour aider Prisma à détecter OpenSSL
    OPENSSL_DIR = "${pkgs.openssl_3.dev}";
    OPENSSL_LIB_DIR = "${pkgs.openssl_3.out}/lib";
  };
  # This adds a file watcher to startup the firebase emulators. The emulators will only start if
  # a firebase.json file is written into the user's directory
  services.firebase.emulators = {
    # Disabling because we are using prod backends right now
    detect = false;
    projectId = "demo-app";
    services = ["auth" "firestore"];
  };
  idx = {
    # Search for the extensions you want on https://open-vsx.org/ and use "publisher.id"
    extensions = [
      # "vscodevim.vim"
    ];
    workspace = {
      onCreate = {
        default.openFiles = [
          "src/app/page.tsx"
        ];
      };
    };
    # Enable previews and customize configuration
    previews = {
      enable = true;
      previews = {
        web = {
          command = ["npm" "run" "dev" "--" "--port" "$PORT" "--hostname" "0.0.0.0"];
          manager = "web";
        };
      };
    };
  };
}