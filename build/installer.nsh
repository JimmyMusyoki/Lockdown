!macro customInstall
  MessageBox MB_YESNO|MB_ICONQUESTION "Lockdown Blocker requires Windows Network Discovery on the Private network profile to find and control other PCs. Enable it now?" IDYES network_discovery_allowed
  Abort "Network Discovery is required to install Lockdown Blocker."

network_discovery_allowed:
  nsExec::ExecToLog '"$SYSDIR\netsh.exe" advfirewall firewall set rule group="Network Discovery" new enable=yes profile=private'
  Pop $0
  StrCmp $0 "0" network_discovery_configured
  MessageBox MB_OK|MB_ICONSTOP "Windows could not enable Network Discovery. Check that the Windows Firewall service is running, then run the installer again."
  Abort "Could not enable required Network Discovery firewall rules."

network_discovery_configured:
!macroend