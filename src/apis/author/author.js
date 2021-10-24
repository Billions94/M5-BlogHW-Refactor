import express from "express";
import * as db from "../../lib/db.js";
import uniqid from "uniqid"
import multer from "multer"

const authorsRouter = express.Router()

const upload = multer()

// get all authors
authorsRouter.get("/", async(req, res, next) => {
try {
    const authors = await db.getAuthors()
    res.status(200).send(authors)
} catch (error) {
    next(error);
}
})

// get single author 
authorsRouter.get("/:id", async(req, res, next) => {
try {
   const authors = await db.getAuthorById(req.params.id)
    res.send(authors);
} catch (error) {
    next(error);
}
})

// post a new author 
authorsRouter.post("/", async(req, res, next) => {
try {
    const authors = await db.getAuthors()

    const newAuthor = {
        id:uniqid(),  
        ...req.body,
        createdAt: new Date(),
    }

    authors.push(newAuthor)
    await db.writeAuthors(authors)

    res.status(203).send(newAuthor)
    console.log(`new author created`,newAuthor)
} catch (error) {
    next(error);
}    
})

// post new avatar to the author
authorsRouter.post("/:id/avatar", upload.single("avatar"), async(req, res, next) => {
try {
    console.log('this is ', req.params.id)
    const extention = path.extname(req.file.originalname);
    const fileName = req.params.id + extention;

    if(req.file){
         await db.savePostImg(fileName, req.file.buffer)

         const authors = await db.getAuthors()
         const author = authors.find(a => a.id === req.params.id)
         const authorArray = authors.filter(a => a.id !== req.params.id)

         const avatar = `http://localhost:3001/img/post/${req.params.id}${extention}`
         author.avatar = avatar
         authorArray.push(author)

         await db.writeAuthors(authorArray)
         res.send(author)
         console.log(`avatar upload`, author)
    } else {
        console.log("Error try to upload avatar");
    }
} catch (error) {
    next(error);
}   
})

authorsRouter.put("/:id", async(req, res, next) => {
try {
    const authors = await db.getAuthors();
    const index = authors.findIndex((blog) => blog.id === req.params.id);
    const editedPost = {
      ...authors[index],
      ...req.body,
      updatedAt: new Date(),
      id: req.params.id,
    };
    authors[index] = editedPost;

    await db.writeAuthors(authors);
    res.send(editedPost);
} catch (error) {
    next(error);
}
})

authorsRouter.delete("/:id", async(req, res, next) => {
try {
    const authors = await db.getAuthors()

    const remainingAuthors = authors.filter(a => a.id !== req.params.id)
     
    await db.writeAuthors(remainingAuthors)
    res.status(204).send()
} catch (error) {
    next(error);
}    
})

export default authorsRouter