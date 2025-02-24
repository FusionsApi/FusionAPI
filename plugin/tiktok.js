
let handler = async (req, res) => {
  try {
    const url = req.query.url;
    if (!url) {
      return res.status(400).json({ error: "Parameter 'url' diperlukan" });
    }

    const apiUrl = `https://tikwm.com/api?url=${encodeURIComponent(url)}`;
    const response = await fetch(apiUrl);
    const data = await response.json();

    res.json(data);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Terjadi kesalahan saat memproses request" });
  }
};

// Ganti regex dengan array
handler.command = ["tt", "tiktok"]; // Array command yang didukung
handler.category = 'dl';
handler.tags = "downloader";
handler.method = "get"; // Metode HTTP
handler.docs = {
    desc: 'Downloader tiktok',
    parameters: [
        {
        "name": "url",
            "in": "query",
            "description": "Url titkok disini",
            "required": true,
            "type": "string",
        }
    ]
}

export default handler;