let fs = require('fs');
let request = require('request');
let versesAliases = 'Mat|Is|Act|Acts|Deut|Luk|Gal|Col|Ps|Jer|Joel|Ezek|Neh|Pr' + 
'|Num|Job|Mt|Lk|Chr|Sam|Eph|Mk|James|Rom|Rm|Ex|Exo|Gen|Cor|Jn|Tim|Pro' + 
'|Peter|Pet|Matt|Kgs|Hos|Jam|Heb|Isa|Rev|Prov|Phil|Jos|Zeph|Hab|Zph|Ezk|Hag|Actes|Joe|Joel' + 
'|Psa|Zech|Dan|Phi|Mak|John|Luke|Isaiah|Eccl|Ruth|Kings|Psalm|Josh|Chron|Amos|Zch|Ths|Mal|Hébreux' +
'|Matthieu|Chroniques|Rois|Psaumes|Exode|Nombres|Marc|Phillipiens|Jean|Jude|Kg|Zach|Joel|'+
'|Jeremie|Job|Luc|Osee|Proverbes|Corinthiens|Genèse|Mic|Judges|Cantiques|Song|Jud|Thes|Ecc|sos|Obad|Ezra|Lev';



let versesExtractor = {
  extract: () => {
    fs.readFile('./assets/verses.txt', 'utf8', (err, data) => {

      if (err) {
        console.error('erreur d\'ouverture du fichier', err);
        return;
      }``
      let cleaned = data.replace(/[\s\n\t]/g, '').toLowerCase();
      let regexString = `[1-9]*(${versesAliases.toLowerCase()}).?[0-9]+:[0-9]+(-[0-9]+)?((\/[0-9]+)?(-[0-9]+)?)*`;
      let regex = new RegExp(regexString, 'gi');
      let verses = cleaned.match(regex)


      //add dot and replace full column by dot
      for (let i in verses) {

        if (verses[i].indexOf('.') != -1) {
          verses[i] = verses[i].replace(/\./gi, '');
        }
      }

      verses = versesExtractor.splitVerses(verses);

      console.log('nombre de verses', verses.length);

      verses = versesExtractor.normalizeVerses(verses);

      verses.reduce((p, verse) => {
        return p.then(() => {
          return versesExtractor.getVerses(verse)
            .then(verseObject => {
              if(verseObject != null) {
                versesExtractor.writeVersesToFile(verseObject, verse);
              }
            });
        });
      }, Promise.resolve()).then(() => {
        console.log('all good');
      }).catch(err => {
       console.error(err);
      });
    });
  },

  writeVersesToFile: (verseObject, verse) => {
    let textToWrite = versesExtractor.humanVerse(verse) + '\n';
    fs.appendFileSync('./assets/verses-text.txt', textToWrite, 'utf-8');

    try {
      for (let j in verseObject.book[0].chapter) {
        let chapterObject = verseObject.book[0].chapter[j];
        let txt = chapterObject.verse_nr + ' ' + chapterObject.verse;
        fs.appendFileSync('./assets/verses-text.txt', txt, 'utf-8');
      }
    }catch(err) {
      // console.error(err);
      // console.log('verseObject', verseObject);
      console.log('verse', verse);
    }
    
    fs.appendFileSync('./assets/verses-text.txt', '\n', 'utf-8');
  },

  getVerses: (verse) => {
    let url = `http://getbible.net/json?p=${verse}&v=ls1910`;

    return new Promise((resolve, reject) => {

      let options = {
        headers: {
          'User-Agent': 'request'
        }
      }

      request.get(url, options, (err, httpResponse, body) => {
        if (err) {
          // console.error(err);
          console.error(url);
          reject(err);
        }
        let result = body.replace(/\);|^\(/gi, '');

        try{
          resolve(JSON.parse(result));
        }catch(err) {
          console.log('url', url);
          // console.error(err);
          resolve(null);
        }
      });
    });
  },

  normalizeVerses: (verses) => {
    for (let i in verses) {
      let v = verses[i];
      let verseSplited = v.split(':');
      let dic = versesExtractor.normalizationDic;

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
  },

  splitVerses: (verses) => {
    let newVerses = [];

    for (let i in verses) {
      let v = verses[i];
      let verseSplitedBySlash = v.split('/');
      let verseSplitedByFullColumn = v.split(':');


      if (verseSplitedBySlash.length > 1) {
        let chapter = '';

        if (verseSplitedBySlash[0].match(/^\d/gi)) {
          chapter = verseSplitedBySlash[1];
        } else {
          chapter = verseSplitedBySlash[0];
        }

        newVerses.push(verseSplitedBySlash[0]);
        newVerses.push(verseSplitedByFullColumn[0] + ':' + verseSplitedBySlash[1]);
      } else {
        newVerses.push(v);
      }
    }

    return newVerses;
  },

  normalizationDic: {
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
  },

  humanDic: {
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
  },

  humanBook: (verse) => {
    let verseSplitedByFullColumn = verse.split(':');

    let bookAndChapter = '';

    if (verseSplitedByFullColumn[0].match(/^\d/gi)) {
      bookAndChapter = verseSplitedByFullColumn[1];
    } else {
      bookAndChapter = verseSplitedByFullColumn[0];
    }

    let book = bookAndChapter.match(/^[a-zA-Z]*/gi);

    for (let i in versesExtractor.humanDic) {
      if (book[0].toLocaleLowerCase() == i.toLocaleLowerCase()) {
        return versesExtractor.humanDic[i];
      }
    }
  },

  humanVerse: (verse) => {
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
  
      for (let i in versesExtractor.humanDic) {
        if (book[0].toLocaleLowerCase() == i.toLocaleLowerCase()) {
          if(complexeBook) {
            return bookFirstPart + ' ' + versesExtractor.humanDic[i] + ' ' + chapter + ':' + verseSplitedByFullColumn[1];
          }
          return versesExtractor.humanDic[i] + ' ' + chapter + ':' + verseSplitedByFullColumn[1];
        }
      }
    }catch(e) {
      console.error(e);
    }
  }
}

module.exports = versesExtractor;