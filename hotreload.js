
const req = require;
const fs = require('fs');

function hotreloadModule(id) {
    id = req.resolve(id);
    const mod = req.cache[id];
    if (!mod) return false;
    delete req.cache[id];
    const exp = req(id);
    // Object.assign(mod.exports, exp);
    // mod.exports = exp;
    console.log('Hotreloaded', id);
}

fs.watch(__dirname, { recursive: true }, (event, filename) => {
    if (filename === 'hotreload.js') return;
    try {
        hotreloadModule('./' + filename);
    } catch (e) {
        // console.error('Hotreload failed:', e);
    }
});

const ModuleProxy = {
    get(mod, key) {
        mod = require.cache[mod.id] || mod;
        return mod.real_exports[key];
    },
    ownKeys(mod) {
        mod = require.cache[mod.id] || mod;
        return Object.keys(mod.real_exports);
    },
    has(mod, key) {
        mod = require.cache[mod.id] || mod;
        return key in (mod.real_exports)[key];
    },
    getPrototypeOf(mod) {
        return Object.getPrototypeOf((require.cache[mod.id] || mod).real_exports);
    },
    getOwnPropertyDescriptor(mod, key) {
        return Object.getOwnPropertyDescriptor((require.cache[mod.id] || mod).real_exports, key);
    }
}

function wrapExtension(ext) {
    const old = require.extensions[ext];
    require.extensions[ext] = (mod, file) => {
        const res = old(mod, file);
        mod.real_exports = mod.exports;
        mod.exports = new Proxy(mod, ModuleProxy);
        return mod;
    }
}

wrapExtension('.js');
wrapExtension('.ts');