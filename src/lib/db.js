import fs from 'fs-extra'
import { fileURLToPath } from "url";
import { dirname, join, } from 'path'
import path from "path"

const { readJSON, writeJSON, writeFile} = fs 

export const dataFolderPath = join(dirname(fileURLToPath(import.meta.url)), '../datas')
// console.log(dataFolderPath)
export const publicFolderPath = join(process.cwd(), './public/img/post')
console.log(publicFolderPath)

// /Users/ejiroghene/Desktop/Strive-School/FS-Aug21/M5/M5-BlogHW-Refactor/src/datas

const blogsJSONPath = join(dataFolderPath, 'post.json')
console.log(blogsJSONPath)

export const getBlogs = () => readJSON(blogsJSONPath)
export const writeBlogs = content => writeJSON(blogsJSONPath, content)

export const savePostImg = (fileName, contentAsBuffer) => writeFile(join(publicFolderPath, fileName), contentAsBuffer)

// export const savePostImgFolder = () => writeFile(join(publicFolderPath))


export const makeBlogPost = async(obj) => {
    try {
        console.log(obj)
        // read the blog array 
        const blogPosts = await getBlogs()
        // pushing new object
        blogPosts.push(obj)
        // writing back to the disk
        await writeBlogs(blogPosts)

        return obj
    } catch (error) {
        console.error(error)
    }
}

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

export const getCommentsById = async(id) => {
    try {
        // read the blog array
        const blogComments = await getBlogs()
        // find comment by id
        const comment = blogComments.comments.find(comment => comment.id === id)
        if(comment){
            console.log({comment})
            return comment
        } else {
            throw new Error(`comment with ${id} is not found!`);   
        }
    } catch (error) {
        throw new Error(`comment with ${id} is not found!`); 
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

export const deleteBlogComment = async(id) => {
    try {
        // delete blog by id
        let blogPosts = await getBlogs()
        const blog = blogPosts.find((blog )=> blog.id === id);
        if(blog) {
            blogPosts = blogPosts.filter(blog => blog.id !== id);
            const comment = blogPosts.comments.pop()
            await writeBlogs(comment)
            return blog
        }else {
            throw new Error(`blog with ${id} is not found!`);
        }     
    } catch (error) {
        console.error(error)
    }
}