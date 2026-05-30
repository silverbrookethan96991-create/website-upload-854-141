(function () {
    var header = document.getElementById("site-header");
    var menuButton = document.querySelector("[data-menu-button]");
    var mobileNav = document.querySelector("[data-mobile-nav]");

    function updateHeader() {
        if (!header) {
            return;
        }
        if (window.scrollY > 20) {
            header.classList.add("is-scrolled");
        } else {
            header.classList.remove("is-scrolled");
        }
    }

    updateHeader();
    window.addEventListener("scroll", updateHeader, { passive: true });

    if (menuButton && mobileNav) {
        menuButton.addEventListener("click", function () {
            var open = mobileNav.classList.toggle("is-open");
            menuButton.setAttribute("aria-expanded", open ? "true" : "false");
        });
    }

    var hero = document.querySelector("[data-hero]");
    if (hero) {
        var slides = Array.prototype.slice.call(hero.querySelectorAll("[data-slide]"));
        var dots = Array.prototype.slice.call(hero.querySelectorAll("[data-dot]"));
        var prev = hero.querySelector("[data-prev]");
        var next = hero.querySelector("[data-next]");
        var current = 0;
        var timer = null;

        function show(index) {
            if (!slides.length) {
                return;
            }
            current = (index + slides.length) % slides.length;
            slides.forEach(function (slide, i) {
                slide.classList.toggle("is-active", i === current);
            });
            dots.forEach(function (dot, i) {
                dot.classList.toggle("is-active", i === current);
            });
        }

        function restart() {
            if (timer) {
                window.clearInterval(timer);
            }
            timer = window.setInterval(function () {
                show(current + 1);
            }, 5200);
        }

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

        dots.forEach(function (dot, i) {
            dot.addEventListener("click", function () {
                show(i);
                restart();
            });
        });

        show(0);
        restart();
    }

    var filterInput = document.querySelector("[data-filter-input]");
    if (filterInput) {
        var cards = Array.prototype.slice.call(document.querySelectorAll("[data-filter-card]"));
        var noResult = document.querySelector("[data-no-result]");
        var params = new URLSearchParams(window.location.search);
        var initial = params.get("q") || "";

        function applyFilter() {
            var keyword = filterInput.value.trim().toLowerCase();
            var visible = 0;
            cards.forEach(function (card) {
                var haystack = card.getAttribute("data-filter-text") || "";
                var matched = !keyword || haystack.indexOf(keyword) !== -1;
                card.style.display = matched ? "" : "none";
                if (matched) {
                    visible += 1;
                }
            });
            if (noResult) {
                noResult.classList.toggle("is-visible", visible === 0);
            }
        }

        if (initial) {
            filterInput.value = initial;
        }
        filterInput.addEventListener("input", applyFilter);
        applyFilter();
    }

    var quickSearch = document.querySelector("[data-quick-search]");
    if (quickSearch) {
        quickSearch.addEventListener("submit", function (event) {
            event.preventDefault();
            var input = quickSearch.querySelector("input");
            var keyword = input ? input.value.trim() : "";
            window.location.href = "./search.html" + (keyword ? "?q=" + encodeURIComponent(keyword) : "");
        });
    }
}());

function startVideoPlayer(videoId, overlayId, streamUrl) {
    var video = document.getElementById(videoId);
    var overlay = document.getElementById(overlayId);
    var hls = null;
    var attached = false;

    if (!video) {
        return;
    }

    function attach() {
        if (attached) {
            return;
        }
        attached = true;
        if (video.canPlayType("application/vnd.apple.mpegurl")) {
            video.src = streamUrl;
        } else if (window.Hls && window.Hls.isSupported()) {
            hls = new window.Hls({
                enableWorker: true,
                lowLatencyMode: true
            });
            hls.loadSource(streamUrl);
            hls.attachMedia(video);
            hls.on(window.Hls.Events.ERROR, function (event, data) {
                if (!data.fatal) {
                    return;
                }
                if (data.type === window.Hls.ErrorTypes.NETWORK_ERROR) {
                    hls.startLoad();
                } else if (data.type === window.Hls.ErrorTypes.MEDIA_ERROR) {
                    hls.recoverMediaError();
                } else {
                    hls.destroy();
                }
            });
        } else {
            video.src = streamUrl;
        }
    }

    function play() {
        attach();
        if (overlay) {
            overlay.classList.add("is-hidden");
        }
        var promise = video.play();
        if (promise && typeof promise.catch === "function") {
            promise.catch(function () {});
        }
    }

    if (overlay) {
        overlay.addEventListener("click", play);
    }

    video.addEventListener("click", function () {
        if (video.paused) {
            play();
        }
    });

    window.addEventListener("pagehide", function () {
        if (hls) {
            hls.destroy();
        }
    });
}
