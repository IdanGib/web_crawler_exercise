const { writeFileSync } = require('fs');
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

class Crawler {
  async extractImages({ outputFilePath, depth = 0, url }) {
    const page = await new WebPage().getPage(url);
    const { images } = await new HtmlParser().extract(page, [
      { tag: 'img', attr: 'src', name: 'images' }
    ]);
    const results = images.map(src => ({ imageUrl: src, sourceUrl: url, depth }));
    writeFileSync(outputFilePath, JSON.stringify({
      results
    }));
  }
}

module.exports = {
  Crawler
}