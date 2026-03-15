import { mkdir } from "fs/promises";
await mkdir("./asn", { recursive: true });
await mkdir("./logos", { recursive: true });

async function fetchWithTimeout(url, ms = 10000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function makePool(concurrency) {
  let active = 0;
  const queue = [];
  return function run(fn) {
    return new Promise((resolve, reject) => {
      const attempt = () => {
        active++;
        fn().then(resolve, reject).finally(() => {
          active--;
          if (queue.length) queue.shift()();
        });
      };
      active < concurrency ? attempt() : queue.push(attempt);
    });
  };
}

async function extractDomain(net) {
  const website = net.website || net.social_media?.find((s) => s.service === "website")?.identifier;
  if (!website) return null;
  try { return new URL(website).hostname; } catch { return null; }
}

async function fetchLogo(domain, asn) {
  try {
    const res = await fetchWithTimeout(`https://www.google.com/s2/favicons?domain=${domain}&sz=256`);
    if (res.ok) {
      await Bun.write(`./logos/${asn}.png`, await res.arrayBuffer());
      return true;
    }
  } catch {}
  return false;
}

let since = 0;
try {
  since = parseInt(await Bun.file("./last_run.txt").text());
} catch {}
const sinceStr = since > 0 ? `&since=${since}` : "";
console.log(`fetching changes since ${since > 0 ? new Date(since * 1000).toISOString() : "beginning"}...`);

const pool = makePool(20);
let skip = 0;
const limit = 1000;
let total = 0;
let logos = 0;
let newAsns = 0;

while (true) {
  let data;
  try {
    const res = await fetchWithTimeout(
      `https://peeringdb.com/api/net?depth=0&limit=${limit}&skip=${skip}${sinceStr}`,
      15000
    );
    ({ data } = await res.json());
  } catch (e) {
    console.log(`page fetch failed at skip=${skip}, retrying... (${e.message})`);
    await Bun.sleep(2000);
    continue;
  }

  if (!data?.length) break;

  const logoTasks = [];
  for (const net of data) {
    if (!net.asn) continue;

    const path = `./asn/${net.asn}.json`;
    const existing = await Bun.file(path).text().catch(() => null);
    const updated = JSON.stringify(net);

    if (existing !== updated) {
      Bun.write(path, updated);
      newAsns++;
      const domain = await extractDomain(net);
      if (domain) logoTasks.push({ domain, asn: net.asn });
    }

    total++;
  }

  const results = await Promise.all(
    logoTasks.map(({ domain, asn }) => pool(() => fetchLogo(domain, asn)))
  );
  logos += results.filter(Boolean).length;

  skip += limit;
  console.log(`checked ${total} records, ${newAsns} updated, ${logos} logos fetched...`);
  await Bun.sleep(300);
}

await Bun.write("./last_run.txt", String(Math.floor(Date.now() / 1000)));
console.log(`done. ${newAsns} ASNs updated, ${logos} logos written.`);