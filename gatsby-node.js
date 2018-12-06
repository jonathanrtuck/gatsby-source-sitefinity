import {error, success} from './console';

import axios from 'axios';
import crypto from 'crypto';

/**
 * @constant
 * @function
 * @param {object} obj
 * @param {object} obj.actions
 * @param {function} obj.createNodeId
 * @param {object} configOptions
 * @param {string} configOptions.url
 * @returns {Promise}
 * @see https://www.gatsbyjs.org/docs/source-plugin-tutorial/
 * @see https://www.gatsbyjs.org/docs/node-apis/#sourceNodes
 */
export const sourceNodes = ({actions, createNodeId}, {url}) => {
  /**
   * validate configuration options.
   */
  if (typeof url !== 'string' || url === '') {
    return error('you must provide a sitefinity api url in the gatsby-source-sitefinity plugin in gatsby-config.js');
  }

  /**
   * @constant
   * @type {function}
   */
  const {createNode} = actions;
  /**
   * remove trailing slash.
   * @constant
   * @type {string}
   */
  const siteUrl = url.replace(/\/$/, '');

  /**
   * get list of content types.
   * @type {Promise}
   */
  return axios({
    url: siteUrl,
  })
    .then(
      /**
       * create and fire request for each content type.
       * @function
       * @param {object} response
       * @returns {Promise}
       */
      (response) =>
        axios.all(
          response.data.value
            .map(
              /**
               * create axios configuration. save 'name' property value for use as content type identifier.
               * @function
               * @param {object} obj
               * @returns {object}
               */
              (obj) => ({
                _type: obj.name,
                url: `${siteUrl}/${obj.url}?$expand=*`,
              })
            )
            .map(axios)
        )
    )
    .then(
      /**
       * parse responses and create gatsby nodes for all content items.
       * @function
       * @param {object[]} responses
       */
      (responses) => {
        responses
          .reduce(
            /**
             * create array of all content items.
             * @function
             * @param {object[]} arr
             * @param {object} response
             * @returns {object[]}
             */
            (arr, response) =>
              arr.concat(
                response.data.value.map(
                  /**
                   * add getsby node properties.
                   * @function
                   * @param {object} obj
                   * @returns {object}
                   */
                  (obj) => ({
                    ...obj,
                    children: [],
                    id: createNodeId(obj.Id),
                    internal: {
                      content: JSON.stringify(obj),
                      contentDigest: crypto
                        .createHash('md5')
                        .update(JSON.stringify(obj))
                        .digest('hex'),
                      // mediaType: obj.MimeType,
                      type: `Sitefinity${response.config._type}`, // prepend to avoid naming collisions with other source plugins
                    },
                    parent: null,
                  })
                )
              ),
            []
          )
          .forEach(
            /**
             * create gatsby node for each content item.
             * @function
             * @param {object} obj
             */
            (obj) => {
              createNode(obj);
            }
          );
      }
    )
    .then(
      /**
       * @function
       */
      () => {
        success('create sitefinity content nodes');
      }
    )
    .catch(
      /**
       * @function
       */
      () => {
        error(
          'cannot get content from sitefinity. have you provided the correct url in the gatsby-source-sitefinity plugin in gatsby-config.js?'
        );
      }
    );
};
