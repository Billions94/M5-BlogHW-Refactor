import { body } from "express-validator";

export const blogsValidation = [
    body("title").exists().withMessage("Title is required!"),
    body("category").exists().withMessage("Category is required!"),
    // body("author.name").exists().withMessage("Author's name is required!")
  ];