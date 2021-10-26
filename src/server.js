import express from "express";
import cors from "cors";
import listEndpoints from "express-list-endpoints";
import {
  badRequest,
  unAuthorized,
  notFound,
  genericError,
} from "./errorsHandler.js";
import { join } from "path";
import blogPostRouter from "./apis/blogPost/router.js";
import authorsRouter from "./apis/author/author.js";

const server = express();

const publicFolderPath = join(process.cwd(), "./public");

const acceptedDomains = [process.env.FE_LOCAL_URL, process.env.FE_PROD_URL];

const corsOpt = {
  origin: function (origin, next) {
    console.log(`CURRENT ORIGIN`, origin);
    if (!origin || acceptedDomains.indexOf(origin) !== -1) {
      next(null, true);
    } else {
      next(new Error("CORS error"));
    }
  },
};

server.use(cors(corsOpt));
server.use(express.json());

server.use(express.static(publicFolderPath));
server.use("/post", blogPostRouter);
server.use("/authors", authorsRouter);

server.use(badRequest);
server.use(unAuthorized);
server.use(notFound);
server.use(genericError);

const port = process.env.PORT;

console.table(listEndpoints(server));

server.listen(port, () => {
  console.log("listening on port", port);
});
