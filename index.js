const express = require('express')
const puppeteer = require('puppeteer')
const app = express()

app.set('view engine', 'pug');

app.get('/', function (req, res) {
    res.render('home', {'result': 'Nothing to see here.'})
})

app.get('/search', async function (req, res) {
        
    const budget = req.query.budget 
    const browser = await puppeteer.launch()
    const page = await browser.newPage()
    const offersSelector = '#main > section:nth-child(2) > section.grid.grid--offer-cards-homepage > ul > li'
    const budgetSelector = '#main > section:nth-child(2) > section.grid.grid--offer-cards-homepage > ul > li:nth-child(INDEX) > a > div.offer-card__info > div > span.offer-card__price-value'
    await page.goto('https://fr.travelbird.be/')

    let resultsLength = await page.evaluate((sel) => {
        const length = document.querySelectorAll(sel).length
        return length
    }, offersSelector)

    let offersThatMatch = []
    
    for (i = 1; i < resultsLength; i++) {
        let indexedBudgetSelector = budgetSelector.replace('INDEX', i)
        let result = await page.evaluate((sel) => {
            const value = parseFloat(document.querySelector(sel).innerHTML.replace('.', '').replace(' €', '').replace(',', '.'))
            return value
        }, indexedBudgetSelector)
        if (result <= budget) {
            offersThatMatch.push(result)
        }
    }
    

    await browser.close()
    await res.render('home', {'result': offersThatMatch})
})

app.listen(3000, function () {})