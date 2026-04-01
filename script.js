const tripButtons = document.querySelectorAll(".container");
const panelOverlay = document.getElementById("panelOverlay");
const sidePanel = document.getElementById("sidePanel");
const panelContent = document.getElementById("panelContent");
const closePanelButton = document.getElementById("closePanelButton");
const mobileMedia = window.matchMedia("(max-width: 900px)");

const textCache = {};
let isTicking = false;

const panelData = {
    "01": { type: "message", title: "01", message: "Lost memories..." },
    "02": { type: "message", title: "02", message: "Lost memories..." },
    "03": { type: "message", title: "03", message: "Lost memories..." },
    "04": { type: "message", title: "04", message: "Lost memories..." },
    "05": { type: "message", title: "05", message: "Lost memories..." },
    "06": {
        type: "gallery",
        title: "Tokyo, Japan 2025",
        intro: "Tokyo travel notes and images, stacked in one scrolling archive.",
        textFile: "tokyo202511/tokyo_text.txt",
        imagePrefix: "tokyo202511/t",
        labelPrefix: "T"
    },
    "07": {
        type: "gallery",
        title: "Qingdao, China 2026",
        intro: "Qingdao travel notes and images, gathered into one vertical story.",
        textFile: "qingdao202603/qingdao_text.txt",
        imagePrefix: "qingdao202603/q",
        labelPrefix: "Q"
    },
    "08": { type: "message", title: "08", message: "To be continued..." }
};

const createMessageMarkup = (title, message) => `
    <div class="message-panel">
        <h2 class="sr-only" id="panelTitle">${title}</h2>
        <p class="typing-message">${message}<span class="cursor">|</span></p>
    </div>
`;

const createGalleryMarkup = (title, intro, entries) => {
    const entriesMarkup = entries.map((entry) => `
        <article class="panel-entry">
            <img src="${entry.image}" alt="${title} ${entry.label}">
            <p class="entry-text">${entry.text}</p>
        </article>
    `).join("");

    return `
        <h2 class="panel-title" id="panelTitle">${title}</h2>
        <p class="panel-intro">${intro}</p>
        <div class="panel-grid">
            ${entriesMarkup}
        </div>
    `;
};

const createFallbackEntries = (labelPrefix, imagePrefix, count = 6) => (
    Array.from({ length: count }, (_, index) => ({
        label: `${labelPrefix}${index + 1}`,
        text: "Archive note unavailable.",
        image: `${imagePrefix}${index + 1}.jpg`
    }))
);

const parseTextEntries = (rawText, labelPrefix, imagePrefix) => {
    const lines = rawText
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);

    const entries = [];

    for (let index = 0; index < lines.length; index += 2) {
        const label = lines[index];
        const text = lines[index + 1];

        if (!label || !text) {
            continue;
        }

        const number = label.replace(labelPrefix, "");

        entries.push({
            label,
            text,
            image: `${imagePrefix}${number}.jpg`
        });
    }

    return entries;
};

const loadTextEntries = async ({ textFile, labelPrefix, imagePrefix }) => {
    const cacheKey = `${textFile}:${labelPrefix}:${imagePrefix}`;

    if (textCache[cacheKey]) {
        return textCache[cacheKey];
    }

    try {
        const response = await fetch(textFile);

        if (!response.ok) {
            throw new Error(`Failed to load ${textFile}`);
        }

        const buffer = await response.arrayBuffer();
        const rawText = new TextDecoder("utf-8").decode(buffer);
        const entries = parseTextEntries(rawText, labelPrefix, imagePrefix);

        textCache[cacheKey] = entries.length
            ? entries
            : createFallbackEntries(labelPrefix, imagePrefix);

        return textCache[cacheKey];
    } catch (error) {
        const fallback = createFallbackEntries(labelPrefix, imagePrefix);
        textCache[cacheKey] = fallback;
        return fallback;
    }
};

const openPanel = async (tripId) => {
    const trip = panelData[tripId];

    if (!trip) {
        return;
    }

    panelOverlay.classList.add("is-open");
    panelOverlay.setAttribute("aria-hidden", "false");
    document.body.classList.add("panel-open");
    panelContent.scrollTop = 0;

    if (trip.type === "gallery") {
        panelContent.innerHTML = `
            <h2 class="panel-title" id="panelTitle">${trip.title}</h2>
            <p class="panel-intro">Loading archive...</p>
        `;

        const entries = await loadTextEntries(trip);

        if (!panelOverlay.classList.contains("is-open")) {
            return;
        }

        panelContent.innerHTML = createGalleryMarkup(trip.title, trip.intro, entries);
        panelContent.scrollTop = 0;
        return;
    }

    panelContent.innerHTML = createMessageMarkup(trip.title, trip.message);
};

const closePanel = () => {
    panelOverlay.classList.remove("is-open");
    panelOverlay.setAttribute("aria-hidden", "true");
    document.body.classList.remove("panel-open");
};

const updateCylinderScroll = () => {
    const isMobile = mobileMedia.matches;

    tripButtons.forEach((button) => {
        if (!isMobile) {
            button.style.removeProperty("--mobile-scale");
            button.style.removeProperty("--mobile-opacity");
            button.style.removeProperty("--mobile-z");
            return;
        }

        const rect = button.getBoundingClientRect();
        const itemCenter = rect.top + rect.height / 2;
        const viewportCenter = window.innerHeight / 2;
        const distance = Math.abs(viewportCenter - itemCenter);
        const normalized = Math.min(distance / (window.innerHeight * 0.48), 1);
        const scale = 0.78 + (1 - normalized) * 0.22;
        const opacity = 0.28 + (1 - normalized) * 0.72;
        const zIndex = Math.round((1 - normalized) * 100);

        button.style.setProperty("--mobile-scale", scale.toFixed(3));
        button.style.setProperty("--mobile-opacity", opacity.toFixed(3));
        button.style.setProperty("--mobile-z", String(zIndex));
    });
};

const handleMobileScroll = () => {
    if (isTicking) {
        return;
    }

    isTicking = true;

    window.requestAnimationFrame(() => {
        updateCylinderScroll();
        isTicking = false;
    });
};

tripButtons.forEach((button) => {
    button.addEventListener("click", () => {
        openPanel(button.dataset.trip);
    });
});

closePanelButton.addEventListener("click", closePanel);

panelOverlay.addEventListener("click", (event) => {
    if (!sidePanel.contains(event.target)) {
        closePanel();
    }
});

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && panelOverlay.classList.contains("is-open")) {
        closePanel();
    }
});

window.addEventListener("scroll", handleMobileScroll, { passive: true });
window.addEventListener("resize", handleMobileScroll);
mobileMedia.addEventListener("change", handleMobileScroll);

updateCylinderScroll();
