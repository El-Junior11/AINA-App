const User = require('../models/userModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const { Op, QueryTypes } = require('sequelize');

// =====================================================
// CONFIGURATION
// =====================================================

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 465,
  secure: Number(process.env.SMTP_PORT || 465) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// =====================================================
// FONCTIONS UTILITAIRES
// =====================================================

const normalizeEmail = (email) => {
  if (typeof email !== 'string') {
    return '';
  }

  return email.trim().toLowerCase();
};

const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const isValidPassword = (password) => {
  return (
    typeof password === 'string' &&
    password.length >= 8 &&
    password.length <= 128
  );
};

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('JWT_SECRET non configuré.');
  }

  return secret;
};

const createToken = (user) => {
  return jwt.sign(
    {
      user_id: user.user_id,
      role: user.role
    },
    getJwtSecret(),
    {
      algorithm: 'HS256',
      expiresIn: '24h'
    }
  );
};

const formatUser = (user) => {
  return {
    user_id: user.user_id,
    name: user.name,
    email: user.email,
    role: user.role,
    commune_id: user.commune_id,
    status: user.status
  };
};

const checkAccountAccess = (user) => {
  if (!user) {
    return {
      allowed: false,
      status: 401,
      message: 'Identifiants invalides.'
    };
  }

  if (user.status === 'en_attente') {
    return {
      allowed: false,
      status: 403,
      message:
        "Votre compte est en attente de validation par l'administrateur."
    };
  }

  if (user.status === 'refuse') {
    return {
      allowed: false,
      status: 403,
      message:
        "Votre demande d'inscription a été refusée."
    };
  }

  if (user.status !== 'accepte') {
    return {
      allowed: false,
      status: 403,
      message: 'Votre compte n’est pas autorisé.'
    };
  }

  if (!['admin', 'user'].includes(user.role)) {
    return {
      allowed: false,
      status: 403,
      message: 'Rôle utilisateur invalide.'
    };
  }

  if (user.role === 'user' && !user.commune_id) {
    return {
      allowed: false,
      status: 403,
      message:
        "Aucune commune n'est attribuée à votre compte."
    };
  }

  return {
    allowed: true
  };
};

const handleError = (res, error, context) => {
  console.error(`Erreur ${context}:`, error);

  if (error.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({
      message: 'Cette adresse email est déjà utilisée.'
    });
  }

  if (error.name === 'SequelizeValidationError') {
    return res.status(400).json({
      message: 'Les informations fournies sont invalides.'
    });
  }

  return res.status(500).json({
    message: 'Une erreur interne est survenue.'
  });
};

// =====================================================
// 1. INSCRIPTION PUBLIQUE
// =====================================================

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body || {};

    if (
      typeof name !== 'string' ||
      !name.trim() ||
      !isValidEmail(normalizeEmail(email)) ||
      !isValidPassword(password)
    ) {
      return res.status(400).json({
        message:
          'Veuillez fournir un nom, une adresse email valide et un mot de passe de 8 à 128 caractères.'
      });
    }

    const cleanName = name.trim();
    const cleanEmail = normalizeEmail(email);

    if (cleanName.length > 255) {
      return res.status(400).json({
        message: 'Le nom est trop long.'
      });
    }

    const existingUser = await User.findOne({
      where: {
        email: cleanEmail
      }
    });

    if (existingUser) {
      return res.status(409).json({
        message: 'Cette adresse email est déjà utilisée.'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    // Le rôle, la commune et le statut sont imposés
    // exclusivement par le serveur.

    const newUser = await User.create({
      name: cleanName,
      email: cleanEmail,
      password: hashedPassword,
      role: 'user',
      commune_id: null,
      status: 'en_attente'
    });

    return res.status(201).json({
      message:
        "Inscription réussie. Votre compte est en attente de validation par l'administrateur.",
      user: {
        user_id: newUser.user_id,
        name: newUser.name,
        email: newUser.email,
        status: newUser.status
      }
    });

  } catch (error) {
    return handleError(res, error, 'register');
  }
};

// =====================================================
// 2. CONNEXION
// =====================================================

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body || {};

    const cleanEmail = normalizeEmail(email);

    if (
      !isValidEmail(cleanEmail) ||
      typeof password !== 'string' ||
      !password
    ) {
      return res.status(400).json({
        message: 'Email et mot de passe obligatoires.'
      });
    }

    const user = await User.findOne({
      where: {
        email: cleanEmail
      }
    });

    if (!user) {
      return res.status(401).json({
        message: 'Identifiants invalides.'
      });
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatches) {
      return res.status(401).json({
        message: 'Identifiants invalides.'
      });
    }

    const access = checkAccountAccess(user);

    if (!access.allowed) {
      return res.status(access.status).json({
        message: access.message
      });
    }

    const token = createToken(user);

    return res.status(200).json({
      message: 'Connexion réussie.',
      token,
      user: formatUser(user)
    });

  } catch (error) {
    return handleError(res, error, 'login');
  }
};

// =====================================================
// 3. MODIFICATION DU PROFIL
// =====================================================

exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.user_id;

    const {
      name,
      email,
      currentPassword,
      newPassword
    } = req.body || {};

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        message: 'Utilisateur introuvable.'
      });
    }

    // Modification du nom

    if (name !== undefined) {
      if (
        typeof name !== 'string' ||
        !name.trim() ||
        name.trim().length > 255
      ) {
        return res.status(400).json({
          message: 'Nom invalide.'
        });
      }

      user.name = name.trim();
    }

    // Modification de l'adresse email

    if (email !== undefined) {
      const cleanEmail = normalizeEmail(email);

      if (!isValidEmail(cleanEmail)) {
        return res.status(400).json({
          message: 'Adresse email invalide.'
        });
      }

      if (cleanEmail !== user.email) {
        const emailExists = await User.findOne({
          where: {
            email: cleanEmail,
            user_id: {
              [Op.ne]: userId
            }
          }
        });

        if (emailExists) {
          return res.status(409).json({
            message: 'Cette adresse email est déjà utilisée.'
          });
        }

        user.email = cleanEmail;
      }
    }

    // Modification du mot de passe

    if (newPassword !== undefined) {
      if (!isValidPassword(newPassword)) {
        return res.status(400).json({
          message:
            'Le nouveau mot de passe doit contenir entre 8 et 128 caractères.'
        });
      }

      if (
        typeof currentPassword !== 'string' ||
        !currentPassword
      ) {
        return res.status(400).json({
          message:
            'Veuillez saisir votre mot de passe actuel.'
        });
      }

      const passwordMatches = await bcrypt.compare(
        currentPassword,
        user.password
      );

      if (!passwordMatches) {
        return res.status(400).json({
          message: 'Le mot de passe actuel est incorrect.'
        });
      }

      user.password = await bcrypt.hash(newPassword, 12);
    }

    // Les champs role, commune_id et status
    // ne sont jamais modifiés par cette fonction.

    await user.save({
      fields: ['name', 'email', 'password']
    });

    return res.status(200).json({
      message:
        'Vos informations ont été mises à jour avec succès.',
      user: formatUser(user)
    });

  } catch (error) {
    return handleError(res, error, 'updateProfile');
  }
};

// =====================================================
// 4. PROFIL DE L'UTILISATEUR CONNECTÉ
// =====================================================

exports.getMe = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.user_id, {
      attributes: [
        'user_id',
        'name',
        'email',
        'role',
        'commune_id',
        'status'
      ]
    });

    if (!user) {
      return res.status(404).json({
        message: 'Utilisateur introuvable.'
      });
    }

    return res.status(200).json(formatUser(user));

  } catch (error) {
    return handleError(res, error, 'getMe');
  }
};

// =====================================================
// 5. LISTE DES INSCRIPTIONS EN ATTENTE
// =====================================================

exports.getPendingUsers = async (req, res) => {
  try {
    // Vérification supplémentaire côté contrôleur.
    // La route doit également utiliser authorizeRoles('admin').

    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({
        message: 'Accès réservé aux administrateurs.'
      });
    }

    const users = await User.findAll({
      where: {
        status: 'en_attente'
      },
      attributes: [
        'user_id',
        'name',
        'email',
        'role',
        'commune_id',
        'status'
      ],
      order: [['user_id', 'DESC']]
    });

    return res.status(200).json(users);

  } catch (error) {
    return handleError(res, error, 'getPendingUsers');
  }
};

// =====================================================
// 6. DEMANDE DE CODE OTP
// =====================================================

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body || {};

    const cleanEmail = normalizeEmail(email);

    if (!isValidEmail(cleanEmail)) {
      return res.status(400).json({
        message: 'Une adresse email valide est requise.'
      });
    }

    const user = await User.findOne({
      where: {
        email: cleanEmail
      }
    });

    // Réponse générique pour limiter
    // la divulgation des comptes existants.

    const genericMessage =
      'Si un compte autorisé correspond à cette adresse, un code de vérification sera envoyé.';

    if (!user) {
      return res.status(200).json({
        message: genericMessage
      });
    }

    const access = checkAccountAccess(user);

    if (!access.allowed) {
      return res.status(200).json({
        message: genericMessage
      });
    }

    if (
      !process.env.SMTP_HOST ||
      !process.env.SMTP_USER ||
      !process.env.SMTP_PASS
    ) {
      console.error('Configuration SMTP incomplète.');

      return res.status(503).json({
        message:
          'Le service de récupération de compte est temporairement indisponible.'
      });
    }

    // Génération cryptographiquement sécurisée
    // d'un code à six chiffres.

    const otp = crypto.randomInt(
      100000,
      1000000
    ).toString();

    const expiresAt = new Date(
      Date.now() + 15 * 60 * 1000
    );

    // Conservation du format de la table existante :
    // otp_verifications(email, code, expires_at).

    await User.sequelize.query(
      `
        INSERT INTO otp_verifications
          (email, code, expires_at)
        VALUES
          (:email, :code, :expiresAt)
        ON CONFLICT (email)
        DO UPDATE SET
          code = EXCLUDED.code,
          expires_at = EXCLUDED.expires_at
      `,
      {
        replacements: {
          email: cleanEmail,
          code: otp,
          expiresAt
        },
        type: QueryTypes.INSERT
      }
    );

    const mailOptions = {
      from: `"ONG TSINJO AINA" <${process.env.SMTP_USER}>`,
      to: cleanEmail,
      subject: 'Votre code de vérification',
      text: `Bonjour,

Vous avez demandé un code de vérification pour votre compte ONG TSINJO AINA.

Votre code : ${otp}

Ce code est valable pendant 15 minutes.

Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.

Cordialement,
ONG TSINJO AINA`
    };

    await transporter.sendMail(mailOptions);

    return res.status(200).json({
      message: genericMessage
    });

  } catch (error) {
    return handleError(res, error, 'forgotPassword');
  }
};

// =====================================================
// 7. VÉRIFICATION OTP
// =====================================================

exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body || {};

    const cleanEmail = normalizeEmail(email);

    if (
      !isValidEmail(cleanEmail) ||
      typeof otp !== 'string' ||
      !/^\d{6}$/.test(otp)
    ) {
      return res.status(400).json({
        message: 'Email ou code OTP invalide.'
      });
    }

    // Vérification du compte avant toute création
    // de session.

    const user = await User.findOne({
      where: {
        email: cleanEmail
      }
    });

    if (!user) {
      return res.status(400).json({
        message: 'Code OTP invalide ou expiré.'
      });
    }

    const access = checkAccountAccess(user);

    if (!access.allowed) {
      return res.status(access.status).json({
        message: access.message
      });
    }

    const transaction = await User.sequelize.transaction();

    try {
      const records = await User.sequelize.query(
        `
          SELECT code, expires_at
          FROM otp_verifications
          WHERE email = :email
          FOR UPDATE
        `,
        {
          replacements: {
            email: cleanEmail
          },
          type: QueryTypes.SELECT,
          transaction
        }
      );

      const otpRecord = records[0];

      if (!otpRecord) {
        await transaction.rollback();

        return res.status(400).json({
          message: 'Code OTP invalide ou expiré.'
        });
      }

      if (
        new Date(otpRecord.expires_at).getTime() <= Date.now()
      ) {
        await User.sequelize.query(
          `
            DELETE FROM otp_verifications
            WHERE email = :email
          `,
          {
            replacements: {
              email: cleanEmail
            },
            type: QueryTypes.DELETE,
            transaction
          }
        );

        await transaction.commit();

        return res.status(400).json({
          message: 'Le code OTP a expiré.'
        });
      }

      const providedCode = Buffer.from(otp);
      const storedCode = Buffer.from(
        String(otpRecord.code)
      );

      const codeMatches =
        providedCode.length === storedCode.length &&
        crypto.timingSafeEqual(
          providedCode,
          storedCode
        );

      if (!codeMatches) {
        await transaction.rollback();

        return res.status(400).json({
          message: 'Code OTP incorrect.'
        });
      }

      // Un OTP validé ne peut plus être réutilisé.

      await User.sequelize.query(
        `
          DELETE FROM otp_verifications
          WHERE email = :email
        `,
        {
          replacements: {
            email: cleanEmail
          },
          type: QueryTypes.DELETE,
          transaction
        }
      );

      await transaction.commit();

    } catch (error) {
      if (!transaction.finished) {
        await transaction.rollback();
      }

      throw error;
    }

    // Nouvelle vérification de l'autorisation
    // avant l'émission du JWT.

    await user.reload();

    const finalAccess = checkAccountAccess(user);

    if (!finalAccess.allowed) {
      return res.status(finalAccess.status).json({
        message: finalAccess.message
      });
    }

    const token = createToken(user);

    return res.status(200).json({
      message: 'Authentification réussie.',
      token,
      user: formatUser(user)
    });

  } catch (error) {
    return handleError(res, error, 'verifyOtp');
  }
};
