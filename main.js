const {Crawler} = require('./crawler');

function main() {
  const crawler = new Crawler();
  crawler.extractImages({ outputFilePath: 'results.json', depth: 0, url: 'https://picsum.photos' });
}

main();