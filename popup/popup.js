document.addEventListener('DOMContentLoaded', () => {
    // Custom Toast Helpers
    let customToastInstance = null;
    function getToastInstance() {
        if (!customToastInstance) {
            customToastInstance = new bootstrap.Toast(document.getElementById('customToast'), { autohide: false });
        }
        return customToastInstance;
    }

    function showAlert(msg) {
        document.getElementById('customToastMessage').textContent = msg;
        document.getElementById('customToastFooter').innerHTML = `<button type="button" class="btn btn-primary btn-sm" data-bs-dismiss="toast">OK</button>`;
        getToastInstance().show();
    }

    function showConfirm(msg, onConfirm) {
        document.getElementById('customToastMessage').textContent = msg;
        document.getElementById('customToastFooter').innerHTML = `
            <button type="button" class="btn btn-secondary btn-sm" data-bs-dismiss="toast">Cancel</button>
            <button type="button" class="btn btn-danger btn-sm" id="customToastConfirmBtn">OK</button>
        `;
        getToastInstance().show();
        
        document.getElementById('customToastConfirmBtn').addEventListener('click', () => {
            getToastInstance().hide();
            if(onConfirm) onConfirm();
        }, { once: true });
    }

    const settingKeys = [
        { id: 'autoResumeSwitch', key: 'autoResume', default: true },
        { id: 'showNotificationAfterResume', key: 'showNotificationAfterResume', default: true },
        { id: 'enableMinimumWatchTime', key: 'enableMinimumWatchTime', default: true },
        { id: 'ytEnableResume', key: 'ytEnableResume', default: true },
        { id: 'ytRestorePlaybackPosition', key: 'ytRestorePlaybackPosition', default: true },
        { id: 'ytRestorePlaybackSpeed', key: 'ytRestorePlaybackSpeed', default: true },
        { id: 'ytRestoreVolume', key: 'ytRestoreVolume', default: true },
        { id: 'ytRestoreMute', key: 'ytRestoreMute', default: true },
        { id: 'ytRestorePlaylist', key: 'ytRestorePlaylist', default: true },
        { id: 'ytmEnableResume', key: 'ytmEnableResume', default: true },
        { id: 'ytmRestorePlaybackPosition', key: 'ytmRestorePlaybackPosition', default: true },
        { id: 'ytmRestorePlaybackSpeed', key: 'ytmRestorePlaybackSpeed', default: true },
        { id: 'ytmRestoreVolume', key: 'ytmRestoreVolume', default: true },
        { id: 'ytmRestorePlaylist', key: 'ytmRestorePlaylist', default: true },
        { id: 'ytmRestoreShuffle', key: 'ytmRestoreShuffle', default: true },
        { id: 'ytmRestoreRepeat', key: 'ytmRestoreRepeat', default: true }
    ];

    const minimumWatchTimeSeconds = document.getElementById('minimumWatchTimeSeconds');
    const musicStatus = document.getElementById('musicStatus');
    const ytStatus = document.getElementById('ytStatus');
    
    // Load settings and states
    chrome.storage.local.get(['settings', 'lastSession_music', 'lastSession_yt'], (result) => {
        const settings = result.settings || {};
        
        // Initialize Toggles
        settingKeys.forEach(item => {
            const el = document.getElementById(item.id);
            if (el) {
                el.checked = settings[item.key] !== undefined ? settings[item.key] : item.default;
                el.addEventListener('change', (e) => updateSetting(item.key, e.target.checked));
            }
        });

        // Initialize Number Inputs
        minimumWatchTimeSeconds.value = settings.minimumWatchTimeSeconds !== undefined ? settings.minimumWatchTimeSeconds : 30;

        // Load Music State
        if (result.lastSession_music && result.lastSession_music.title) {
            musicStatus.textContent = `${result.lastSession_music.title} - ${result.lastSession_music.author}`;
            musicStatus.title = musicStatus.textContent; // tooltip
        } else {
            musicStatus.textContent = 'No data saved.';
        }

        // Load YT State
        if (result.lastSession_yt && result.lastSession_yt.title) {
            ytStatus.textContent = `${result.lastSession_yt.title} - ${result.lastSession_yt.author}`;
            ytStatus.title = ytStatus.textContent; // tooltip
        } else {
            ytStatus.textContent = 'No data saved.';
        }
    });

    const updateSetting = (key, value) => {
        chrome.storage.local.get(['settings'], (result) => {
            const settings = result.settings || {};
            settings[key] = value;
            chrome.storage.local.set({ settings });
        });
    };

    minimumWatchTimeSeconds.addEventListener('change', (e) => {
        let val = parseInt(e.target.value, 10);
        if (isNaN(val) || val < 1) val = 1;
        updateSetting('minimumWatchTimeSeconds', val);
    });

    // Clear Data Handlers
    document.getElementById('clearMusicBtn').addEventListener('click', () => {
        chrome.storage.local.remove('lastSession_music', () => {
            musicStatus.textContent = 'No data saved.';
            musicStatus.title = '';
        });
    });

    document.getElementById('clearYtBtn').addEventListener('click', () => {
        chrome.storage.local.remove('lastSession_yt', () => {
            ytStatus.textContent = 'No data saved.';
            ytStatus.title = '';
        });
    });

    document.getElementById('clearDataBtn').addEventListener('click', () => {
        showConfirm('Are you sure you want to clear all saved session data?', () => {
            chrome.storage.local.remove(['lastSession_music', 'lastSession_yt'], () => {
                musicStatus.textContent = 'No data saved.';
                musicStatus.title = '';
                ytStatus.textContent = 'No data saved.';
                ytStatus.title = '';
            });
        });
    });

    // Resume Now logic
    const triggerResume = (storageKey, enableKey, restorePosKey, restorePlaylistKey, isMusic) => {
        chrome.storage.local.get([storageKey, 'settings'], (result) => {
            const state = result[storageKey];
            const settings = result.settings || {};
            const isEnabled = settings[enableKey] !== undefined ? settings[enableKey] : true;
            
            if (!isEnabled) {
                showAlert(`Resume is disabled for ${isMusic ? 'YouTube Music' : 'YouTube'} in settings.`);
                return;
            }

            if (state && state.videoId) {
                const restorePos = settings[restorePosKey] !== undefined ? settings[restorePosKey] : true;
                const restoreList = settings[restorePlaylistKey] !== undefined ? settings[restorePlaylistKey] : true;
                
                let resumeUrl = `https://${isMusic ? 'music.youtube.com' : 'www.youtube.com'}/watch?v=${state.videoId}`;
                if (restoreList && state.playlistId) {
                    resumeUrl += `&list=${state.playlistId}`;
                    if (state.playlistIndex !== undefined && state.playlistIndex !== null) {
                        resumeUrl += `&index=${state.playlistIndex}`;
                    }
                }
                if (restorePos && state.currentTime > 5) resumeUrl += `&t=${Math.floor(state.currentTime)}s`;
                
                chrome.tabs.create({ url: resumeUrl });
            } else {
                showAlert(`No saved ${isMusic ? 'YouTube Music' : 'YouTube'} session found.`);
            }
        });
    };

    document.getElementById('resumeYtBtn').addEventListener('click', (e) => {
        e.preventDefault();
        triggerResume('lastSession_yt', 'ytEnableResume', 'ytRestorePlaybackPosition', 'ytRestorePlaylist', false);
    });

    document.getElementById('resumeYtmBtn').addEventListener('click', (e) => {
        e.preventDefault();
        triggerResume('lastSession_music', 'ytmEnableResume', 'ytmRestorePlaybackPosition', 'ytmRestorePlaylist', true);
    });
});
