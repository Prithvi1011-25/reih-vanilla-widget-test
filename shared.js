/** Shared listing + widget helpers for both vanilla integrations. */

export var WIDGET_PUBLIC_KEY = "public_key";
export var REIH_LOADER_ID = "reih-host-loader";

export var WIDGET_DEV_API_BASE_URL =
  "https://oetb78o6i5.execute-api.us-west-2.amazonaws.com/dev";

var PROPERTY_4_IMAGES = "/images/property-4";

export var LISTING_MEDIA = [
  {
    image_url: PROPERTY_4_IMAGES + "/08_living_room_furnished.png",
    label: "Furnished living room",
  },
  {
    image_url: PROPERTY_4_IMAGES + "/07_entry_hallway.png",
    label: "Entry hallway",
  },
  {
    image_url: PROPERTY_4_IMAGES + "/09_living_room_angle2.png",
    label: "Living room, alternate angle",
  },
  {
    image_url: PROPERTY_4_IMAGES + "/living_room_angle3.png",
    label: "Living room view",
  },
  {
    image_url: PROPERTY_4_IMAGES + "/living_room_angle4.png",
    label: "Living room seating area",
  },
  {
    image_url: PROPERTY_4_IMAGES + "/10_kitchen_furnished.png",
    label: "Furnished kitchen",
  },
  {
    image_url: PROPERTY_4_IMAGES + "/11_kitchen_dining_angle.png",
    label: "Kitchen and dining area",
  },
  {
    image_url: PROPERTY_4_IMAGES + "/14_master_bedroom_furnished.png",
    label: "Master bedroom",
  },
  {
    image_url: PROPERTY_4_IMAGES + "/15_bedroom2_empty.png",
    label: "Second bedroom",
  },
  {
    image_url: PROPERTY_4_IMAGES + "/16_kids_room_furnished.png",
    label: "Kids room",
  },
  {
    image_url: PROPERTY_4_IMAGES + "/16_kids_room_angle2.png",
    label: "Kids room, alternate angle",
  },
  {
    image_url: PROPERTY_4_IMAGES + "/17_study_empty.png",
    label: "Study",
  },
  {
    image_url: PROPERTY_4_IMAGES + "/13_staircase_landing.png",
    label: "Staircase landing",
  },
  {
    image_url: PROPERTY_4_IMAGES + "/18_bathroom1_empty.png",
    label: "Primary bathroom",
  },
  {
    image_url: PROPERTY_4_IMAGES + "/19_bathroom2_empty.png",
    label: "Second bathroom",
  },
  {
    image_url: PROPERTY_4_IMAGES + "/20_laundry_utility.png",
    label: "Laundry and utility room",
  },
  {
    image_url: PROPERTY_4_IMAGES + "/21_balcony_terrace.png",
    label: "Balcony terrace",
  },
  { image_url: "/images/invalid-format.txt", label: "Invalid format test" },
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
      mode: "agentic",
      branding: buildWidgetBranding(),
      sidebar_position: "right",
    },
    widgetCallbacks
  );
}

export function buildNpmWidgetConfigureOptions() {
  return Object.assign(
    {
      public_key: WIDGET_PUBLIC_KEY,
      media: resolveListingMedia(),
      mode: "agentic",
      branding: buildWidgetBranding(),
      sidebar_position: "right",
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
  if (media.label) return media.label;
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
      alt: heroMedia.label || "Property listing hero photo",
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
