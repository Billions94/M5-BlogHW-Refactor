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

// To post a new blog post
blogPostRouter.post("/",  async (req, res, next) => {
    try {
        console.log(req.body)
      const errorList = validationResult(req);
      let { name, avatar, value, unit, title, category } = req.body
      const author = {name, avatar}
      const readTime = {value, unit}
      title = title
      category = category
  
      if (!errorList.isEmpty()) {
        next(createHttpError(400, { errorList }));
      } else {
          
          const newPost = {
            ...req.body,
          category,
          title,
          cover: ``,
          readTime,
          author,
          comments: [],
          createdAt: new Date(),
          id: uniqid(),
        };
        const blogPost = await db.getBlogs();
        blogPost.push(newPost);
  
        // await db.savePostImg(req.file.originalname, req.file.buffer);
        await db.writeBlogs(blogPost);
  
        res.status(203).send(newPost);
      }
    } catch (error) {
      next(error);
    }
  });

 // post picture to blog post 
blogPostRouter.post("/:id/uploadSingle", upload.single("picture"), async (req, res, next) => {
  try {
    const errorList = validationResult(req);

    if (!errorList.isEmpty()) {
      next(createHttpError(400, { errorList }));
    } else {
        let { name, avatar, value, unit, title, category } = req.body
        const author = {name, avatar}
        const readTime = {value, unit}
        title = title
        category = category


      const picture = `http://localhost:3001/img/post/${req.file.originalname}`;
      let newPicture = {
            category,
            title,
            cover: picture,
            readTime,
            author,
            comments: [],
            createdAt: new Date(),
        id: uniqid(),
      };

      await db.savePostImg(req.file.originalname, req.file.buffer);
      const posts = await db.makeBlogPost(newPicture);

      res.status(201).send(posts);
    }
  } catch (error) {
    next(error);
  }
});

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

// To update a single comment with id
blogPostRouter.put("/:id/comment", async(req, res, next) => {
    try {
       const blogComments = await db.getCommentsById(req.params.id)
       res.send(blogComments)
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

// To update a blog post
blogPostRouter.put("/:Id", upload.single("picture"), async (req, res, next) => {
    try {
      const errorList = validationResult(req);
  
      if (!errorList.isEmpty()) {
        next(createHttpError(404, { errorList }));
      } else {
        let { name, avatar, value, unit, title, category } = req.body
        const author = {name, avatar}
        const readTime = {value, unit}
        title = title
        category = category

        const blogs = await db.getBlogs();
        const index = blogs.findIndex((blog) => blog.id === req.params.Id);

        const picture = `http://localhost:3001/img/post/${req.file.originalname}`;

        const editedPost = {
            category,
            title,
            cover: picture,
            readTime,
            author,
            comments: [],
          updatedAt: new Date(),
          id: req.params.Id,
        };
        blogs[index] = editedPost;

        await db.savePostImg(req.file.originalname, req.file.buffer);
  
        await db.writeBlogs(blogs);
        res.send(editedPost);
      }
    } catch (error) {
      next(error);
    }
  });

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


  blogPostRouter.put(
    "/:blogId/cover",
    multer().single("picture"),
  
    async (req, res, next) => {
      try {
        const blogs = await db.getBlogs();
  
        const index = blogs.findIndex((blog) => blog.id === req.params.blogId);
  
        const extention = path.extname(req.file.originalname);
  
        await db.savePostImg(req.params.blogId + extention, req.file.buffer);
  
        const coverUrl = `http://localhost:3001/img/post/${req.params.blogId}${extention}`;
  
        const editedPost = {
          ...blogs[index],
          cover: coverUrl,
          updatedAt: new Date(),
          id: req.params.blogId,
        };
  
        blogs[index] = editedPost;
  
        await db.writeBlogs(blogs);
        res.send(editedPost);
      } catch (error) {
        next(error);
      }
    }
  );

export default blogPostRouter;
