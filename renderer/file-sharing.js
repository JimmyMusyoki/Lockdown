const params = new URLSearchParams(window.location.search);
const initialDestinations = JSON.parse(params.get('destinations') || '[]');
const availableDestinations = JSON.parse(params.get('availableDestinations') || '[]');
const sources = JSON.parse(params.get('sources') || '[]');
const fileList = document.getElementById('file-list');
const status = document.getElementById('transfer-status');
const sendButton = document.getElementById('send-files');
const refreshButton = document.getElementById('refresh-files');
const destinationList = document.getElementById('destination-list');
const sourceSelect = document.getElementById('source-pc');
const selectAllDestinations = document.getElementById('select-all-destinations');
const selectedDestinationHosts = new Set(initialDestinations.map((device) => device.host));

document.getElementById('device-name').textContent = `${initialDestinations.length} destination PC${initialDestinations.length === 1 ? '' : 's'}`;
document.getElementById('device-address').textContent = 'Transfers use each PC’s Lockdown Blocker shared folder.';
sendButton.title = 'Choose local files to send to the selected PCs';
sendButton.setAttribute('aria-label', 'Send local files to selected PCs');

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function showStatus(message, isError = false) {
  status.textContent = message;
  status.classList.toggle('error', isError);
}

function selectedHosts() {
  return [...selectedDestinationHosts];
}

function renderDestinations() {
  destinationList.replaceChildren();
  availableDestinations.forEach((device) => {
    const label = document.createElement('label');
    label.className = 'destination-option';
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = selectedDestinationHosts.has(device.host);
    checkbox.addEventListener('change', () => {
      if (checkbox.checked) selectedDestinationHosts.add(device.host);
      else selectedDestinationHosts.delete(device.host);
      updateDestinationState();
    });
    const name = document.createElement('span');
    name.textContent = `${device.name} · ${device.host}`;
    label.append(checkbox, name);
    destinationList.append(label);
  });
  updateDestinationState();
}

function updateDestinationState() {
  const checkboxes = [...destinationList.querySelectorAll('input[type="checkbox"]')];
  const selectedCount = checkboxes.filter((checkbox) => checkbox.checked).length;
  selectAllDestinations.checked = checkboxes.length > 0 && selectedCount === checkboxes.length;
  selectAllDestinations.indeterminate = selectedCount > 0 && selectedCount < checkboxes.length;
  sendButton.disabled = selectedCount === 0;
  document.querySelectorAll('[data-copy-file]').forEach((button) => {
    button.disabled = !selectedHosts().some((host) => host !== sourceSelect.value);
  });
}

function renderSources() {
  sourceSelect.replaceChildren();
  sources.forEach((device) => {
    const option = document.createElement('option');
    option.value = device.host;
    option.textContent = device.name;
    sourceSelect.append(option);
  });
  if (!sources.length) {
    sourceSelect.disabled = true;
    showStatus('No saved remote PCs are available as a file source.', true);
  }
}

async function refreshFiles() {
  const sourceHost = sourceSelect.value;
  if (!sourceHost) return;
  refreshButton.disabled = true;
  try {
    const files = await window.api.listSharedFiles(sourceHost);
    fileList.replaceChildren();
    if (!files.length) {
      const empty = document.createElement('p');
      empty.className = 'empty-state';
      empty.textContent = 'No files are available from this PC.';
      fileList.append(empty);
      return;
    }
    files.forEach((file) => {
      const row = document.createElement('div');
      row.className = 'file-row';
      const icon = document.createElement('span');
      icon.className = 'file-icon';
      icon.textContent = '▤';
      const details = document.createElement('div');
      details.className = 'file-details';
      const name = document.createElement('strong');
      name.textContent = file.name;
      const metadata = document.createElement('small');
      metadata.textContent = `${formatBytes(file.size)} · Added ${new Date(file.addedAt).toLocaleString()}`;
      details.append(name, metadata);
      const download = document.createElement('button');
      download.className = 'icon-button';
      download.type = 'button';
      download.textContent = '↓';
      download.title = `Download ${file.name}`;
      download.setAttribute('aria-label', `Download ${file.name}`);
      download.addEventListener('click', async () => {
        download.disabled = true;
        showStatus(`Downloading ${file.name}…`);
        try {
          const saved = await window.api.downloadSharedFile(sourceHost, file);
          showStatus(saved ? `${file.name} downloaded.` : 'Download canceled.');
        } catch (error) {
          showStatus(error.message || 'Download failed.', true);
        } finally {
          download.disabled = false;
        }
      });
      const copy = document.createElement('button');
      copy.className = 'icon-button';
      copy.type = 'button';
      copy.textContent = '⇥';
      copy.title = `Copy ${file.name} to the selected PCs`;
      copy.setAttribute('aria-label', `Copy ${file.name} to selected PCs`);
      copy.dataset.copyFile = file.id;
      copy.disabled = selectedHosts().length === 0;
      copy.addEventListener('click', async () => {
        const targets = selectedHosts();
        copy.disabled = true;
        showStatus(`Copying ${file.name} from ${sourceSelect.selectedOptions[0].textContent}…`);
        try {
          const results = await window.api.relaySharedFile(sourceHost, file, targets);
          const succeeded = results.filter((result) => result.ok).length;
          const firstFailure = results.find((result) => !result.ok);
          showStatus(firstFailure
            ? `${file.name}: copied to ${succeeded}/${results.length}; ${firstFailure.host}: ${firstFailure.error}`
            : `${file.name} copied to ${succeeded} PC${succeeded === 1 ? '' : 's'}.`, Boolean(firstFailure));
        } catch (error) {
          showStatus(error.message || 'Remote copy failed.', true);
          copy.disabled = !selectedHosts().some((host) => host !== sourceHost);
          copy.disabled = false;
        }
            if (!targets.length) return showStatus('Select a destination other than the source PC.', true);
      });
      row.append(icon, details, download, copy);
      fileList.append(row);
    });
    showStatus(`${files.length} shared file${files.length === 1 ? '' : 's'}.`);
  } catch (error) {
    fileList.replaceChildren();
    const empty = document.createElement('p');
    empty.className = 'empty-state';
    empty.textContent = error.message || 'Could not load shared files.';
    fileList.append(empty);
    showStatus(error.message || 'Could not load files from the source PC.', true);
  } finally {
    refreshButton.disabled = false;
  }
}

sendButton.addEventListener('click', async () => {
  const hosts = selectedHosts();
  if (!hosts.length) return showStatus('Select one or more destination PCs.', true);
  sendButton.disabled = true;
  showStatus('Choose files to send…');
  try {
    const results = await window.api.pickAndSendSharedFiles(hosts);
    const sent = results.reduce((count, result) => count + result.destinations.filter((destination) => destination.ok).length, 0);
    const attempts = results.reduce((count, result) => count + result.destinations.length, 0);
    const failure = results.flatMap((result) => result.destinations.map((destination) => ({ name: result.name, ...destination }))).find((destination) => !destination.ok);
    if (failure) showStatus(`${sent}/${attempts} file copies sent; ${failure.name} to ${failure.host}: ${failure.error}`, true);
    else if (sent) showStatus(`${results.length} file${results.length === 1 ? '' : 's'} sent to ${hosts.length} PC${hosts.length === 1 ? '' : 's'}.`);
    else showStatus('No files selected.');
    if (hosts.includes(sourceSelect.value)) await refreshFiles();
  } catch (error) {
    showStatus(error.message || 'Could not send files.', true);
  } finally {
    sendButton.disabled = false;
  }
});

selectAllDestinations.addEventListener('change', () => {
  selectedDestinationHosts.clear();
  if (selectAllDestinations.checked) availableDestinations.forEach((device) => selectedDestinationHosts.add(device.host));
  renderDestinations();
});
refreshButton.addEventListener('click', refreshFiles);
sourceSelect.addEventListener('change', refreshFiles);
sourceSelect.addEventListener('change', () => {
  updateDestinationState();
  refreshFiles();
});
renderDestinations();
renderSources();
refreshFiles();