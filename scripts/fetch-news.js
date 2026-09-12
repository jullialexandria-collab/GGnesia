const fs = require("fs");
const Parser = require("rss-parser");

const parser = new Parser({
    timeout: 15000
});

const feeds = [
    {
        name: "Babel Insight",
        url: "https://www.babelinsight.id/rss/game.xml",
        category: "Game News"
    },
    {
        name: "GRYOnline",
        url: "https://www.gry-online.pl/rss/news.xml",
        category: "Game News"
    }
];

async function getFeed(feed) {

    try {

        console.log(`Mengambil: ${feed.name}`);

        const result = await parser.parseURL(feed.url);

        return result.items.map(item => ({

            title: item.title || "Berita Game",

            category: feed.category,

            date: item.isoDate || item.pubDate || new Date().toISOString(),

            description: cleanDescription(
                item.contentSnippet ||
                item.content ||
                item.summary ||
                ""
            ),

            image: getImage(item),

            source: feed.name,

            url: item.link || "#"

        }));

    } catch (error) {

        console.error(`Gagal mengambil ${feed.name}:`, error.message);

        return [];
    }
}


function cleanDescription(text) {

    return text
        .replace(/<[^>]*>/g, "")
        .replace(/\s+/g, " ")
        .trim()
        .substring(0, 180);
}


function getImage(item) {

    if (item.enclosure && item.enclosure.url) {
        return item.enclosure.url;
    }

    if (item.media && item.media.content) {
        return item.media.content.url || "";
    }

    return "";
}


async function main() {

    let allArticles = [];

    for (const feed of feeds) {

        const articles = await getFeed(feed);

        allArticles = allArticles.concat(articles);
    }


    const uniqueArticles = [];

    const usedUrls = new Set();

    for (const article of allArticles) {

        if (!article.url || usedUrls.has(article.url)) {
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
        `Berhasil menyimpan ${latestArticles.length} berita.`
    );
}


main();
