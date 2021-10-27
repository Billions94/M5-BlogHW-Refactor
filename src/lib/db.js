import fs from 'fs-extra'
import { fileURLToPath } from "url";
import { dirname, join, } from 'path'
import path from "path"

const { readJSON, writeJSON, writeFile, createReadStream } = fs 

export const dataFolderPath = join(dirname(fileURLToPath(import.meta.url)), '../datas')

export const publicFolderPath = join(process.cwd(), './public/img/post')
console.log(publicFolderPath)



export const blogsJSONPath = join(dataFolderPath, 'post.json')
export const authorJSONPath = join(dataFolderPath, 'authors.json')
console.log(blogsJSONPath)

export const getBlogs = () => readJSON(blogsJSONPath)
export const writeBlogs = content => writeJSON(blogsJSONPath, content)

export const getAuthors = () => readJSON(authorJSONPath)
export const writeAuthors = content => writeJSON(authorJSONPath, content)

export const savePostImg = (fileName, contentAsBuffer) => writeFile(join(publicFolderPath, fileName), contentAsBuffer)

export const getBlogsReadableStream = () => createReadStream(blogsJSONPath)



export const getBlogById = async(id) => {
    try {
        // read the blog array
        const blogPost = await getBlogs();
        // find a blog by id
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
        // read the blog array
        const authors = await getAuthors();
        // find a blog by id
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
        // delete blog by id
        let blogPosts = await getBlogs()
        const blog = blogPosts.find((blog )=> blog.id === id);
        if(blog) {
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

