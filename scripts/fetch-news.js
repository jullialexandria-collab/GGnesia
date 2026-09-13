const fs = require("fs");
const Parser = require("rss-parser");

const parser = new Parser({
    timeout: 30000,
    headers: {
        "User-Agent": "Mozilla/5.0 GGNesia-NewsBot/1.0"
    }
});

const feeds = [
    {
        name: "GameSpot",
        url: "https://www.gamespot.com/feeds/game-news/",
        category: "Game News"
    },
    {
        name: "GamingOnLinux",
        url: "https://www.gamingonlinux.com/article_rss.php?newsonly",
        category: "PC Gaming"
    }
];
function detectCategory(title, description, source) {
    const text = `${title} ${description} ${source}`.toLowerCase();

    const esportsKeywords = [
        "esports",
        "e-sports",
        "turnamen",
        "tournament",
        "mpl",
        "m-series",
        "pmgc",
        "pmgo",
        "pmpl",
        "ffws",
        "vct",
        "valorant champions",
        "world championship",
        "grand final",
        "playoffs",
        "pro player",
        "roster"
    ];

    const mobileKeywords = [
        "mobile",
        "android",
        "ios",
        "iphone",
        "ipad",
        "mobile legends",
        "mlbb",
        "pubg mobile",
        "free fire",
        "genshin impact",
        "honor of kings",
        "honkai",
        "wuthering waves"
    ];

    const consoleKeywords = [
        "ps5",
        "ps4",
        "playstation",
        "xbox",
        "xbox series",
        "nintendo switch",
        "switch 2"
    ];

    if (esportsKeywords.some(word => text.includes(word))) {
        return "Esports";
    }

    if (mobileKeywords.some(word => text.includes(word))) {
        return "Mobile";
    }

    if (consoleKeywords.some(word => text.includes(word))) {
        return "Console";
    }

    return "PC";
}

async function getFeed(feed) {

    console.log(`\nMengambil RSS: ${feed.name}`);
    console.log(`URL: ${feed.url}`);

    try {

        const result = await parser.parseURL(feed.url);

        console.log(
            `${feed.name}: ${result.items.length} artikel ditemukan`
        );
const filteredItems = result.items.filter(item => {

    const text = (
        (item.title || "") + " " +
        (item.contentSnippet || "") + " " +
        (item.summary || "")
    ).toLowerCase();

    const blockedWords = [
        "kde plasma",
        "linux mint",
        "xapp",
        "desktop linux",
        "linux desktop",
        "gnome",
        "ubuntu desktop"
    ];

    return !blockedWords.some(word =>
        text.includes(word)
    );
});

return filteredItems.map(item => {
        
            let description =
                item.contentSnippet ||
                item.content ||
                item.summary ||
                "";

            description = cleanText(description);

            return {
                title: cleanText(item.title || "Berita Game"),
                category: detectCategory(item.title || "", description, feed.name),
                date:
                    item.isoDate ||
                    item.pubDate ||
                    new Date().toISOString(),
                description: description.substring(0, 180),
                image: getImage(item),
                source: feed.name,
                url: item.link || "#"
            };

        });

    } catch (error) {

        console.error(
            `GAGAL mengambil ${feed.name}: ${error.message}`
        );

        return [];
    }
}


function cleanText(text) {

    return String(text)
        .replace(/<[^>]*>/g, "")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\s+/g, " ")
        .trim();
}


function getImage(item) {

    if (item.enclosure && item.enclosure.url) {
        return item.enclosure.url;
    }

    const mediaContent = item["media:content"];

    if (mediaContent) {

        const media = Array.isArray(mediaContent)
            ? mediaContent[0]
            : mediaContent;

        if (media) {
            return media.$?.url || media.url || "";
        }
    }

    const thumbnail = item["media:thumbnail"];

    if (thumbnail) {

        const thumb = Array.isArray(thumbnail)
            ? thumbnail[0]
            : thumbnail;

        if (thumb) {
            return thumb.$?.url || thumb.url || "";
        }
    }

    const content =
        item.content ||
        item["content:encoded"] ||
        item.summary ||
        "";

    const match = content.match(
        /<img[^>]+src=["']([^"']+)["']/i
    );

    if (match && match[1]) {
        return match[1];
    }

    return "./images/ggnesia-placeholder.svg";
}


async function getPageImage(url) {

    if (!url || url === "#") {
        return "";
    }

    try {

        const controller = new AbortController();

        const timeout = setTimeout(() => {
            controller.abort();
        }, 10000);

        const response = await fetch(url, {
            headers: {
                "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
                "Accept":
                    "text/html,application/xhtml+xml"
            },
            signal: controller.signal
        });

        clearTimeout(timeout);

        if (!response.ok) {
            console.log(
                `Halaman artikel gagal: ${response.status}`
            );
            return "";
        }

        const html = await response.text();

        // Open Graph image
        let match = html.match(
            /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i
        );

        if (!match) {
            match = html.match(
                /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i
            );
        }

        if (match && match[1]) {
            return new URL(match[1], url).href;
        }

        // Twitter image
        match = html.match(
            /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i
        );

        if (!match) {
            match = html.match(
                /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i
            );
        }

        if (match && match[1]) {
            return new URL(match[1], url).href;
        }

        return "";

    } catch (error) {

        console.log(
            `Tidak bisa mengambil gambar: ${error.message}`
        );

        return "";
    }
}


async function addMissingImages(articles) {

    console.log("\nMencari gambar artikel...");

    // Maksimal 4 artikel diproses bersamaan
    const batchSize = 4;

    for (let i = 0; i < articles.length; i += batchSize) {

        const batch = articles.slice(i, i + batchSize);

        await Promise.all(
            batch.map(async article => {

                if (article.image) {
                    return;
                }

                console.log(
                    `Mencari gambar: ${article.title.substring(0, 60)}...`
                );

                const image = await getPageImage(article.url);

                if (image) {
                    article.image = image;
                    console.log("Gambar ditemukan.");
                } else {
                    console.log("Gambar tidak ditemukan.");
                }

            })
        );
    }

    return articles;
}


async function main() {

    let allArticles = [];

    for (const feed of feeds) {

        const articles = await getFeed(feed);

        allArticles = allArticles.concat(articles);
    }

    console.log(
        `\nTotal artikel sebelum filter: ${allArticles.length}`
    );


    // Hapus artikel tanpa URL dan duplikat
    const uniqueArticles = [];
    const usedUrls = new Set();

    for (const article of allArticles) {

        if (
            !article.url ||
            article.url === "#" ||
            usedUrls.has(article.url)
        ) {
            continue;
        }

        usedUrls.add(article.url);
        uniqueArticles.push(article);
    }


    // Urutkan dari yang terbaru
    uniqueArticles.sort((a, b) => {

        return new Date(b.date) - new Date(a.date);

    });


    // Ambil 30 berita terbaru
    let latestArticles = uniqueArticles.slice(0, 30);


    // Cari gambar yang belum tersedia
    latestArticles = await addMissingImages(latestArticles);


    // Simpan ke JSON
    fs.writeFileSync(
        "data/articles.json",
        JSON.stringify(latestArticles, null, 2),
        "utf8"
    );


    const imagesFound = latestArticles.filter(
        article => article.image
    ).length;


    console.log(
        `\nTotal berita disimpan: ${latestArticles.length}`
    );

    console.log(
        `Total gambar ditemukan: ${imagesFound}`
    );

    console.log("Selesai.");
}


main(); 
