import express from 'express';
import cors from 'cors';
import listEndpoints from 'express-list-endpoints';
import { badRequest, unAuthorized, notFound, genericError } from './errorsHandler.js'
import { join } from 'path'
import blogPostRouter from './apis/blogPost/router.js';
import authorsRouter from './apis/author/author.js';

const server = express();
const port = 3001;

const publicFolderPath = join(process.cwd(),"./public")

server.use(cors())
server.use(express.json())

server.use(express.static(publicFolderPath))
server.use('/post', blogPostRouter)
server.use('/authors', authorsRouter)
console.table(listEndpoints(server))

server.use(badRequest)
server.use(unAuthorized)
server.use(notFound)
server.use(genericError)




server.listen(port, ()=> {
    console.log('listening on port', port)
})