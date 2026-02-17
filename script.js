/* LIGHTBOX */
const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightbox-img");
document.querySelectorAll(".card img").forEach(img => {
    img.addEventListener("click", () => {
        lightbox.classList.add("active");
        lightboxImg.src = img.src;
    });
});
lightbox.addEventListener("click", () => {
    lightbox.classList.remove("active");
});

/* SEASONAL EFFECT */
function createParticles(type, count) {
    const container = document.getElementById("season-container");
    for (let i = 0; i < count; i++) {
        const p = document.createElement("div");
        p.classList.add("particle", type);
        const size = Math.random() * 6 + 4;
        p.style.width = size + "px";
        p.style.height = size + "px";
        p.style.left = Math.random() * 100 + "vw";
        p.style.animationDuration = (Math.random() * 5 + 5) + "s";
        p.style.animationDelay = Math.random() * 5 + "s";
        container.appendChild(p);
    }
}

const month = new Date().getMonth() + 1;
if (month === 12) { createParticles("snow", 80); }
else if (month === 1 || month === 2) { createParticles("snow", 60); }
else if (month >= 3 && month <= 5) { createParticles("petal", 40); }
else if (month >= 6 && month <= 8) { createParticles("sun", 30); }
else { createParticles("leaf", 50); }
