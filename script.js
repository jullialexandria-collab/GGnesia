document.addEventListener("DOMContentLoaded", () => {

    const menuBtn = document.getElementById("menuBtn");
    const nav = document.querySelector(".nav");

    if (menuBtn && nav) {
        menuBtn.addEventListener("click", () => {
            nav.classList.toggle("active");
        });
    }
const categoryButtons = document.querySelectorAll("[data-category]");

categoryButtons.forEach(button => {
    button.addEventListener("click", (event) => {
        event.preventDefault();

        const category = button.dataset.category;

        document.querySelectorAll("[data-category]").forEach(btn => {
            btn.classList.remove("active");
        });

        button.classList.add("active");

        loadArticles(category);
    });
});
    loadArticles();
});


async function loadArticles(category = "all") {


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


const filteredArticles = category === "all"
    ? articles
    : articles.filter(article => article.category === category);


        newsGrid.innerHTML = filteredArticles.map(article => {

            const image = article.image && !article.image.includes("ggnesia-placeholder")
    ? `<img src="${article.image}" alt="${article.title}">`
    : `<div class="news-image-placeholder">
           <span>${article.category}</span>
       </div>`;

            const date = new Date(article.date).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "long",
                year: "numeric"
            });

            return `
                <article class="news-card">

                    <div class="news-image">
                        ${image}
                        
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
