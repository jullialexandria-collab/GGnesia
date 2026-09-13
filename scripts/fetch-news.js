const fs = require("fs");
const Parser = require("rss-parser");

const parser = new Parser({
    timeout: 15000,
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

async function getFeed(feed) {

    console.log(`\nMengambil RSS: ${feed.name}`);
    console.log(`URL: ${feed.url}`);

    try {

        const result = await parser.parseURL(feed.url);

        console.log(
            `${feed.name}: ${result.items.length} artikel ditemukan`
        );

        return result.items.map(item => {

            let description =
                item.contentSnippet ||
                item.content ||
                item.summary ||
                "";

            description = cleanText(description);

            return {
                title: cleanText(item.title || "Berita Game"),
                category: feed.category,
                date: item.isoDate || item.pubDate || new Date().toISOString(),
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

    // 1. Gambar dari enclosure
    if (item.enclosure && item.enclosure.url) {
        return item.enclosure.url;
    }

    // 2. Gambar dari media:content
    const mediaContent = item["media:content"];

    if (mediaContent) {
        const media = Array.isArray(mediaContent)
            ? mediaContent[0]
            : mediaContent;

        if (media) {
            return media.$?.url || media.url || "";
        }
    }

    // 3. Gambar dari media:thumbnail
    const thumbnail = item["media:thumbnail"];

    if (thumbnail) {
        const thumb = Array.isArray(thumbnail)
            ? thumbnail[0]
            : thumbnail;

        if (thumb) {
            return thumb.$?.url || thumb.url || "";
        }
    }

    // 4. Cari gambar langsung dari isi artikel RSS
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

    return "";
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

    uniqueArticles.sort((a, b) => {
        return new Date(b.date) - new Date(a.date);
    });

    const latestArticles = uniqueArticles.slice(0, 30);

    fs.writeFileSync(
        "data/articles.json",
        JSON.stringify(latestArticles, null, 2),
        "utf8"
    );

    console.log(
        `Total berita disimpan: ${latestArticles.length}`
    );

    console.log("Selesai.");
}

main();
