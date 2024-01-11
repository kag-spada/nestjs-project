import puppeteer from 'puppeteer';
import { LinkedInSearchData } from './types';

export const scrapData = (url, pagesToScrape, accessToken): Promise<LinkedInSearchData[]> => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!pagesToScrape) {
        pagesToScrape = 1;
      }
      const browser = await puppeteer.launch({
        headless: true,
        args: [`--window-size=1920,1080`],
        defaultViewport: {
          width: 1920,
          height: 1080,
        },
      });
      const page = await browser.newPage();
      let final:LinkedInSearchData[]= [];

      await page.setCookie({
        name: 'li_at',
        value: accessToken,
        domain: 'www.linkedin.com',
        path: '/',
        expires: Date.now() + 1000 * 60 * 60 * 24 * 365,
      });

      await page.goto(url, {
        waitUntil: 'networkidle2',
      });

      let currentPage = 1;

      while (currentPage <= pagesToScrape) {
        const results = await page.$$eval(
          'span[dir="ltr"] > span[aria-hidden="true"]',
          (spans) => {
            return spans.map((span) => span.textContent.trim());
          },
        );

        final = [
          ...final,
          ...results.map((item) =>  (
            {
              name:String(item)
            }
          )),
        ];
        if (currentPage < pagesToScrape) {
          await Promise.all([
            await page.click(
              currentPage == 1
                ? 'div.search-results-container div:nth-child(4) div div button:nth-of-type(2)'
                : 'div.search-results-container div div div.ember-view div button:nth-of-type(2)',
            ),
            await page.waitForSelector(
              'span[dir="ltr"] > span[aria-hidden="true"]',
            ),
          ]);
        }
        currentPage++;
      }
      browser.close();
      return resolve(final);
    } catch (e) {
      return reject(e);
    }
  });
};
