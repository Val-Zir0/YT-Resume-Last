// background.js

chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        chrome.tabs.create({ url: 'welcome/welcome.html' });
    }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'SAVE_SESSION') {
        const data = message.data;
        const storageKey = data.isMusic ? 'lastSession_music' : 'lastSession_yt';
        
        chrome.storage.local.get(['settings'], (result) => {
            const settings = result.settings || {};
            const enableMinWatchTime = settings.enableMinimumWatchTime !== undefined ? settings.enableMinimumWatchTime : true;
            const minWatchTime = settings.minimumWatchTimeSeconds !== undefined ? settings.minimumWatchTimeSeconds : 30;
            
            // Only save if it exceeds minimum watch time (if enabled)
            if (enableMinWatchTime && data.currentTime < minWatchTime && data.state === 1) {
                return; // Do not save yet
            }

            chrome.storage.local.set({ [storageKey]: data }, () => {
                // Data saved successfully
            });
        });
    } else if (message.type === 'CHECK_RESUME' && sender.tab) {
        const url = new URL(message.url);
        if (url.hostname === 'music.youtube.com') {
            resumeSession(sender.tab.id, 'lastSession_music', true);
        } else if (url.hostname === 'www.youtube.com' || url.hostname === 'youtube.com') {
            resumeSession(sender.tab.id, 'lastSession_yt', false);
        }
    }
});



function resumeSession(tabId, storageKey, isMusic) {
    chrome.storage.local.get([storageKey, 'settings'], (result) => {
        const session = result[storageKey];
        const settings = result.settings || {};

        const autoResume = settings.autoResume !== undefined ? settings.autoResume : true;
        const enableResume = isMusic 
            ? (settings.ytmEnableResume !== undefined ? settings.ytmEnableResume : true)
            : (settings.ytEnableResume !== undefined ? settings.ytEnableResume : true);
        
        const restorePos = isMusic
            ? (settings.ytmRestorePlaybackPosition !== undefined ? settings.ytmRestorePlaybackPosition : true)
            : (settings.ytRestorePlaybackPosition !== undefined ? settings.ytRestorePlaybackPosition : true);
            
        const restoreList = isMusic
            ? (settings.ytmRestorePlaylist !== undefined ? settings.ytmRestorePlaylist : true)
            : (settings.ytRestorePlaylist !== undefined ? settings.ytRestorePlaylist : true);

        const showNotification = settings.showNotificationAfterResume !== undefined ? settings.showNotificationAfterResume : true;

        if (!autoResume) return;
        if (!enableResume) return;

        if (session && session.videoId) {
            // Calculate if the video was near the end to avoid resuming a finished video
            const isNearEnd = session.duration > 0 && session.currentTime >= (session.duration - 10);
            if (isNearEnd) return; // Don't resume if it's basically finished

            let resumeUrl = `https://${isMusic ? 'music.youtube.com' : 'www.youtube.com'}/watch?v=${session.videoId}`;
            
            if (restoreList && session.playlistId) {
                resumeUrl += `&list=${session.playlistId}`;
                if (session.playlistIndex !== undefined && session.playlistIndex !== null) {
                    resumeUrl += `&index=${session.playlistIndex}`;
                }
            }
            
            if (restorePos && session.currentTime > 5) {
                resumeUrl += `&t=${Math.floor(session.currentTime)}s`;
            }

            chrome.tabs.update(tabId, { url: resumeUrl }, () => {
                if (showNotification && typeof chrome.notifications !== 'undefined' && chrome.notifications.create) {
                    chrome.notifications.create({
                        type: 'basic',
                        iconUrl: '/icons/icon48.png',
                        title: 'YT Resume Last',
                        message: `Resumed: ${session.title}`
                    }, (notificationId) => {
                        if (chrome.runtime.lastError) {
                            console.warn('YT Resume Last: Notification error -', chrome.runtime.lastError.message);
                        }
                    });
                }
            });
        }
    });
}
