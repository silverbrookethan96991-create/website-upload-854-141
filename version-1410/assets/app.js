(function () {
  const header = document.querySelector('[data-site-header]');
  const mobileToggle = document.querySelector('[data-mobile-toggle]');
  const mobileNav = document.querySelector('[data-mobile-nav]');

  function updateHeader() {
    if (!header) {
      return;
    }
    header.classList.toggle('is-scrolled', window.scrollY > 18);
  }

  updateHeader();
  window.addEventListener('scroll', updateHeader, { passive: true });

  if (mobileToggle && mobileNav && header) {
    mobileToggle.addEventListener('click', function () {
      const isOpen = mobileNav.classList.toggle('is-open');
      header.classList.toggle('is-open', isOpen);
      document.body.classList.toggle('menu-open', isOpen);
    });
  }

  document.querySelectorAll('[data-search-redirect]').forEach(function (form) {
    form.addEventListener('submit', function () {
      const input = form.querySelector('input[name="q"]');
      if (input) {
        input.value = input.value.trim();
      }
    });
  });

  const carousel = document.querySelector('[data-hero-carousel]');
  if (carousel) {
    const slides = Array.from(carousel.querySelectorAll('[data-hero-slide]'));
    const dots = Array.from(carousel.querySelectorAll('[data-hero-dot]'));
    const next = carousel.querySelector('[data-hero-next]');
    const prev = carousel.querySelector('[data-hero-prev]');
    let currentIndex = 0;
    let timerId = null;

    function showSlide(index) {
      if (!slides.length) {
        return;
      }
      currentIndex = (index + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle('is-active', slideIndex === currentIndex);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle('is-active', dotIndex === currentIndex);
      });
    }

    function schedule() {
      window.clearInterval(timerId);
      timerId = window.setInterval(function () {
        showSlide(currentIndex + 1);
      }, 5200);
    }

    if (next) {
      next.addEventListener('click', function () {
        showSlide(currentIndex + 1);
        schedule();
      });
    }

    if (prev) {
      prev.addEventListener('click', function () {
        showSlide(currentIndex - 1);
        schedule();
      });
    }

    dots.forEach(function (dot, dotIndex) {
      dot.addEventListener('click', function () {
        showSlide(dotIndex);
        schedule();
      });
    });

    showSlide(0);
    schedule();
  }

  const filterPage = document.querySelector('[data-filter-page]');
  if (filterPage) {
    const cards = Array.from(filterPage.querySelectorAll('[data-movie-card]'));
    const searchInput = filterPage.querySelector('#searchInput');
    const regionFilter = filterPage.querySelector('#regionFilter');
    const typeFilter = filterPage.querySelector('#typeFilter');
    const yearFilter = filterPage.querySelector('#yearFilter');
    const categoryFilter = filterPage.querySelector('#categoryFilter');
    const countNode = filterPage.querySelector('[data-filter-count]');
    const noResults = filterPage.querySelector('[data-no-results]');
    const params = new URLSearchParams(window.location.search);
    const initialQuery = params.get('q');

    if (initialQuery && searchInput) {
      searchInput.value = initialQuery;
    }

    function normalize(value) {
      return String(value || '').trim().toLowerCase();
    }

    function cardText(card) {
      return [
        card.dataset.title,
        card.dataset.region,
        card.dataset.type,
        card.dataset.year,
        card.dataset.category,
        card.dataset.genre,
        card.dataset.tags,
        card.textContent
      ].join(' ').toLowerCase();
    }

    function applyFilters() {
      const query = normalize(searchInput && searchInput.value);
      const region = normalize(regionFilter && regionFilter.value);
      const type = normalize(typeFilter && typeFilter.value);
      const year = normalize(yearFilter && yearFilter.value);
      const category = normalize(categoryFilter && categoryFilter.value);
      let visible = 0;

      cards.forEach(function (card) {
        const text = cardText(card);
        const matchQuery = !query || text.includes(query);
        const matchRegion = !region || normalize(card.dataset.region) === region;
        const matchType = !type || normalize(card.dataset.type) === type;
        const matchYear = !year || normalize(card.dataset.year) === year;
        const matchCategory = !category || normalize(card.dataset.category) === category;
        const isVisible = matchQuery && matchRegion && matchType && matchYear && matchCategory;

        card.hidden = !isVisible;
        if (isVisible) {
          visible += 1;
        }
      });

      if (countNode) {
        countNode.textContent = String(visible);
      }
      if (noResults) {
        noResults.hidden = visible !== 0;
      }
    }

    [searchInput, regionFilter, typeFilter, yearFilter, categoryFilter].forEach(function (control) {
      if (control) {
        control.addEventListener('input', applyFilters);
        control.addEventListener('change', applyFilters);
      }
    });

    applyFilters();
  }

  document.querySelectorAll('[data-player-start]').forEach(function (button) {
    button.addEventListener('click', function () {
      const shell = button.closest('.player-shell');
      if (!shell) {
        return;
      }

      const video = shell.querySelector('video');
      const status = shell.querySelector('[data-player-status]');
      const source = shell.dataset.video;
      const poster = shell.dataset.poster;

      if (!video || !source) {
        if (status) {
          status.textContent = '播放源缺失，无法加载视频。';
        }
        return;
      }

      shell.classList.add('is-playing');
      video.setAttribute('controls', 'controls');
      if (poster) {
        video.setAttribute('poster', poster);
      }

      function markReady(message) {
        if (status) {
          status.textContent = message;
        }
      }

      if (window.Hls && window.Hls.isSupported()) {
        const hls = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true
        });

        hls.loadSource(source);
        hls.attachMedia(video);
        hls.on(window.Hls.Events.MANIFEST_PARSED, function () {
          markReady('播放源已加载，正在播放。');
          video.play().catch(function () {
            markReady('播放源已加载，请再次点击播放器开始播放。');
          });
        });
        hls.on(window.Hls.Events.ERROR, function (event, data) {
          if (!data || !data.fatal) {
            return;
          }
          if (data.type === window.Hls.ErrorTypes.NETWORK_ERROR) {
            markReady('网络异常，正在重新加载播放源。');
            hls.startLoad();
          } else if (data.type === window.Hls.ErrorTypes.MEDIA_ERROR) {
            markReady('媒体解码异常，正在恢复播放。');
            hls.recoverMediaError();
          } else {
            markReady('当前浏览器无法恢复该播放源。');
            hls.destroy();
          }
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = source;
        video.addEventListener('loadedmetadata', function () {
          markReady('播放源已加载，正在播放。');
          video.play().catch(function () {
            markReady('播放源已加载，请再次点击播放器开始播放。');
          });
        }, { once: true });
      } else {
        video.src = source;
        markReady('已尝试使用浏览器原生播放器打开播放源。');
        video.play().catch(function () {
          markReady('浏览器可能不支持 HLS，请使用 Chrome、Safari 或 Edge 最新版本。');
        });
      }
    });
  });
})();
