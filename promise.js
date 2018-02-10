'use strict';
// https://github.com/danmactough/node-feedparser/issues/166
// For concurrency support:
// https://github.com/visionmedia/batch
// https://github.com/Automattic/kue

/**
 * Module dependencies.
 */

const
  Promise     = require('bluebird'),
  request     = require('request'),
  FeedParser  = require('feedparser');


const fetchPromise = (url) => {
  return new Promise((resolve, reject) => {
    if (!url) { return reject(new Error(`Bad URL (url: ${url}`)); }

    const
      feedparser = new FeedParser(),
      items     = [];

    feedparser.on('error', (e) => {
      return reject(e);
    }).on('readable', () => {
      // This is where the action is!
      var item;
      

      while (item = feedparser.read()) {
        items.push(item)
        // article.articleLink = item["link"];
        // article.articleTitle = item["title"];
        // article.articleDescription = item["description"];
        // items[i] = article;
        // i++;
      }
    }).on('end', () => {
      resolve({
        meta: feedparser.meta,
        records: JSON.stringify(items, undefined, 4)
      });
    });

    request({
      method: 'GET',
      url: url
    }, (e, res, body) => {
      if (e) {
        return reject(e);
      }

      if (res.statusCode != 200) {
        return reject(new Error(`Bad status code (status: ${res.statusCode}, url: ${url})`));
      }

      feedparser.end(body);
    });
  });
};

module.exports.fetchPromise = fetchPromise;