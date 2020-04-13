# gatsby-source-sitefinity

## Installation

```
yarn add gatsby-source-sitefinity
```

## Usage

In `gatsby-config.js`:

```
module.exports = {
  plugins: [
    {
      resolve: 'gatsby-source-sitefinity',
      options: {
        languages: [{ LANGUAGE CODE }, { LANGUAGE CODE }, …],
        url: '{ DOMAIN }/api/{ SITE }',
        pageSize: Number
      },
    },
  ],
}
```

**Note:** Content type names are converted to Pascal case and prepended with _Sitefinity_ to avoid potential naming collisions. For example, a content type of `content-items` in Sitefinity can be queried in GraphQL as `allSitefinityContentItems`.

## Options

- ### `baseUrl` (_required_)
  - define your sitefinity Instance URL
- ### `serviceName` (_required_)
   - define your sitefinity service name
- ### `types`
   - use it in case you want to whitelist types to be processed by the plugin
   - example `["pages","news"]`
- ### `authentication`
   - use it in case you want to use sitefinity APIs with authentication required, if not present the plugin will consider that the APIs are public
   - for more information how to setup sitefinity authentication follow this link `https://www.progress.com/documentation/sitefinity-cms/authentication-and-web-services`
   - authentication object must contain the following properties 
    
| name 	| description 	|
|---------------	|-----------------------------------	|
| username 	| provide sitefinity username/email 	|
| password 	| sitefinity user password to login 	|
| client_id 	| your API client ID 	|
| client_secret 	| your API client secret 	|

    

 
- ### `languages`
  - Used to set the `sf_culture` url parameter.
  - If absent, nodes will be created for all content items of the _default language_.
  - If present, nodes will be created for all content items of _all languages_ passed. Example query:
    ```
    {
      allSitefinityContentItems(filter: {language: {eq: "en"}}) {
        edges {
          node {
            Id
            Title
          }
        }
      }
    }
    ```
- ### `pageSize`
  - Used to set `$top` url parameter.
  - if absent, by default the size will be 50 items