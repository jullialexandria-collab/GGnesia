document.addEventListener("DOMContentLoaded", () => {

    const menuBtn = document.getElementById("menuBtn");
    const nav = document.querySelector(".nav");

    if (menuBtn && nav) {
        menuBtn.addEventListener("click", () => {
            nav.classList.toggle("active");
        });
    }

    loadArticles();
});


async function loadArticles() {

    const newsGrid = document.getElementById("newsGrid");

    if (!newsGrid) {
        console.error("newsGrid tidak ditemukan!");
        return;
    }

    try {

        const response = await fetch("./data/articles.json");

        if (!response.ok) {
            throw new Error("Gagal mengambil articles.json");
        }

        const articles = await response.json();

        newsGrid.innerHTML = articles.map(article => {

            const image = article.image
    ? `<img src="${article.image}" alt="${article.title}">`
    : `<div class="news-image-placeholder"></div>`;

            const date = new Date(article.date).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "long",
                year: "numeric"
            });

            return `
                <article class="news-card">

                    <div class="news-image">
                        ${image}
                        <span class="category-badge">
                            ${article.category}
                        </span>
                    </div>

                    <div class="news-content">

                        <small>
                            ${date} • ${article.source}
                        </small>

                        <h3>${article.title}</h3>

                        <p>${article.description}</p>

                        <a href="${article.url}" target="_blank">
                            Baca selengkapnya →
                        </a>

                    </div>

                </article>
            `;

        }).join("");

    } catch (error) {

        console.error("Gagal memuat berita:", error);

        newsGrid.innerHTML = `
            <p>Berita gagal dimuat.</p>
        `;
    }
}
