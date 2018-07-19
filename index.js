const express = require('express')
const puppeteer = require('puppeteer')
const app = express()

app.set('view engine', 'pug');

app.get('/', function (req, res) {
    res.render('home', {'result': ''})
})

app.get('/search', async function (req, res) {
        
    const budget = req.query.budget 
    const browser = await puppeteer.launch()
    const page = await browser.newPage()
    let isNextPageAvailable
    let offersThatMatch = []
    await page.goto('https://fr.travelbird.be/search')

    do {
        console.log('New page request')
        const offersSelector = '#js-search-grid-cards > ul > li.grid-cards__item:not(grid-cards__item--break)'
        const budgetSelector = '#js-search-grid-cards > ul > li.grid-cards__item:not(grid-cards__item--break):nth-child(INDEX) > a > div.offer-card__info > div > span.offer-card__price-value'
        const linkToNextPage = '#js-search-result > div > a:last-child'

        let resultsLength = await page.evaluate((sel) => {
            const length = document.querySelectorAll(sel).length
            return length
        }, offersSelector)

        for (i = 1; i <= resultsLength; i++) {
            let indexedBudgetSelector = budgetSelector.replace('INDEX', i)
            if (i != 7) {
                let result = await page.evaluate((sel) => {
                    const value = parseFloat(document.querySelector(sel).innerHTML.replace('.', '').replace(' €', '').replace(',', '.'))
                    return value
                }, indexedBudgetSelector)
                if (result <= budget) {
                    offersThatMatch.push(result)
                }
            }
        }
        console.log('Offers : ' + offersThatMatch)
        isNextPageAvailable = await page.evaluate((sel) => {
            const isDisabled = document.querySelector(sel).classList.contains('disabled')
            return !isDisabled
        }, linkToNextPage)
        
        if (isNextPageAvailable) {
            await page.click(linkToNextPage);
            await page.waitForNavigation();
            console.log('Navigated to new page')
        }
    } while (isNextPageAvailable)

    await browser.close()
    await res.render('home', {'result': offersThatMatch})
})

app.listen(3000, function () {})