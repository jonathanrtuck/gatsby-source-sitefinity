const axios = require('axios');
const querystring = require('querystring');
const camelCase = require('lodash/camelCase');
const crypto = require('crypto');
const { error, success } = require('./console');
const every = require('lodash/every');
const isArray = require('lodash/isArray');
const isObject = require('lodash/isObject');
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
 * @param {string} configOptions.baseUrl
 * @param {string} configOptions.serviceName
 * @param {string[]} configOptions.types
 * @param {object} configOptions.authentication
 * @param {number} configOptions.pageSize
 * @returns {Promise}
 * @see https://www.gatsbyjs.org/docs/source-plugin-tutorial/
 * @see https://www.gatsbyjs.org/docs/node-apis/#sourceNodes
 */
exports.sourceNodes = (
  { actions, createNodeId },
  { languages, baseUrl, serviceName, types, authentication, pageSize = 50 },
  cb
) => {
  axios.interceptors.request.use((request) => {
    console.log('Starting Request', request.url, request.data);
    return request;
  });

  /**
   * validate url configuration option.
   */
  if (!isString(baseUrl) || isEmpty(baseUrl)) {
    return error(
      'you must provide a sitefinity api url in the gatsby-source-sitefinity plugin in gatsby-config.js'
    );
  }

  /**
   * validate url configuration option.
   */
  if (!isString(serviceName) || isEmpty(serviceName)) {
    return error(
      'you must provide a sitefinity api serviceName in the gatsby-source-sitefinity plugin in gatsby-config.js'
    );
  }

  /**
   * @constant
   * @type {boolean}
   */
  const hasAuthentication =
    isObject(authentication) &&
    !isEmpty(authentication) &&
    !isEmpty(authentication.username) &&
    isString(authentication.username) &&
    !isEmpty(authentication.password) &&
    isString(authentication.password) &&
    !isEmpty(authentication.client_id) &&
    isString(authentication.client_id) &&
    !isEmpty(authentication.client_secret) &&
    isString(authentication.client_secret);

  /**
   * validate authentication configuration option.
   */
  if (!isUndefined(authentication) && !hasAuthentication) {
    return error(
      `invalid authentication option: ${JSON.stringify(
        authentication
      )}. must be object contains non empty username, password.`
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
   * @type {boolean}
   */
  const hasTypes = isArray(types) && !isEmpty(types) && every(types, isString);

  /**
   * validate types configuration option.
   */
  if (!isUndefined(types) && !hasTypes) {
    return error(`invalid types option: ${types}. must be a string array.`);
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
  const siteUrl = `${baseUrl.replace(/\/$/, '')}/api/${serviceName}`;

  const authenticationRequest = () => {
    return axios.post(
      `${baseUrl}/Sitefinity/Authenticate/OpenID/connect/token`,
      querystring.stringify({
        username: authentication.username,
        password: authentication.password,
        grant_type: 'password',
        scope: 'openid',
        client_id: authentication.client_id,
        client_secret: authentication.client_secret,
      })
    );
  };

  const dataRequests = () => {
    /**
     * get list of content types.
     * @type {Promise}
     */
    return axios({
      url: siteUrl,
    })
      .then(
        /**
         * create and fire count request for each content type.
         * @function
         * @param {object} response
         * @returns {Promise}
         */

        (response) => {
          const toBeQueriedTypes = hasTypes
            ? response.data.value.filter((item) => {
                return types.indexOf(item.name) !== -1;
              })
            : response.data.value;

          return axios.all(
            toBeQueriedTypes
              .reduce((requests, { name, url }) => {
                if (hasLanguages) {
                  return requests.concat(
                    languages.map((language) => ({
                      _language: language,
                      _type: name,
                      url: `${siteUrl}/${url}/$count?sf_culture=${language}`,
                    }))
                  );
                }
                return [
                  ...requests,
                  {
                    _type: name,
                    url: `${siteUrl}/${url}/$count`,
                  },
                ];
              }, [])
              .map(axios)
          );
        }
      )
      .then(
        /**
         * create and fire request for each content type.
         * @function
         * @param {object} response
         * @returns {Promise}
         */
        (response) =>
          axios.all(
            response
              .reduce(
                /**
                 * @function
                 * @param {object[]} requests
                 * @param {object} obj
                 * @param {string} obj.name
                 * @param {string} obj.url
                 * @returns {object[]}
                 */
                (requests, { config, data }) => {
                  // calculate number of requests based on total count, page size for each language if provided
                  let skip = 0;
                  const top = pageSize;
                  const totalCount = data;
                  const totalRequestsCount = Math.ceil(totalCount / top);
                  if (hasLanguages) {
                    return requests.concat(
                      ...[...Array(totalRequestsCount)].map((_, i) => {
                        const currentPageRequest = {
                          _language: config._language,
                          _type: config._type,
                          url: `${siteUrl}/${config._type}?$skip=${skip}&$top=${top}&$expand=*&sf_culture=${config._language}`,
                        };
                        skip += pageSize;
                        return currentPageRequest;
                      })
                    );
                  }

                  return [
                    ...[...Array(totalRequestsCount)].map((_, i) => {
                      const currentPageRequest = {
                        _type: config._type,
                        url: `${siteUrl}/${config._type}?$skip=${skip}&$top=${top}&$expand=*`,
                      };
                      skip += pageSize;
                      return currentPageRequest;
                    }),
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
          cb();
        }
      )
      .catch(
        /**
         * @function
         */
        (ex) => {
          if (ex.response && ex.response.status === 401) {
            error(
              `cannot get content from sitefinity. ${ex.message} , please provide correct username and password`
            );
          } else {
            error(
              `cannot get content from sitefinity. ${JSON.stringify(
                ex.message
              )}`
            );
          }
        }
      );
  };

  if (hasAuthentication) {
    authenticationRequest()
      .then((response) => {
        axios.defaults.headers.common[
          'Authorization'
        ] = `${response.data.token_type} ${response.data.access_token}`;
        dataRequests();
      })
      .catch(
        /**
         * @function
         */
        (ex) => {
          error(`cannot get content from sitefinity. ${JSON.stringify(ex)}`);
        }
      );
  } else {
    dataRequests();
  }
};
