import puppeteer from "puppeteer";
import * as dotenv from 'dotenv';
dotenv.config();

const { OAUTH_API_ENDPOINT, CHALLENGE_USERNAME, PASSWORD } = process.env;

export async function visitApp(clientId, redirectUri) {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox'],
  });
  const page = await browser.newPage();

  redirectUri = encodeURIComponent(redirectUri);
  const url = `${OAUTH_API_ENDPOINT}/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=username`;

  await page.goto(url);

  await page.type('#username', CHALLENGE_USERNAME);
  await page.type('#password', PASSWORD);
  await Promise.all([
    page.waitForNavigation(),
    page.click('#login'),
  ])

  const authorizeButtonSelector = '#authorizeButton';
  await Promise.all([
    page.waitForNavigation(),
    page.click(authorizeButtonSelector),
  ])

  await browser.close();
}
