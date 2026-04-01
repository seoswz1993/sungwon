const tripPanels = document.querySelectorAll(".trip-panel");
const tripLinks = document.querySelectorAll(".trip-link");

const setActiveLink = (id) => {
    tripLinks.forEach((link) => {
        const matches = link.dataset.target === id;
        link.classList.toggle("is-active", matches);
        link.setAttribute("aria-current", matches ? "true" : "false");
    });
};

const observer = new IntersectionObserver(
    (entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                setActiveLink(entry.target.id);
            }
        });
    },
    {
        threshold: 0.55,
        rootMargin: "-10% 0px -10% 0px"
    }
);

tripPanels.forEach((panel) => observer.observe(panel));

tripLinks.forEach((link) => {
    link.addEventListener("click", () => {
        setActiveLink(link.dataset.target);
    });
});
