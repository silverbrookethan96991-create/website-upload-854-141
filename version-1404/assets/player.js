function initMoviePlayer(streamUrl) {
  var shell = document.querySelector("[data-player]");
  if (!shell) {
    return;
  }
  var video = shell.querySelector("video");
  var overlay = shell.querySelector(".player-overlay");
  var hlsInstance = null;
  var started = false;

  function attachStream() {
    if (started) {
      return;
    }
    started = true;
    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = streamUrl;
      video.play().catch(function () {});
      return;
    }
    if (window.Hls && window.Hls.isSupported()) {
      hlsInstance = new window.Hls({
        enableWorker: true,
        lowLatencyMode: false
      });
      hlsInstance.loadSource(streamUrl);
      hlsInstance.attachMedia(video);
      hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, function () {
        video.play().catch(function () {});
      });
      return;
    }
    video.src = streamUrl;
    video.play().catch(function () {});
  }

  function startPlay() {
    if (overlay) {
      overlay.classList.add("is-hidden");
    }
    attachStream();
    video.play().catch(function () {});
  }

  if (overlay) {
    overlay.addEventListener("click", startPlay);
  }

  video.addEventListener("click", function () {
    if (video.paused) {
      startPlay();
    }
  });

  video.addEventListener("play", function () {
    if (overlay) {
      overlay.classList.add("is-hidden");
    }
  });

  window.addEventListener("beforeunload", function () {
    if (hlsInstance) {
      hlsInstance.destroy();
    }
  });
}
