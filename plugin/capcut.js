import axios from "axios";
import BodysSender from "form-data";
import * as cheerio from "cheerio";
import checkApikeys from "../component/cekApikey.js";

const BASE_URL = "https://vidburner.com";
const AIO_URL = "/wp-json/aio-dl/video-data/";
const STRING_BASE64 = "1043YWlvLWRs";

async function getToken() {
  const { data } = await axios.get(BASE_URL);
  const $ = cheerio.load(data);
  return $("#token").val();
}

async function capcurDonloder(url) {
  const dd = new BodysSender();
  const string = btoa(url);
  const validHash = string + STRING_BASE64;
  const tkn = await getToken();
  dd.append("url", url);
  dd.append("token", tkn);
  dd.append("hash", validHash);
  const headers = { ...dd.getHeaders() };
  const { data: dss } = await axios.post(BASE_URL + AIO_URL, dd, { headers });
  return dss;
}

const handler = async (req, res) => {
  try {
    await checkApikeys(req, res);
    const url = req.query.url;
    if (!url) {
      return res.status(400).json({ error: "Parameter 'url' diperlukan" });
    }

    const data = await capcurDonloder(url);

    res.status(200).json({
      status: true,
      author: "FusionsTeam",
      result: data,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Terjadi kesalahan saat memproses request" });
  }
};

handler.command = ["capcut"];
handler.category = "downloader";
handler.tags = "downloader";
handler.method = "get";
handler.docs = {
  desc: "Download Capcut No watermark Here!",
  parameters: [
    {
      name: "url",
      in: "query",
      description: "Url",
      required: true,
      type: "string",
    },
  ],
  headers: [
    {
      name: "Authorization",
      in: "header",
      description: "Masukkan API Key di sini",
      required: true,
      type: "string",
    },
  ],
};

export default handler;
