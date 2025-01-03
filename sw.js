const CACHE_NAME = 'tom-and-jerry-v1';
const urlsToCache = [
    'index.html',
    'files/pages/instructions.html',
    'files/pages/level.html',
    'files/pages/start.html',
    'files/pages/levels-settings/tasks.json',
    'files/css/index-styles.css',
    'files/css/instructions-styles.css',
    'files/css/level.css',
    'files/css/start-styles.css',
    'files/fonts/Arizonia-Regular.ttf',
    'files/fonts/beer money.ttf',
    'files/fonts/TMVinograd-Oblique.otf',
    'files/fonts/TMVinograd-Oblique.ttf',
    'files/fonts/TMVinograd-Regular.otf',
    'files/fonts/TMVinograd-Regular.ttf',
    'files/images/1.webp',
    'files/images/2.webp',
    'files/images/3.webp',
    'files/images/4.webp',
    'files/images/5.webp',
    'files/images/6.webp',
    'files/images/7.webp',
    'files/images/8.webp',
    'files/images/bg_2.webp',
    'files/images/54.png',
    'files/images/boss.png',
    'files/images/bullet.png',
    'files/images/defeat.png',
    'files/images/enemy.png',
    'files/images/final.png',
    'files/images/player.png',
    'files/images/s_1.png',
    'files/images/s_2.png',
    'files/images/victory.png',
    'files/images/pwa_icon_192.png',
    'files/images/pwa_icon_512.png',
    'files/images/fireworks_3.gif',
    'files/js/start-js.js',
    'files/js/level.js',
    'files/js/instructions.js',
    'files/js/index.js'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                return response || fetch(event.request);
            })
    );
});

self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (!cacheWhitelist.includes(cacheName)) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});
