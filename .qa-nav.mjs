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

const state = `JSON.stringify({path:location.pathname,hash:location.hash,scrollY:Math.round(window.scrollY)})`;

await send("Page.navigate", { url: `${BASE}/` });
await sleep(12000);

await evaluate("window.scrollTo(0, 3000)");
await sleep(500);
console.log("главная, до клика:", await evaluate(state));

console.log("клик по «Расписание» в меню");
await evaluate(`Array.from(document.querySelectorAll('header a')).find(a=>a.getAttribute('href')==='/schedule').click(); 'ok'`);
await sleep(5000);
console.log("после перехода:", await evaluate(state));

console.log("клик по «Направления» с /schedule");
await evaluate(`Array.from(document.querySelectorAll('header a')).find(a=>a.getAttribute('href')==='/#directions').click(); 'ok'`);
await sleep(6000);
console.log("после перехода:", await evaluate(state));
console.log("верх #directions:", await evaluate(`Math.round(document.getElementById('directions')?.getBoundingClientRect().top ?? -9999)`));

socket.close();
process.exit(0);
