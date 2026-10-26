// オフライン対応のサービスワーカー
// 方針：通信できるときは必ずネットから最新版を取得し（ネット優先）、取れたものを保存する。
//       圏外などで取得できないときだけ、保存しておいた前回の版を返す。
// oita-ems-v1.7.8-2026-10-26 はビルド時に版番号入りの名前に置き換わる（版が変わると古い保存分は消える）。
const CACHE = "__CACHE_NAME__";
const PRECACHE = ["./oita%20ems.html", "./manifest.webmanifest", "./icon-180.png", "./icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((c) => Promise.all(PRECACHE.map((u) => c.add(new Request(u, { cache: "reload" })).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("oita-ems-") && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;
  event.respondWith(
    fetch(req, { cache: "no-store" })
      .then((res) => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      })
      .catch(() =>
        caches.match(req, { ignoreSearch: true }).then((hit) => hit || caches.match("./oita%20ems.html"))
      )
  );
});
