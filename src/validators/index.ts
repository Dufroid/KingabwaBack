import { z } from 'zod';

const uploadAssetSchema = z.union([
  z.string().url(),
  z.string().startsWith('/uploads/'),
  z.string().startsWith('uploads/'),
]);

export const registerSchema = z.object({
  firstName: z.string().min(2, 'Le prénom doit contenir au moins 2 caractères'),
  lastName: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  phone: z.string().trim().min(8, 'Le numéro de téléphone est requis').refine((value) => /^\+?[0-9\s\-()]{8,20}$/.test(value), {
    message: 'Numéro de téléphone invalide',
  }),
  password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
});

export const loginSchema = z.object({
  phone: z.string().trim().min(8, 'Renseignez un numéro de téléphone valide'),
  password: z.string().min(1, 'Le mot de passe est requis'),
});

export const castVoteSchema = z.object({
  editionId: z.string().min(1, 'L\'identifiant de l\'édition est requis'),
  categoryId: z.string().min(1, 'L\'identifiant de la catégorie est requis'),
  nomineeId: z.string().min(1, 'L\'identifiant du candidat est requis'),
  voteType: z.enum(['FREE', 'PAID']).default('FREE'),
  paymentReference: z.string().trim().optional(),
});

export const proposalSchema = z.object({
  nomineeName: z.string().min(2, 'Le nom du candidat est requis'),
  proposedCategory: z.string().min(2, 'La catégorie proposée est requise'),
  profession: z.string().min(2, 'La profession/domaine est requis'),
  biography: z.string().min(10, 'Une courte biographie est requise'),
  achievements: z.string().min(10, 'Les réalisations sont requises'),
  reason: z.string().min(10, 'La raison de la nomination est requise'),
  referenceLinks: z.string().optional(),
  proposerInformation: z.object({
    fullName: z.string().min(2, 'Votre nom est requis'),
    email: z.string().email('Votre e-mail est invalide'),
    phone: z.string().optional(),
  }),
});

export const createCategorySchema = z.object({
  editionId: z.string().min(1),
  name: z.string().min(2),
  description: z.string().min(5),
  icon: z.string().optional(),
  image: z.string().optional(),
  votingEnabled: z.boolean().optional(),
  order: z.number().optional(),
});

export const createNomineeSchema = z.object({
  editionId: z.string().min(1),
  categoryId: z.string().min(1),
  fullName: z.string().min(2),
  profileImage: uploadAssetSchema,
  shortBio: z.string().optional().default(''),
  biography: z.string().optional().default(''),
  achievements: z.array(z.string()).optional(),
  socialLinks: z.object({
    facebook: z.string().optional(),
    twitter: z.string().optional(),
    instagram: z.string().optional(),
    linkedin: z.string().optional(),
    youtube: z.string().optional(),
  }).optional(),
});

export const createBlogPostSchema = z.object({
  title: z.string().min(3),
  excerpt: z.string().min(10),
  content: z.string().min(20),
  featuredImage: uploadAssetSchema,
  mediaType: z.enum(['IMAGE', 'VIDEO', 'PDF']).optional().default('IMAGE'),
  categoryId: z.string().min(1),
  tags: z.array(z.string()).optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
});
