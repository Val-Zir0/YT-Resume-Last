// inject.js
// Runs in the Main World of the page to access internal YouTube APIs

if (window.__YT_RESUME_INJECTED__) {
    // Already injected
} else {
window.__YT_RESUME_INJECTED__ = true;

function getPlayer() {
    return document.getElementById('movie_player');
}

function sendPlayerData() {
    const player = getPlayer();
    if (!player || typeof player.getVideoData !== 'function') return;

    try {
        const videoData = player.getVideoData();
        const currentTime = player.getCurrentTime ? player.getCurrentTime() : 0;
        const duration = player.getDuration ? player.getDuration() : 0;
        const state = player.getPlayerState ? player.getPlayerState() : -1;
        const playlistId = player.getPlaylistId ? player.getPlaylistId() : null;
        const playlistIndex = player.getPlaylistIndex ? player.getPlaylistIndex() : null;
        
        // Capture new properties
        const volume = player.getVolume ? player.getVolume() : null;
        const muted = player.isMuted ? player.isMuted() : null;
        const playbackRate = player.getPlaybackRate ? player.getPlaybackRate() : null;
        
        // We only care if there is an actual video ID
        if (videoData && videoData.video_id) {
            window.postMessage({
                source: 'yt-resume-last',
                type: 'PLAYER_STATE_UPDATE',
                data: {
                    videoId: videoData.video_id,
                    title: videoData.title,
                    author: videoData.author,
                    currentTime: currentTime,
                    duration: duration,
                    state: state, // 1: playing, 2: paused
                    playlistId: playlistId,
                    playlistIndex: playlistIndex,
                    volume: volume,
                    muted: muted,
                    playbackRate: playbackRate,
                    isMusic: window.location.hostname === 'music.youtube.com'
                }
            }, '*');
        }
    } catch (e) {
        // Suppress errors during polling
    }
}

// Poll every 3 seconds to update the current time
setInterval(sendPlayerData, 3000);

// Listen for restore commands from content.js
window.addEventListener('message', function(event) {
    if (event.source !== window) return;
    
    if (event.data.source === 'yt-resume-last' && event.data.type === 'RESTORE_PLAYER_STATE') {
        const data = event.data.data;
        const player = getPlayer();
        if (!player) return;

        // Player methods might not be immediately available or state might take time to set
        let attempts = 0;
        const tryRestore = setInterval(() => {
            attempts++;
            if (typeof player.setVolume === 'function') {
                clearInterval(tryRestore);
                
                if (data.volume !== undefined && data.volume !== null) {
                    player.setVolume(data.volume);
                }
                
                if (data.muted !== undefined && data.muted !== null) {
                    if (data.muted && typeof player.mute === 'function') player.mute();
                    else if (!data.muted && typeof player.unMute === 'function') player.unMute();
                }
                
                if (data.playbackRate !== undefined && data.playbackRate !== null) {
                    if (typeof player.setPlaybackRate === 'function') {
                        player.setPlaybackRate(data.playbackRate);
                    }
                }
                
                // For Shuffle/Repeat on Music, we attempt to trigger the UI buttons since API varies
                if (data.shuffle && window.location.hostname === 'music.youtube.com') {
                    const shuffleBtn = document.querySelector('ytmusic-player-bar yt-icon-button.shuffle') || document.querySelector('ytmusic-player-bar [aria-label="Shuffle"]');
                    if (shuffleBtn && shuffleBtn.getAttribute('aria-pressed') === 'false') {
                        shuffleBtn.click();
                    }
                }
                
                if (data.repeat && window.location.hostname === 'music.youtube.com') {
                    const repeatBtn = document.querySelector('ytmusic-player-bar yt-icon-button.repeat') || document.querySelector('ytmusic-player-bar [aria-label="Repeat"]');
                    // In YT music, repeat has states: repeat none, repeat all, repeat one
                    // Restoring complex repeat is tricky via API, we just attempt basic if requested
                }
            } else if (attempts > 20) {
                // Give up after 10 seconds
                clearInterval(tryRestore);
            }
        }, 500);
    }
});

} // end of guard block
