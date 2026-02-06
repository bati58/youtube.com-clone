(() => {
  const grid = document.getElementById('video-grid');
  const resultsCount = document.getElementById('results-count');
  const emptyState = document.getElementById('empty-state');
  const searchForm = document.querySelector('.search-form');
  const searchInput = document.getElementById('search-input');
  const navLinks = Array.from(document.querySelectorAll('.sidebar-link[data-section]'));
  const menuButton = document.getElementById('menu-button');
  const voiceButton = document.querySelector('.voice-search-button');
  const notificationsButton = document.getElementById('notifications-button');
  const notificationsPanel = document.getElementById('notifications-panel');
  const notificationsClose = document.getElementById('notifications-close');
  const toast = document.getElementById('toast');  const createButton = document.getElementById('create-button');
  const createModal = document.getElementById('create-modal');
  const createForm = document.getElementById('create-form');
  const thumbnailFileInput = document.getElementById('create-thumbnail-file');
  const thumbnailPreview = document.getElementById('create-thumbnail-preview');
  const syncButton = document.getElementById('sync-button');
  const syncModal = document.getElementById('sync-modal');
  const syncForm = document.getElementById('sync-form');
  const syncTokenInput = document.getElementById('sync-token');
  const syncRemember = document.getElementById('sync-remember');
  const videos = Array.isArray(window.videos) ? window.videos : [];

  let currentSection = 'home';
  let toastTimer;

  const normalize = (value) => value.toLowerCase().trim();
  const isSmallScreen = () => window.matchMedia('(max-width: 900px)').matches;

  const showToast = (message) => {
    if (!toast) {
      return;
    }

    toast.textContent = message;
    toast.classList.add('is-visible');

    if (toastTimer) {
      clearTimeout(toastTimer);
    }

    toastTimer = setTimeout(() => {
      toast.classList.remove('is-visible');
    }, 2000);
  };

  const setActiveSection = (section) => {
    currentSection = section || 'home';

    navLinks.forEach((link) => {
      const isActive = link.dataset.section === currentSection;
      link.classList.toggle('is-active', isActive);
      if (isActive) {
        link.setAttribute('aria-current', 'page');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  };

  const applyFilters = () => {
    const query = normalize(searchInput ? searchInput.value : '');

    let filtered = videos;

    if (currentSection !== 'home') {
      filtered = filtered.filter((video) => (video.section || 'home') === currentSection);
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

    const sectionLabel = currentSection === 'home' ? 'videos' : `${currentSection} videos`;
    const queryLabel = query ? ` for "${query}"` : '';
    resultsCount.textContent = `Showing ${count} ${sectionLabel}${queryLabel}.`;
  };

  const syncQueryParam = (query) => {
    if (!searchInput) {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    if (query) {
      params.set('q', query);
    } else {
      params.delete('q');
    }

    const queryString = params.toString();
    const hash = window.location.hash || '';
    const nextUrl = `${window.location.pathname}${queryString ? `?${queryString}` : ''}${hash}`;
    window.history.replaceState(null, '', nextUrl);
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

        const linkHref = video.id ? `watch.html?id=${encodeURIComponent(video.id)}` : video.href;
        const externalAttrs = video.id ? '' : ' target="_blank" rel="noopener noreferrer"';

        return `
          <a href="${linkHref}"${externalAttrs} class="video-link">
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
      .join('');

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
      ? document.body.classList.contains('sidebar-open')
      : !document.body.classList.contains('sidebar-collapsed');

    menuButton.setAttribute('aria-expanded', String(expanded));
  };

  const toggleSidebar = () => {
    if (isSmallScreen()) {
      document.body.classList.toggle('sidebar-open');
    } else {
      document.body.classList.toggle('sidebar-collapsed');
    }

    updateMenuAria();
  };
  // Create/upload modal handling
  function openCreateModal() {
    if (!createModal) return;
    createModal.setAttribute('aria-hidden', 'false');
    const first = createModal.querySelector('input, button, textarea');
    if (first) first.focus();
    document.body.style.overflow = 'hidden';
  }

  function closeCreateModal() {
    if (!createModal) return;
    createModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (createButton) createButton.focus();
  }

  if (createButton) {
    createButton.addEventListener('click', () => {
      openCreateModal();
    });
  }

  if (createModal) {
    createModal.addEventListener('click', (e) => {
      if (e.target === createModal) closeCreateModal();
    });

    const cancel = document.getElementById('create-cancel');
    if (cancel) cancel.addEventListener('click', closeCreateModal);

    const createClose = document.getElementById('create-close');
    if (createClose) createClose.addEventListener('click', closeCreateModal);

    // focus trap helpers
    const focusableSelector = 'a[href], area[href], input:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])';
    let lastFocusedBeforeModal = null;

    const trapFocus = (e) => {
      if (!createModal || createModal.getAttribute('aria-hidden') === 'true') return;
      const focusable = Array.from(createModal.querySelectorAll(focusableSelector));
      if (!focusable.length) return;

      if (e.key === 'Tab') {
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      } else if (e.key === 'Escape') {
        closeCreateModal();
      }
    };

    const openCreateModalWithFocus = () => {
      lastFocusedBeforeModal = document.activeElement;
      openCreateModal();
      document.addEventListener('keydown', trapFocus);
    };

    const closeCreateModalAndRestoreFocus = () => {
      closeCreateModal();
      document.removeEventListener('keydown', trapFocus);
      if (lastFocusedBeforeModal && typeof lastFocusedBeforeModal.focus === 'function') {
        lastFocusedBeforeModal.focus();
      }
    };

    // replace previously used handlers
    if (createButton) {
      createButton.addEventListener('click', () => {
        openCreateModalWithFocus();
      });
    }

    // Sync modal handlers
    if (syncButton) {
      syncButton.addEventListener('click', () => {
        if (!syncModal) return;
        syncModal.setAttribute('aria-hidden', 'false');
        const first = syncModal.querySelector('input, button, textarea');
        if (first) first.focus();
        document.body.style.overflow = 'hidden';
      });
    }

    if (syncModal) {
      const syncClose = document.getElementById('sync-close');
      const syncCancel = document.getElementById('sync-cancel');
      if (syncClose) syncClose.addEventListener('click', () => syncModal.setAttribute('aria-hidden', 'true'));
      if (syncCancel) syncCancel.addEventListener('click', () => syncModal.setAttribute('aria-hidden', 'true'));

      // load stored token if present
      try {
        const saved = localStorage.getItem('githubToken');
        if (saved && syncTokenInput) syncTokenInput.value = saved;
      } catch (e) {
        // ignore
      }

      if (syncForm) {
        syncForm.addEventListener('submit', async (e) => {
          e.preventDefault();
          const token = syncTokenInput ? syncTokenInput.value.trim() : '';
          const remember = syncRemember ? syncRemember.checked : false;
          if (!token) {
            if (typeof window.showToast === 'function') window.showToast('Provide a GitHub token to sync');
            return;
          }

          try {
            await pushVideosToGitHub(token, { owner: 'bati58', repo: 'youtube.com-clone', path: 'data/videos.json' });
            if (remember) localStorage.setItem('githubToken', token);
            if (typeof window.showToast === 'function') window.showToast('Sync successful');
            syncModal.setAttribute('aria-hidden', 'true');
          } catch (err) {
            if (typeof window.showToast === 'function') window.showToast('Sync failed: ' + (err && err.message));
          }
        });
      }
    }

    if (createForm) {
      // thumbnail file handling
      let uploadedThumbnailData = null;
      if (thumbnailFileInput) {
        thumbnailFileInput.addEventListener('change', (e) => {
          const f = e.target.files && e.target.files[0];
          if (!f) return;
          const reader = new FileReader();
          reader.onload = () => {
            uploadedThumbnailData = reader.result;
            if (thumbnailPreview) {
              thumbnailPreview.innerHTML = `<img src="${uploadedThumbnailData}" alt="thumbnail preview" />`;
              thumbnailPreview.setAttribute('aria-hidden', 'false');
            }
          };
          reader.readAsDataURL(f);
        });
      }

      // validation helper
      const extractYouTubeIdFromHref = (url) => {
        try {
          const u = new URL(url);
          if (u.hostname.includes('youtube.com')) return u.searchParams.get('v');
          if (u.hostname === 'youtu.be') return u.pathname.replace('/', '');
          return null;
        } catch (err) {
          return null;
        }
      };

      // basic validation: title and YouTube URL
      const titleInput = document.getElementById('create-title-input');
      const hrefInput = document.getElementById('create-href-input');
      const submitBtn = document.getElementById('create-submit');

      const validateCreateForm = () => {
        const t = titleInput ? titleInput.value.trim() : '';
        const h = hrefInput ? hrefInput.value.trim() : '';
        const id = extractYouTubeIdFromHref(h);
        const valid = t.length > 0 && !!id;
        if (submitBtn) submitBtn.disabled = !valid;
        return valid;
      };

      if (titleInput) titleInput.addEventListener('input', validateCreateForm);
      if (hrefInput) hrefInput.addEventListener('input', validateCreateForm);

      createForm.addEventListener('submit', (ev) => {
        ev.preventDefault();
        const formData = new FormData(createForm);
        const title = formData.get('title')?.toString().trim();
        const href = formData.get('href')?.toString().trim();
        const thumbnail = formData.get('thumbnail')?.toString().trim();
        const author = formData.get('author')?.toString().trim() || 'Channel';
        const duration = formData.get('duration')?.toString().trim() || '';

        if (!title || !href || !extractYouTubeIdFromHref(href)) {
          if (typeof window.showToast === 'function') window.showToast('Please provide a valid YouTube URL and title');
          return;
        }

        const newId = `v${String(videos.length + 1).padStart(3, '0')}`;
        const newVideo = {
          id: newId,
          href,
          thumbnail: uploadedThumbnailData || thumbnail || 'thumbnails/thumbnail-1.webp',
          duration,
          title,
          author,
          stats: '0 views',
          channelImage: 'channel-pictures/mychannel.png'
        };

        videos.unshift(newVideo);
        render();
        closeCreateModalAndRestoreFocus();
        if (typeof window.showToast === 'function') window.showToast('Video added');
      });

      // initial validate
      validateCreateForm();
    }
  }
  const closeSidebarIfSmall = () => {
    if (isSmallScreen()) {
      document.body.classList.remove('sidebar-open');
      updateMenuAria();
    }
  };

  const closeNotifications = () => {
    if (!notificationsPanel || !notificationsButton) {
      return;
    }

    notificationsPanel.hidden = true;
    notificationsButton.setAttribute('aria-expanded', 'false');
  };

  const toggleNotifications = () => {
    if (!notificationsPanel || !notificationsButton) {
      return;
    }

    const isHidden = notificationsPanel.hidden;
    notificationsPanel.hidden = !isHidden;
    notificationsButton.setAttribute('aria-expanded', String(isHidden));
  };

  const initNavigation = () => {
    if (!navLinks.length) {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const initialQuery = params.get('q');
    if (searchInput && initialQuery) {
      searchInput.value = initialQuery;
    }

    const hashSection = window.location.hash.replace('#', '');
    const hashLink = navLinks.find((link) => link.dataset.section === hashSection);
    setActiveSection(hashLink ? hashLink.dataset.section : 'home');
  };

  if (searchForm) {
    searchForm.addEventListener('submit', (event) => {
      event.preventDefault();
      render();
    });
  }

  if (searchInput) {
    searchInput.addEventListener('input', render);
  }

  navLinks.forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      const section = link.dataset.section || 'home';
      setActiveSection(section);
      window.history.replaceState(null, '', `#${section}`);
      closeSidebarIfSmall();
      render();
    });
  });

  if (menuButton) {
    menuButton.addEventListener('click', toggleSidebar);
  }

  if (notificationsButton) {
    notificationsButton.addEventListener('click', toggleNotifications);
  }

  if (notificationsClose) {
    notificationsClose.addEventListener('click', closeNotifications);
  }

  document.addEventListener('click', (event) => {
    if (!notificationsPanel || !notificationsButton || notificationsPanel.hidden) {
      return;
    }

    const target = event.target;
    if (notificationsPanel.contains(target) || notificationsButton.contains(target)) {
      return;
    }

    closeNotifications();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeNotifications();
      closeSidebarIfSmall();
    }
  });

  document.addEventListener('click', (event) => {
    if (!isSmallScreen() || !document.body.classList.contains('sidebar-open')) {
      return;
    }

    const sidebar = document.getElementById('sidebar');
    if (!sidebar || !menuButton) {
      return;
    }

    if (sidebar.contains(event.target) || menuButton.contains(event.target)) {
      return;
    }

    closeSidebarIfSmall();
  });

  if (voiceButton) {
    voiceButton.addEventListener('click', () => {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

      if (!SpeechRecognition) {
        showToast('Voice search is not supported in this browser.');
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
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
        showToast('Voice search failed. Try again.');
      };

      recognition.start();
    });
  }

  const handleResize = () => {
    if (isSmallScreen()) {
      document.body.classList.remove('sidebar-collapsed');
    } else {
      document.body.classList.remove('sidebar-open');
    }

    updateMenuAria();
  };
  // GitHub sync helper
  async function pushVideosToGitHub(token, { owner, repo, path }) {
    if (!token) throw new Error('No token');
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
    const content = JSON.stringify(videos, null, 2);

    const headers = {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github+json'
    };

    // Check if file exists to get current sha
    const getResp = await fetch(url, { method: 'GET', headers });
    let sha = undefined;
    if (getResp.status === 200) {
      const j = await getResp.json();
      sha = j.sha;
    }

    const body = {
      message: 'sync: update videos.json',
      content: btoa(unescape(encodeURIComponent(content)))
    };
    if (sha) body.sha = sha;

    const putResp = await fetch(url, { method: 'PUT', headers: Object.assign({ 'Content-Type': 'application/json' }, headers), body: JSON.stringify(body) });
    if (putResp.status !== 201 && putResp.status !== 200) {
      const text = await putResp.text();
      throw new Error(`GitHub API error ${putResp.status}: ${text}`);
    }

    return true;
  }

  // expose helper for tests / advanced usage
  if (typeof window !== 'undefined') {
    window.pushVideosToGitHub = pushVideosToGitHub;
  }
  window.addEventListener('resize', handleResize);

  initNavigation();
  handleResize();
  render();
})();
