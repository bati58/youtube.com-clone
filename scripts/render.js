(() => {
  const grid = document.getElementById("video-grid");
  const resultsCount = document.getElementById("results-count");
  const emptyState = document.getElementById("empty-state");
  const searchForm = document.querySelector(".search-form");
  const searchInput = document.getElementById("search-input");
  const navLinks = Array.from(document.querySelectorAll(".sidebar-link[data-section]"));
  const menuButton = document.getElementById("menu-button");
  const voiceButton = document.querySelector(".voice-search-button");
  const notificationsButton = document.getElementById("notifications-button");
  const notificationsPanel = document.getElementById("notifications-panel");
  const notificationsClose = document.getElementById("notifications-close");
  const toast = document.getElementById("toast");
  const videos = Array.isArray(window.videos) ? window.videos : [];

  let currentSection = "home";
  let toastTimer;

  const normalize = (value) => value.toLowerCase().trim();
  const isSmallScreen = () => window.matchMedia("(max-width: 900px)").matches;

  const showToast = (message) => {
    if (!toast) {
      return;
    }

    toast.textContent = message;
    toast.classList.add("is-visible");

    if (toastTimer) {
      clearTimeout(toastTimer);
    }

    toastTimer = setTimeout(() => {
      toast.classList.remove("is-visible");
    }, 2000);
  };

  const setActiveSection = (section) => {
    currentSection = section || "home";

    navLinks.forEach((link) => {
      const isActive = link.dataset.section === currentSection;
      link.classList.toggle("is-active", isActive);
      if (isActive) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  };

  const applyFilters = () => {
    const query = normalize(searchInput ? searchInput.value : "");

    let filtered = videos;

    if (currentSection !== "home") {
      filtered = filtered.filter((video) => (video.section || "home") === currentSection);
    }

    if (query) {
      filtered = filtered.filter((video) => {
        const haystack = normalize(`${video.title} ${video.author}`);
        return haystack.includes(query);
      });
    }

    return { filtered, query };
  };

  const updateResults = (count, total, query) => {
    if (!resultsCount) {
      return;
    }

    const sectionLabel = currentSection === "home" ? "videos" : `${currentSection} videos`;
    const queryLabel = query ? ` for "${query}"` : "";
    resultsCount.textContent = `Showing ${count} ${sectionLabel}${queryLabel}.`;
  };

  const syncQueryParam = (query) => {
    if (!searchInput) {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    if (query) {
      params.set("q", query);
    } else {
      params.delete("q");
    }

    const queryString = params.toString();
    const hash = window.location.hash || "";
    const nextUrl = `${window.location.pathname}${queryString ? `?${queryString}` : ""}${hash}`;
    window.history.replaceState(null, "", nextUrl);
  };

  const render = () => {
    if (!grid) {
      return;
    }

    const { filtered, query } = applyFilters();

    const cards = filtered
      .map((video) => {
        const title = video.title;
        const thumbnailAlt = video.thumbnailAlt || title;
        const channelAlt = video.channelAlt || `Channel picture for ${video.author}`;

        return `
          <a href="${video.href}" target="_blank" rel="noopener noreferrer" class="video-link">
            <div class="video-preview">
              <div class="thumbnail-row">
                <img class="thumbnail" src="${video.thumbnail}" alt="${thumbnailAlt}" loading="lazy" />
                <div class="video-time">${video.duration}</div>
              </div>
              <div class="video-info-grid">
                <div class="channel-picture">
                  <img class="profile-picture" src="${video.channelImage}" alt="${channelAlt}" loading="lazy" />
                </div>
                <div class="video-info">
                  <p class="video-title">${title}</p>
                  <p class="video-author">${video.author}</p>
                  <p class="video-stats">${video.stats}</p>
                </div>
              </div>
            </div>
          </a>
        `;
      })
      .join("");

    grid.innerHTML = cards;
    updateResults(filtered.length, videos.length, query);
    syncQueryParam(query);

    if (emptyState) {
      emptyState.hidden = filtered.length !== 0;
    }
  };

  const updateMenuAria = () => {
    if (!menuButton) {
      return;
    }

    const expanded = isSmallScreen()
      ? document.body.classList.contains("sidebar-open")
      : !document.body.classList.contains("sidebar-collapsed");

    menuButton.setAttribute("aria-expanded", String(expanded));
  };

  const toggleSidebar = () => {
    if (isSmallScreen()) {
      document.body.classList.toggle("sidebar-open");
    } else {
      document.body.classList.toggle("sidebar-collapsed");
    }

    updateMenuAria();
  };

  const closeSidebarIfSmall = () => {
    if (isSmallScreen()) {
      document.body.classList.remove("sidebar-open");
      updateMenuAria();
    }
  };

  const closeNotifications = () => {
    if (!notificationsPanel || !notificationsButton) {
      return;
    }

    notificationsPanel.hidden = true;
    notificationsButton.setAttribute("aria-expanded", "false");
  };

  const toggleNotifications = () => {
    if (!notificationsPanel || !notificationsButton) {
      return;
    }

    const isHidden = notificationsPanel.hidden;
    notificationsPanel.hidden = !isHidden;
    notificationsButton.setAttribute("aria-expanded", String(isHidden));
  };

  const initNavigation = () => {
    if (!navLinks.length) {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const initialQuery = params.get("q");
    if (searchInput && initialQuery) {
      searchInput.value = initialQuery;
    }

    const hashSection = window.location.hash.replace("#", "");
    const hashLink = navLinks.find((link) => link.dataset.section === hashSection);
    setActiveSection(hashLink ? hashLink.dataset.section : "home");
  };

  if (searchForm) {
    searchForm.addEventListener("submit", (event) => {
      event.preventDefault();
      render();
    });
  }

  if (searchInput) {
    searchInput.addEventListener("input", render);
  }

  navLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      const section = link.dataset.section || "home";
      setActiveSection(section);
      window.history.replaceState(null, "", `#${section}`);
      closeSidebarIfSmall();
      render();
    });
  });

  if (menuButton) {
    menuButton.addEventListener("click", toggleSidebar);
  }

  if (notificationsButton) {
    notificationsButton.addEventListener("click", toggleNotifications);
  }

  if (notificationsClose) {
    notificationsClose.addEventListener("click", closeNotifications);
  }

  document.addEventListener("click", (event) => {
    if (!notificationsPanel || !notificationsButton || notificationsPanel.hidden) {
      return;
    }

    const target = event.target;
    if (notificationsPanel.contains(target) || notificationsButton.contains(target)) {
      return;
    }

    closeNotifications();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeNotifications();
      closeSidebarIfSmall();
    }
  });

  document.addEventListener("click", (event) => {
    if (!isSmallScreen() || !document.body.classList.contains("sidebar-open")) {
      return;
    }

    const sidebar = document.getElementById("sidebar");
    if (!sidebar || !menuButton) {
      return;
    }

    if (sidebar.contains(event.target) || menuButton.contains(event.target)) {
      return;
    }

    closeSidebarIfSmall();
  });

  if (voiceButton) {
    voiceButton.addEventListener("click", () => {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

      if (!SpeechRecognition) {
        showToast("Voice search is not supported in this browser.");
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.lang = "en-US";
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (searchInput) {
          searchInput.value = transcript;
          render();
        }
        showToast(`Searching for "${transcript}"`);
      };

      recognition.onerror = () => {
        showToast("Voice search failed. Try again.");
      };

      recognition.start();
    });
  }

  const handleResize = () => {
    if (isSmallScreen()) {
      document.body.classList.remove("sidebar-collapsed");
    } else {
      document.body.classList.remove("sidebar-open");
    }

    updateMenuAria();
  };

  window.addEventListener("resize", handleResize);

  initNavigation();
  handleResize();
  render();
})();
