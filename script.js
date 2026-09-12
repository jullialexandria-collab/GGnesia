const menuBtn = document.getElementById("menuBtn");
const nav = document.querySelector(".nav");

menuBtn.addEventListener("click", () => {
    nav.classList.toggle("active");
});

async function loadArticles() {
    try {
        const response = await fetch("data/articles.json");

        if (!response.ok) {
            throw new Error("Gagal mengambil data berita");
        }

        const articles = await response.json();
        const newsGrid = document.getElementById("newsGrid");

        newsGrid.innerHTML = articles.map(article => `
            <article class="news-card">

                <div class="news-image">
                    <span>${article.category}</span>
                </div>

                <div class="news-content">

                    <small>${article.date}</small>

                    <h3>${article.title}</h3>

                    <p>${article.description}</p>

                    <a href="${article.url}">
                        Baca selengkapnya →
                    </a>

                </div>

            </article>
        `).join("");

    } catch (error) {
        console.error("Terjadi kesalahan:", error);
    }
}

loadArticles();
