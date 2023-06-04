import * as fs from 'fs'

import { ServerResponse, createServer as createHttpServer } from 'http'

import { CONSOLE_LOG_SERVER_REPORTER } from '../../../src/server/reporter'
import { Reducer } from '../../../src/reducer/types'
import { chatAppReducer } from '../common'
import { createStoreServer } from '../../../src'
// eslint-disable-next-line import/order
import path from 'path'

const HTTP_SERVER_HOST = 'localhost'
const HTTP_SERVER_PORT = 4000

// 0.0.0.0 makes it reachable by not just the browser, but by "external" clients like Insomnia/Postman as well.
const STORE_SERVER_HOST = '0.0.0.0'
const STORE_SERVER_PORT = 4001

const CLIENT_SRC_REL_DIR = path.resolve(__dirname, '../../client')
const CLIENT_BUILD_REL_DIR = path.resolve(__dirname, '../client')

const getMimeType = (filePath: string) => {
  if (filePath.endsWith('.html'))
    return 'text/html'

  if (filePath.endsWith('.css'))
    return 'text/css'

  return 'text/plain'
}

const sendFile = (res: ServerResponse, filePath: string) => {
  if (!fs.existsSync(filePath)) {
    console.log(`404 - File ${filePath} does not exist`)
    res.statusCode = 404
    res.end()
    return
  }

  const fileStat = fs.statSync(filePath)
  res.writeHead(200, {
    'Content-Type': getMimeType(filePath),
    'Content-Length': fileStat.size,
  })
  fs.createReadStream(filePath).pipe(res)
}

const main = () => {
  const storeServer = createStoreServer({
    host: STORE_SERVER_HOST,
    port: STORE_SERVER_PORT,
    topics: {
      chatApp: {
        reducer: chatAppReducer as Reducer,
      },
    },
    reporter: CONSOLE_LOG_SERVER_REPORTER,
  })

  const httpServer = createHttpServer((req, res) => {
    console.log(`Handling request to ${req.url}`)
    if (req.url === '' || req.url === '/' || req.url === 'index.html') {
      sendFile(res, path.join(CLIENT_SRC_REL_DIR, 'index.html'))
      return
    }
    if (req.url === '/index.css') {
      sendFile(res, path.join(CLIENT_SRC_REL_DIR, 'index.css'))
      return
    }

    sendFile(res, path.join(CLIENT_BUILD_REL_DIR, `.${req.url}`))
  })

  httpServer.listen(HTTP_SERVER_PORT, HTTP_SERVER_HOST, () => {
    console.log(`Chat App active. Access at http://${HTTP_SERVER_HOST}:${HTTP_SERVER_PORT}.`)
  })
}

main()
