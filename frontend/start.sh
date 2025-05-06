#!/bin/bash

# Set NODE_OPTIONS environment variable to allow legacy OpenSSL provider
export NODE_OPTIONS=--openssl-legacy-provider

# Start the React application
npm start
