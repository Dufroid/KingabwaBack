import { Request, Response } from 'express';
import { BlogPost } from '../models/BlogPost.js';
import { BlogCategory } from '../models/BlogCategory.js';
import { createBlogPostSchema } from '../validators/index.js';
import { AuthRequest } from '../types/index.js';

export const getBlogPosts = async (req: Request, res: Response) => {
  try {
    const { category, search, tag, page = 1, limit = 10, all } = req.query;
    const includeAll = all === 'true' || all === '1';
    const filter: any = includeAll ? {} : { status: 'PUBLISHED' };

    if (category) {
      const blogCat = await BlogCategory.findOne({ slug: category as string });
      if (blogCat) filter.categoryId = blogCat._id;
    }

    if (tag) {
      filter.tags = tag;
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search as string, $options: 'i' } },
        { excerpt: { $regex: search as string, $options: 'i' } },
      ];
    }

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const posts = await BlogPost.find(filter)
      .populate('authorId', 'firstName lastName profileImage')
      .populate('categoryId', 'name slug')
      .sort({ publishedAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await BlogPost.countDocuments(filter);

    return res.json({
      success: true,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      data: posts,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getBlogPostBySlug = async (req: Request, res: Response) => {
  try {
    const post = await BlogPost.findOne({ slug: req.params.slug })
      .populate('authorId', 'firstName lastName profileImage')
      .populate('categoryId', 'name slug');

    if (!post) {
      return res.status(404).json({ success: false, message: 'Article introuvable.' });
    }

    // Get related posts
    const relatedPosts = await BlogPost.find({
      _id: { $ne: post._id },
      categoryId: post.categoryId,
      status: 'PUBLISHED',
    })
      .limit(3)
      .populate('authorId', 'firstName lastName');

    return res.json({ success: true, post, relatedPosts });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getBlogCategories = async (req: Request, res: Response) => {
  try {
    const categories = await BlogCategory.find();
    return res.json({ success: true, data: categories });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createBlogPost = async (req: AuthRequest, res: Response) => {
  try {
    const validated = createBlogPostSchema.parse(req.body);
    const slug = validated.title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-');

    const newPost = await BlogPost.create({
      ...validated,
      slug,
      authorId: req.user?.userId,
      publishedAt: validated.status === 'PUBLISHED' ? new Date() : undefined,
    });

    return res.status(201).json({ success: true, data: newPost });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const updateBlogPost = async (req: Request, res: Response) => {
  try {
    const updated = await BlogPost.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ success: false, message: 'Article introuvable.' });
    return res.json({ success: true, data: updated });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteBlogPost = async (req: Request, res: Response) => {
  try {
    const deleted = await BlogPost.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Article introuvable.' });
    return res.json({ success: true, message: 'Article supprimé.' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
