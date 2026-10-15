"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createBlogPostSchema = exports.createNomineeSchema = exports.createCategorySchema = exports.proposalSchema = exports.castVoteSchema = exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
exports.registerSchema = zod_1.z.object({
    firstName: zod_1.z.string().min(2, 'Le prénom doit contenir au moins 2 caractères'),
    lastName: zod_1.z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
    email: zod_1.z.string().email('Adresse e-mail invalide'),
    password: zod_1.z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
});
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Adresse e-mail invalide'),
    password: zod_1.z.string().min(1, 'Le mot de passe est requis'),
});
exports.castVoteSchema = zod_1.z.object({
    editionId: zod_1.z.string().min(1, 'L\'identifiant de l\'édition est requis'),
    categoryId: zod_1.z.string().min(1, 'L\'identifiant de la catégorie est requis'),
    nomineeId: zod_1.z.string().min(1, 'L\'identifiant du candidat est requis'),
});
exports.proposalSchema = zod_1.z.object({
    nomineeName: zod_1.z.string().min(2, 'Le nom du candidat est requis'),
    proposedCategory: zod_1.z.string().min(2, 'La catégorie proposée est requise'),
    profession: zod_1.z.string().min(2, 'La profession/domaine est requis'),
    biography: zod_1.z.string().min(10, 'Une courte biographie est requise'),
    achievements: zod_1.z.string().min(10, 'Les réalisations sont requises'),
    reason: zod_1.z.string().min(10, 'La raison de la nomination est requise'),
    referenceLinks: zod_1.z.string().optional(),
    proposerInformation: zod_1.z.object({
        fullName: zod_1.z.string().min(2, 'Votre nom est requis'),
        email: zod_1.z.string().email('Votre e-mail est invalide'),
        phone: zod_1.z.string().optional(),
    }),
});
exports.createCategorySchema = zod_1.z.object({
    editionId: zod_1.z.string().min(1),
    name: zod_1.z.string().min(2),
    description: zod_1.z.string().min(5),
    icon: zod_1.z.string().optional(),
    image: zod_1.z.string().optional(),
    votingEnabled: zod_1.z.boolean().optional(),
    order: zod_1.z.number().optional(),
});
exports.createNomineeSchema = zod_1.z.object({
    editionId: zod_1.z.string().min(1),
    categoryId: zod_1.z.string().min(1),
    fullName: zod_1.z.string().min(2),
    profileImage: zod_1.z.string().url(),
    shortBio: zod_1.z.string().min(5),
    biography: zod_1.z.string().min(10),
    achievements: zod_1.z.array(zod_1.z.string()).optional(),
    socialLinks: zod_1.z.object({
        facebook: zod_1.z.string().optional(),
        twitter: zod_1.z.string().optional(),
        instagram: zod_1.z.string().optional(),
        linkedin: zod_1.z.string().optional(),
        youtube: zod_1.z.string().optional(),
    }).optional(),
});
exports.createBlogPostSchema = zod_1.z.object({
    title: zod_1.z.string().min(3),
    excerpt: zod_1.z.string().min(10),
    content: zod_1.z.string().min(20),
    featuredImage: zod_1.z.string().url(),
    categoryId: zod_1.z.string().min(1),
    tags: zod_1.z.array(zod_1.z.string()).optional(),
    status: zod_1.z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
    metaTitle: zod_1.z.string().optional(),
    metaDescription: zod_1.z.string().optional(),
});
