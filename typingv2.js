const cheerio = require('cheerio');
const got = require('got');
const {shell} = require('electron')
const d3 = require('d3')

const base_url = 'https://blog.reedsy.com';
const main_url = base_url + '/short-stories';

let body = d3.select('body')
let div1 = d3.select('#textBox')
let reBtn = d3.select('#restart')
let newBtn = d3.select('#newStory')
let endScrn = d3.select('.endScreen')
let fakeDiv = div1.append('div')
    .attr('id', 'textDivLeft')
    .style('position', 'relative')
    .style('display', 'flex')
    .style('flex-direction', 'row-reverse')
    .style('height', '100%')
    .style('width', '50%')
let fakeDiv2 = div1.append('div')
    .attr('id', 'textDivRight')
    .style('position', 'relative')
    .style('height', '100%')
    .style('width', '50%')
let focus = true;
body.on('click', bodyClick)
div1.on('mouseover', textBoxMouseOver)
d3.select('#more-stories-link').on('click', function(){shell.openExternal(main_url)});
d3.select('#more-story-link').on('click', function(){shell.openExternal(global_link)});
//let testTextRaw = " Oh Hello There";
//testTextRaw = testTextRaw + testTextRaw+ testTextRaw+ testTextRaw+ testTextRaw
//let testText = testTextRaw.trim().split(" ");
//let textArray = Array.from(testText)
//console.log(Array.from(testText))
let correctColor = '#B6D8F2';
let wrongColor = '#F4CFDF';
let dh = div1.node().getBoundingClientRect().height;
let dw = div1.node().getBoundingClientRect().width;
let dw1 = div1.node().getBoundingClientRect().width;
let timeUp = false;
let guess = 90;
let th;
let tw;
let heigh_set = false;
let width_set = false;
let space = 20;
let letter_width;
let h = window.innerHeight;
let dy = window.innerHeight/h;
let cursor;
let baseTime = 60;
let time = baseTime;
let topDivs = d3.select('#top1')
let topDim = topDivs.node().getBoundingClientRect()

let acc;
let firstWord = true;
let wordStack = [];
let leftStack = [];
let word;
let firstChar = true;
let wordsCorrect = 0;
let wordsIncorrect = 0;
let word_index = 0;
let reset = false;
let initDone = false;
let full_story;
let global_link;
let story_title;
let story_author;
mainFunc()
reBtn.node().onclick = function(){initTest(full_story)};
newBtn.node().onclick = function(){getStory()};
function styleTop(){
    //heigh_set = false;
    let topText = d3.selectAll('.topText')
    d3.select('#top1').select('text').text(time)

    let topTextGuess = 30;
    topText.style('top', 0+'px')
    while(heigh_set == false){
        th = d3.select('.topText').node().getBoundingClientRect().height;
        let diff = th-topDim.height
        if((diff <= 4)&&(diff >= 2)) heigh_set = true;
        if(diff > 4){
            topTextGuess -= 0.5
        }
        if(diff < 2){
            topTextGuess += 0.5
        }
        d3.selectAll('.topText')
            .style('font-size', topTextGuess + 'px')
    }
    d3.select('#top2').select('text').style('font-size', '80px')
//    while(width_set == false){
//        tw = d3.select('.topText').node().getBoundingClientRect().width;
//        let diff = tw-topDim.width
//        if((diff <= 4)&&(diff >= 2)) width_set = true;
//        if(diff > 4){
//            topTextGuess -= 0.5
//        }
//        if(diff < 2){
//            topTextGuess += 0.5
//        }
//        d3.selectAll('.topText')
//            .style('font-size', topTextGuess + 'px')
//    }
}
function testStop(){
    timeUp = true
    let endScreen = d3.select('.endScreen')
    endScreen.style('visibility', 'visible')
    endScreen.select('text').text(`${wordsCorrect}WPM at ${Math.round(acc)}% accuracy`)
    endScreen.select('#title-author').text(`"${story_title}" by ${story_author}`)
}
function timeTick(){
    if(time != 0){
        d3.select('#top1').select('text').transition().duration(1000)
            .text(time--)
            .on('end', timeTick)
    }
    else{
        d3.select('#top1').select('text').text(0)
        testStop()
    }
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1) + min); //The maximum is inclusive and the minimum is inclusive
}
function mainFunc(){
    styleTop()
    heigh_set = false;
    //addCursor()
    //cursorTick()
    getStory()
}
function getStory(){
    d3.select('#loading').style('visibility', 'visible')
    d3.select(".endScreen").style('visibility', 'hidden')
    let story_string = ''
    got(main_url).then(response => {
        const $ = cheerio.load(response.body);
        const story_divs = $("div[class=submission]")
        const rand = getRandomInt(0, story_divs.length-1)
        let story_div;
        story_divs.each((i, d) => {if(i==rand) story_div = $(d)})
        const link = story_div.find("div[class=cell-shrink]").find("a").attr('href')
        const firstH3 = story_div.find("h3").find("a")

        story_title = $(firstH3[0]).text()
        story_author = $(firstH3[1]).text()
        const full_story_link = base_url + link
        global_link = full_story_link;
        got(full_story_link).then(response2 => {
            const $$ = cheerio.load(response2.body)
            const story = $$("article").find("p")
            story.each((i,d) => {
                story_string += $$(d).text()
            })
            story_string = story_string.replaceAll(/[“”‘’]/g,"'")
            story_string = story_string.replaceAll(/[.]/g,". ")
            story_string = story_string.replaceAll("  ",' ')
            full_story = story_string.trim().split(" ")

            initTest(full_story)
            initTextHeight()
            //addCursor()
            //if(!initDone){addCursor()};

        }).catch(err => {console.log(err)})
    }).catch(err => {
        console.log(err);
    });
}
function initTextHeight(){
    wordResize(null)
    while(heigh_set == false){
        th = d3.select('.textBottomRight').node().getBoundingClientRect().height;
        let diff = th-dh
        if((diff <= 4)&&(diff >= 2)) heigh_set = true;
        if(diff > 4){
            guess -= 0.5
        }
        if(diff < 2){
            guess += 0.5
        }
        d3.selectAll('.textBottomRight')
            .style('font-size', guess + 'px')
    }
    if(initDone == false){addCursor(); initDone=true;};
    cursorTick()
}

function wordResize(ev){
    dy = window.innerHeight/h;
    dw = fakeDiv2.node().getBoundingClientRect().width;
    dw1 = div1.node().getBoundingClientRect().width;
    d3.selectAll('.textBottomRight')
        .style('font-size', guess*dy + 'px')
    d3.select('svg')
        .style('left', (dw1/2.0)+'px')
        .attr('height', (th-20)*dy)
    d3.select('rect')
        .attr('height', (th-20)*dy)
    //could also add resizing of space between them but idk
}
window.onresize = wordResize

function addWords(s){
    s.forEach((d, i) => {
        fakeDiv2.append('text')
            .attr('class', 'textBottomRight')
            .attr('id', 't'+i)
            //.attr('font-family', 'garamond')
            .style('position', 'relative')
            .style('font-size', guess+'px')
            .style('margin-right', space+'px')

            .text(d)
    })
}


function addCursor(){
    //th = d3.select('.textBottomRight').node().getBoundingClientRect().height;
    div1.insert('svg', ':first-child')
    div1.select('svg')
        .attr('width', space/8)
        .attr('height',(th-20)*dy)
        .style('position', 'absolute')
        .style('left', (dw1/2.0)+'px')
        .style('top', '10%')
        //.attr('transform', 'translate(0, 0)')
        .append('rect')
        .attr('id', 'textCursor')
        //.attr('class', 'cursor')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', space/8)
        .attr('height', (th-20)*dy)
        //.attr('fill', correctColor)

}

function cursorTick(){
    if(focus){
        d3.select('#textCursor')
            .transition().duration(500)
            .attr('fill', '#000')
            .transition().duration(500)
            .attr('fill', 'none')
            .on('end', cursorTick)
    }
}

document.onkeydown = typingv5
let letter_spacing = 60;
function initTest(text){
    //initDone = true;
    timeUp = false;
    time = baseTime
    firstWord = true;
    firstChar = true;
    wordsCorrect = 0;
    focus = true;
    wordsIncorrect = 0;
    leftStack = []
    word_index = 0;
    wordsCorrect = 0;
    wordsIncorrect = 0;
    acc = 0;
    d3.selectAll('.textBottomRight').remove()
    d3.selectAll('.textBottomLeft').remove()
    d3.select(".endScreen").style('visibility', 'hidden')
    d3.select('#top1').select('text').text(time)
    d3.select('#top2').select('text').text('0 WPM')
    d3.select('#top3').select('text').text('100%')

    addWords(text)
    d3.select('#loading').style('visibility', 'hidden')
}
function wordEqual(){
    let equal = true;
    if(leftStack.length != 0){
        //let tempStack = wordStack.slice(0, leftStack.length-1)
        for(let i=0; i<leftStack.length; i++){
            if(leftStack[i] != wordStack[i]) equal = false;
        }
    }
    return equal;
}
function typingv5(ev){
    //ev.preventDefault()
    if(timeUp != true){
        if(focus == true){
        cursorTick()
        if(firstWord && (ev.keyCode != 16)){//first word and no shift
            timeTick()
            fakeDiv.insert('text', ':first-child')
                .attr('class', 'textBottomLeft')
                .attr('id', 'ft'+word_index)
                .style('font-size', (guess*dy)+'px')
                //.style('margin-right', space+'px')
            firstWord = false;
            word = d3.select('#t'+word_index).text()
            wordStack = Array.from(word)
        }
        //(ev.keyCode>=65) && (ev.keyCode<=90) && (ev.key!=' ')
        if(((ev.keyCode>=48)&&(ev.keyCode<=90)) || ((ev.keyCode>=186)&&(ev.keyCode<=223))){
            leftStack.push(ev.key)
            d3.select('#ft'+word_index).text(leftStack.join(''))
            if(wordEqual()){
                d3.select('#ft'+word_index).style('color', correctColor)
                d3.select('#t'+word_index).text(wordStack.slice(leftStack.length, wordStack.length).join(''))
            }
            else{
                d3.select('#ft'+word_index).style('color', wrongColor)
            }
            firstChar = false;
        }
        if(ev.keyCode==8){
            leftStack.pop()
            d3.select('#ft'+word_index).text(leftStack.join(''))
            if(wordEqual()){
                d3.select('#ft'+word_index).style('color', correctColor)
                d3.select('#t'+word_index).text(wordStack.slice(leftStack.length, wordStack.length).join(''))
            }
            else{
                d3.select('#ft'+word_index).style('color', wrongColor)
            }
        }
        if((ev.key == ' ') && (firstChar == false)){
            ev.preventDefault()//prevent spacebar scroll
            d3.select('#ft'+word_index).style('margin-right', space+'px')
            if(leftStack.join('') == wordStack.join('')){
                d3.select('#ft'+word_index).style('color', correctColor)
                wordsCorrect += 1;
                d3.select('#top2').select('text').text(`${wordsCorrect} WPM`)
                acc = (wordsCorrect/(wordsCorrect+wordsIncorrect))*100
                d3.select('#top3').select('text').text(`${Math.round(acc)}%`)
            }
            else{
                d3.select('#ft'+word_index).style('color', wrongColor)
                wordsIncorrect += 1;
            }
            d3.select('#t'+word_index).remove()
            word_index += 1
            fakeDiv.insert('text', ':first-child')
                .attr('id', 'ft'+word_index)
                .attr('class', 'textBottomLeft')
                .style('font-size', (guess*dy)+'px')
            leftStack = []
            word = d3.select('#t'+word_index).text()
            wordStack = Array.from(word)
            firstChar = true;
            //move on to next word and clear char stack
        }
    }
    }
}
function textBoxMouseOver(ev){
    d3.select(this).style('cursor', 'text')
}
function bodyClick(ev){
    if((d3.select(ev.target).attr('id') == 'textDivLeft') ||
       (d3.select(ev.target).attr('id') == 'textDivRight') ||
      d3.select(ev.target)._groups[0][0].nodeName == 'TEXT' ||
        (d3.select(ev.target).attr('id') == 'restart') ||
        (d3.select(ev.target).attr('id') == 'newStory')){
        focus = true;
        cursorTick()
    }
    else {
        focus = false;
    }
}
