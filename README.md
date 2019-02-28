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
      },
    },
  ],
}
```

**Note:** Content type names are converted to Pascal case and prepended with _Sitefinity_ to avoid potential naming collisions. For example, a content type of `content-items` in Sitefinity can be queried in GraphQL as `allSitefinityContentItems`.

## Options

- ### `url` (_required_)
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
