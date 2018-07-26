const express = require('express')
const puppeteer = require('puppeteer')
const app = express()

app.set('view engine', 'pug');

app.get('/', function (req, res) {
    res.render('home', {'result': ''})
})

app.get('/search', async function (req, res) {
    req.setTimeout(0); // As the request can be very long, the page should never timeout
    const budget = req.query.budget 
    const browser = await puppeteer.launch({slowMo: 10}) // SloMo to wait for content load
    const page = await browser.newPage()
    let isNextPageAvailable
    let offersThatMatch = []
    await page.setViewport({width: 1920, height: 1080}) // Best result as desktop viewport
    await page.goto('https://fr.travelbird.be/search')

    do {
        const offersSelector = '#js-search-grid-cards > ul > li'
        const budgetSelector = '#js-search-grid-cards > ul > li:nth-child(INDEX) > a > div.offer-card__info > div > span.offer-card__price-value'
        const linkToNextPageSelector = '#js-search-result > div > .pagination-btn:last-child'

        let offersLength = await page.evaluate((sel) => {
            const length = document.querySelectorAll(sel).length
            return length
        }, offersSelector)

        for (i = 1; i <= offersLength; i++) {
            let offerPrice = budgetSelector.replace('INDEX', i)
            try { // Avoid error on ads
                let result = await page.evaluate((sel) => {
                    const value = parseFloat(document.querySelector(sel).innerHTML.replace('.', '').replace(' €', '').replace(',', '.'))
                    return value
                }, offerPrice)
                if (result <= budget) {
                    offersThatMatch.push(result)
                }
            } catch (error) {
                console.log(error)
                continue
            }
        }

        await page.waitFor(linkToNextPageSelector, {visible: true})
        isNextPageAvailable = await page.evaluate((sel) => {
            const isDisabled = document.querySelector(sel).classList.contains('disabled')
            return !isDisabled
        }, linkToNextPageSelector)

        if (isNextPageAvailable) {
            await page.hover(linkToNextPageSelector)
            await page.click(linkToNextPageSelector)
            await page.waitForNavigation({
                waitUntil: 'networkidle2',
                timeout: 0
            }) // Always wait for page to load except on network failure
        }
        p++
    } while (isNextPageAvailable)

    await browser.close()
    await res.render('home', {'result': offersThatMatch})
})

app.listen(3000, function () {})