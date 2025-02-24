// folderplugin/example.js
let handler = async (req, res) => {
  try {
    const data = req.body; // Data dari body request
    res.json({ message: "Data diterima", data });
  } catch (error) {
    res.status(500).json({ error: "Terjadi kesalahan saat memproses request" });
  }
};

// Array command yang didukung
handler.command = ["example", "demo"];
handler.method = "post"; // Metode HTTP

export default handler;