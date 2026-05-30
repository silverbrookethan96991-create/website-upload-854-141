(function () {
  function ready(callback) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', callback);
    } else {
      callback();
    }
  }

  ready(function () {
    initMobileMenu();
    initHeroSlider();
    initFilters();
    initPlayers();
  });

  function initMobileMenu() {
    var toggle = document.querySelector('[data-menu-toggle]');
    var menu = document.querySelector('[data-mobile-menu]');

    if (!toggle || !menu) {
      return;
    }

    toggle.addEventListener('click', function () {
      menu.classList.toggle('is-open');
    });
  }

  function initHeroSlider() {
    var hero = document.querySelector('[data-hero]');

    if (!hero) {
      return;
    }

    var slides = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-slide]'));
    var dots = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-dot]'));
    var prev = hero.querySelector('[data-hero-prev]');
    var next = hero.querySelector('[data-hero-next]');
    var index = 0;
    var timer = null;

    if (slides.length <= 1) {
      return;
    }

    function show(nextIndex) {
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle('active', slideIndex === index);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle('active', dotIndex === index);
      });
    }

    function start() {
      stop();
      timer = window.setInterval(function () {
        show(index + 1);
      }, 5000);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    }

    if (prev) {
      prev.addEventListener('click', function () {
        show(index - 1);
        start();
      });
    }

    if (next) {
      next.addEventListener('click', function () {
        show(index + 1);
        start();
      });
    }

    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        show(Number(dot.getAttribute('data-hero-dot') || 0));
        start();
      });
    });

    hero.addEventListener('mouseenter', stop);
    hero.addEventListener('mouseleave', start);
    start();
  }

  function initFilters() {
    var roots = Array.prototype.slice.call(document.querySelectorAll('[data-filter-root]'));

    roots.forEach(function (root) {
      var section = root.parentElement || document;
      var cards = Array.prototype.slice.call(section.querySelectorAll('[data-movie-card]'));
      var search = root.querySelector('[data-search-input]');
      var region = root.querySelector('[data-region-filter]');
      var type = root.querySelector('[data-type-filter]');
      var year = root.querySelector('[data-year-filter]');
      var reset = root.querySelector('[data-filter-reset]');
      var count = root.querySelector('[data-result-count]');

      function valueOf(input) {
        return input ? String(input.value || '').trim().toLowerCase() : '';
      }

      function update() {
        var keyword = valueOf(search);
        var selectedRegion = valueOf(region);
        var selectedType = valueOf(type);
        var selectedYear = valueOf(year);
        var visible = 0;

        cards.forEach(function (card) {
          var haystack = String(card.getAttribute('data-search') || '').toLowerCase();
          var cardRegion = String(card.getAttribute('data-region') || '').toLowerCase();
          var cardType = String(card.getAttribute('data-type') || '').toLowerCase();
          var cardYear = String(card.getAttribute('data-year') || '').toLowerCase();
          var matched = true;

          if (keyword && haystack.indexOf(keyword) === -1) {
            matched = false;
          }
          if (selectedRegion && cardRegion !== selectedRegion) {
            matched = false;
          }
          if (selectedType && cardType !== selectedType) {
            matched = false;
          }
          if (selectedYear && cardYear !== selectedYear) {
            matched = false;
          }

          card.classList.toggle('is-hidden', !matched);
          if (matched) {
            visible += 1;
          }
        });

        if (count) {
          count.textContent = '当前显示 ' + visible + ' / ' + cards.length + ' 部';
        }
      }

      [search, region, type, year].forEach(function (control) {
        if (control) {
          control.addEventListener('input', update);
          control.addEventListener('change', update);
        }
      });

      if (reset) {
        reset.addEventListener('click', function () {
          [search, region, type, year].forEach(function (control) {
            if (control) {
              control.value = '';
            }
          });
          update();
        });
      }

      update();
    });
  }

  function initPlayers() {
    var players = Array.prototype.slice.call(document.querySelectorAll('[data-player]'));

    players.forEach(function (frame) {
      var video = frame.querySelector('video');
      var button = frame.querySelector('[data-play-button]');
      var status = frame.parentElement ? frame.parentElement.querySelector('[data-player-status]') : null;
      var hlsInstance = null;

      if (!video || !button) {
        return;
      }

      function setStatus(message) {
        if (status) {
          status.textContent = message || '';
        }
      }

      function playVideo() {
        var source = video.getAttribute('data-src');

        if (!source) {
          setStatus('当前影片暂未绑定播放源。');
          return;
        }

        button.classList.add('is-hidden');
        setStatus('正在加载高清播放源…');

        if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = source;
          video.play().then(function () {
            setStatus('播放已开始。');
          }).catch(function () {
            setStatus('播放源已绑定，请使用播放器控件继续播放。');
          });
          return;
        }

        if (window.Hls && window.Hls.isSupported()) {
          if (!hlsInstance) {
            hlsInstance = new window.Hls({
              enableWorker: true,
              lowLatencyMode: true
            });
            hlsInstance.loadSource(source);
            hlsInstance.attachMedia(video);
            hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, function () {
              video.play().then(function () {
                setStatus('播放已开始。');
              }).catch(function () {
                setStatus('播放源已绑定，请使用播放器控件继续播放。');
              });
            });
            hlsInstance.on(window.Hls.Events.ERROR, function (event, data) {
              if (data && data.fatal) {
                setStatus('播放源加载失败，请稍后重试或更换网络环境。');
              }
            });
          } else {
            video.play().catch(function () {
              setStatus('播放源已绑定，请使用播放器控件继续播放。');
            });
          }
          return;
        }

        video.src = source;
        video.play().then(function () {
          setStatus('播放已开始。');
        }).catch(function () {
          setStatus('当前浏览器不支持 HLS 自动播放，请更换支持 HLS 的浏览器。');
        });
      }

      button.addEventListener('click', playVideo);
    });
  }
})();
