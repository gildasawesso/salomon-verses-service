let fs = require('fs');
let request = require('request');
let fetch = require('node-fetch');

const versesRegex = /([1|2]?[a-zA-Z]{1,4}[\s|\.|0-9][0-9]{0,3}:[0-9]{0,3}-?[0-9]{0,3}(\/?[0-9]{0,3}-?[0-9]{0,3})+(?![a-zA-Z]{2,3}(\.|[0-9])))/gm;

async function generate(verses) {
  let tempResult = cleanVerses(verses);
  tempResult = matchedVerses(tempResult);
  tempResult = removeDots(tempResult);
  tempResult = splitVerses(tempResult);
  console.log('Nombre de verses', tempResult.length);
  // tempResult = normalizeVerses(tempResult);
  tempResult = await getVerses(tempResult);

  fs.writeFileSync('./assets/verses-text.txt', tempResult, 'utf-8');
  return tempResult;
}

function cleanVerses(str) {
  return str.replace(/[\s\n\t]/g, '').toLowerCase();
}

function matchedVerses(str) {
  let regexp = new RegExp(versesRegex, 'gm');
  let matches = str.match(regexp);
  return matches;
}

function removeDots(versesArray) {
  return versesArray.map(verse => {
    let str = verse.replace(/\./g, '');
    return str.replace(/\/$/, '');
  });
}

function splitVerses(verses) {
  let newVerses = [];

  verses.forEach(verse => {
    let verseSplitedBySlash = verse.split('/');
    let verseSplitedByFullColumn = verse.split(':');

    if (verseSplitedBySlash.length > 1) {
      verseSplitedBySlash.forEach((chapiter, index) => {
        if(index == 0) {
          newVerses.push(verseSplitedBySlash[0]);
        } else {
          newVerses.push(verseSplitedByFullColumn[0] + ':' + chapiter);
        }
      });
    } else {
      newVerses.push(verse);
    }
  });

  return newVerses;
}

function normalizeVerses(verses) {
  for (let i in verses) {
    let v = verses[i];
    let verseSplited = v.split(':');
    let dic = normalizationDic;

    let chapter = '';

    if (verseSplited[0].match(/^\d/gi)) {
      chapter = verseSplited[0].slice(1);
    } else {
      chapter = verseSplited[0];
    }

    let trueChapter = chapter.match(/^[a-zA-Z]*/i);

    for (let j in dic) {
      if (trueChapter[0].toLocaleLowerCase() == j.toLocaleLowerCase()) {
        let normalizedVerse = v.replace(j.toLowerCase(), dic[j]);
        v = normalizedVerse;
        verses[i] = v;
        break;
      }
    }
  }

  return verses;
}

function humanReadableVerse(verse, bookObject) {
  let verseSplitedByFullColumn = verse.split(':');

  let bookAndChapter = '';
  let bookFirstPart = '';
  let complexeBook = false;
  // let book = '';
  // let chapter = '';

  if (verseSplitedByFullColumn[0].match(/^\d/gi)) {
    // bookAndChapter = verseSplitedByFullColumn[1];
    bookAndChapter = verseSplitedByFullColumn[0].match(/[a-zA-Z]*[0-9]+/gi)[1];
    bookFirstPart = verseSplitedByFullColumn[0].match(/^\d/gi)[0];
    complexeBook = true;
  } else {
    bookAndChapter = verseSplitedByFullColumn[0];
  }

  try {
    let book = bookAndChapter.match(/^[a-zA-Z]*/gi);
    let chapter = bookAndChapter.match(/\d*$/gi)[0];

    return bookObject.book_name + ' ' + chapter + ':' + verseSplitedByFullColumn[1];
  } catch (e) {
    console.error(e);
  }
}

function humanReadableVerseFR(verse) {
  let verseSplitedByFullColumn = verse.split(':');

  let bookAndChapter = '';
  let bookFirstPart = '';
  let complexeBook = false;
  // let book = '';
  // let chapter = '';

  if (verseSplitedByFullColumn[0].match(/^\d/gi)) {
    // bookAndChapter = verseSplitedByFullColumn[1];
    bookAndChapter = verseSplitedByFullColumn[0].match(/[a-zA-Z]*[0-9]+/gi)[1];
    bookFirstPart = verseSplitedByFullColumn[0].match(/^\d/gi)[0];
    complexeBook = true;
  } else {
    bookAndChapter = verseSplitedByFullColumn[0];
  }

  try {
    let book = bookAndChapter.match(/^[a-zA-Z]*/gi);
    let chapter = bookAndChapter.match(/\d*$/gi)[0];

    for (let i in humanDic) {
      if (book[0].toLocaleLowerCase() == i.toLocaleLowerCase()) {
        if (complexeBook) {
          return bookFirstPart + ' ' + humanDic[i] + ' ' + chapter + ':' + verseSplitedByFullColumn[1];
        }
        return humanDic[i] + ' ' + chapter + ':' + verseSplitedByFullColumn[1];
      }
    }
  } catch (e) {
    console.error(e);
  }
}

async function getVersesFr(verses) {
  let versesText = [];
  for(let i in verses) {
    let verse = verses[i];
    let verseObject = await getVerse(verse);
    const bookObject = verseObject.book[0];
    let readableVerse = humanReadableVerse(verse, bookObject);
    let text = verseText(verseObject);
    if(text == null) continue;
    // console.log('processed verse : ', readableVerse);

    versesText.push({
      verseTitle: readableVerse,
      verseBody: text
    });
  }
  return versesText;
}

async function getVerses(verses) {
  let versesText = [];
  for(let i in verses) {
    let verse = verses[i];
    let verseObject = await getVerse(verse);
    const bookObject = verseObject.book[0];
    let readableVerse = humanReadableVerse(verse, bookObject);
    let text = verseText(verseObject);
    if(text == null) continue;
    // console.log('processed verse : ', readableVerse);
    versesText.push({
      verseTitle: readableVerse,
      verseBody: text
    });
  }
  return versesText;
}

function verseText(verseObject) {
  let verses = [];
  try {
    Object.values(verseObject.book[0].chapter).map((v => {
      return verses.push(v.verse_nr + ' ' + v.verse);
    }));
    return verses;
  } catch(err) {
    return null;
  }
}

async function getVerse(verse) {
  let url = `http://getbible.net/json?p=${verse}&v=kjv`;

  try {
    const result = await fetch(url);
    let data = await result.text();
    data = data.replace(/\);|^\(/gi, '');
    return JSON.parse(data);
  } catch(err) {
    console.error(err);
    console.log('verse', verse);
    return null;
  }
}

function normalizeVerses(verses) {
  for (let i in verses) {
    let v = verses[i];
    let verseSplited = v.split(':');
    let dic = normalizationDic;

    let chapter = '';

    if (verseSplited[0].match(/^\d/gi)) {
      chapter = verseSplited[0].slice(1);
    } else {
      chapter = verseSplited[0];
    }

    let trueChapter = chapter.match(/^[a-zA-Z]*/i);

    for (let j in dic) {
      if (trueChapter[0].toLocaleLowerCase() == j.toLocaleLowerCase()) {
        let normalizedVerse = v.replace(j.toLowerCase(), dic[j]);
        v = normalizedVerse;
        verses[i] = v;
        break;
      }
    }
  }

  return verses;
}

const normalizationDic = {
  'Deut': 'De',
  'Ezek': 'Eze',
  'Sam': 'S',
  'Mk': 'Mark',
  'Gen': 'Ge',
  'Matt': 'Mt',
  'Kgs': 'kings',
  'Kg': 'Kings',
  'Hos': 'Ho',
  'Prov': 'Pro',
  'Phil': 'Phl',
  'Rm': 'Rom',
  'Zph': 'Zeph',
  'Ezk': 'Ez',
  'Actes': 'Act',
  'Joe': 'Joel',
  'Psa': 'Ps',
  'Phi': 'Phl',
  'Mak': 'Mark',
  'Eccl': 'Ec',
  'Ecc': 'Ec',
  'Josh': 'Jos',
  'Psalm': 'Ps',
  'Chron': 'Chr',
  'Zch': 'Zech',
  'Zach': 'Zech',
  'Ths': 'Th',
  'Rois': 'Kings',
  'Psaumes': 'Ps',
  'Hébreux': 'Heb',
  'Phillipiens': 'Phil',
  'Matthieu': 'Mt',
  'Chroniques': 'Chr',
  'Nombres': 'Num',
  'Marc': 'Mark',
  'Jean': 'john',
  'Joel': 'Joel',
  'Jeremie': 'Jer',
  'Luc': 'Luk',
  'Osee': 'Hos',
  'Proverbes': 'Pro',
  'Corinthiens': 'Cor',
  'Genèse': 'Gen',
  'Mic': 'Mi',
  'Jud': 'Jude',
  'Thes': 'Th',
  'Sos': 'Song'
}

const humanDic = {
  'Is': 'Esaie',
  'Mat': 'Matthieu',
  'Act': 'Actes',
  'Acts': 'Actes',
  'De': 'Deuteronome',
  'Luk': 'luc',
  'Gal': 'Galates',
  'Col': 'Colossiens',
  'Ps': 'Psaumes',
  'Jer': 'Jeremie',
  'Joel': 'Joel',
  'Eze': 'Ezekiel',
  'Neh': 'Nehemie',
  'Pr': 'Proverbes',
  'S': 'Samuel',
  'Sam': 'Samuel',
  'Gen': 'Genese',
  'Ex': 'Exode',
  'Exo': 'Exode',
  'Num': 'Nombres',
  'Job': 'Job',
  'Rom': 'Romains',
  'Mt': 'Matthieu',
  'Chr': 'Chroniques',
  'Eph': 'Ephesiens',
  'Lk': 'Luc',
  'Mk': 'Marc',
  'Mark': 'Marc',
  'James': 'Jacques',
  'Ge': 'Genese',
  'Cor': 'Corinthiens',
  'Jn': 'Jean',
  'Pro': 'Proverbes',
  'Tim': 'Timothee',
  'Peter': 'Pierre',
  'Pet': 'Pierre',
  'Matt': 'Matthieu',
  'Kgs': 'Roi',
  'Hos': 'Osee',
  'Ho': 'Osee',
  'K': 'Roi',
  'Kings': 'Roi',
  'Isa': 'Esaie',
  'Heb': 'Hebreux',
  'Jam': 'Jacques',
  'Rev': 'Apocalypse',
  'Phl': 'Philippiens',
  'Jos': 'Josue',
  'Zeph': 'Sophonie',
  'Hab': 'Habacuc',
  'Ez': 'Ezekiel',
  'Hag': 'Aggée',
  'Zech': 'Zacharie',
  'Zch': 'Zacharie',
  'Dan': 'Daniel',
  'Isaiah': 'Esaie',
  'John': 'Jean',
  'Luke': 'Luc',
  'Isaiah': 'Esaie',
  'Ec': 'Ecclesiaste',
  'Ruth': 'Ruth',
  'Amos': 'Amos',
  'Th': 'Thessaloniciens',
  'Thes': 'Thessaloniciens',
  'Mal': 'Malachie',
  'Jude': 'Jude',
  'Mi': 'Miché',
  'Judges': 'Juges',
  'Song': 'Cantiques',
  'Obad': 'Abdias',
  'Ezra': 'Esdras',
  'Lev': 'Lévitique'
}

function humanBook(verse) {
  let verseSplitedByFullColumn = verse.split(':');

  let bookAndChapter = '';

  if (verseSplitedByFullColumn[0].match(/^\d/gi)) {
    bookAndChapter = verseSplitedByFullColumn[1];
  } else {
    bookAndChapter = verseSplitedByFullColumn[0];
  }

  let book = bookAndChapter.match(/^[a-zA-Z]*/gi);

  for (let i in humanDic) {
    if (book[0].toLocaleLowerCase() == i.toLocaleLowerCase()) {
      return humanDic[i];
    }
  }
}

function humanVerse(verse) {
  let verseSplitedByFullColumn = verse.split(':');

  let bookAndChapter = '';
  let bookFirstPart = '';
  let complexeBook = false;
  // let book = '';
  // let chapter = '';

  if (verseSplitedByFullColumn[0].match(/^\d/gi)) {
    // bookAndChapter = verseSplitedByFullColumn[1];
    bookAndChapter = verseSplitedByFullColumn[0].match(/[a-zA-Z]*[0-9]+/gi)[1];
    bookFirstPart = verseSplitedByFullColumn[0].match(/^\d/gi)[0];
    complexeBook = true;
  } else {
    bookAndChapter = verseSplitedByFullColumn[0];
  }

  try {
    let book = bookAndChapter.match(/^[a-zA-Z]*/gi);
    let chapter = bookAndChapter.match(/\d*$/gi)[0];

    for (let i in humanDic) {
      if (book[0].toLocaleLowerCase() == i.toLocaleLowerCase()) {
        if (complexeBook) {
          return bookFirstPart + ' ' + humanDic[i] + ' ' + chapter + ':' + verseSplitedByFullColumn[1];
        }
        return humanDic[i] + ' ' + chapter + ':' + verseSplitedByFullColumn[1];
      }
    }
  } catch (e) {
    console.error(e);
  }
}

exports.generate = generate;
