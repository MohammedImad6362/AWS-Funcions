const puppeteer = require('puppeteer-core');
const chromium = require('@sparticuz/chromium');
const ejs = require('ejs');

async function generatePDFFromData(questionData, htmlTemplate) {
    const browser = await puppeteer.launch({
        args: chromium.args,
        executablePath: await chromium.executablePath,
        headless: true,
    });
    const page = await browser.newPage();

    const htmlContents = [];

    for (let index = 0; index < questionData.length; index++) {
        const item = questionData[index];
        const compiledTemplate = ejs.compile(htmlTemplate);
        const htmlContent = compiledTemplate({
            data: item,
            index: index + 1,
        });
        htmlContents.push(htmlContent);
    }

    await page.setContent(htmlContents.join(''));

    const pdfBuffer = await page.pdf({ format: 'A4' });

    await browser.close();
    return pdfBuffer;
}

module.exports = generatePDFFromData;
