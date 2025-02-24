import fs from "fs";
import { fileURLToPath } from "url";
import path from "path";
const GITHUB_API = 'https://api.github.com/repos/ErerexIDChx/fusions-api/contents/component/apikey.json';
const TOKEN = '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';
let apiKeys = []
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

try {
    const apiKeyData = fs.readFileSync(path.join(__dirname, 'apikey.json'), 'utf8');
    const parsedData = JSON.parse(apiKeyData);
    apiKeys = parsedData.api_keys && Array.isArray(parsedData.api_keys) ? parsedData.api_keys : [];
    
    console.log('API keys berhasil dimuat:', apiKeys);
} catch (error) {
    console.error('Gagal membaca file apikey.json:', error);
    process.exit(1); 
}

async function saveApiKeys() {
    try {
        const updatedData = JSON.stringify({ api_keys: apiKeys }, null, 2);
        const fileContent = Buffer.from(updatedData).toString('base64');

        console.log('Menyimpan API keys ke GitHub...');
        const { data } = await axios.get(GITHUB_API, {
            headers: {
                Authorization: `Bearer ${TOKEN}`
            }
        });

        if (!data.sha) {
            throw new Error('SHA file tidak ditemukan di respon GitHub.');
        }
        await axios.put(
            GITHUB_API,
            {
                message: 'Update API keys',
                content: fileContent,
                sha: data.sha
            },
            {
                headers: {
                    Authorization: `Bearer ${TOKEN}`
                }
            }
        );

        console.log('API keys berhasil disimpan ke GitHub.');
    } catch (error) {
        console.error('Gagal menyimpan API keys ke GitHub:', error.message);
    }
}

async function checkApikeys(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(403).json({ error: 'Authorization header tidak ditemukan.' });
    }

    const parts = authHeader.split(' ');
    const requestApiKey = parts.length === 2 && parts[0] === 'Bearer' ? parts[1] : authHeader;

    if (!apiKeys.length) {
        console.log('Memuat ulang API keys...');
        try {
            const apiKeyData = fs.readFileSync(path.join(__dirname, 'apikey.json'), 'utf8');
            const parsedData = JSON.parse(apiKeyData);
            apiKeys = parsedData.api_keys.map(key => ({
                ...key,
                initialLimit: key.initialLimit || key.limit,
                lastReset: key.lastReset || 0
            }));
            console.log('API keys berhasil dimuat:', apiKeys);
        } catch (error) {
            console.error('Gagal membaca file apikey.json:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    console.log('API key dari request:', requestApiKey);
    console.log('Daftar API keys yang tersedia:', apiKeys);

    if (!requestApiKey) {
        return res.status(403).json({ error: 'API key tidak ditemukan dalam request.' });
    }

    const apiKeyEntry = apiKeys.find(key => key.key === requestApiKey);
    if (!apiKeyEntry) {
        return res.status(403).json({ error: 'API key tidak valid.' });
    }

    const now = Date.now();
    if (apiKeyEntry.lastReset === 0 || now - apiKeyEntry.lastReset >= 86400000) {
        apiKeyEntry.limit = apiKeyEntry.initialLimit;
        apiKeyEntry.lastReset = now;
        await saveApiKeys();
    }

    if (apiKeyEntry.limit <= 0) {
        return res.status(403).json({ error: 'API key limit habis.' });
    }

    apiKeyEntry.limit -= 1;
    await saveApiKeys();

    console.log(`API key ${requestApiKey} diterima, limit tersisa ${apiKeyEntry.limit} dan akan dilanjutkan...`);
    next();
}

export default checkApikeys;