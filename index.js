const HTMLParser = require('node-html-parser');
const puppeteer = require('puppeteer');
require('dotenv').config();

console.log('Helo!')

let cachedInfo = {};

let detectInfo = ( text ) => {
    text = text.split('');
    if(parseInt(text[0]) || text[0] === '0' || text[0] === '')return;

    let newText = '';
    let i = 0;

    text.forEach(char => {
        if(char !== ' '){
            newText += char;
            i = 0
        } else{
            i++

            if(i === 1){
                newText += ' ';
            }
        }
    })

    text = newText.split(' ');
    let key = text[0]
    let value = {
        gw: text[1],
        percent: text[3]
    }

    if(text[0] === 'IC' || text[0] === 'IC2'){
        key += ' ' + text[1];
        value.gw = text[2];
        value.percent = text[4];
    }

    cachedInfo[key] = value;
}

let scrape = async () => {
    console.log('Launching Browser');

    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    console.log('Loading GridWatch');
    await page.goto('https://gridwatch.co.uk/');

    setTimeout(async () => {
        console.log('Parsing Data')
        const root = HTMLParser.parse(await page.content());

        console.log('Fixing Text');
        root.querySelectorAll('.rgraph_accessible_text_bars').forEach(data => {
            detectInfo(data.innerHTML);
        });

        console.log('Closing Browser');
        await browser.close();

        console.log('Sending To Server');
        fetch('https://grid.phazed.xyz/api/v1/webhook', {
            method: 'POST',
            headers: {
                token: process.env.WHToken
            },
            body: JSON.stringify(cachedInfo)
        }).then(data => data.json()).then(data => {
            if(data.ok){
                console.log('Finished Sending Data')
            } else{
                console.log('Error: '+data.msg)
            }
        })
    }, 2000)
}

scrape()
// test