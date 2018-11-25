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
      options: {
        url: '{DOMAIN}/api/{SITE}',
      },
      resolve: 'gatsby-source-sitefinity',
    },
  ],
}
```
