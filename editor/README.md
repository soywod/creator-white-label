# Editor

This repository contains the source code of canvas editor. It has been written with:

- [TypeScript](https://www.typescriptlang.org/)
- [React](https://reactjs.org/)
- [Fabric.js](http://fabricjs.com/)
- [Create React App](https://create-react-app.dev/)
- [Rollup](https://rollupjs.org/guide/en/)

## Requirements

- [Node.js](https://nodejs.org/en/)
- [Yarn](https://yarnpkg.com/)

## Installation

```sh
git clone git@github.com:graphorizon/creator-editor.git editor
cd editor
yarn
```

## Development

```sh
yarn start
```

The development server should be availabe at `http://localhost:3000`.

## Production

To build the demo using create-react-app:

```sh
NODE_ENV=production yarn build
```

To build the lib version using rollup (used by the admin and the e-shop):

```sh
NODE_ENV=production yarn lib
```
