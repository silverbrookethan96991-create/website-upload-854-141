(function() {
    function ready(fn) {
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", fn);
        } else {
            fn();
        }
    }

    ready(function() {
        var toggle = document.querySelector(".menu-toggle");
        var mobileNav = document.querySelector(".mobile-nav");
        if (toggle && mobileNav) {
            toggle.addEventListener("click", function() {
                mobileNav.classList.toggle("is-open");
            });
        }

        var slides = Array.prototype.slice.call(document.querySelectorAll(".hero-slide"));
        var dots = Array.prototype.slice.call(document.querySelectorAll(".hero-dot"));
        if (slides.length > 1) {
            var current = 0;
            var activate = function(index) {
                current = index;
                slides.forEach(function(slide, i) {
                    slide.classList.toggle("is-active", i === index);
                });
                dots.forEach(function(dot, i) {
                    dot.classList.toggle("is-active", i === index);
                });
            };
            dots.forEach(function(dot, i) {
                dot.addEventListener("click", function() {
                    activate(i);
                });
            });
            window.setInterval(function() {
                activate((current + 1) % slides.length);
            }, 6200);
        }

        Array.prototype.slice.call(document.querySelectorAll(".search-scope")).forEach(function(scope) {
            var input = scope.querySelector(".movie-search");
            var cards = Array.prototype.slice.call(scope.querySelectorAll(".movie-card"));
            var buttons = Array.prototype.slice.call(scope.querySelectorAll(".filter-btn"));
            var empty = scope.querySelector(".empty-tip");
            var activeFilter = "all";

            var update = function() {
                var query = input ? input.value.trim().toLowerCase() : "";
                var visibleCount = 0;
                cards.forEach(function(card) {
                    var text = (card.getAttribute("data-search") || "").toLowerCase();
                    var type = card.getAttribute("data-type") || "";
                    var matchedText = query === "" || text.indexOf(query) !== -1;
                    var matchedFilter = activeFilter === "all" || type.indexOf(activeFilter) !== -1 || text.indexOf(activeFilter.toLowerCase()) !== -1;
                    var show = matchedText && matchedFilter;
                    card.style.display = show ? "" : "none";
                    if (show) {
                        visibleCount += 1;
                    }
                });
                if (empty) {
                    empty.style.display = visibleCount ? "none" : "block";
                }
            };

            if (input) {
                input.addEventListener("input", update);
            }

            buttons.forEach(function(button) {
                button.addEventListener("click", function() {
                    buttons.forEach(function(item) {
                        item.classList.remove("is-active");
                    });
                    button.classList.add("is-active");
                    activeFilter = button.getAttribute("data-filter") || "all";
                    update();
                });
            });
        });

        Array.prototype.slice.call(document.querySelectorAll(".movie-player")).forEach(function(player) {
            var video = player.querySelector("video");
            var overlay = player.querySelector(".player-overlay");
            var started = false;
            var hlsInstance = null;

            var loadVideo = function() {
                if (!video || started) {
                    return;
                }
                var src = video.getAttribute("data-hls");
                started = true;
                if (video.canPlayType("application/vnd.apple.mpegurl")) {
                    video.src = src;
                } else if (window.Hls && window.Hls.isSupported()) {
                    hlsInstance = new Hls({
                        enableWorker: true
                    });
                    hlsInstance.loadSource(src);
                    hlsInstance.attachMedia(video);
                } else {
                    video.src = src;
                }
            };

            var start = function() {
                if (!video) {
                    return;
                }
                loadVideo();
                if (overlay) {
                    overlay.classList.add("is-hidden");
                }
                var playResult = video.play();
                if (playResult && typeof playResult.catch === "function") {
                    playResult.catch(function() {
                        if (overlay) {
                            overlay.classList.remove("is-hidden");
                        }
                    });
                }
            };

            if (overlay) {
                overlay.addEventListener("click", start);
            }

            if (video) {
                video.addEventListener("click", function() {
                    if (video.paused) {
                        start();
                    }
                });
                video.addEventListener("play", function() {
                    if (overlay) {
                        overlay.classList.add("is-hidden");
                    }
                });
                video.addEventListener("ended", function() {
                    if (overlay) {
                        overlay.classList.remove("is-hidden");
                    }
                });
            }

            window.addEventListener("beforeunload", function() {
                if (hlsInstance) {
                    hlsInstance.destroy();
                }
            });
        });
    });
})();
