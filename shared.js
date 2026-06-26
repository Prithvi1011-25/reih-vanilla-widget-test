/** Shared listing + widget helpers for both vanilla integrations. */

export var WIDGET_PUBLIC_KEY = "public_key";
export var REIH_LOADER_ID = "reih-host-loader";

export var WIDGET_DEV_API_BASE_URL =
  "https://oetb78o6i5.execute-api.us-west-2.amazonaws.com/dev";

export var LISTING_MEDIA = [
  {
    image_url:
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&h=600&fit=crop",
  },
  {
    image_url:
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop",
  },
  {
    image_url:
      "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&h=600&fit=crop",
  },
  {
    image_url:
      "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800&h=600&fit=crop",
  },
  {
    image_url:
      "https://images.unsplash.com/photo-1721244653580-79577d2822a2?q=80&w=2096&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    image_url:
      "https://images.unsplash.com/photo-1619418602850-35ad20aa1700?q=80&w=1771&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    image_url:
      "https://images.unsplash.com/photo-1721244654210-a505a99661e9?q=80&w=1704&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    image_url:
      "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&h=600&fit=crop",
  },
  {
    image_url:
      "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=1200&h=800&fit=crop",
  },
  {
    image_url:
      "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=1200&h=800&fit=crop",
  },
  { image_url: "/images/invalid-format.txt" },
  {
    image_url:
      "https://images.unsplash.com/photo-1630699144919-681cf308ae82?q=80&w=1770&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
];

export function clearReihLoader() {
  document.getElementById(REIH_LOADER_ID)?.remove();
}

export function resolveMediaUrl(url) {
  if (url.charAt(0) === "/") {
    return window.location.origin + url;
  }
  return url;
}

export function resolveListingMedia(media) {
  var source = media || LISTING_MEDIA;
  return source.map(function (item) {
    return { image_url: resolveMediaUrl(item.image_url) };
  });
}

export function buildWidgetLanguage() {
  return [
    { code: "en-US", name: "English (United States)", nativeName: "English (US)" },
    { code: "en-GB", name: "English (United Kingdom)", nativeName: "English (UK)" },
    { code: "pl-PL", name: "Polish", nativeName: "Polski" },
    { code: "es-ES", name: "Spanish", nativeName: "Español" },
  ];
}

export function buildWidgetBranding() {
  return {
    logo: "https://ecdn.styldod.com/assets/logo/6a2bca9bce2a355c2c13d058.svg",
    text_primary: "#071121FF",
    text_secondary: "#1B232E",
    primary_color: "#3ED37A",
    heading: "Reimagine Your Space",
    sub_heading: "AI-powered room redesign",
    footer_text: "",
  };
}

export function getWidgetHostCssVars() {
  var branding = buildWidgetBranding();
  return {
    "--reih-primary": branding.primary_color,
    "--reih-text-primary": branding.text_primary.replace(/ff$/i, ""),
    "--reih-text-secondary": branding.text_secondary,
  };
}

export function applyHostCssVars() {
  var shell = document.getElementById("listing-shell");
  if (!shell) return;

  var vars = getWidgetHostCssVars();
  Object.keys(vars).forEach(function (key) {
    shell.style.setProperty(key, vars[key]);
  });
}

export var widgetCallbacks = {
  onComplete: function (detail) {
    console.log("[reih] onComplete:", detail);
  },
  onError: function (err) {
    console.error("[reih] onError:", err);
  },
  onClose: function () {
    console.log("[reih] onClose: widget closed");
  },
};

export function buildScriptEmbedWidgetConfig() {
  return Object.assign(
    {
      media: resolveListingMedia(),
      mode: "simple",
      branding: buildWidgetBranding(),
      sidebar_position: "right",
      language: buildWidgetLanguage(),
    },
    widgetCallbacks
  );
}

export function buildNpmWidgetConfigureOptions() {
  return Object.assign(
    {
      public_key: WIDGET_PUBLIC_KEY,
      media: resolveListingMedia(),
      mode: "simple",
      branding: buildWidgetBranding(),
      sidebar_position: "right",
      language: buildWidgetLanguage(),
    },
    widgetCallbacks
  );
}

export function openReihWithMedia(widget, media) {
  clearReihLoader();
  return widget.open({
    media: media.map(function (item) {
      return { image_url: resolveMediaUrl(item.image_url) };
    }),
    mode: "simple",
    branding: buildWidgetBranding(),
    sidebar_position: "right",
    language: buildWidgetLanguage(),
  });
}

export function createWidgetOpener(getWidget, logPrefix) {
  var opening = false;

  return function openWidget(media) {
    if (opening) return;

    opening = true;

    Promise.resolve()
      .then(function () {
        return getWidget();
      })
      .then(function (widget) {
        return openReihWithMedia(widget, media);
      })
      .catch(function (error) {
        clearReihLoader();
        console.error(logPrefix + " Widget open failed:", error);
      })
      .finally(function () {
        opening = false;
      });
  };
}

export function getGalleryAlt(media, index) {
  if (media.image_url.indexOf("photo-1545324418") !== -1) {
    return "Exterior view of a multi-story apartment building";
  }
  if (media.image_url.indexOf("photo-1600047509807") !== -1) {
    return "Master bedroom with natural light";
  }
  if (media.image_url.indexOf("photo-1600607687920") !== -1) {
    return "Open-plan living and dining area";
  }
  if (media.image_url.indexOf("invalid-format") !== -1) {
    return "Invalid format test (text file, not an image)";
  }
  return "Listing photo " + (index + 2);
}

export function bindHostPageButton() {
  var hostBtn = document.getElementById("host-btn");
  if (!hostBtn) return;

  hostBtn.addEventListener("click", function () {
    var status = document.getElementById("host-status");
    if (status) {
      status.textContent =
        "Host page button works — existing JavaScript is unaffected.";
    }
    console.log("Test Host Page Button clicked");
  });
}

export function initListingPage(options) {
  var openWidget = options.openWidget;
  var logPrefix = options.logPrefix;

  function createMediaFrame(media, frameOptions) {
    var frame = document.createElement("div");
    frame.className = "media-frame";

    var img = document.createElement("img");
    img.src = media.image_url;
    img.alt = frameOptions.alt;
    if (frameOptions.imageClass) {
      img.className = frameOptions.imageClass;
    }

    var button = document.createElement("button");
    button.type = "button";
    button.className = "media-frame__fab";
    button.setAttribute("aria-label", "Reimagine " + frameOptions.label);
    button.textContent = "Reimagine";
    button.addEventListener("click", function () {
      if (typeof frameOptions.onOpen === "function") {
        frameOptions.onOpen(media);
        return;
      }
      console.log(logPrefix + " Floating button clicked:", media.image_url);
      openWidget([media]);
    });

    frame.appendChild(img);
    frame.appendChild(button);
    return frame;
  }

  var heroSection = document.getElementById("hero");
  var galleryGrid = document.getElementById("gallery-grid");
  var galleryHeading = document.getElementById("gallery-heading");

  if (!heroSection || !galleryGrid || LISTING_MEDIA.length === 0) {
    return;
  }

  var heroMedia = LISTING_MEDIA[0];
  var galleryMedia = LISTING_MEDIA.slice(1);

  heroSection.appendChild(
    createMediaFrame(heroMedia, {
      alt: "Modern home exterior with landscaped front yard",
      imageClass: "hero__image",
      label: "hero photo",
      onOpen: function () {
        console.log(logPrefix + " Open button clicked (all listing media)");
        openWidget(resolveListingMedia());
      },
    })
  );

  if (galleryHeading) {
    galleryHeading.textContent =
      "Photo Gallery (" + LISTING_MEDIA.length + " photos)";
  }

  galleryMedia.forEach(function (media, index) {
    galleryGrid.appendChild(
      createMediaFrame(media, {
        alt: getGalleryAlt(media, index),
        label: "gallery photo " + (index + 1),
      })
    );
  });

  var openBtn = document.getElementById("open-btn");
  if (openBtn) {
    openBtn.addEventListener("click", function () {
      console.log(logPrefix + " Open button clicked (all listing media)");
      openWidget(resolveListingMedia());
    });
  }

  bindHostPageButton();
}
