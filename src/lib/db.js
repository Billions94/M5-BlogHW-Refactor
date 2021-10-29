//   **********************        CODE BY EJIROGHENE     ***********************     //

import fs from 'fs-extra'
import { fileURLToPath } from "url";
import { dirname, join, } from 'path'

const { readJSON, writeJSON, writeFile, createReadStream } = fs 

export const dataFolderPath = join(dirname(fileURLToPath(import.meta.url)), '../datas')

export const publicFolderPath = join(process.cwd(), './public/img/post')
console.log(publicFolderPath)



export const blogsJSONPath = join(dataFolderPath, 'post.json')
export const authorJSONPath = join(dataFolderPath, 'authors.json')
console.log(blogsJSONPath)

// READING THE PATH OF OUR JSON FILE ON THE DISK
export const getBlogs = () => readJSON(blogsJSONPath)
// WRITING BACK TO OUR JSON FILE ON THE DISK
export const writeBlogs = content => writeJSON(blogsJSONPath, content)
// READING THE PATH OF OUR JSON FILE ON THE DISK
export const getAuthors = () => readJSON(authorJSONPath)
// WRITING BACK TO OUR JSON FILE ON THE DISK
export const writeAuthors = content => writeJSON(authorJSONPath, content)
// WRITING TO OUR LOCAL PUBLIC FOLDER WHERE WE WANT TO SAVE THE IMAGE
export const savePostImg = (fileName, contentAsBuffer) => writeFile(join(publicFolderPath, fileName), contentAsBuffer)
// CREATING A READABLE STREAM FROM OUR JSON FILE ON THE DISK 
export const getBlogsReadableStream = () => createReadStream(blogsJSONPath)



export const getBlogById = async(id) => {
    try {
        // READ THE BLOG ARRAY
        const blogPost = await getBlogs();
        // FIND A BLOG MY ID
        const blog = blogPost.find((blog) => blog.id === id);
        if(blog){
            console.log({blog});
            return blog;
        } else {
            throw new Error(`blog with ${id} is not found!`);   
        }     
    } catch (error) {
        throw new Error(`blog with ${id} is not found!`);   
    }
}

export const getAuthorById = async(id) => {
    try {
         // READ THE BLOG ARRAY
        const authors = await getAuthors();
        // FIND A BLOG MY ID
        const author = authors.find((a) => a.id === id);
        if(author){
            console.log({author});
            return author;
        } else {
            throw new Error(`author with ${id} is not found!`);   
        }     
    } catch (error) {
        throw new Error(`author with ${id} is not found!`);   
    }
}




export const deleteBlog = async(id) => {
    try {
        // DELETE A BLOG BY ID
        let blogPosts = await getBlogs()
        const blog = blogPosts.find((blog )=> blog.id === id);
        if(blog) {
            // FILTERING BY ID AND RETURNING THE BLOGS LEFT
            blogPosts = blogPosts.filter(blog => blog.id !== id);
            // const filePath = path.join(publicFolderPath, blog.fileName)
            // console.log(filePath)
            // await fs.unlink(savePostImg)
            await writeBlogs(blogPosts)
            return blog
        }else {
            throw new Error(`blog with ${id} is not found!`);
        }     
    } catch (error) {
        console.error(error)
    }
}

//   **********************        CODE BY EJIROGHENE     ***********************     //