import { ActionFunctionArgs, LoaderFunctionArgs, json } from "@remix-run/node";
import puppeteer from 'puppeteer';
function delay(timeout:number) {
  return new Promise((resolve) => {
    setTimeout(resolve, timeout);
  });
}
export async function action({
    request,
  }: ActionFunctionArgs) {
    const {webapp} = await request.json();
    let browser = await puppeteer.launch({});
    let page = await browser.newPage();
    try { 

    // await page.setViewportSize({ width: 1280, height: 768 });
    let errors = '';
    page.on('pageerror', (err) => {
      errors += err.toString()+err.stack + '\n';
    })
    await page.goto(webapp);
    await delay(5000);
    const screenshot = (await page.screenshot()).toString('base64');
    await page.close();
    await browser.close();
    return json(
      {screenshot,errors:errors.slice(0,500)}
    );
    } catch (e) {
      await page.close();
      await browser.close();
      throw e;
    }
  }