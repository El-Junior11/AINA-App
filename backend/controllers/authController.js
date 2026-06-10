const User = require('../models/userModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'tsinjo_secret_key_2026';

exports.register = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        const userExists = await User.findOne({ where: { email } });
        if (userExists) {
            return res.status(400).json({ message: "Cet utilisateur existe déjà." });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = await User.create({
            name,
            email,
            password: hashedPassword,
            role: role || 'user'
        });

        res.status(201).json({ 
            message: "Utilisateur créé avec succès", 
            user: {
                user_id: newUser.user_id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role
            }
        });

    } catch (err) {
        console.error("Erreur register:", err);
        res.status(500).json({ message: "Erreur serveur lors de l'inscription." });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(401).json({ message: "Identifiants invalides." });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Identifiants invalides." });
        }

        // Fampidirana ny user_id sy ny role ao anaty payload
        // Izany no ahafahan'ny middleware mamantatra ny zon'ny Admin
        const token = jwt.sign(
            { 
                user_id: user.user_id, 
                role: user.role 
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(200).json({
            token,
            user: { 
                user_id: user.user_id,
                name: user.name, 
                email: user.email, 
                role: user.role 
            }
        });

    } catch (err) {
        console.error("Erreur login:", err);
        res.status(500).json({ message: "Erreur serveur lors de la connexion." });
    }
};

/**
 * MISE À JOUR DU COMPTE (PARAMÈTRES DU COMPTE)
 */
exports.updateProfile = async (req, res) => {
    try {
        // Récupération de l'ID depuis le middleware d'authentification (req.user.user_id)
        const userId = req.user.user_id; 
        const { name, email, currentPassword, newPassword } = req.body;

        // Recherche de l'utilisateur par sa clé primaire (user_id)
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: "Utilisateur non trouvé." });
        }

        // Si l'email est modifié, vérifier s'il n'est pas déjà pris par un autre utilisateur
        if (email && email !== user.email) {
            const emailExists = await User.findOne({ where: { email } });
            if (emailExists) {
                return res.status(400).json({ message: "Cette adresse email est déjà utilisée." });
            }
            user.email = email;
        }

        // Mise à jour du nom si fourni
        if (name) {
            user.name = name;
        }

        // Si l'utilisateur souhaite modifier son mot de passe
        if (newPassword) {
            if (!currentPassword) {
                return res.status(400).json({ message: "Veuillez saisir votre mot de passe actuel pour confirmer le changement." });
            }

            // Vérification de la correspondance du mot de passe actuel
            const isMatch = await bcrypt.compare(currentPassword, user.password);
            if (!isMatch) {
                return res.status(400).json({ message: "Le mot de passe actuel est incorrect." });
            }

            // Hachage du nouveau mot de passe
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(newPassword, salt);
        }

        // Sauvegarde des modifications dans la base de données
        await user.save();

        res.status(200).json({ 
            message: "Vos informations ont été mises à jour avec succès.",
            user: { 
                user_id: user.user_id, 
                name: user.name, 
                email: user.email,
                role: user.role
            }
        });

    } catch (err) {
        console.error("Erreur Update Profile:", err);
        res.status(500).json({ message: "Erreur serveur lors de la mise à jour des paramètres du compte." });
    }
};