const { execFile } = require('child_process');
const dns = require('dns').promises;
const net = require('net');
const os = require('os');
const AGENT_PORT = 47821;

function exec(command, args) {
  return new Promise((resolve, reject) => {
    execFile(command, args, { windowsHide: true }, (error, stdout) => {
      if (error) reject(error);
      else resolve(stdout);
    });
  });
}

function localAddresses() {
  return Object.values(os.networkInterfaces()).flat().filter((item) => item
    && !item.internal
    && item.family === 'IPv4'
    && typeof item.address === 'string'
    && typeof item.netmask === 'string'
    && isUsableAddress(item.address)
    && item.netmask.split('.').length === 4);
}

function isUsableAddress(ip) {
  const parts = ip.split('.').map(Number);
  return parts.length === 4 && parts.every((part) => part >= 0 && part <= 255) && parts[0] < 224 && parts[3] !== 255;
}

function inferDeviceType(name, local) {
  if (local) return 'pc';
  const value = String(name || '').toLowerCase();
  if (/iphone|ipad|android|pixel|galaxy|mobile/.test(value)) return 'phone';
  if (/laptop|notebook|macbook/.test(value)) return 'laptop';
  if (/desktop|pc|workstation|windows|computer/.test(value)) return 'pc';
  if (/tv|roku|chromecast|firestick/.test(value)) return 'tv';
  return 'unknown';
}

function subnetHosts(address, netmask) {
  const ipParts = address.split('.').map(Number);
  const maskParts = netmask.split('.').map(Number);
  const network = ipParts.map((part, index) => part & maskParts[index]);
  const broadcast = network.map((part, index) => part | (255 ^ maskParts[index]));
  const hosts = [];
  for (let last = network[3] + 1; last < broadcast[3]; last += 1) {
    const candidate = `${network[0]}.${network[1]}.${network[2]}.${last}`;
    if (candidate !== address) hosts.push(candidate);
  }
  return hosts;
}

async function pingAddress(ip) {
  try {
    await exec('ping', ['-4', '-n', '1', '-w', '120', ip]);
    return ip;
  } catch (_) {
    return null;
  }
}

function agentReachable(ip) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host: ip, port: AGENT_PORT });
    const finish = (reachable) => {
      socket.destroy();
      resolve(reachable);
    };
    socket.setTimeout(400, () => finish(false));
    socket.once('connect', () => finish(true));
    socket.once('error', () => finish(false));
  });
}

async function probeSubnets(local) {
  // The first non-virtual adapter is the active LAN in the common Windows case.
  // ARP entries from other adapters are still included below.
  const candidates = [...new Set(local.flatMap((item) => subnetHosts(item.address, item.netmask)))];
  const pinged = [];
  for (let index = 0; index < candidates.length; index += 64) {
    const batch = await Promise.all(candidates.slice(index, index + 64).map(pingAddress));
    pinged.push(...batch.filter(Boolean));
  }
  const pingedSet = new Set(pinged);
  const agentActive = [];
  const unpinged = candidates.filter((ip) => !pingedSet.has(ip));
  for (let index = 0; index < unpinged.length; index += 64) {
    const batch = await Promise.all(unpinged.slice(index, index + 64).map(async (ip) => await agentReachable(ip) ? ip : null));
    agentActive.push(...batch.filter(Boolean));
  }
  return [...pinged, ...agentActive];
}

async function resolveName(ip) {
  try {
    const output = await exec('ping', ['-4', '-a', '-n', '1', '-w', '300', ip]);
    const match = output.match(/Pinging\s+([^\s\[]+)\s+\[/i);
    if (match && match[1] && match[1] !== ip) return match[1];
  } catch (_) {
    // Continue with NetBIOS and reverse DNS when name-aware ping is unavailable.
  }

  try {
    const output = await exec('nbtstat', ['-A', ip]);
    const match = output.match(/^\s*([^\s<]+)\s+<00>\s+UNIQUE/im);
    if (match && match[1]) return match[1].trim();
  } catch (_) {
    // Some devices disable NetBIOS; continue with DNS and a friendly fallback.
  }

  try {
    const names = await Promise.race([
      dns.reverse(ip),
      new Promise((resolve) => setTimeout(() => resolve([]), 500))
    ]);
    if (names[0]) return names[0].split('.')[0];
  } catch (_) {
    // Reverse DNS is optional on most home networks.
  }
  return null;
}

async function discoverNetwork() {
  const local = localAddresses();
  if (!local.length) return [];
  let probedAddresses = [];
  try {
    probedAddresses = await probeSubnets(local);
  } catch (_) {
    // ARP discovery below still works when an adapter blocks ICMP probing.
  }
  let output = '';
  try {
    output = await exec('arp', ['-a']);
  } catch (_) {
    return local.map((item) => ({
      ip: item.address,
      name: os.hostname(),
      nameAvailable: true,
      mac: item.mac || 'local',
      local: true,
      online: true,
      type: 'pc'
    }));
  }

  const addresses = new Set();
  const macs = new Map();
  for (const match of output.matchAll(/^\s*(\d{1,3}(?:\.\d{1,3}){3})\s+([\da-f-]{2}(?:-[\da-f]{2}){5})\s+/gim)) {
    const ip = match[1] || match[2];
    if (ip && isUsableAddress(ip)) {
      addresses.add(ip);
      macs.set(ip, match[2]);
    }
  }

  const onlineAddresses = new Set([...local.map((item) => item.address), ...probedAddresses]);
  for (const item of local) addresses.add(item.address);
  for (const ip of probedAddresses) addresses.add(ip);
  const devices = await Promise.all([...addresses].map(async (ip) => {
    const isLocal = local.some((item) => item.address === ip);
    const name = isLocal ? os.hostname() : await resolveName(ip);
    return {
      ip,
      name,
      nameAvailable: Boolean(name),
      mac: macs.get(ip) || (isLocal ? local.find((item) => item.address === ip)?.mac || 'local' : 'Detected on LAN'),
      local: isLocal,
      online: onlineAddresses.has(ip),
      type: inferDeviceType(name, isLocal)
    };
  }));
  const uniqueDevices = [];
  let localAdded = false;
  for (const device of devices) {
    if (device.local) {
      if (localAdded) continue;
      localAdded = true;
    }
    uniqueDevices.push(device);
  }
  return uniqueDevices.sort((a, b) => Number(b.online) - Number(a.online) || a.ip.localeCompare(b.ip, undefined, { numeric: true }));
}

module.exports = { discoverNetwork };