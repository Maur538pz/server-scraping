const app = require("express")();
const cors = require("cors")

let chrome = {};
let puppeteer;

if (process.env.AWS_LAMBDA_FUNCTION_VERSION) {
  chrome = require("chrome-aws-lambda");
  puppeteer = require("puppeteer-core");
} else {
  puppeteer = require("puppeteer");
}

app.use(cors())

app.get("/api/:site", async (req, res) => {
  let dep = req.params.site
  const departmentMin = dep.toLowerCase();
  let options = {};
  const url = `https://www.pods.pe/mapa/lista.php?reg=${departmentMin}&ods=15&tem=undefined&tip=undefined`;

  if (process.env.AWS_LAMBDA_FUNCTION_VERSION) {
    options = {
      args: [...chrome.args, "--hide-scrollbars", "--disable-web-security"],
      defaultViewport: chrome.defaultViewport,
      executablePath: await chrome.executablePath,
      headless: true,
      ignoreHTTPSErrors: true,
    };
  }

  try {
    let browser = await puppeteer.launch(options);

    let page = await browser.newPage();




    await page.goto(url);

    let response = await page.evaluate(() => {
      const numIniciativas = Number(
        document.querySelector('.num > span').innerText,
      );
      if (!numIniciativas) {
        return [];
      }
      const campos = [
        ...document.querySelectorAll('thead > tr > :not(.sep)'),
      ].map((e) => e.innerText);

      const nodeContent= document.querySelectorAll('tbody > tr');

      const content = [...nodeContent].map((e) =>
        [...e.querySelectorAll(':not(.sep)')]
          .map((td) => td.innerText)
          .slice(1),
      );

      return [campos, ...content];
    });
    await browser.close()


    res.send(response);
  } catch (err) {
    console.error(err);
    return null;
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Server started");
});

module.exports = app;
