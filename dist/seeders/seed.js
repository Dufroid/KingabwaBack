"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const dotenv_1 = __importDefault(require("dotenv"));
const db_js_1 = require("../config/db.js");
const User_js_1 = require("../models/User.js");
const AwardEdition_js_1 = require("../models/AwardEdition.js");
const Category_js_1 = require("../models/Category.js");
const Nominee_js_1 = require("../models/Nominee.js");
const BlogCategory_js_1 = require("../models/BlogCategory.js");
const BlogPost_js_1 = require("../models/BlogPost.js");
const Partner_js_1 = require("../models/Partner.js");
const Winner_js_1 = require("../models/Winner.js");
const GalleryMedia_js_1 = require("../models/GalleryMedia.js");
dotenv_1.default.config();
const seed = async () => {
    console.log('🌱 Starting Kingabwa Awards Database Seeding...');
    await (0, db_js_1.connectDB)();
    // Clear existing collections
    await Promise.all([
        User_js_1.User.deleteMany({}),
        AwardEdition_js_1.AwardEdition.deleteMany({}),
        Category_js_1.Category.deleteMany({}),
        Nominee_js_1.Nominee.deleteMany({}),
        BlogCategory_js_1.BlogCategory.deleteMany({}),
        BlogPost_js_1.BlogPost.deleteMany({}),
        Partner_js_1.Partner.deleteMany({}),
        Winner_js_1.Winner.deleteMany({}),
        GalleryMedia_js_1.GalleryMedia.deleteMany({}),
    ]);
    console.log('🧹 Existing data cleared.');
    // 1. Create Super Admin & Voter Users
    const salt = await bcryptjs_1.default.genSalt(10);
    const hashedPassword = await bcryptjs_1.default.hash('Admin@2026', salt);
    const voterPassword = await bcryptjs_1.default.hash('Voter@2026', salt);
    const superAdmin = await User_js_1.User.create({
        firstName: 'Glody',
        lastName: 'Kambale',
        email: 'admin@kingabwa-awards.cd',
        password: hashedPassword,
        role: 'SUPER_ADMIN',
        isVerified: true,
    });
    const demoVoter = await User_js_1.User.create({
        firstName: 'Athanase',
        lastName: 'Mukendi',
        email: 'voter@kingabwa-awards.cd',
        password: voterPassword,
        role: 'VOTER',
        isVerified: true,
    });
    console.log('👤 Users seeded (Super Admin: admin@kingabwa-awards.cd / Admin@2026).');
    // 2. Create Award Edition 2026
    const edition2026 = await AwardEdition_js_1.AwardEdition.create({
        name: 'Kingabwa Awards 2026',
        year: 2026,
        description: '4ème Édition Officielle - Célébration de l\'Excellence, de l\'Élité et de l\'Impact Socioculturel à Kingabwa.',
        startDate: new Date('2026-01-01'),
        ceremonyDate: new Date('2026-11-28'),
        votingStartDate: new Date('2026-08-01'),
        votingEndDate: new Date('2026-11-15'),
        status: 'OPEN',
    });
    console.log('🏆 Award Edition 2026 created.');
    // 3. Create Categories
    const categoriesData = [
        {
            editionId: edition2026._id,
            name: 'Personnalité de l\'année',
            slug: 'personnalite-de-l-annee',
            description: 'Récompense l\'individu ayant eu le plus grand impact positif et le leadership le plus inspirant dans la communauté de Kingabwa.',
            icon: 'Award',
            image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=800',
            order: 1,
        },
        {
            editionId: edition2026._id,
            name: 'Entrepreneur de l\'année',
            slug: 'entrepreneur-de-l-annee',
            description: 'Honnore les bâtisseurs d\'entreprises, créateurs d\'emplois et innovateurs économiques de Kingabwa.',
            icon: 'Briefcase',
            image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800',
            order: 2,
        },
        {
            editionId: edition2026._id,
            name: 'Excellence Académique',
            slug: 'excellence-academique',
            description: 'Dédiée aux étudiants, chercheurs et éducateurs s\'étant distingués par leur parcours brillant.',
            icon: 'GraduationCap',
            image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=800',
            order: 3,
        },
        {
            editionId: edition2026._id,
            name: 'Artiste de l\'année',
            slug: 'artiste-de-l-annee',
            description: 'Célèbre les figures majeures de la musique, des arts plastiques, de la danse et de la culture de Kingabwa.',
            icon: 'Music',
            image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=800',
            order: 4,
        },
        {
            editionId: edition2026._id,
            name: 'Action Sociale & Humanitaire',
            slug: 'action-sociale-et-humanitaire',
            description: 'Met en lumière les acteurs de la société civile, ONG et bénévoles dévoués aux causes communautaires.',
            icon: 'HeartHandshake',
            image: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=800',
            order: 5,
        },
        {
            editionId: edition2026._id,
            name: 'Révélation et Jeune Talent',
            slug: 'revelation-et-jeune-talent',
            description: 'Encourage les jeunes talents prometteurs âgés de moins de 25 ans s\'illustrant par leur potentiel remarquable.',
            icon: 'Sparkles',
            image: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=800',
            order: 6,
        },
    ];
    const categories = await Category_js_1.Category.insertMany(categoriesData);
    console.log(`📁 ${categories.length} Categories seeded.`);
    // 4. Create Nominees
    const nomineesData = [
        // Personnalité de l'année
        {
            editionId: edition2026._id,
            categoryId: categories[0]._id,
            fullName: 'Dr. Joseph Tshilombo',
            slug: 'dr-joseph-tshilombo',
            profileImage: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=600',
            shortBio: 'Médecin communautaire et fondateur de la Clinique Espoir Kingabwa.',
            biography: 'Dr. Joseph Tshilombo consacre sa vie depuis plus de 15 ans à fournir des soins médicaux gratuits et accessibles aux familles défavorisées de Kingabwa.',
            achievements: [
                'Construction d\'un centre de santé maternel gratuit à Kingabwa Grand-Monde',
                'Soins prodigués à plus de 12 000 patients vulnérables',
                'Prix du Mérite de la Santé Publique 2024',
            ],
            socialLinks: { facebook: 'https://facebook.com', linkedin: 'https://linkedin.com' },
            status: 'ACTIVE',
            voteCount: 142,
        },
        {
            editionId: edition2026._id,
            categoryId: categories[0]._id,
            fullName: 'Marie-Claire Banza',
            slug: 'marie-claire-banza',
            profileImage: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=600',
            shortBio: 'Pionnière de l\'autonomisation des femmes à Kingabwa.',
            biography: 'Présidente du Réseau des Femmes Leader de Kingabwa, elle a formé plus de 500 jeunes femmes à l\'entrepreneuriat artisanal et au commerce informel.',
            achievements: [
                'Création de la Mutuelle de Crédit pour micro-entrepreneuses',
                'Organisation du Forum Annuel de la Femme de Kingabwa',
            ],
            socialLinks: { facebook: 'https://facebook.com', instagram: 'https://instagram.com' },
            status: 'ACTIVE',
            voteCount: 98,
        },
        // Entrepreneur de l'année
        {
            editionId: edition2026._id,
            categoryId: categories[1]._id,
            fullName: 'Christian Mpoyi',
            slug: 'christian-mpoyi',
            profileImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=600',
            shortBio: 'Fondateur de Kingabwa Logistics & Clean Services.',
            biography: 'Pionnier dans le domaine du recyclage des plastiques et de la logistique fluviale à Kingabwa, Christian emploie plus de 80 jeunes du quartier.',
            achievements: [
                'Création de la première unité de recyclage plastique de Kingabwa',
                'Génération de 80 emplois directs pour les jeunes locaux',
            ],
            socialLinks: { linkedin: 'https://linkedin.com', twitter: 'https://twitter.com' },
            status: 'ACTIVE',
            voteCount: 115,
        },
        {
            editionId: edition2026._id,
            categoryId: categories[1]._id,
            fullName: 'Sarah Kanku',
            slug: 'sarah-kanku',
            profileImage: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=600',
            shortBio: 'CEO de Kingabwa Agro-Foods & Bakery.',
            biography: 'Jeune entrepreneuse ayant révolutionné la boulangerie et la transformation de manioc locale avec des normes sanitaires modernes.',
            achievements: ['Plus de 5 points de vente ouverts à Kinshasa', 'Prix Innovation Agroalimentaire 2025'],
            socialLinks: { instagram: 'https://instagram.com' },
            status: 'ACTIVE',
            voteCount: 88,
        },
        // Artiste de l'année
        {
            editionId: edition2026._id,
            categoryId: categories[3]._id,
            fullName: 'Gael "Le Poète" Mwamba',
            slug: 'gael-le-poete-mwamba',
            profileImage: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=600',
            shortBio: 'Artiste sculpteur et slameur engagé.',
            biography: 'Ses œuvres en matériaux recyclés sont exposées dans les plus grandes galeries de Kinshasa et véhiculent des messages sur l\'histoire de Kingabwa.',
            achievements: ['Exposition solo à l\'Institut Français de Kinshasa', 'Trophée du Meilleur Sculptural Urbain'],
            socialLinks: { instagram: 'https://instagram.com', youtube: 'https://youtube.com' },
            status: 'ACTIVE',
            voteCount: 210,
        },
    ];
    await Nominee_js_1.Nominee.insertMany(nomineesData);
    console.log(`🌟 Nominees seeded.`);
    // 5. Create Blog Categories & Blog Posts
    const blogCat1 = await BlogCategory_js_1.BlogCategory.create({
        name: 'Événements & Cérémonie',
        slug: 'evenements-et-ceremonie',
        description: 'Actualités sur l\'organisation des Kingabwa Awards.',
    });
    const blogCat2 = await BlogCategory_js_1.BlogCategory.create({
        name: 'Portraits d\'Élites',
        slug: 'portraits-d-elites',
        description: 'Zoom sur les parcours inspirants des citoyens de Kingabwa.',
    });
    const blogPostsData = [
        {
            title: 'Lancement Officiel de la 4ème Édition des Kingabwa Awards 2026',
            slug: 'lancement-officiel-de-la-4eme-edition-des-kingabwa-awards-2026',
            excerpt: 'C\'est sous le signe du prestige et de l\'unité communautaire que s\'est ouverte l\'édition 2026 des Kingabwa Awards.',
            content: `
        <p>Le comité d'organisation des Kingabwa Awards est très heureux d'annoncer l'ouverture officielle de l'édition 2026.</p>
        <p>Sous le slogan inspirant <strong>« L'excellence de chez nous, célébrée par nous »</strong>, cette édition mettra en lumière des personnalités exceptionnelles qui œuvrent quotidiennement pour le rayonnement de Kingabwa.</p>
        <h3>Les Nouveautés de cette Édition</h3>
        <ul>
          <li>Plateforme de vote en ligne 100% sécurisée</li>
          <li>Nouvelle catégorie dédiée aux Jeunes Talents</li>
          <li>Grande soirée de Gala au prestigieux Fleuve Congo Hotel</li>
        </ul>
      `,
            featuredImage: 'https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=1200',
            authorId: superAdmin._id,
            categoryId: blogCat1._id,
            tags: ['KingabwaAwards2026', 'Événement', 'Kinshasa'],
            status: 'PUBLISHED',
            publishedAt: new Date('2026-08-01'),
            readTimeMinutes: 3,
            metaTitle: 'Lancement Kingabwa Awards 2026',
            metaDescription: 'Découvrez toutes les étapes et nouveautés de l\'édition 2026 des Kingabwa Awards.',
        },
        {
            title: 'Portrait : Dr. Joseph Tshilombo, 15 ans au service de la santé à Kingabwa',
            slug: 'portrait-dr-joseph-tshilombo-15-ans-au-service-de-la-sante',
            excerpt: 'Retour sur le parcours impressionnant d\'un médecin dont l\'engagement humanitaire force le respect.',
            content: `
        <p>Arrivé à Kingabwa il y a plus de quinze ans, le Dr. Joseph Tshilombo a bâti de ses propres mains un havre de soin pour les familles du quartier.</p>
        <p>Nominé dans la catégorie <em>Personnalité de l'année</em>, il nous partage ses convictions et son amour profond pour la communauté de Kingabwa.</p>
      `,
            featuredImage: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?q=80&w=1200',
            authorId: superAdmin._id,
            categoryId: blogCat2._id,
            tags: ['Portrait', 'Excellence', 'Santé'],
            status: 'PUBLISHED',
            publishedAt: new Date('2026-08-10'),
            readTimeMinutes: 5,
        },
    ];
    await BlogPost_js_1.BlogPost.insertMany(blogPostsData);
    console.log(`📝 Blog posts seeded.`);
    // 6. Create Partners
    const partnersData = [
        {
            name: 'Vodacom Congo',
            logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/Vodacom_Logo.png/600px-Vodacom_Logo.png',
            description: 'Partenaire Officiel Télécom & Connectivité',
            website: 'https://vodacom.cd',
            level: 'PLATINUM',
            order: 1,
            active: true,
        },
        {
            name: 'Bracongo',
            logo: 'https://bracongo.cd/wp-content/uploads/2021/04/Logo-Bracongo-1.png',
            description: 'Sponsor Majeur de la Soirée de Gala',
            website: 'https://bracongo.cd',
            level: 'GOLD',
            order: 2,
            active: true,
        },
        {
            name: 'Radio Okapi',
            logo: 'https://www.radiookapi.net/sites/default/files/radio_okapi_logo.png',
            description: 'Partenaire Média Officiel',
            website: 'https://radiookapi.net',
            level: 'SILVER',
            order: 3,
            active: true,
        },
    ];
    await Partner_js_1.Partner.insertMany(partnersData);
    console.log(`🤝 Partners seeded.`);
    // 7. Create Hall of Fame Winners
    const winnersData = [
        {
            editionYear: 2025,
            editionName: 'Kingabwa Awards 2025',
            categoryName: 'Personnalité de l\'année',
            winnerName: 'Prof. Honoré Mbaya',
            winnerImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=600',
            description: 'Lauréat 2025 pour ses travaux de recherche en génie de l\'environnement et son programme de bourse d\'études.',
            achievements: 'Octroi de 20 bourses universitaires complètes aux bacheliers de Kingabwa.',
        },
        {
            editionYear: 2024,
            editionName: 'Kingabwa Awards 2024',
            categoryName: 'Artiste de l\'année',
            winnerName: 'Mlle Clarisse Yowa',
            winnerImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=600',
            description: 'Lauréate 2024 pour son album de musique traditionnelle fusion.',
            achievements: 'Tournée culturelle internationale en Afrique de l\'Ouest.',
        },
    ];
    await Winner_js_1.Winner.insertMany(winnersData);
    console.log(`🏛️ Hall of Fame Winners seeded.`);
    // 8. Create Gallery Media
    const galleryData = [
        {
            title: 'Remise des Trophées Kingabwa Awards 2025',
            type: 'PHOTO',
            url: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=1200',
            category: 'CEREMONY',
            editionYear: 2025,
            description: 'Moment fort de la remise des prix lors de la grande soirée au Fleuve Congo Hotel.',
        },
        {
            title: 'Défilé Tapis Rouge 2025',
            type: 'PHOTO',
            url: 'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?q=80&w=1200',
            category: 'RED_CARPET',
            editionYear: 2025,
            description: 'Arrivée des personnalités et nominés sur le Tapis Rouge.',
        },
    ];
    await GalleryMedia_js_1.GalleryMedia.insertMany(galleryData);
    console.log(`🖼️ Gallery Media seeded.`);
    console.log('✅ DATABASE SEEDING COMPLETED SUCCESSFULLY!');
    await (0, db_js_1.closeDB)();
    process.exit(0);
};
seed().catch((err) => {
    console.error('❌ Seeding error:', err);
    process.exit(1);
});
