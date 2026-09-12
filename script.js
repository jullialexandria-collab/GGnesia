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

        console.log("Berita berhasil dimuat:", articles);

    } catch (error) {
        console.error("Terjadi kesalahan:", error);
    }
}

loadArticles();
