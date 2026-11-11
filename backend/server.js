const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
require('dotenv').config();
require('./models/associations');

const sequelize = require('./config/db');
const auditMiddleware = require('./middleware/audit');

const authRoutes = require('./routes/authRoutes');
const membreRoutes = require('./routes/membreRoutes');
const groupeRoutes = require('./routes/groupeRoutes');
const reseauRoutes = require('./routes/reseauRoutes');
const responsableRoutes = require('./routes/responsableRoutes');
const formationRoutes = require('./routes/formationRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const auditRoutes = require('./routes/auditRoutes');
const communeRoutes = require('./routes/communeRoutes');
const adminUserRoutes = require('./routes/adminUserRoutes');
const rapportRoutes = require('./routes/rapportRoutes');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: [
            "http://localhost:5173",
            "http://192.168.56.9:30080",
	    "http://tsinjoaina.local"
        ],
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true
    }
});

global.io = io;

app.use(cors({
    origin: [
        "http://localhost:5173",
        "http://172.19.0.1:5275",
        "http://192.168.56.9:30080",
	"http://tsinjoaina.local"
    ],
    credentials: true
}));
app.use(helmet({
    crossOriginResourcePolicy: false,
    contentSecurityPolicy: false,
    hsts: false,
}));
app.use(express.json());

app.use(auditMiddleware);

app.use(express.static(path.join(__dirname, 'frontend/dist')));
app.use('/assets', express.static(path.join(__dirname, 'frontend/dist/assets')));

app.use('/api/auth', authRoutes);
app.use('/api/membres', membreRoutes);
app.use('/api/groupes', groupeRoutes);
app.use('/api/reseaux', reseauRoutes);
app.use('/api/responsables', responsableRoutes);
app.use('/api/formations', formationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api/communes', communeRoutes);
app.use('/api/admin/users', adminUserRoutes);
app.use('/api/rapports', rapportRoutes);


app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend/dist/index.html'));
});

app.use((req, res, next) => {
    res.status(404).json({ message: "Route introuvable sur le serveur" });
});

const connectWithRetry = async () => {
    const MAX_RETRIES = 5;
    const DELAY = 3000;

    for (let i = 1; i <= MAX_RETRIES; i++) {
        try {
            // Vérifier uniquement la connexion PostgreSQL
            // Ne pas modifier automatiquement le schéma de la base
            await sequelize.authenticate();

            console.log("Connexion à PostgreSQL réussie.");

            const PORT = process.env.PORT || 5000;

            server.listen(PORT, () => {
                console.log(`Serveur démarré sur : http://localhost:${PORT}`);
            });

            return;

        } catch (err) {
            console.error(
                `Tentative ${i}/${MAX_RETRIES} échouée :`,
                err.message
            );

            if (i < MAX_RETRIES) {
                console.log("Nouvel essai dans 3 secondes...");
                await new Promise(resolve => setTimeout(resolve, DELAY));
            }
        }
    }

    console.error(
        "Impossible de se connecter à PostgreSQL après plusieurs tentatives."
    );

    process.exit(1);
};

connectWithRetry();
