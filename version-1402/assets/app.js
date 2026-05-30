
(function () {
    function ready(callback) {
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", callback);
        } else {
            callback();
        }
    }

    function qs(selector, root) {
        return (root || document).querySelector(selector);
    }

    function qsa(selector, root) {
        return Array.from((root || document).querySelectorAll(selector));
    }

    ready(function () {
        var toggle = qs(".menu-toggle");
        var panel = qs(".mobile-panel");
        if (toggle && panel) {
            toggle.addEventListener("click", function () {
                var isOpen = panel.hasAttribute("hidden");
                if (isOpen) {
                    panel.removeAttribute("hidden");
                    toggle.setAttribute("aria-expanded", "true");
                } else {
                    panel.setAttribute("hidden", "");
                    toggle.setAttribute("aria-expanded", "false");
                }
            });
        }

        qsa(".search-form").forEach(function (form) {
            form.addEventListener("submit", function (event) {
                event.preventDefault();
                var input = qs("input[name='q']", form);
                var keyword = input ? input.value.trim() : "";
                var url = "./search.html";
                if (keyword) {
                    url += "?q=" + encodeURIComponent(keyword);
                }
                window.location.href = url;
            });
        });

        var hero = qs("[data-hero]");
        if (hero) {
            var slides = qsa(".hero-slide", hero);
            var dots = qsa(".hero-dots button", hero);
            var prev = qs(".hero-prev", hero);
            var next = qs(".hero-next", hero);
            var index = 0;
            var timer = null;

            function show(nextIndex) {
                index = (nextIndex + slides.length) % slides.length;
                slides.forEach(function (slide, slideIndex) {
                    slide.classList.toggle("is-active", slideIndex === index);
                });
                dots.forEach(function (dot, dotIndex) {
                    dot.classList.toggle("is-active", dotIndex === index);
                });
            }

            function advance(step) {
                show(index + step);
                restart();
            }

            function restart() {
                if (timer) {
                    window.clearInterval(timer);
                }
                timer = window.setInterval(function () {
                    show(index + 1);
                }, 5000);
            }

            if (prev) {
                prev.addEventListener("click", function () {
                    advance(-1);
                });
            }
            if (next) {
                next.addEventListener("click", function () {
                    advance(1);
                });
            }
            dots.forEach(function (dot, dotIndex) {
                dot.addEventListener("click", function () {
                    show(dotIndex);
                    restart();
                });
            });
            if (slides.length > 1) {
                restart();
            }
        }

        qsa("[data-local-filter]").forEach(function (form) {
            var input = qs("[data-filter-input]", form);
            var regionSelect = qs("[data-filter-region]", form);
            var yearSelect = qs("[data-filter-year]", form);
            var grid = qs("[data-filter-grid]");
            var empty = qs("[data-empty-state]");
            if (!grid) {
                return;
            }
            var params = new URLSearchParams(window.location.search);
            if (input && params.get("q")) {
                input.value = params.get("q");
            }
            if (regionSelect && params.get("region")) {
                regionSelect.value = params.get("region");
            }
            if (yearSelect && params.get("year")) {
                yearSelect.value = params.get("year");
            }

            function filterCards() {
                var keyword = input ? input.value.trim().toLowerCase() : "";
                var region = regionSelect ? regionSelect.value : "";
                var year = yearSelect ? yearSelect.value : "";
                var visible = 0;
                qsa(".movie-card", grid).forEach(function (card) {
                    var text = [
                        card.dataset.title || "",
                        card.dataset.region || "",
                        card.dataset.year || "",
                        card.dataset.tags || "",
                        card.textContent || ""
                    ].join(" ").toLowerCase();
                    var regionOk = !region || (card.dataset.region || "").indexOf(region) !== -1;
                    var yearOk = !year || (card.dataset.year || "") === year;
                    var keywordOk = !keyword || text.indexOf(keyword) !== -1;
                    var showCard = regionOk && yearOk && keywordOk;
                    card.hidden = !showCard;
                    if (showCard) {
                        visible += 1;
                    }
                });
                if (empty) {
                    empty.hidden = visible !== 0;
                }
            }

            [input, regionSelect, yearSelect].forEach(function (control) {
                if (control) {
                    control.addEventListener("input", filterCards);
                    control.addEventListener("change", filterCards);
                }
            });
            form.addEventListener("submit", function (event) {
                event.preventDefault();
                filterCards();
            });
            filterCards();
        });
    });
})();
