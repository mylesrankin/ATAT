/*
const rp = require('request-promise');
const $ = require('cheerio');

function advertScraper(url){
    rp(url)
        .then(function(html){
            //success!
            const urls = [];
            for (let i = 0; i < 45; i++) {
                urls.push($('a', html)[i].attribs.href);
            }
        })
        .catch(function(err){
            //handle error
            console.log("error")
        });
}

advertScraper('https://www.autotrader.co.uk/car-search?sort=sponsored&radius=15&postcode=b904uh&onesearchad=Used&onesearchad=Nearly%20New&onesearchad=New&make=BMW&model=M2'); */

const puppeteer = require('puppeteer');
const $ = require('cheerio');
const url = 'https://www.autotrader.co.uk/car-search?sort=sponsored&radius=15&postcode=b904uh&onesearchad=Used&onesearchad=Nearly%20New&onesearchad=New&make=BMW&model=M2';

puppeteer
    .launch()
    .then(function(browser) {
        return browser.newPage();
    })
    .then(function(page) {
        return page.goto(url).then(function() {
            return page.content();
        });
    })
    .then(function(html) {
        $('.js-click-handler listing-fpa-link', html).each(function() {
            console.log($(this).text());
        });
    })
    .catch(function(err) {
        //handle error
    });