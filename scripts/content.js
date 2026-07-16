// content.js
// Runs in the Isolated World, bridges Main World and Background Service Worker

// Inject the main world script
if (!document.getElementById('yt-resume-last-script')) {
    const script = document.createElement('script');
    script.id = 'yt-resume-last-script';
    script.src = chrome.runtime.getURL('scripts/inject.js');
    script.onload = function() {
        this.remove();
    };
    (document.head || document.documentElement).appendChild(script);
}

// Listen for messages from the injected script
if (!window.__YT_RESUME_LISTENER__) {
    window.__YT_RESUME_LISTENER__ = true;
    window.addEventListener('message', function(event) {
        if (event.source !== window) return;

    if (event.data.source === 'yt-resume-last') {
        if (event.data.type === 'PLAYER_STATE_UPDATE') {
            try {
                chrome.runtime.sendMessage({
                    type: 'SAVE_SESSION',
                    data: event.data.data
                }, () => {
                    if (chrome.runtime.lastError) {
                        // Suppress lastError quietly
                    }
                });
            } catch (e) {
                // Suppress synchronous 'Extension context invalidated' error quietly
            }
        }
    }
});
}

// Check if we need to restore player settings
chrome.storage.local.get(['settings', 'lastSession_yt', 'lastSession_music'], (result) => {
    const isMusic = window.location.hostname === 'music.youtube.com';
    const storageKey = isMusic ? 'lastSession_music' : 'lastSession_yt';
    const session = result[storageKey];
    const settings = result.settings || {};

    const urlParams = new URLSearchParams(window.location.search);
    const currentVideoId = urlParams.get('v');

    // Only restore if we are playing the exact video that was saved
    if (session && session.videoId === currentVideoId) {
        const restoreVolKey = isMusic ? 'ytmRestoreVolume' : 'ytRestoreVolume';
        const restoreSpeedKey = isMusic ? 'ytmRestorePlaybackSpeed' : 'ytRestorePlaybackSpeed';
        const restoreMuteKey = isMusic ? null : 'ytRestoreMute'; // Only YouTube has separate mute toggle
        const restoreShuffleKey = isMusic ? 'ytmRestoreShuffle' : null;
        const restoreRepeatKey = isMusic ? 'ytmRestoreRepeat' : null;

        const doVol = settings[restoreVolKey] !== undefined ? settings[restoreVolKey] : true;
        const doSpeed = settings[restoreSpeedKey] !== undefined ? settings[restoreSpeedKey] : true;
        const doMute = restoreMuteKey ? (settings[restoreMuteKey] !== undefined ? settings[restoreMuteKey] : true) : false;
        
        const doShuffle = restoreShuffleKey ? (settings[restoreShuffleKey] !== undefined ? settings[restoreShuffleKey] : true) : false;
        const doRepeat = restoreRepeatKey ? (settings[restoreRepeatKey] !== undefined ? settings[restoreRepeatKey] : true) : false;

        const restoreData = {};
        
        if (doVol && session.volume !== undefined) restoreData.volume = session.volume;
        if (doMute && session.muted !== undefined) restoreData.muted = session.muted;
        if (doSpeed && session.playbackRate !== undefined) restoreData.playbackRate = session.playbackRate;
        
        if (doShuffle) restoreData.shuffle = true;
        if (doRepeat) restoreData.repeat = true;

        // We use setTimeout to let the DOM and player load initially
        setTimeout(() => {
            window.postMessage({
                source: 'yt-resume-last',
                type: 'RESTORE_PLAYER_STATE',
                data: restoreData
            }, '*');
        }, 1500);
    }
});

// If the user navigates directly to the homepage (hard load), check if we should auto-resume
if (window.location.pathname === '/' && window.self === window.top) {
    if (!sessionStorage.getItem('yt_resume_done')) {
        sessionStorage.setItem('yt_resume_done', 'true');
        chrome.runtime.sendMessage({ 
            type: 'CHECK_RESUME', 
            url: window.location.href 
        });
    }
}
