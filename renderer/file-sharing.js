const params = new URLSearchParams(window.location.search);
const host = params.get('host');
const deviceName = params.get('name') || host || 'Remote PC';
const fileList = document.getElementById('file-list');
const status = document.getElementById('transfer-status');
const sendButton = document.getElementById('send-files');
const refreshButton = document.getElementById('refresh-files');

document.getElementById('device-name').textContent = deviceName;
document.getElementById('device-address').textContent = host || '';

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function showStatus(message, isError = false) {
  status.textContent = message;
  status.classList.toggle('error', isError);
}

async function refreshFiles() {
  refreshButton.disabled = true;
  try {
    const files = await window.api.listSharedFiles(host);
    fileList.replaceChildren();
    if (!files.length) {
      const empty = document.createElement('p');
      empty.className = 'empty-state';
      empty.textContent = 'No files are being shared by this PC yet.';
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
          const saved = await window.api.downloadSharedFile(host, file);
          showStatus(saved ? `${file.name} downloaded.` : 'Download canceled.');
        } catch (error) {
          showStatus(error.message || 'Download failed.', true);
        } finally {
          download.disabled = false;
        }
      });
      row.append(icon, details, download);
      fileList.append(row);
    });
    showStatus(`${files.length} shared file${files.length === 1 ? '' : 's'}.`);
  } catch (error) {
    fileList.replaceChildren();
    const empty = document.createElement('p');
    empty.className = 'empty-state';
    empty.textContent = error.message || 'Could not load shared files.';
    fileList.append(empty);
    showStatus('Enable file sharing in the Network section on the remote PC.', true);
  } finally {
    refreshButton.disabled = false;
  }
}

sendButton.addEventListener('click', async () => {
  sendButton.disabled = true;
  showStatus('Choose files to send…');
  try {
    const results = await window.api.pickAndSendSharedFiles(host);
    const sent = results.filter((result) => result.ok).length;
    const failures = results.filter((result) => !result.ok);
    if (failures.length) showStatus(`${sent} sent; ${failures[0].name}: ${failures[0].error}`, true);
    else if (sent) showStatus(`${sent} file${sent === 1 ? '' : 's'} sent to ${deviceName}.`);
    else showStatus('No files selected.');
    await refreshFiles();
  } catch (error) {
    showStatus(error.message || 'Could not send files.', true);
  } finally {
    sendButton.disabled = false;
  }
});

refreshButton.addEventListener('click', refreshFiles);
refreshFiles();