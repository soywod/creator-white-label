# Admin

This repository contains the source code of the back office (administration panel). It has been written with:

- [TypeScript](https://www.typescriptlang.org/)
- [React](https://reactjs.org/)
- [Create React App](https://create-react-app.dev/)
- [Ant Design](https://ant.design/)

## Requirements

- [Node.js](https://nodejs.org/en/)
- [Yarn](https://yarnpkg.com/)

## Installation

The editor should be installed first, in a folder named `editor` at the same level (because the admin depends on it, see the `package.json`).

```sh
git clone git@github.com:graphorizon/creator-admin.git admin
cd admin
yarn
```

## Development

```sh
yarn start
```

The development server should be availabe at `http://localhost:3000`.

## Production

```sh
NODE_ENV=production yarn build
```

This generates an archive `build.tar.gz` that can be deployed manually to the server using FTP.

## Update the editor version

To update the editor version contained in the admin:

```sh
# go to the editor folder and build the lib
cd editor
yarn lib

# for the production lib, prefix with:
NODE_ENV=production yarn lib

# remove the `node_modules` folder to avoid react version conflicts
mv node_modules ../

# go to the admin folder and reinstall the editor
cd ../admin
yarn remove creator
yarn add ../editor

# build the admin
yarn build

# for the production build, prefix with:
NODE_ENV=production yarn build
```


*** Server issue path fix ssh
everything needs to be moved to /var/www/admin.pictosigns.io/build


