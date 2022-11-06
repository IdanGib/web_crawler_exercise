const {Crawler} = require('./crawler');

async function main() {
  const crawler = new Crawler();
  const config = {
    outputFilePath: 'results.json', 
    depth: 0, 
    url: 'https://picsum.photos'
  };
  await crawler.extractImages(config);
}

main();