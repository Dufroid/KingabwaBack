"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteBlogPost = exports.updateBlogPost = exports.createBlogPost = exports.getBlogCategories = exports.getBlogPostBySlug = exports.getBlogPosts = void 0;
const BlogPost_js_1 = require("../models/BlogPost.js");
const BlogCategory_js_1 = require("../models/BlogCategory.js");
const index_js_1 = require("../validators/index.js");
const getBlogPosts = async (req, res) => {
    try {
        const { category, search, tag, page = 1, limit = 10, all } = req.query;
        const includeAll = all === 'true' || all === '1';
        const filter = includeAll ? {} : { status: 'PUBLISHED' };
        if (category) {
            const blogCat = await BlogCategory_js_1.BlogCategory.findOne({ slug: category });
            if (blogCat)
                filter.categoryId = blogCat._id;
        }
        if (tag) {
            filter.tags = tag;
        }
        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: 'i' } },
                { excerpt: { $regex: search, $options: 'i' } },
            ];
        }
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const skip = (pageNum - 1) * limitNum;
        const posts = await BlogPost_js_1.BlogPost.find(filter)
            .populate('authorId', 'firstName lastName profileImage')
            .populate('categoryId', 'name slug')
            .sort({ publishedAt: -1 })
            .skip(skip)
            .limit(limitNum);
        const total = await BlogPost_js_1.BlogPost.countDocuments(filter);
        return res.json({
            success: true,
            total,
            page: pageNum,
            totalPages: Math.ceil(total / limitNum),
            data: posts,
        });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.getBlogPosts = getBlogPosts;
const getBlogPostBySlug = async (req, res) => {
    try {
        const post = await BlogPost_js_1.BlogPost.findOne({ slug: req.params.slug })
            .populate('authorId', 'firstName lastName profileImage')
            .populate('categoryId', 'name slug');
        if (!post) {
            return res.status(404).json({ success: false, message: 'Article introuvable.' });
        }
        // Get related posts
        const relatedPosts = await BlogPost_js_1.BlogPost.find({
            _id: { $ne: post._id },
            categoryId: post.categoryId,
            status: 'PUBLISHED',
        })
            .limit(3)
            .populate('authorId', 'firstName lastName');
        return res.json({ success: true, post, relatedPosts });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.getBlogPostBySlug = getBlogPostBySlug;
const getBlogCategories = async (req, res) => {
    try {
        const categories = await BlogCategory_js_1.BlogCategory.find();
        return res.json({ success: true, data: categories });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.getBlogCategories = getBlogCategories;
const createBlogPost = async (req, res) => {
    try {
        const validated = index_js_1.createBlogPostSchema.parse(req.body);
        const slug = validated.title
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]/g, '-')
            .replace(/-+/g, '-');
        const newPost = await BlogPost_js_1.BlogPost.create({
            ...validated,
            slug,
            authorId: req.user?.userId,
            publishedAt: validated.status === 'PUBLISHED' ? new Date() : undefined,
        });
        return res.status(201).json({ success: true, data: newPost });
    }
    catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};
exports.createBlogPost = createBlogPost;
const updateBlogPost = async (req, res) => {
    try {
        const updated = await BlogPost_js_1.BlogPost.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updated)
            return res.status(404).json({ success: false, message: 'Article introuvable.' });
        return res.json({ success: true, data: updated });
    }
    catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};
exports.updateBlogPost = updateBlogPost;
const deleteBlogPost = async (req, res) => {
    try {
        const deleted = await BlogPost_js_1.BlogPost.findByIdAndDelete(req.params.id);
        if (!deleted)
            return res.status(404).json({ success: false, message: 'Article introuvable.' });
        return res.json({ success: true, message: 'Article supprimé.' });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.deleteBlogPost = deleteBlogPost;
