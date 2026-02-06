(function () {
  function parseQuery() {
    const params = new URLSearchParams(window.location.search);
    return params.get("id");
  }

  function extractYouTubeId(url) {
    try {
      const u = new URL(url);
      return u.searchParams.get("v");
    } catch (e) {
      return null;
    }
  }

  const videoId = parseQuery();
  const videos = window.videos || [];
  const video = videos.find((v) => v.id === videoId);

  const playerEl = document.getElementById("video-player");
  const titleEl = document.getElementById("video-title");
  const channelImageEl = document.getElementById("channel-image");
  const channelNameEl = document.getElementById("channel-name");
  const descriptionEl = document.getElementById("description");
  const suggestedList = document.getElementById("suggested-list");
  const subscribeButton = document.getElementById("subscribe-button");
  const likeButton = document.getElementById("like-button");
  const saveButton = document.getElementById("save-button");

  if (!video) {
    titleEl.textContent = "Video not found";
    return;
  }

  // inject iframe using YouTube embed id (if available) otherwise use href
  const ytId = extractYouTubeId(video.href);
  const src = ytId ? `https://www.youtube.com/embed/${ytId}` : video.href;
  playerEl.innerHTML = `<iframe src="${src}" title="${video.title}" allowfullscreen loading="lazy" frameborder="0"></iframe>`;

  titleEl.textContent = video.title;
  channelImageEl.src = video.channelImage;
  channelImageEl.alt = `Channel picture for ${video.author}`;
  channelNameEl.textContent = video.author;
  descriptionEl.innerHTML = `<p>${video.title}</p><p class="video-stats">${video.stats}</p>`;

  // metadata for SEO / social
  document.title = `${video.title} — YouTube Clone`;
  const ld = {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: video.title,
    description: video.title,
    thumbnailUrl: video.thumbnail,
    uploadDate: video.uploadDate || null,
    duration: video.duration ? `PT${video.duration}` : null,
    contentUrl: video.href
  };
  const ldNode = document.getElementById("ld-json");
  if (ldNode) {
    ldNode.textContent = JSON.stringify(ld);
  }

  // suggested videos
  const suggestions = videos.filter((v) => v.id !== video.id).slice(0, 8);
  suggestedList.innerHTML = suggestions
    .map((s) => {
      return `
        <a class="video-link" href="watch.html?id=${encodeURIComponent(s.id)}">
          <div class="video-preview">
            <img class="thumbnail" src="${s.thumbnail}" alt="${s.thumbnailAlt || s.title}" loading="lazy" />
            <div>
              <div class="video-title">${s.title}</div>
              <div class="video-author">${s.author}</div>
              <div class="video-stats">${s.stats}</div>
            </div>
          </div>
        </a>
      `;
    })
    .join("");

  // comments stored in localStorage
  const commentsKey = `comments:${video.id}`;
  const commentsList = document.getElementById("comments-list");
  const commentForm = document.getElementById("comment-form");
  const commentInput = document.getElementById("comment-input");

  function loadComments() {
    const raw = localStorage.getItem(commentsKey);
    return raw ? JSON.parse(raw) : [];
  }

  function saveComments(list) {
    localStorage.setItem(commentsKey, JSON.stringify(list));
  }

  function renderComments() {
    const list = loadComments();
    commentsList.innerHTML = list
      .map((c) => `<li><strong>${c.author}</strong><div>${c.text}</div></li>`)
      .join("");
  }

  commentForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const txt = commentInput.value.trim();
    if (!txt) return;
    const list = loadComments();
    list.unshift({ author: "You", text: txt, date: Date.now() });
    saveComments(list);
    renderComments();
    commentInput.value = "";
    showToast && showToast("Comment posted");
  });

  renderComments();

  // subscribe/like/save mock state
  const subKey = `subscribed:${video.author}`;
  const likeKey = `liked:${video.id}`;
  const savedKey = `saved:${video.id}`;

  function updateSubscribeUI() {
    const sub = localStorage.getItem(subKey) === "1";
    subscribeButton.textContent = sub ? "Subscribed" : "Subscribe";
    subscribeButton.setAttribute("aria-pressed", String(sub));
  }

  function updateLikeUI() {
    const liked = localStorage.getItem(likeKey) === "1";
    likeButton.setAttribute("aria-pressed", String(liked));
    likeButton.textContent = liked ? "👍 Liked" : "👍 Like";
  }

  function updateSaveUI() {
    const saved = localStorage.getItem(savedKey) === "1";
    saveButton.setAttribute("aria-pressed", String(saved));
    saveButton.textContent = saved ? "💾 Saved" : "💾 Save";
  }

  subscribeButton.addEventListener("click", () => {
    const cur = localStorage.getItem(subKey) === "1";
    localStorage.setItem(subKey, cur ? "0" : "1");
    updateSubscribeUI();
    showToast && showToast(cur ? "Unsubscribed" : "Subscribed");
  });

  likeButton.addEventListener("click", () => {
    const cur = localStorage.getItem(likeKey) === "1";
    localStorage.setItem(likeKey, cur ? "0" : "1");
    updateLikeUI();
    showToast && showToast(cur ? "Unliked" : "Liked");
  });

  saveButton.addEventListener("click", () => {
    const cur = localStorage.getItem(savedKey) === "1";
    localStorage.setItem(savedKey, cur ? "0" : "1");
    updateSaveUI();
    showToast && showToast(cur ? "Removed from saved" : "Saved to Watch Later");
  });

  updateSubscribeUI();
  updateLikeUI();
  updateSaveUI();
})();