//const http = require('http');
import * as http from 'http';

const textContentTypes = ['application/json', 'text/plain', 'application/x-www-form-urlencoded'];

function isObject(data) {
  return typeof data === 'object' && !Array.isArray(data) && data !== null;
}

// Test if anything is a string of data in correct JSON format.
function isJSON(data) {
  try {
    JSON.parse(data);
    return true;
  } catch (error) {
    return false;
  }
}

function isInteger(value) {
  return Number.isInteger(value);
}

// Test if IP is four groups of numbers separated by dots and each number between 0-255
function validateIP(ip) {
  return typeof ip === 'string' && ip.match(/^\d{1,3}[.]\d{1,3}[.]\d{1,3}[.]\d{1,3}$/) && ip.split('.').every((s) => s >= 0 && s <= 255);
}

function validatePort(port) {
  return typeof port === 'number' && isInteger(port) && port > 0 && port < 65536;
}

function objCopy(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function getParameters(url) {
  const params = new URLSearchParams(new URL(url).search);
  let result = {};

  for (let [key, value] of params) {
    // Make sure the key exists in result before pushing to its array
    if (!result[key]) result[key] = [];
    // Split the comma-separated values and add them to the array
    const values = value.split(',');
    result[key].push(...values);
  }

  return result;
}

export class JsonDb {
  constructor(database, port, ip) {
    this.webserverIp = validateIP(ip) ? ip : '0.0.0.0';
    this.webserverPort = validatePort(port) ? port : 8080;
    // If object is passed use it as database, otherwise create empty object.
    this.db = isObject(database) ? database : {};
  }

  start(port) {
    if (validatePort(port)) this.port = port;
    this.httpServer = http.createServer(async (req, res) => {
      // set default values
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Content-Type', 'application/json');
      res.statusCode = 404; // Default to not found.

      const url = new URL('http://' + req.headers.host + req.url);

      // Remove leading and trailing slash then split by slash. Remove '' as those are double filters
      const pathnameArray = url.pathname
        .split('/')
        .filter((e) => e !== '')
        .map((e) => decodeURI(e));
      const responseData = [];
      responseData.push(this.db);

      // Test if an object with the requested name exists in db (or in the case of POST sometimes create it)
      for (let i = 0; i < pathnameArray.length; i++) {
        // if post/put we should create all "parent levels"
        if (req.method === 'POST' || req.method === 'PUT') {
          // if the next level already exists, do nothing (or create it if undefined)
          if (!responseData[0][pathnameArray[i]]) {
            // if we not look at the last parameter, check if the next param is a number, of it is this is a array otherwise assume it's an object
            if (i !== pathnameArray.length - 1 && Number.isInteger(Number(pathnameArray[i + 1]))) {
              responseData[0][pathnameArray[i]] = [];
            } else {
              responseData[0][pathnameArray[i]] = {};
            }
          }
        }
        // put the last response first in the array. if this don't exist insert undefined
        responseData.unshift(responseData[0] && responseData[0][pathnameArray[i]]);
      }

      // Use URLSearchParams to manipulate the query parameters
      let params = getParameters(url);

      // data sent with request
      let data = [];

      // Collect the data as Buffer chunks
      req.on('data', (chunk) => {
        data.push(chunk); // Store the Buffer chunks without converting
      });
      req.on('end', () => {
        // If data is sent, try to convert it into a object
        if (data) {
          const contentType = req.headers['content-type'];
          if (contentType && textContentTypes.includes(contentType)) {
            data = Buffer.concat(data).toString();
            if (isJSON(data)) data = JSON.parse(data);
          }
        }

        if (responseData[0] !== undefined) {
          res.statusCode = 200;
          switch (req.method) {
            case 'GET':
              if (responseData[0] !== null && typeof responseData[0] === 'object') {
                const paramKeys = Object.keys(params);

                // if there is paramKeys there is filters to be applied, otherwise just return the full object
                if (paramKeys.length > 0) {
                  // this is what will be returned
                  const responseDataCopy = Array.isArray(responseData[0]) ? [] : {};

                  // for each element in returned data
                  Object.keys(responseData[0]).forEach((objKey) => {
                    // the object to be considered to be returned
                    const curObj = responseData[0][objKey];

                    // all params that are not 'show' are filterparams
                    const paramKeysFilters = paramKeys.filter((k) => k !== 'show');

                    // if there is no filters we should copy (return)
                    let copy = paramKeysFilters.length === 0;
                    // if there are filters copy will be false and we going to check if any of the required params are missing
                    if (!copy) {
                      // return true if there is missing match for anny of the parameters
                      copy = paramKeysFilters.every((param) => {
                        // return true if there is no match for this parameter
                        return params[param].includes(curObj[param]);
                      });
                    }
                    if (copy) {
                      // add to the responseDataCopy object in a proper way according to it's type
                      if (Array.isArray(responseDataCopy)) {
                        responseDataCopy.push(objCopy(curObj));
                      } else {
                        responseDataCopy[objKey] = objCopy(curObj);
                      }
                    }
                  });

                  // if param show is set remove other stuff
                  if (params.show && Array.isArray(params.show)) {
                    Object.keys(responseDataCopy).forEach((key) => {
                      // If an array we want to filter each context
                      if (Array.isArray(responseDataCopy)) {
                        Object.keys(responseDataCopy[key]).forEach((subKey) => {
                          if (!params.show.includes(subKey)) responseDataCopy[key][subKey] = undefined;
                        });
                      } else {
                        if (!params.show.includes(key)) responseDataCopy[key] = undefined;
                      }
                    });
                  }
                  res.write(JSON.stringify(responseDataCopy));
                } else {
                  res.write(JSON.stringify(responseData[0]));
                }
              } else {
                res.setHeader('Content-Type', 'text/plain');
                res.write(responseData[0]);
              }
              break;
            case 'DELETE':
              // don't allow to delete the root object..  403 forbidden.
              if (responseData.length <= 1) {
                res.statusCode = 403;
              } else {
                delete responseData[1][pathnameArray[pathnameArray.length - 1]];
              }
              break;
            case 'POST':
              // add so that every level is created if they are not
              if (Array.isArray(responseData[0])) {
                responseData[0].push(data);
              } else {
                if (responseData[1][pathnameArray[pathnameArray.length - 1]] === undefined) {
                  responseData[1][pathnameArray[pathnameArray.length - 1]] = data;
                } else {
                  res.statusCode = 409; // conflict
                }
              }
              break;
            case 'PUT':
              responseData[1][pathnameArray[pathnameArray.length - 1]] = data;
              break;
            case 'PATCH':
              if (typeof responseData[1][pathnameArray[pathnameArray.length - 1]] === typeof data) {
                switch (typeof data) {
                  case 'object':
                    if (Array.isArray(data)) {
                      responseData[1][pathnameArray[pathnameArray.length - 1]].push(...data);
                    } else {
                      Object.assign(responseData[1][pathnameArray[pathnameArray.length - 1]], data);
                    }
                    break;
                  default:
                    responseData[1][pathnameArray[pathnameArray.length - 1]] = data;
                }
              } else {
                res.statusCode = 409; // conflict
              }
          }
        }
        res.end();
      });
    });
    console.log(`Listening on ${this.webserverIp}:${this.webserverPort}`);
    this.httpServer.listen(this.webserverPort, this.webserverIp);
  }
}
