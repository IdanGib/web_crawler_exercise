const { writeFileSync } = require('fs');
const htmlparser2 = require("htmlparser2");
const axios = require('axios');

class HtmlParser {
  getPageImagesAndLinks(page) {
    const data = {
      links: [],
      images: [],
    };
    return new Promise((resolve, reject) => {
      const parser = new htmlparser2.Parser({
          onopentag(name, attributes) {
              if (name === "img") {
                  data.images.push(attributes.src);
                
              }
              if (name === "link") {
                  data.links.push(attributes.href);
              }
          },
          onerror(err) {
            reject(err);
          },
          onend() {
            resolve(data);
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
    const data = await new HtmlParser().getPageImagesAndLinks(page);
    writeFileSync(outputFilePath, JSON.stringify({ data }));
  }
}

module.exports = {
  Crawler
}