const BASE = "https://bronx-preview.onrender.com";
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const targets = await (await fetch("http://127.0.0.1:9223/json/list")).json();
const page = targets.find((t) => t.type === "page");
const socket = new WebSocket(page.webSocketDebuggerUrl);
const pending = new Map();
let nextId = 1;

function send(method, params = {}) {
  const id = nextId++;
  socket.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    setTimeout(() => {
      if (pending.has(id)) {
        pending.delete(id);
        reject(new Error(`timeout ${method}`));
      }
    }, 60000);
  });
}

socket.addEventListener("message", (event) => {
  const message = JSON.parse(event.data);
  if (message.id && pending.has(message.id)) {
    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) reject(new Error(JSON.stringify(message.error)));
    else resolve(message.result);
  }
});

await new Promise((resolve) => socket.addEventListener("open", resolve, { once: true }));
await send("Page.enable");
await send("Runtime.enable");

const evaluate = async (expression) => {
  const result = await send("Runtime.evaluate", {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  return result.result?.value;
};

const logo = `(() => {
  const link = document.querySelector('header a[href="/"]');
  if (!link) return 'not_found';
  return 'href=' + link.getAttribute('href') + ' text=' + link.innerText.replace(/\\s+/g,' ').trim();
})()`;

async function scenario(name, startUrl, before) {
  console.log(`\n=== ${name} ===`);
  await send("Page.navigate", { url: startUrl });
  await sleep(12000);
  if (before) await evaluate(before);
  console.log("до клика:", await evaluate(`JSON.stringify({path:location.pathname,hash:location.hash,scrollY:Math.round(window.scrollY)})`));
  console.log("логотип:", await evaluate(logo));
  await evaluate(`document.querySelector('header a[href="/"]').click(); 'clicked'`);
  await sleep(4000);
  console.log("после клика:", await evaluate(`JSON.stringify({path:location.pathname,hash:location.hash,scrollY:Math.round(window.scrollY)})`));
}

await scenario("из /schedule", `${BASE}/schedule`);
await scenario(
  "с главной, прокрученной вниз",
  `${BASE}/#directions`,
  `window.scrollTo(0, 3000); 'scrolled'`,
);

socket.close();
process.exit(0);
