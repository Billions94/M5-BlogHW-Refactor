import express from "express";
import uniqid from "uniqid";
import createHttpError from "http-errors";
import { blogsValidation } from "./validation.js";
import { body, validationResult } from "express-validator";
import * as db from "../../lib/db.js";
import path from "path";
import fs from "fs-extra";
import multer from "multer";

const upload = multer();

const blogPostRouter = express.Router();

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

// To get a single blog post with id
blogPostRouter.get("/:id", async (req, res, next) => {
  try {
    const blogPost = await db.getBlogById(req.params.id);
      res.send(blogPost);
  } catch (error) {
    console.error(error);
    next(error);
  }
});

// Get all comments 
blogPostRouter.get("/:id/comments", async (req, res, next) => {
  try {
    const posts = await db.getBlogs()
    console.log(`i am the posts`,posts)

    const singlePost = posts.find(post => post.id === req.params.id)
    console.log(`i'm the single post`,singlePost)
    
    res.send(singlePost.comments)
  } catch (error) {
    next(error);
  }
})



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

 // post picture to blog post 

 blogPostRouter.post(
  "/:id/cover",
  multer().single("cover"),
  async (req, res, next) => {
    try {
      const extention = path.extname(req.file.originalname);
      const fıleName = req.params.id + extention;
    
      if (req.file) {
        await db.savePostImg(fıleName, req.file.buffer);

        const converUrl = `http://localhost:3001/img/post/${req.params.id}${extention}`;

        const posts = await db.getBlogs();

        const post = posts.find((p) => p.id === req.params.id);

        post.cover = converUrl;
      

        const postArray = posts.filter((p) => p.id !== req.params.id);

        postArray.push(post);

        await db.writeBlogs(postArray);
        res.send(post);
      } else {
        console.log(req.file.buffer);
      }
    } catch (error) {
      console.log(req.file);
      next(error);
    }
  }
);


// To update a single comment with id
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

// To delete a blog post
blogPostRouter.delete("/:id", async (req, res, next) => {
  try {
    await db.deleteBlog(req.params.id);
    res.status(204).send();
  } catch (error) {
    console.error(error);
    next(error);
  }
});

blogPostRouter.delete("/:id/comment", async(req, res, next) => {
    try {
        await db.deleteBlogComment()
        res.status(208).send()
    } catch (error) {
        next(error);
    }
})



// post comment in blog POST
  blogPostRouter.post(
    "/:blogId/comment",
  
    async (req, res, next) => {
      try {
        const { text, userName } = req.body;
  
        const comment = { id: uniqid(), text, userName, createdAt: new Date() };
  
        const blogs = await db.getBlogs();
  
        const index = blogs.findIndex((blog) => blog.id === req.params.blogId);
  
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
// Update comment
  blogPostRouter.put(
    "/:blogId/comments",
  
    async (req, res, next) => {
      try {
        const { text, userName } = req.body;
  
        const comment = { id: uniqid(), text, userName, createdAt: new Date() };
  
        const blogs = await db.getBlogs();
  
        const index = blogs.findIndex((blog) => blog.id === req.params.blogId);
  
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




export default blogPostRouter;
