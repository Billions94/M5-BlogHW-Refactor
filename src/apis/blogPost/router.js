import express from "express";
import uniqid from "uniqid";
import createHttpError from "http-errors";
import { blogsValidation } from "./validation.js";
import { body, validationResult } from "express-validator";
import * as db from "../../lib/db.js";
import {getPDFReadableStream} from "../../lib/pdfTools.js"
import multer from "multer";
import json2csv from "json2csv"
import { CloudinaryStorage } from "multer-storage-cloudinary"
import { v2 as cloudinary } from "cloudinary"
import { pipeline } from "stream"
import { sendRegistrationEmail } from "../../lib/emailTools.js"

const upload = multer();

const blogPostRouter = express.Router();

const cloudinaryStorage = new CloudinaryStorage({
  cloudinary, // CREDENTIALS, this line of code is going to search in your process.env for something called CLOUDINARY_URL
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
    // const transform = createGzip()
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
    // SOURCE (file on disk, request, ....) --> DESTINATION (file on disk, terminal, response...)

    // In this example we are going to have: SOURCE (file on disk --> books.json) --> DESTINATION (response)

    res.setHeader("Content-Disposition", "attachment; filename=post.csv") // This header tells the browser to do not open the file, but to download it

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
      res.setHeader("Content-Disposition", `attachment; filename=${singleBlogPost.id}.pdf`)// This header tells the browser to do not open the file, but to download it

      const source = await getPDFReadableStream(singleBlogPost) // PDF READABLE STREAM
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
// To get all blog posts
blogPostRouter.get("/", async (req, res, next) => {
  try {
    console.log(req.body);
    const blogPost = await db.getBlogs();
    res.send(blogPost);
  } catch (error) {
    next(error);
  }
});

//To get a single blog post with id
blogPostRouter.get("/:id", async (req, res, next) => {
  try {
    const blogPost = await db.getBlogById(req.params.id);
      res.send(blogPost);
  } catch (error) {
    console.error(error);
    next(error);
  }
});

// To post a new blog post
blogPostRouter.post("/",  async (req, res, next) => {
  try {
      console.log(req.body)
    const errorList = validationResult(req);

    if (!errorList.isEmpty()) {
      next(createHttpError(400, { errorList }));
    } else {         
        const newPost = {
          id: uniqid(),
          ...req.body,
        createdAt: new Date(),
      };
      const blogPost = await db.getBlogs();
      blogPost.push(newPost);

      await db.writeBlogs(blogPost);
      res.status(203).send(newPost);
    }
  } catch (error) {
    next(error);
  }
});

// Post picture/cover to blog post 
blogPostRouter.post(
"/:id/cover",
multer({ storage: cloudinaryStorage }).single("cover"),
async (req, res, next) => {
  try {

    if (req.file) {
      
      const posts = await db.getBlogs();
      
      const post = posts.find((p) => p.id === req.params.id);
     
      post.cover = req.file.path;

      const postArray = posts.filter((p) => p.id !== req.params.id);

      postArray.push(post);

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

// blogPostRouter.post("/uploadCloudinary", multer({ storage: cloudinaryStorage }).single("cover"), async (req, res, next) => {
//   try {
//     console.log(req.file)
//     res.send("Image uploaded on Cloudinary")
//   } catch (error) {
//     next(error)
//   }
// })

  // To delete blog post
  blogPostRouter.delete("/:id", async (req, res, next) => {
    try {
      await db.deleteBlog(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error(error);
      next(error);
    }
  });


// *******************************COMMENTS SECTION *****************************
// post comment in blog 
blogPostRouter.post(
  "/:blogId/comments",

  async (req, res, next) => {
    try {
      const { text, userName } = req.body;

      const comment = { id: uniqid(), text, userName, createdAt: new Date() };

      const blogs = await db.getBlogs();

      const index = blogs.findIndex(b => b.id === req.params.blogId);

      blogs[index].comments = blogs[index].comments || [];

      const editedPost = blogs[index];
      editedPost.comments.push(comment);

      blogs[index] = editedPost;

      await db.writeBlogs(blogs);
      res.send(editedPost);
    } catch (error) {
      next(error);
    }
  }
);

// Get all comments 
blogPostRouter.get("/:id/comments", async (req, res, next) => {
  try {
    const posts = await db.getBlogs()
    console.log(`i am the posts`,posts)

    const singlePost = posts.find(p => p.id === req.params.id)
    console.log(`i'm the single post`,singlePost)
    
    res.send(singlePost.comments)
  } catch (error) {
    next(error);
  }
})


// To edit and update a single comment with id
blogPostRouter.put("/:postId/comments/:commentId", async(req, res, next) => {
  try {
    const posts = await db.getBlogs()
    console.log(`i am the posts`,posts)

    const singlePost = posts.find(p => p.id === req.params.postId)
    const index = posts.findIndex(p => p.id === req.params.postId)
    const indexComment = singlePost.comments.findIndex(c => c.id === req.params.commentId)
    posts[index].comments[indexComment] = {
      ...posts[index].comments[indexComment],
      ...req.body,
      updatedAt: new Date()       
    }

    await db.writeBlogs(posts)

    console.log(`i'm the single post`,singlePost)
    
    res.send(posts[index].comments[indexComment])
  } catch (error) {
      console.log(error)
      next(error);
  }
})

// Delete a comment 
blogPostRouter.delete("/:postId/comments/:commentId", async(req, res, next) => {
  try {
    const posts = await db.getBlogs()

    const singlePost = posts.find(p => p.id === req.params.postId)
    const index = posts.findIndex(p => p.id === req.params.postId)
    const comment = singlePost.comments.filter(c => c.id !== req.params.commentId)
    singlePost.comments = comment
    console.log(comment)

    posts[index] = singlePost
    await db.writeBlogs(posts)

    res.status(204).send()
    console.log("Comment Deleted ---->", comment);

  } catch (error) {
    console.log(error)
    next(error)
  }
})


blogPostRouter.post("/register", async (req, res, next) => {
  try {
    // 1. Receive email address via req.body
    const { email } = req.body

    // 2. Send email on that address
    await sendRegistrationEmail(email)

    // 3. Send ok
    res.send("ok")
  } catch (error) {
    res.status(400).send(error.message)
   // next(error)
  }
})



export default blogPostRouter;
