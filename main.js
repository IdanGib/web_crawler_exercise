const {Crawler} = require('./crawler');

async function main() {
  const crawler = new Crawler();
  const config = {
    outputFilePath: 'results.json', 
    depth: 0, 
    urls: ['https://picsum.photos']
  };
  await crawler.extractImages(config);
}

main();