{ pkgs ? import <nixpkgs> {} }:

let 
  projectName = "BigO Calculator";
  
  myPackages = [
    pkgs.nodejs_22
    pkgs.yarn

  # Pretty welcome
    pkgs.figlet
  ];

in pkgs.mkShell {
  buildInputs = myPackages;

  shellHook = ''
    # --- Gruvbox Dark Palette ---
    GRUV_ORANGE='\033[38;5;208m'
    GRUV_GREEN='\033[38;5;142m'
    GRUV_YELLOW='\033[38;5;214m'
    GRUV_BLUE='\033[38;5;109m'
    GRUV_GRAY='\033[38;5;245m'
    GRUV_PURPLE='\033[38;5;175m'
    RESET='\033[0m'
    BOLD='\033[1m'

    # --- Banner ---
    echo -e "''${GRUV_ORANGE}"
    figlet -f big "${projectName}"
    echo -e "''${RESET}"

    echo -e "  ''${GRUV_GRAY}:: ''${GRUV_PURPLE}"${projectName}" DevShell Active  ''${GRUV_GRAY}::''${RESET}"
    echo ""

    echo -e "''${GRUV_YELLOW}''${BOLD}Loaded Packages:''${RESET}"

    # --- Dynamic Package List ---
    for pkg in ${toString (builtins.map (p: p.name) myPackages)}; do
      echo -e "  ''${GRUV_GREEN}✓''${RESET} ''${GRUV_BLUE}$pkg''${RESET}"
    done
    
    echo ""
    echo -e "''${GRUV_GRAY}------------------------------------------------''${RESET}"
    echo -e "''${GRUV_PURPLE}Welcome back!''${RESET}"
  '';
}
