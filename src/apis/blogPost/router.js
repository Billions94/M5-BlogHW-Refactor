//   **********************        CODE BY EJIROGHENE     ***********************     //

import express from "express";
import uniqid from "uniqid";
import createHttpError from "http-errors";
import { blogsValidation } from "./validation.js";
import { body, validationResult } from "express-validator";
import * as db from "../../lib/db.js";
import { getPDFReadableStream, generatePDFAsync } from "../../lib/pdfTools.js"
import multer from "multer";
import json2csv from "json2csv"
import { CloudinaryStorage } from "multer-storage-cloudinary"
import { v2 as cloudinary } from "cloudinary"
import { pipeline } from "stream"
import { sendEmailToUser } from "../../lib/emailTools.js"
import fs from "fs-extra"



const blogPostRouter = express.Router();
// CLOUDINARY STORAGE
const cloudinaryStorage = new CloudinaryStorage({
  cloudinary, // CREDENTIALS, 
  params: {
    folder: "alex-blogs",
  },
})

//**********************************************STREAMING CONTENT ***************************************/

blogPostRouter.get("/downloadJSON", async (req, res, next) => {
  try {
    // SOURCE (file on disk, request, ....) --> DESTINATION (file on disk, terminal, response...)

    // In this example we are going to have: SOURCE (file on disk --> books.json) --> DESTINATION (response)

    res.setHeader("Content-Disposition", "attachment; filename=post.json") // This header tells the browser to do not open the file, but to download it

    const source = db.getBlogsReadableStream()
   
    const destination = res

    pipeline(source, destination, err => {
      if (err) next(err)
    })
  } catch (error) {
    next(error)
  }
})

blogPostRouter.get("/downloadCSV", async (req, res, next) => {
  try {
   
    res.setHeader("Content-Disposition", "attachment; filename=post.csv") 

    const source = db.getBlogsReadableStream()
   
    const transform = new json2csv.Transform({ fields: ["author.name"] })
    const destination = res

    pipeline(source, transform, destination, err => {
      if (err) next(err)
    })
  } catch (error) {
    next(error)
  }
})

blogPostRouter.get("/:id/downloadPDF", async(req, res, next) => {
  try {
    const data = await db.getBlogs()
    const singleBlogPost = data.find(b => b.id === req.params.id)

    if(!singleBlogPost){
      res
      .status(404)
      .send({ message: `blog with ${req.params.id} is not found!` });
    } else {
      res.setHeader("Content-Disposition", `attachment; filename=${singleBlogPost.id}.pdf`)

      const source = await getPDFReadableStream(singleBlogPost) 
      const destination = res
  
      pipeline(source, destination, err => {
        if (err) next(err)
      })
    }
  } catch (error) {
    next(error)
  }
})

// ******************************BLOG SECTION WITH IMAGE UPLOAD*********************
// GET ALL BLOG POST
blogPostRouter.get("/", async (req, res, next) => {
  try {
    console.log(req.body);
    const blogPost = await db.getBlogs();
    res.send(blogPost);
  } catch (error) {
    next(error);
  }
});

//GET SINGLE BLOG POST BY ID
blogPostRouter.get("/:id", async (req, res, next) => {
  try {
    const blogPost = await db.getBlogById(req.params.id);
      res.send(blogPost);
  } catch (error) {
    console.error(error);
    next(error);
  }
});

// TO CREATE NEW BLOG POST
blogPostRouter.post("/", multer({ storage: cloudinaryStorage }).single("cover"),  async (req, res, next) => {
  try {
      console.log(req.body)
    const errorList = validationResult(req);

    if (!errorList.isEmpty()) {
      next(createHttpError(400, { errorList }));
    } else {         
        const newPost = {
          id: uniqid(),
          ...req.body,
        cover:req.file.path,
        createdAt: new Date(),
      };
      const blogPost = await db.getBlogs();
      blogPost.push(newPost);
      await db.writeBlogs(blogPost);

    // CREATING THE NAME OF THE  PDF
    const path = await generatePDFAsync(newPost)
    // CONVERTING OUR PDF IMAGE TO BASE64
		const attachment = fs.readFileSync(path).toString("base64")
      // SENDING THE USER AN EMAIL WITH AN ATTACHMENT CONVERTED TO BASE64 FOR DISPLAY IMAGE ON THE PDF
      await sendEmailToUser("ajlexy70@gmail.com", attachment, newPost.id)
      // SENDING THE NEW POST 
      res.status(203).send(newPost);
    }
  } catch (error) {
    next(error);
  }
});

// EDIT COVER PHOTO
blogPostRouter.post(
"/:id/cover",
multer({ storage: cloudinaryStorage }).single("cover"),
async (req, res, next) => {
  try {

    if (req.file) {
      // READ THE BLOG ARRAY
      const posts = await db.getBlogs();
       // FIND A BLOG POST BY ID
      const post = posts.find((p) => p.id === req.params.id);
     // UPDATE THE COVER IMAGE WITH THE CORRECT URL
      post.cover = req.file.path;
     // FILTERING THE ARRAY
      const postArray = posts.filter((p) => p.id !== req.params.id);
      // PUSHING INTO THE NEWLY FILTERED ARRAY THE POST WITH THE CORRECT COVER URL
      postArray.push(post);
      // WRITING BACK TO THE ARRAY TO SAVE THE UPDATE AND UPDATING THE IMAGE ON THE CLOUD
      await db.writeBlogs(postArray);
      res.send("Image uploaded on Cloudinary");
    } else {
      console.log(req.file.buffer);
    }
  } catch (error) {
    console.log(req.file);
    next(error);
  }
});


  // DELETE BLOG POST BY ID
  blogPostRouter.delete("/:id", async (req, res, next) => {
    try {
      // DELETE A BLOG BY ID PASSED AS A PARAMETER 
      await db.deleteBlog(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error(error);
      next(error);
    }
  });


// *******************************COMMENTS SECTION *****************************
// POST A BLOG COMMENT 
blogPostRouter.post(
  "/:blogId/comments",

  async (req, res, next) => {
    try {
      // RETREIVING THE FIELD WE NEED FOR THE COMMENTS
      const { text, userName } = req.body;
      // CREATING NEW COMMENT
      const comment = { id: uniqid(), text, userName, replies: [], createdAt: new Date() };
      // READING THE FILE FROM THE BLOG ARRAY(DISK)
      const blogs = await db.getBlogs();
      // FINDING THE INDEX OF THE COMMENT ARRAY IN THE BLOG POST ARRAY
      const index = blogs.findIndex(b => b.id === req.params.blogId);
      // CREATING A COMMENT ARRAY IN THE BLOG POST ARRAY IF THERE IS NONE EXISTING
      blogs[index].comments = blogs[index].comments || [];
      
      const editedPost = blogs[index];
      // PUSHING INTO THE BLOGS COMMENT ARRAY THE NEW COMMENT
      editedPost.comments.push(comment);

      blogs[index] = editedPost;
      // WRITING BACK TO THE ARRAY TO SAVE THE UPDATE
      await db.writeBlogs(blogs);
      res.send(editedPost);
    } catch (error) {
      next(error);
    }
  }
);

// GET ALL COMMENTS FROM A SINGLE BLOG POST
blogPostRouter.get("/:id/comments", async (req, res, next) => {
  try {
     // READ THE BLOG ARRAY
    const posts = await db.getBlogs()
     // FIND A COMMENT BY ID
    const singlePost = posts.find(p => p.id === req.params.id)
    // SENDING THE FOUNDED COMMENT AS RESPONSE
    res.send(singlePost.comments)
  } catch (error) {
    next(error);
  }
})


// EDIT AND UPDATE A BLOG COMMENT
blogPostRouter.put("/:postId/comments/:commentId", async(req, res, next) => {
  try {
    // READING THE BLOG ARRAY
    const posts = await db.getBlogs()
    console.log(`i am the posts`,posts)
    // FINDING A POST BY ID
    const singlePost = posts.find(p => p.id === req.params.postId)
    // GETTING THE INDEX OF THE POST ID WE WANT TO UPDATE
    const index = posts.findIndex(p => p.id === req.params.postId)
    // GETTING THE COMMENT INDEX WE WANT TO UPDATE 
    const indexComment = singlePost.comments.findIndex(c => c.id === req.params.commentId)
    // UPDATING THE COMMENT WITH A MODIFIED OBJECT
    posts[index].comments[indexComment] = {
      ...posts[index].comments[indexComment],
      ...req.body,
      updatedAt: new Date()       
    }
    // WRITING BACK TO THE ARRAY TO SAVE THE UPDATE
    await db.writeBlogs(posts)
    // SENDING THE UPDATE COMMENT AS A RESPONSE 
    res.send(posts[index].comments[indexComment])
  } catch (error) {
      console.log(error)
      next(error);
  }
})

// POST A NEW COMMENT IN A PREVIOUS COMMENT

blogPostRouter.post("/:id/comments/:commentId", async(req, res, next) => {
  try {
    const { text, userName } = req.body;

    const reply = { 
      id: uniqid(), 
      text,
      userName,
      createdAt: new Date()
    }

    const posts = await db.getBlogs()

    const post = posts.find(p => p.id === req.params.id)

    const index = posts.findIndex(p => p.id === req.params.id)

    const indexComment = post.comments.findIndex(c => c.id === req.params.commentId)

    posts[index].comments[indexComment].replies.push(reply)
    console.log(posts[index].comments[indexComment])

    await db.writeBlogs(posts)
    res.status(201).send(reply)
  } catch (error) {
    next(error)
  }
})

// DELETE A BLOG COMMENT 
blogPostRouter.delete("/:postId/comments/:commentId", async(req, res, next) => {
  try {
    const posts = await db.getBlogs()
    // FINDING A POST BY ID
    const singlePost = posts.find(p => p.id === req.params.postId)
      // GETTING THE INDEX OF THE POST ID WE WANT TO DELETE
    const index = posts.findIndex(p => p.id === req.params.postId)
    // FILTERING BY ID AND RETURNING THE COMMENTS LEFT
    const comment = singlePost.comments.filter(c => c.id !== req.params.commentId)
    // ASSIGNING BLOG POST COMMENT ARRAY THE COMMENTS LEFT AFTER DELETING THE COMMENT
    singlePost.comments = comment
    console.log(comment)
    // ASSINGING THE INDEX OF THE COMMENT WE NEED TO DELETE
    posts[index] = singlePost
    // WRITING BACK TO THE BLOG POST ARRAY(DISK) TO SAVE THE UPDATED INFO
    await db.writeBlogs(posts)
    res.status(204).send()
    console.log("Comment Deleted ---->", comment);

  } catch (error) {
    console.log(error)
    next(error)
  }
})







export default blogPostRouter;

//   **********************        CODE BY EJIROGHENE     ***********************     //