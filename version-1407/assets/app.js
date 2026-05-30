(function () {
  const header = document.querySelector('[data-header]');
  const menuToggle = document.querySelector('[data-menu-toggle]');

  function syncHeader() {
    if (!header) {
      return;
    }
    header.classList.toggle('is-scrolled', window.scrollY > 20);
  }

  window.addEventListener('scroll', syncHeader, { passive: true });
  syncHeader();

  if (header && menuToggle) {
    menuToggle.addEventListener('click', function () {
      header.classList.toggle('is-open');
    });
  }

  const hero = document.querySelector('[data-hero]');
  if (hero) {
    const slides = Array.from(hero.querySelectorAll('[data-hero-slide]'));
    const dots = Array.from(hero.querySelectorAll('[data-hero-dot]'));
    const nextButton = hero.querySelector('[data-hero-next]');
    const prevButton = hero.querySelector('[data-hero-prev]');
    let current = 0;
    let timer = null;

    function showSlide(index) {
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle('is-active', slideIndex === current);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle('is-active', dotIndex === current);
      });
    }

    function startHero() {
      stopHero();
      timer = window.setInterval(function () {
        showSlide(current + 1);
      }, 5000);
    }

    function stopHero() {
      if (timer) {
        window.clearInterval(timer);
      }
    }

    if (slides.length > 1) {
      if (nextButton) {
        nextButton.addEventListener('click', function () {
          showSlide(current + 1);
          startHero();
        });
      }
      if (prevButton) {
        prevButton.addEventListener('click', function () {
          showSlide(current - 1);
          startHero();
        });
      }
      dots.forEach(function (dot) {
        dot.addEventListener('click', function () {
          showSlide(Number(dot.dataset.heroDot || 0));
          startHero();
        });
      });
      startHero();
    }
  }

  const searchInput = document.getElementById('siteSearch');
  const searchResults = document.getElementById('searchResults');
  const clearSearch = document.querySelector('[data-clear-search]');

  function renderSearchResults(query) {
    if (!searchResults) {
      return;
    }
    const data = window.SEARCH_DATA || [];
    const normalized = query.trim().toLowerCase();
    searchResults.innerHTML = '';
    if (!normalized) {
      return;
    }
    const matches = data.filter(function (item) {
      return item.search.toLowerCase().indexOf(normalized) !== -1;
    }).slice(0, 12);

    if (!matches.length) {
      searchResults.innerHTML = '<p class="filter-count">没有找到匹配影片。</p>';
      return;
    }

    const fragment = document.createDocumentFragment();
    matches.forEach(function (item) {
      const link = document.createElement('a');
      link.className = 'search-result-item';
      link.href = item.url;
      link.innerHTML = [
        '<img src="' + item.cover + '" alt="' + escapeHtml(item.title) + '" loading="lazy">',
        '<span><strong>' + escapeHtml(item.title) + '</strong><em>' + escapeHtml(item.meta) + '</em></span>',
        '<span class="result-go">查看 →</span>'
      ].join('');
      fragment.appendChild(link);
    });
    searchResults.appendChild(fragment);
  }

  if (searchInput) {
    searchInput.addEventListener('input', function () {
      renderSearchResults(searchInput.value);
    });
  }

  if (clearSearch && searchInput && searchResults) {
    clearSearch.addEventListener('click', function () {
      searchInput.value = '';
      searchResults.innerHTML = '';
      searchInput.focus();
    });
  }

  document.querySelectorAll('[data-filter-scope]').forEach(function (scope) {
    const input = scope.querySelector('[data-filter-input]');
    const clear = scope.querySelector('[data-filter-clear]');
    const cards = Array.from(scope.querySelectorAll('[data-card]'));
    const count = scope.querySelector('[data-filter-count]');
    const regionButtons = Array.from(scope.querySelectorAll('[data-filter-region]'));
    let region = '';

    function applyFilter() {
      const query = input ? input.value.trim().toLowerCase() : '';
      let visible = 0;
      cards.forEach(function (card) {
        const text = (card.dataset.search || '').toLowerCase();
        const cardRegion = card.dataset.region || '';
        const matchedQuery = !query || text.indexOf(query) !== -1;
        const matchedRegion = !region || cardRegion === region;
        const show = matchedQuery && matchedRegion;
        card.style.display = show ? '' : 'none';
        if (show) {
          visible += 1;
        }
      });
      if (count) {
        count.textContent = '显示 ' + visible + ' 部影片';
      }
    }

    if (input) {
      input.addEventListener('input', applyFilter);
    }
    if (clear && input) {
      clear.addEventListener('click', function () {
        input.value = '';
        region = '';
        regionButtons.forEach(function (button) {
          button.classList.toggle('is-active', !button.dataset.filterRegion);
        });
        applyFilter();
        input.focus();
      });
    }
    regionButtons.forEach(function (button) {
      button.addEventListener('click', function () {
        region = button.dataset.filterRegion || '';
        regionButtons.forEach(function (other) {
          other.classList.toggle('is-active', other === button);
        });
        applyFilter();
      });
    });
    applyFilter();
  });

  document.querySelectorAll('[data-player]').forEach(function (player) {
    const video = player.querySelector('[data-video]');
    const button = player.querySelector('[data-video-src]');
    const status = player.querySelector('[data-player-status]');
    let hlsInstance = null;
    let initialized = false;

    function setStatus(message) {
      if (status) {
        status.textContent = message;
      }
    }

    function playVideo() {
      if (!video || !button) {
        return;
      }
      const src = button.dataset.videoSrc;
      if (!src) {
        setStatus('当前影片没有可用播放源。');
        return;
      }

      if (!initialized) {
        if (window.Hls && window.Hls.isSupported()) {
          hlsInstance = new window.Hls({
            enableWorker: true,
            lowLatencyMode: true
          });
          hlsInstance.loadSource(src);
          hlsInstance.attachMedia(video);
          hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, function () {
            video.play().catch(function () {
              setStatus('播放源已加载，请再次点击播放按钮。');
            });
          });
          hlsInstance.on(window.Hls.Events.ERROR, function (event, data) {
            if (!data || !data.fatal || !hlsInstance) {
              return;
            }
            if (data.type === window.Hls.ErrorTypes.NETWORK_ERROR) {
              hlsInstance.startLoad();
              setStatus('网络波动，正在重新加载播放源。');
            } else if (data.type === window.Hls.ErrorTypes.MEDIA_ERROR) {
              hlsInstance.recoverMediaError();
              setStatus('媒体解码异常，正在尝试恢复。');
            } else {
              hlsInstance.destroy();
              setStatus('播放源加载失败，请刷新页面重试。');
            }
          });
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = src;
          video.addEventListener('loadedmetadata', function () {
            video.play().catch(function () {
              setStatus('播放源已加载，请再次点击播放按钮。');
            });
          }, { once: true });
        } else {
          video.src = src;
          setStatus('当前浏览器需要 HLS 支持，已尝试使用原始播放源。');
        }
        initialized = true;
      }

      button.classList.add('is-hidden');
      video.play().catch(function () {
        setStatus('播放源已就绪，请使用播放器控制栏开始播放。');
      });
    }

    if (button) {
      button.addEventListener('click', playVideo);
    }
    if (video) {
      video.addEventListener('play', function () {
        if (button) {
          button.classList.add('is-hidden');
        }
        setStatus('正在播放。');
      });
      video.addEventListener('pause', function () {
        setStatus('播放已暂停。');
      });
    }

    window.addEventListener('beforeunload', function () {
      if (hlsInstance) {
        hlsInstance.destroy();
      }
    });
  });

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
})();
