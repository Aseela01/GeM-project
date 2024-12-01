const puppeteer = require('puppeteer');

async function scrapeGeM(category, brandName) {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    let products = [];
    let pageNumber = 1;

    while (products.length < 15 && pageNumber <= 20) {
        const url = `https://mkp.gem.gov.in/computers-0806nb/search?q=${category.replace(" ", "+")}+${brandName.replace(" ", "+")}&page=${pageNumber}`;
        await page.goto(url, { waitUntil: 'networkidle2' });
        const newProducts = await page.evaluate((category, brandName) => {

            let items = [];

            document.querySelectorAll('div.variant-wrapper').forEach(product => {
                
                let name = product.querySelector('span.variant-title').innerText;
                let price = product.querySelector('span.variant-final-price').innerText;
                let url = product.querySelector('a').href;
                name = name.replace(/[^a-zA-Z0-9\s]/g, '');
                let priceValue = parseFloat(price.replace(/[^0-9.]/g, ''));
                price = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(priceValue);

                if (!url.startsWith('http')) {
                    url = 'https://mkp.gem.gov.in' + url;
                }

                if (name.toLowerCase().includes(category.toLowerCase()) && name.toLowerCase().includes(brandName.toLowerCase())) {
                    items.push({ platform: 'GeM', name, price, url });
                }
            });

            return items;

        }, category, brandName);
        products = products.concat(newProducts);
        pageNumber++;

    }
    await browser.close();

    if (products.length === 0) {
        return [{ platform: 'GeM', name: 'No products found', price: '', url: '' }];
    }

    return products.slice(0, 15);
}

const [category, brandName] = process.argv.slice(2);
scrapeGeM(category, brandName).then(products => console.log(JSON.stringify(products)));

