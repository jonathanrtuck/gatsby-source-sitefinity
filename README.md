# gatsby-source-sitefinity

## Installation

```
yarn add gatsby-source-sitefinity
```

## Use

In `gatsby-config.js`:

```
module.exports = {
  plugins: [
    {
      resolve: 'gatsby-source-sitefinity',
      options: {
        url: '{ DOMAIN }/api/{ SITE }',
      },
    },
  ],
}
```

**Note:** Content type names are converted to Pascal case and prepended with _Sitefinity_ to avoid potential naming collisions. For example, a content type of `content-items` in Sitefinity can be queried in GraphQL as `allSitefinityContentItems`.
