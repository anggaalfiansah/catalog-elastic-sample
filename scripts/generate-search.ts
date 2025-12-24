import { esClient } from "../catalog-server/config/elastic";

const ES_LOGS = "search_logs";

const keywords = [
  "Joran Shimano", "Reel Daiwa", "Umpan Gabus", "Senar PE", 
  "Kail Carbon", "Relix Nusantara", "Soft Frog", "Metal Jig", 
  "Casting", "Ultralight", "Hook", "Lure", "Pancing Kolam"
];

const typos: Record<string, string[]> = {
  "shimano": ["shimno", "shiman", "simano"],
  "daiwa": ["dawa", "daiia", "daiwas"],
  "joran": ["jorn", "jron"],
  "reel": ["rel", "reell"]
};

async function generateVariedSearch(count: number) {
  console.log(`🚀 Memulai generate ${count} data pencarian bervariasi...`);

  for (let i = 0; i < count; i++) {
    let keyword = keywords[Math.floor(Math.random() * keywords.length)].toLowerCase();
    
    // 1. Simulasi Typo (peluang 15%)
    const shouldTypo = Math.random() < 0.15;
    if (shouldTypo) {
      const baseWord = Object.keys(typos).find(k => keyword.includes(k));
      if (baseWord) {
        const typoList = typos[baseWord];
        keyword = keyword.replace(baseWord, typoList[Math.floor(Math.random() * typoList.length)]);
      }
    }

    // 2. Simulasi Zero Results (pencarian aneh/tidak relevan)
    const isWeirdSearch = Math.random() < 0.1;
    let resultCount = Math.floor(Math.random() * 50);
    
    if (isWeirdSearch) {
      const weirdWords = ["mancing keributan", "umpan naga", "joran beton", "kail plastik"];
      keyword = weirdWords[Math.floor(Math.random() * weirdWords.length)];
      resultCount = 0;
    }

    // 3. Distribusi Waktu Lebih Realistis
    const date = new Date();
    // Mundur maksimal 14 hari
    date.setDate(date.getDate() - Math.floor(Math.random() * 14));
    // Set jam acak (simulasi lebih ramai di jam istirahat/malam)
    const hours = [8, 12, 13, 19, 20, 21, 22, 23];
    date.setHours(hours[Math.floor(Math.random() * hours.length)], Math.floor(Math.random() * 59));

    try {
      await esClient.index({
        index: ES_LOGS,
        document: {
          keyword: keyword,
          resultCount: resultCount,
          timestamp: date,
          isTypo: shouldTypo,
          isZeroResult: resultCount === 0
        },
      });
      
      if (i % 20 === 0) console.log(`✅ ${i} data bervariasi terkirim...`);
    } catch (e) {
      console.error("Gagal mengirim log:", e);
    }
  }

  await esClient.indices.refresh({ index: ES_LOGS });
  console.log("🎉 Selesai! Dashboard Anda sekarang memiliki data yang sangat bervariasi.");
}

generateVariedSearch(200);