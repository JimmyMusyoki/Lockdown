const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  getData: () => ipcRenderer.invoke('get-data'),
  updateSites: (sites) => ipcRenderer.invoke('update-sites', sites),
  updateApps: (apps) => ipcRenderer.invoke('update-apps', apps),
  startLock: (minutes, password) => ipcRenderer.invoke('start-lock', { minutes, password }),
  getLockStatus: () => ipcRenderer.invoke('get-lock-status')
  ,remoteCommand: (host, password, command, payload) => ipcRenderer.invoke('remote-command', { host, password, command, payload }),
  discoverNetwork: () => ipcRenderer.invoke('discover-network'),
  networkSpeedTest: () => ipcRenderer.invoke('network-speed-test'),
  onNetworkSpeedStage: (callback) => ipcRenderer.on('network-speed-stage', (_event, stage) => callback(stage)),
  getNetworkGroups: () => ipcRenderer.invoke('get-network-groups'),
  saveNetworkGroup: (group) => ipcRenderer.invoke('save-network-group', group)
});
