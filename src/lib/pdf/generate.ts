import puppeteer from "puppeteer-core";
import { buildTemplate } from "./template";

export interface DadosPDF {
  laudo: any;
  proprietario: any;
  implemento: any;
  veiculo: any;
  caracteristicas: any;
  itens_inspecao: any[];
  fotos: any[];
  textos_padrao: Record<string, string>;
  user: { nome: string; crea_numero: string; crea_estado: string };
}

function findChromePath(): string {
  const platform = process.platform;

  if (platform === "win32") {
    const paths = [
      "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
      "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
      `${process.env.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe`,
    ];
    for (const p of paths) {
      try { require("fs").accessSync(p); return p; } catch { /* next */ }
    }
  } else if (platform === "darwin") {
    return "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
  } else {
    const paths = [
      "/usr/bin/google-chrome",
      "/usr/bin/google-chrome-stable",
      "/usr/bin/chromium-browser",
      "/usr/bin/chromium",
    ];
    for (const p of paths) {
      try { require("fs").accessSync(p); return p; } catch { /* next */ }
    }
  }

  throw new Error(
    "Chrome não encontrado. Instale o Google Chrome ou defina a variável CHROME_PATH no .env"
  );
}

export async function gerarPDF(dados: DadosPDF): Promise<Buffer> {
  const html = buildTemplate(dados);

  const executablePath = process.env.CHROME_PATH || findChromePath();

  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
    ],
  });

  try {
    const page = await browser.newPage();

    await page.setContent(html, {
      waitUntil: "networkidle0",
      timeout: 30000,
    });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "30mm",
        left: "30mm",
        right: "20mm",
        bottom: "20mm",
      },
      displayHeaderFooter: true,
      headerTemplate: "<div></div>",
      footerTemplate: `
        <div style="width:100%; text-align:center; font-size:8px; color:#999; padding:0 20mm;">
          <span class="pageNumber"></span> / <span class="totalPages"></span>
        </div>
      `,
    });

    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}
