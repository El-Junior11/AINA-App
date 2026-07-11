const User = require('../models/userModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

const JWT_SECRET = process.env.JWT_SECRET || 'tsinjo_secret_key_2026';

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: true,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

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
            role: role || 'user',
            status: 'en_attente'
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

        const [dbUser] = await User.sequelize.query(
            `SELECT status FROM users WHERE user_id = :id`,
            {
                replacements: { id: user.user_id },
                type: User.sequelize.QueryTypes.SELECT
            }
        );

        const currentStatus = dbUser ? dbUser.status : 'en_attente';

        if (currentStatus === 'en_attente') {
            return res.status(403).json({ message: "Votre compte est en attente d'approbation par l'administrateur." });
        }
        
        if (currentStatus === 'refuse') {
            return res.status(403).json({ message: "Votre demande d'inscription a été refusée." });
        }

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

exports.updateProfile = async (req, res) => {
    try {
        const userId = req.user.user_id; 
        const { name, email, currentPassword, newPassword } = req.body;

        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: "Utilisateur non trouvé." });
        }

        if (email && email !== user.email) {
            const emailExists = await User.findOne({ where: { email } });
            if (emailExists) {
                return res.status(400).json({ message: "Cette adresse email est déjà utilisée." });
            }
            user.email = email;
        }

        if (name) {
            user.name = name;
        }

        if (newPassword) {
            if (!currentPassword) {
                return res.status(400).json({ message: "Veuillez saisir votre mot de passe actuel pour confirmer le changement." });
            }

            const isMatch = await bcrypt.compare(currentPassword, user.password);
            if (!isMatch) {
                return res.status(400).json({ message: "Le mot de passe actuel est incorrect." });
            }

            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(newPassword, salt);
        }

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

exports.getMe = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.user_id, {
            attributes: ['user_id', 'name', 'email', 'role']
        });

        if (!user) {
            return res.status(404).json({ message: "Utilisateur non trouvé." });
        }

        res.status(200).json(user);
    } catch (err) {
        console.error("Erreur getMe:", err);
        res.status(500).json({ message: "Erreur serveur lors de la récupération du profil." });
    }
};

exports.getPendingUsers = async (req, res) => {
    try {
        const users = await User.findAll({ 
            where: { status: 'en_attente' },
            attributes: ['user_id', 'name', 'email']
        });
        res.status(200).json(users);
    } catch (err) {
        console.error("Erreur getPendingUsers:", err);
        res.status(500).json({ message: "Erreur lors de la récupération des demandes." });
    }
};

exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: "L'adresse email est requise." });
        }

        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(404).json({ message: "Aucun utilisateur trouvé avec cette adresse email." });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

        await User.sequelize.query(
            `INSERT INTO otp_verifications (email, code, expires_at) 
             VALUES (:email, :code, :expiresAt) 
             ON CONFLICT (email) 
             DO UPDATE SET code = :code, expires_at = :expiresAt`,
            {
                replacements: { email, code: otp, expiresAt },
                type: User.sequelize.QueryTypes.INSERT
            }
        );

        const mailOptions = {
            from: `" ONG Tsinjo Aina Fianarantsoa" <${process.env.SMTP_USER}>`,
            to: email,
            subject: "Votre code de vérification",
            html: `
                <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 500px; margin: auto; border: 1px solid #eee; border-radius: 10px;">
                    <h2 style="color: #2563eb; text-align: center;">Vérification de sécurité</h2>
                    <p>Bonjour,</p>
                    <p>Vous avez demandé un code de vérification pour accéder à votre espace <b>Tsinjo</b>.</p>
                    <div style="background-color: #f3f4f6; padding: 15px; font-size: 26px; font-weight: bold; text-align: center; letter-spacing: 6px; margin: 20px 0; border-radius: 10px; color: #1e293b;">
                        ${otp}
                    </div>
                    <p style="font-size: 13px; color: #666;">Ce code est valable pendant 15 minutes. Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email en toute sécurité.</p>
                </div>
            `,
        };

        await transporter.sendMail(mailOptions);
        res.status(200).json({ message: "Code OTP envoyé avec succès." });

    } catch (err) {
        console.error("Erreur forgotPassword:", err);
        res.status(500).json({ message: "Erreur serveur lors de la demande d'OTP." });
    }
};

exports.verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ message: "L'email et le code OTP sont requis." });
        }

        const [otpRecord] = await User.sequelize.query(
            `SELECT code, expires_at FROM otp_verifications WHERE email = :email`,
            {
                replacements: { email },
                type: User.sequelize.QueryTypes.SELECT
            }
        );

        if (!otpRecord) {
            return res.status(400).json({ message: "Aucun code demandé pour cet email." });
        }

        if (new Date() > new Date(otpRecord.expires_at)) {
            await User.sequelize.query(`DELETE FROM otp_verifications WHERE email = :email`, { replacements: { email } });
            return res.status(400).json({ message: "Le code OTP a expiré." });
        }

        if (otpRecord.code !== otp) {
            return res.status(400).json({ message: "Le code OTP is incorrect." });
        }

        await User.sequelize.query(`DELETE FROM otp_verifications WHERE email = :email`, { replacements: { email } });

        const user = await User.findOne({ where: { email } });

        const token = jwt.sign(
            { 
                user_id: user.user_id, 
                role: user.role 
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(200).json({
            message: "Authentification réussie.",
            token,
            user: {
                user_id: user.user_id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (err) {
        console.error("Erreur verifyOtp:", err);
        res.status(500).json({ message: "Erreur serveur lors de la vérification de l'OTP." });
    }
};