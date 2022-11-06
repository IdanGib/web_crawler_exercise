const { writeFileSync, readFileSync } = require('fs');
const htmlparser2 = require("htmlparser2");
const axios = require('axios');
const { isEmpty, flatten } = require('lodash');

class HtmlParser {
  extract(page, data) {
    const result = {};
    return new Promise((resolve, reject) => {
      const parser = new htmlparser2.Parser({
          onopentag(tagName, attributes) {
              let attrValue;
              for (const { tag, attr, name } of data) {
                attrValue = attributes?.[attr];
                if (tagName === tag && attrValue) {
                  if(!result[name]) {
                    result[name] = [];
                  }
                  result[name].push(attrValue);
                }
              }
          },
          onerror(err) {
            reject(err);
          },
          onend() {
            resolve(result);
          }
      });
      parser.write(page);
      parser.end();
    });
  }
}

class WebPage {
  async getPage(url) {
    try {
      const { data } = await axios.get(url);
      return data;
    } catch(e) {
      console.error(e?.message);
      return "";
    }
  }
}

class CrawlerHelper {
  static updateResultsFile({ outputFilePath, results }) {
    const buff = readFileSync(outputFilePath);
    const { results: res } = JSON.parse(buff.toString()) || {};
    res.push(...results);
    writeFileSync(outputFilePath, JSON.stringify({ results: res }));
  }
  static clearResultsFile({ outputFilePath }) {
    writeFileSync(outputFilePath,JSON.stringify({ results: [] }));
  }
  static async extractPageImagesAndLinks({ urls }) {
    const webPage = new WebPage();
    const parser = new HtmlParser();
    const results = await Promise.allSettled(urls.map(async sourceUrl => {
      const page = await webPage.getPage(sourceUrl);
      const {images, links} = await  parser.extract(page, [
        { tag: 'img', attr: 'src', name: 'images' },
        { tag: 'a', attr: 'href', name: 'links' }
      ]);
      return {
        sourceUrl,
        images: images,
        links: links.filter(l => l.startsWith('https://'))
      };
    }));
    const data = results.filter(r => r.status === 'fulfilled').map(r => r.value);
    return data;
  }
}

class Crawler {
  async extractImages({ outputFilePath, depth = 0, urls }) {
    if (isEmpty(urls) || isEmpty(outputFilePath) || depth < 0) {
      return;
    }
    if (depth < 0) {
      return;
    }
    const _depth = Math.floor(depth);
    const pages = await CrawlerHelper.extractPageImagesAndLinks({ urls });
    const pagelinks = [];
    const results = flatten(pages.map(({ images, sourceUrl, links }) => {
      pagelinks.push(...links);
      return images.map(src => ({
        sourceUrl,
        imageUrl: src,
        depth: _depth
      }));
    }));
    CrawlerHelper.updateResultsFile({outputFilePath, results });
    await this.extractImages({ urls: pagelinks, depth: _depth - 1, outputFilePath }); 
  }
}


async function main() {
  const [url, depth] = process.argv.slice(2);
  const crawler = new Crawler();
  const config = {
    outputFilePath: 'results.json', 
    depth, 
    urls: [url]
  };
  CrawlerHelper.clearResultsFile({ outputFilePath: config.outputFilePath });
  await crawler.extractImages(config);
}

main();