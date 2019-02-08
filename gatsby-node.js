const axios = require('axios');
const camelCase = require('lodash/camelCase');
const crypto = require('crypto');
const { error, success } = require('./console');
const every = require('lodash/every');
const isArray = require('lodash/isArray');
const isEmpty = require('lodash/isEmpty');
const isString = require('lodash/isString');
const isUndefined = require('lodash/isUndefined');
const upperFirst = require('lodash/upperFirst');

/**
 * @function
 * @param {object} obj
 * @param {object} obj.actions
 * @param {function} obj.createNodeId
 * @param {object} configOptions
 * @param {string[]} [configOptions.languages]
 * @param {string} configOptions.url
 * @returns {Promise}
 * @see https://www.gatsbyjs.org/docs/source-plugin-tutorial/
 * @see https://www.gatsbyjs.org/docs/node-apis/#sourceNodes
 */
exports.sourceNodes = ({ actions, createNodeId }, { languages, url }) => {
  /**
   * validate url configuration option.
   */
  if (!isString(url) || isEmpty(url)) {
    return error(
      'you must provide a sitefinity api url in the gatsby-source-sitefinity plugin in gatsby-config.js'
    );
  }

  /**
   * @constant
   * @type {boolean}
   */
  const hasLanguages =
    isArray(languages) && !isEmpty(languages) && every(languages, isString);

  /**
   * validate languages configuration option.
   */
  if (!isUndefined(languages) && !hasLanguages) {
    return error(
      `invalid languages option: ${languages}. must be a string array.`
    );
  }

  /**
   * @constant
   * @type {function}
   */
  const { createNode } = actions;
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
            .reduce(
              /**
               * @function
               * @param {object[]} requests
               * @param {object} obj
               * @param {string} obj.name
               * @param {string} obj.url
               * @returns {object[]}
               */
              (requests, { name, url }) => {
                if (hasLanguages) {
                  return requests.concat(
                    languages.map(
                      /**
                       * @function
                       * @param {string} language
                       * @returns {object}
                       */
                      (language) => ({
                        _language: language,
                        _type: name,
                        url: `${siteUrl}/${url}?$expand=*&sf_culture=${language}`,
                      })
                    )
                  );
                }

                return [
                  ...requests,
                  {
                    _type: name,
                    url: `${siteUrl}/${url}?$expand=*`,
                  },
                ];
              },
              []
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
             * @param {object} response.config
             * @param {object} response.data
             * @returns {object[]}
             */
            (arr, { config, data }) =>
              arr.concat(
                data.value.map(
                  /**
                   * add getsby node properties.
                   * @function
                   * @param {object} obj
                   * @returns {object}
                   */
                  (obj) => {
                    /**
                     * @constant
                     * @type {object}
                     */
                    const node = {
                      ...obj,
                      children: [],
                      id: createNodeId(
                        `sitefinity-${obj.Id}-${config._language}`
                      ),
                      internal: {
                        content: JSON.stringify(obj),
                        contentDigest: crypto
                          .createHash('md5')
                          .update(JSON.stringify(obj))
                          .digest('hex'),
                        // prepend to avoid naming collisions with other source plugins
                        type: `Sitefinity${upperFirst(
                          camelCase(config._type)
                        )}`,
                      },
                      parent: null,
                    };

                    if (hasLanguages) {
                      return {
                        ...node,
                        language: config._language,
                      };
                    }

                    return node;
                  }
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
