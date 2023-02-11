import puppeteer from "puppeteer";
import * as dotenv from 'dotenv';
dotenv.config();

const { OAUTH_API_ENDPOINT, TARGET_USERNAME, PASSWORD } = process.env;

export async function visitApp(clientId, redirectUri) {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox'],
  });
  const page = await browser.newPage();

  redirectUri = encodeURIComponent(redirectUri);
  const url = `${OAUTH_API_ENDPOINT}/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=username`;

  await page.goto(url);

  await page.type('#username', TARGET_USERNAME);
  await page.type('#password', PASSWORD);
  await page.click('#login');

  const authorizeButtonSelector = '#authorizeButton';
  await page.waitForNavigation();
  await page.click(authorizeButtonSelector);
  await page.waitForNavigation();

  await browser.close();
}
