/**
 * Field Recording Wiki - Media Player
 * Embedded in pagetools with queue persistence across navigation
 */

(function() {
  'use strict';

  // ===== PLAYER STATE MANAGEMENT =====
  var STORAGE_KEY = 'wiki_media_player';
  
  function getState() {
    try {
      var saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : {
        queue: [],
        currentIndex: 0,
        currentTime: 0,
        volume: 0.8,
        isPlaying: false
      };
    } catch(e) {
      return { queue: [], currentIndex: 0, currentTime: 0, volume: 0.8, isPlaying: false };
    }
  }
  
  function saveState(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch(e) {}
  }

  // ===== DEFAULT TRACKS =====
  var defaultTracks = [
    {
      title: 'Featured Recording',
      artist: 'Field Recording Library',
      src: 'https://media.sysya.com.au/featured/220331_002.ogg',
      type: 'audio'
    }
  ];

  // ===== INITIALIZE ON LOAD =====
  // Use jQuery ready since DokuWiki loads scripts with defer
  jQuery(function() {
    console.log('[MediaPlayer] jQuery ready, initializing...');
    
    var pagetools = document.getElementById('dokuwiki__pagetools');
    if (!pagetools) {
      console.log('[MediaPlayer] pagetools not found, skipping');
      return;
    }
    
    console.log('[MediaPlayer] pagetools found:', pagetools);
    
    var toolsDiv = pagetools.querySelector('.tools');
    if (!toolsDiv) {
      console.log('[MediaPlayer] .tools not found');
      return;
    }
    
    console.log('[MediaPlayer] .tools found:', toolsDiv);

    // Create player container
    var playerContainer = document.createElement('div');
    playerContainer.id = 'wiki-media-player';
    playerContainer.innerHTML = [
      '<div class="wmp-header">',
      '  <span class="wmp-icon">&#9835;</span>',
      '  <span class="wmp-title">Media Player</span>',
      '  <button class="wmp-toggle" id="wmp-toggle" title="Toggle player">&#9660;</button>',
      '</div>',
      '<div class="wmp-body" id="wmp-body">',
      '  <div class="wmp-now-playing">',
      '    <div class="wmp-track-title" id="wmp-track-title">No track</div>',
      '    <div class="wmp-track-artist" id="wmp-track-artist">-</div>',
      '  </div>',
      '  <div class="wmp-controls">',
      '    <button class="wmp-btn" id="wmp-prev" title="Previous">&#9198;</button>',
      '    <button class="wmp-btn wmp-play" id="wmp-play" title="Play">&#9654;</button>',
      '    <button class="wmp-btn" id="wmp-next" title="Next">&#9197;</button>',
      '  </div>',
      '  <div class="wmp-progress">',
      '    <span class="wmp-time" id="wmp-current">0:00</span>',
      '    <input type="range" class="wmp-seek" id="wmp-seek" value="0" min="0" max="100">',
      '    <span class="wmp-time" id="wmp-duration">0:00</span>',
      '  </div>',
      '  <div class="wmp-volume">',
      '    <span class="wmp-vol-icon" id="wmp-vol-icon">&#128266;</span>',
      '    <input type="range" class="wmp-vol" id="wmp-vol" value="80" min="0" max="100">',
      '  </div>',
      '  <div class="wmp-queue-header">',
      '    <span>Queue (<span id="wmp-queue-count">0</span>)</span>',
      '    <button class="wmp-clear" id="wmp-clear" title="Clear queue">Clear</button>',
      '  </div>',
      '  <ul class="wmp-queue" id="wmp-queue"></ul>',
      '</div>',
      '<audio id="wmp-audio" preload="metadata"></audio>'
    ].join('');

    // Insert after tools list
    toolsDiv.appendChild(playerContainer);

    // ===== ELEMENTS =====
    var audio = document.getElementById('wmp-audio');
    var playBtn = document.getElementById('wmp-play');
    var prevBtn = document.getElementById('wmp-prev');
    var nextBtn = document.getElementById('wmp-next');
    var seekBar = document.getElementById('wmp-seek');
    var volBar = document.getElementById('wmp-vol');
    var volIcon = document.getElementById('wmp-vol-icon');
    var currentTime = document.getElementById('wmp-current');
    var duration = document.getElementById('wmp-duration');
    var trackTitle = document.getElementById('wmp-track-title');
    var trackArtist = document.getElementById('wmp-track-artist');
    var queueList = document.getElementById('wmp-queue');
    var queueCount = document.getElementById('wmp-queue-count');
    var clearBtn = document.getElementById('wmp-clear');
    var toggleBtn = document.getElementById('wmp-toggle');
    var playerBody = document.getElementById('wmp-body');

    // ===== STATE =====
    var state = getState();
    
    // Initialize with defaults if queue is empty
    if (state.queue.length === 0) {
      state.queue = defaultTracks.slice();
      state.currentIndex = 0;
    }

    // ===== HELPER FUNCTIONS =====
    function formatTime(s) {
      if (!s || isNaN(s)) return '0:00';
      var m = Math.floor(s / 60);
      var sec = Math.floor(s % 60);
      return m + ':' + (sec < 10 ? '0' : '') + sec;
    }

    function loadTrack(index, autoplay) {
      if (index < 0 || index >= state.queue.length) return;
      
      var track = state.queue[index];
      state.currentIndex = index;
      
      audio.src = track.src;
      trackTitle.textContent = track.title;
      trackArtist.textContent = track.artist;
      
      // Restore position if same track
      if (state.currentTime > 0 && autoplay) {
        audio.currentTime = state.currentTime;
      }
      
      updateQueueDisplay();
      
      if (autoplay) {
        audio.play().catch(function() {});
        playBtn.innerHTML = '&#10074;&#10074;';
        state.isPlaying = true;
      }
      
      saveState(state);
    }

    function updateQueueDisplay() {
      queueList.innerHTML = '';
      queueCount.textContent = state.queue.length;
      
      state.queue.forEach(function(track, i) {
        var li = document.createElement('li');
        li.className = 'wmp-queue-item' + (i === state.currentIndex ? ' active' : '');
        li.innerHTML = '<span class="wmp-q-title">' + track.title + '</span>' +
                       '<button class="wmp-q-remove" data-index="' + i + '">&#10005;</button>';
        li.querySelector('.wmp-q-title').onclick = function() {
          loadTrack(i, true);
        };
        li.querySelector('.wmp-q-remove').onclick = function(e) {
          e.stopPropagation();
          removeFromQueue(i);
        };
        queueList.appendChild(li);
      });
    }

    function removeFromQueue(index) {
      state.queue.splice(index, 1);
      if (state.currentIndex >= index && state.currentIndex > 0) {
        state.currentIndex--;
      }
      if (state.queue.length === 0) {
        audio.pause();
        audio.src = '';
        trackTitle.textContent = 'No track';
        trackArtist.textContent = '-';
        playBtn.innerHTML = '&#9654;';
        state.isPlaying = false;
      } else if (index === state.currentIndex) {
        loadTrack(state.currentIndex, state.isPlaying);
      }
      updateQueueDisplay();
      saveState(state);
    }

    // ===== EVENT HANDLERS =====
    playBtn.onclick = function() {
      if (state.queue.length === 0) return;
      
      if (audio.paused) {
        audio.play();
        playBtn.innerHTML = '&#10074;&#10074;';
        state.isPlaying = true;
      } else {
        audio.pause();
        playBtn.innerHTML = '&#9654;';
        state.isPlaying = false;
      }
      saveState(state);
    };

    prevBtn.onclick = function() {
      if (state.currentIndex > 0) {
        state.currentTime = 0;
        loadTrack(state.currentIndex - 1, true);
      }
    };

    nextBtn.onclick = function() {
      if (state.currentIndex < state.queue.length - 1) {
        state.currentTime = 0;
        loadTrack(state.currentIndex + 1, true);
      }
    };

    audio.ontimeupdate = function() {
      if (audio.duration) {
        seekBar.value = (audio.currentTime / audio.duration) * 100;
        currentTime.textContent = formatTime(audio.currentTime);
        state.currentTime = audio.currentTime;
      }
    };

    audio.onloadedmetadata = function() {
      duration.textContent = formatTime(audio.duration);
    };

    audio.onended = function() {
      state.currentTime = 0;
      if (state.currentIndex < state.queue.length - 1) {
        loadTrack(state.currentIndex + 1, true);
      } else {
        playBtn.innerHTML = '&#9654;';
        state.isPlaying = false;
        saveState(state);
      }
    };

    seekBar.oninput = function() {
      if (audio.duration) {
        audio.currentTime = (this.value / 100) * audio.duration;
      }
    };

    volBar.oninput = function() {
      audio.volume = this.value / 100;
      state.volume = audio.volume;
      volIcon.innerHTML = audio.volume === 0 ? '&#128263;' : '&#128266;';
      saveState(state);
    };

    clearBtn.onclick = function() {
      audio.pause();
      audio.src = '';
      state.queue = [];
      state.currentIndex = 0;
      state.currentTime = 0;
      state.isPlaying = false;
      trackTitle.textContent = 'No track';
      trackArtist.textContent = '-';
      playBtn.innerHTML = '&#9654;';
      updateQueueDisplay();
      saveState(state);
    };

    toggleBtn.onclick = function() {
      var isHidden = playerBody.style.display === 'none';
      playerBody.style.display = isHidden ? 'block' : 'none';
      toggleBtn.innerHTML = isHidden ? '&#9660;' : '&#9650;';
    };

    // ===== GLOBAL API for adding to queue from wiki pages =====
    window.wikiPlayer = {
      addToQueue: function(track) {
        // track = { title, artist, src, type }
        state.queue.push(track);
        updateQueueDisplay();
        saveState(state);
        
        // Auto-play if this is the only track
        if (state.queue.length === 1) {
          loadTrack(0, true);
        }
      },
      playNow: function(track) {
        state.queue.unshift(track);
        state.currentIndex = 0;
        state.currentTime = 0;
        loadTrack(0, true);
      },
      getQueue: function() {
        return state.queue.slice();
      }
    };

    // ===== INITIALIZE =====
    audio.volume = state.volume;
    volBar.value = state.volume * 100;
    
    // Load the current track and restore state
    if (state.queue.length > 0) {
      loadTrack(state.currentIndex, false);
      
      // Resume playback if it was playing
      if (state.isPlaying && state.currentTime > 0) {
        audio.currentTime = state.currentTime;
        audio.play().then(function() {
          playBtn.innerHTML = '&#10074;&#10074;';
        }).catch(function() {
          // Autoplay blocked, user needs to click
          state.isPlaying = false;
          saveState(state);
        });
      }
    }

    // Save state before page unload
    window.addEventListener('beforeunload', function() {
      state.currentTime = audio.currentTime;
      saveState(state);
    });

    console.log('[MediaPlayer] Initialized in pagetools');
  });
})();

// PayPal Donation Button Injection
// DokuWiki strips external links from wiki syntax, so we inject via JS
(function() {
  jQuery(function($) {
    // Find sidebar and add PayPal button
    var sidebar = document.getElementById('dokuwiki__aside');
    if (sidebar) {
      var paypalDiv = document.createElement('div');
      paypalDiv.id = 'paypal-donate';
      paypalDiv.innerHTML = '<a href="https://paypal.me/mithun3a" target="_blank" rel="noopener" class="paypal-btn">💳 Donate via PayPal</a>';
      
      // Insert at end of sidebar content
      var sidebarContent = sidebar.querySelector('.aside');
      if (sidebarContent) {
        sidebarContent.appendChild(paypalDiv);
      } else {
        sidebar.appendChild(paypalDiv);
      }
      console.log('[PayPal] Button injected into sidebar');
    }
  });
})();
