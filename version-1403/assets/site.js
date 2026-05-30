(function () {
  function ready(fn) {
    if (document.readyState !== "loading") {
      fn();
      return;
    }
    document.addEventListener("DOMContentLoaded", fn);
  }

  function qs(selector, root) {
    return (root || document).querySelector(selector);
  }

  function qsa(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function bindMobileMenu() {
    var button = qs("[data-mobile-toggle]");
    var nav = qs("[data-nav]");
    if (!button || !nav) {
      return;
    }
    button.addEventListener("click", function () {
      nav.classList.toggle("is-open");
    });
  }

  function bindHeaderSearch() {
    qsa("[data-search-form]").forEach(function (form) {
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        var input = qs("input", form);
        var value = input ? input.value.trim() : "";
        if (value) {
          window.location.href = "search.html?q=" + encodeURIComponent(value);
        } else {
          window.location.href = "search.html";
        }
      });
    });
  }

  function bindHero() {
    var slider = qs("[data-hero-slider]");
    if (!slider) {
      return;
    }
    var slides = qsa("[data-hero-slide]", slider);
    var dots = qsa("[data-hero-dot]", slider);
    var prev = qs("[data-hero-prev]", slider);
    var next = qs("[data-hero-next]", slider);
    var current = 0;
    var timer = null;

    function show(index) {
      if (!slides.length) {
        return;
      }
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, idx) {
        slide.classList.toggle("is-active", idx === current);
      });
      dots.forEach(function (dot, idx) {
        dot.classList.toggle("is-active", idx === current);
      });
    }

    function play() {
      if (timer) {
        clearInterval(timer);
      }
      timer = setInterval(function () {
        show(current + 1);
      }, 5200);
    }

    if (prev) {
      prev.addEventListener("click", function () {
        show(current - 1);
        play();
      });
    }

    if (next) {
      next.addEventListener("click", function () {
        show(current + 1);
        play();
      });
    }

    dots.forEach(function (dot, index) {
      dot.addEventListener("click", function () {
        show(index);
        play();
      });
    });

    show(0);
    play();
  }

  function bindFilters() {
    var input = qs("[data-filter-input]");
    var cards = qsa("[data-card]");
    if (!input || !cards.length) {
      return;
    }

    function apply(value) {
      var term = value.trim().toLowerCase();
      cards.forEach(function (card) {
        var haystack = (card.getAttribute("data-title") + " " + card.getAttribute("data-info")).toLowerCase();
        card.classList.toggle("hidden-card", term !== "" && haystack.indexOf(term) === -1);
      });
    }

    var params = new URLSearchParams(window.location.search);
    var initial = params.get("q") || "";
    if (initial) {
      input.value = initial;
      apply(initial);
    }

    input.addEventListener("input", function () {
      apply(input.value);
    });
  }

  function bindPlayers() {
    qsa("[data-player]").forEach(function (box) {
      var video = qs("video", box);
      var button = qs("[data-play-button]", box);
      var cover = qs("[data-player-cover]", box);
      if (!video) {
        return;
      }
      var streamUrl = video.getAttribute("data-video");

      function attachStream() {
        if (!streamUrl || video.getAttribute("data-ready") === "1") {
          return;
        }
        if (video.canPlayType("application/vnd.apple.mpegurl")) {
          video.src = streamUrl;
        } else if (window.Hls && window.Hls.isSupported()) {
          var hls = new window.Hls();
          hls.loadSource(streamUrl);
          hls.attachMedia(video);
          video.hls = hls;
        } else {
          video.src = streamUrl;
        }
        video.setAttribute("data-ready", "1");
      }

      function start(event) {
        if (event) {
          event.preventDefault();
          event.stopPropagation();
        }
        attachStream();
        box.classList.add("is-playing");
        var promise = video.play();
        if (promise && typeof promise.catch === "function") {
          promise.catch(function () {});
        }
      }

      if (button) {
        button.addEventListener("click", start);
      }
      if (cover) {
        cover.addEventListener("click", start);
      }
      box.addEventListener("click", function (event) {
        if (event.target === video && video.getAttribute("data-ready") === "1") {
          return;
        }
        start(event);
      });
      video.addEventListener("play", function () {
        box.classList.add("is-playing");
      });
    });
  }

  ready(function () {
    bindMobileMenu();
    bindHeaderSearch();
    bindHero();
    bindFilters();
    bindPlayers();
  });
})();
