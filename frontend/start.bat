@echo off
REM Set NODE_OPTIONS environment variable to allow legacy OpenSSL provider
set NODE_OPTIONS=--openssl-legacy-provider

REM Start the React application
npm start
