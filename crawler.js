const { writeFileSync, readFileSync } = require('fs');
const htmlparser2 = require("htmlparser2");
const axios = require('axios');

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
}

class Crawler {
  async extractImages({ outputFilePath, depth = 0, url }) {
    CrawlerHelper.clearResultsFile({ outputFilePath });
    if (depth < 0) {
      return;
    }
    const _depth = Math.floor(depth);
    const page = await new WebPage().getPage(url);
    const { images, links } = await new HtmlParser().extract(page, [
      { tag: 'img', attr: 'src', name: 'images' },
      { tag: 'a', attr: 'href', name: 'links' }
    ]);
    const results = images.map(src => ({ imageUrl: src, sourceUrl: url, depth: _depth }));
    CrawlerHelper.updateResultsFile({ outputFilePath, results });
  }
}

module.exports = {
  Crawler
}