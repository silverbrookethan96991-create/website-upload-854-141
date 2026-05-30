(function () {
  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }

  function initMenu() {
    var button = document.querySelector(".menu-toggle");
    var panel = document.querySelector(".mobile-panel");
    if (!button || !panel) {
      return;
    }
    button.addEventListener("click", function () {
      var open = panel.hasAttribute("hidden");
      if (open) {
        panel.removeAttribute("hidden");
        button.setAttribute("aria-expanded", "true");
        button.textContent = "×";
      } else {
        panel.setAttribute("hidden", "");
        button.setAttribute("aria-expanded", "false");
        button.textContent = "☰";
      }
    });
  }

  function initHero() {
    var slides = Array.prototype.slice.call(document.querySelectorAll("[data-hero-slide]"));
    var dots = Array.prototype.slice.call(document.querySelectorAll("[data-hero-dot]"));
    var prev = document.querySelector("[data-hero-prev]");
    var next = document.querySelector("[data-hero-next]");
    if (!slides.length) {
      return;
    }
    var current = 0;
    var timer = null;

    function show(index) {
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle("active", i === current);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle("active", i === current);
      });
    }

    function start() {
      timer = window.setInterval(function () {
        show(current + 1);
      }, 5200);
    }

    function restart() {
      if (timer) {
        window.clearInterval(timer);
      }
      start();
    }

    dots.forEach(function (dot, i) {
      dot.addEventListener("click", function () {
        show(i);
        restart();
      });
    });

    if (prev) {
      prev.addEventListener("click", function () {
        show(current - 1);
        restart();
      });
    }

    if (next) {
      next.addEventListener("click", function () {
        show(current + 1);
        restart();
      });
    }

    start();
  }

  function initCategoryFilters() {
    var tools = document.querySelector("[data-category-tools]");
    var cards = Array.prototype.slice.call(document.querySelectorAll("[data-card-list] .movie-card"));
    if (!tools || !cards.length) {
      return;
    }
    var search = tools.querySelector("[data-category-search]");
    var state = {
      year: "all",
      region: "all",
      keyword: ""
    };

    function apply() {
      cards.forEach(function (card) {
        var text = [
          card.getAttribute("data-title"),
          card.getAttribute("data-year"),
          card.getAttribute("data-region"),
          card.getAttribute("data-type")
        ].join(" ").toLowerCase();
        var matchKeyword = !state.keyword || text.indexOf(state.keyword) !== -1;
        var matchYear = state.year === "all" || card.getAttribute("data-year") === state.year;
        var matchRegion = state.region === "all" || card.getAttribute("data-region") === state.region;
        card.classList.toggle("is-filter-hidden", !(matchKeyword && matchYear && matchRegion));
      });
    }

    tools.addEventListener("click", function (event) {
      var yearButton = event.target.closest("[data-filter-year]");
      var regionButton = event.target.closest("[data-filter-region]");
      if (yearButton) {
        state.year = yearButton.getAttribute("data-filter-year");
        tools.querySelectorAll("[data-filter-year]").forEach(function (button) {
          button.classList.toggle("active", button === yearButton);
        });
        apply();
      }
      if (regionButton) {
        state.region = regionButton.getAttribute("data-filter-region");
        tools.querySelectorAll("[data-filter-region]").forEach(function (button) {
          button.classList.toggle("active", button === regionButton);
        });
        apply();
      }
    });

    if (search) {
      search.addEventListener("input", function () {
        state.keyword = search.value.trim().toLowerCase();
        apply();
      });
    }
  }

  function escapeHtml(value) {
    return String(value || "").replace(/[&<>"']/g, function (char) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        """: "&quot;",
        "'": "&#39;"
      }[char];
    });
  }

  function movieCard(movie) {
    var tags = (movie.tags || []).slice(0, 3).map(function (tag) {
      return "<span>" + escapeHtml(tag) + "</span>";
    }).join("");
    return [
      "<article class="movie-card">",
      "<a href="./" + escapeHtml(movie.file) + "" aria-label="" + escapeHtml(movie.title) + "">",
      "<div class="poster-wrap">",
      "<img src="" + escapeHtml(movie.cover) + "" alt="" + escapeHtml(movie.title) + "" loading="lazy">",
      "<span class="type-badge">" + escapeHtml(movie.type) + "</span>",
      "<span class="year-badge">" + escapeHtml(movie.year) + "</span>",
      "</div>",
      "<div class="card-body">",
      "<h2>" + escapeHtml(movie.title) + "</h2>",
      "<p>" + escapeHtml(movie.oneLine) + "</p>",
      "<div class="card-meta"><span>" + escapeHtml(movie.category) + "</span><span>" + escapeHtml(movie.region) + "</span></div>",
      "<div class="tag-row">" + tags + "</div>",
      "</div>",
      "</a>",
      "</article>"
    ].join("");
  }

  function initSearchPage() {
    var results = document.querySelector("[data-search-results]");
    var input = document.querySelector("[data-search-input]");
    var title = document.querySelector("[data-search-title]");
    var kicker = document.querySelector("[data-search-kicker]");
    if (!results || !window.MOVIES) {
      return;
    }
    var params = new URLSearchParams(window.location.search);
    var query = (params.get("q") || "").trim();
    if (input) {
      input.value = query;
    }
    if (!query) {
      return;
    }
    var q = query.toLowerCase();
    var matched = window.MOVIES.filter(function (movie) {
      return [
        movie.title,
        movie.oneLine,
        movie.region,
        movie.type,
        movie.year,
        movie.category,
        (movie.tags || []).join(" ")
      ].join(" ").toLowerCase().indexOf(q) !== -1;
    }).slice(0, 96);
    if (title) {
      title.textContent = "搜索结果";
    }
    if (kicker) {
      kicker.textContent = query;
    }
    results.innerHTML = matched.length
      ? matched.map(movieCard).join("")
      : "<div class="side-panel"><h2>没有找到相关作品</h2><p>可以尝试更换片名、地区、类型或年份关键词。</p></div>";
  }

  ready(function () {
    initMenu();
    initHero();
    initCategoryFilters();
    initSearchPage();
  });
}());
