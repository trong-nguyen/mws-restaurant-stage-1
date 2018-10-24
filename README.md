MWS - Restaurant Project
========================

## Descriptions

A directory that lists restaurants in a couple of neiborhoods with detail information and customer reviews. The website is fully responsive on all screen devices. You can access the site offline with cached data or data that you have accessed.

## Prerequisites

You will need `node` and npm installed to be able to build and serve using the included webserver.

Go to [nodejs.org](https://nodejs.org/en/download/) to download and install latest version of node and npm.

## Install

- Clone this repository

- Change directory to the cloned repo

- Install dependencies to build with `npm install`

- Build from source `gulp build` to have a deployable version of this website in `build` folder

## Deployment

- You can either deploy using your own webserver solution by serving folder `build`

- Or using the built-in webserver by:

    + Change directory to the repo directory

    + Issue command:

        * `gulp clean` to clean any prior build

        * `gulp build`

        * `guilp serve`

    + Go to `localhost:8000` to checkout the site
