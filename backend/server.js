const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();
require('./models/associations');

// Imports
const sequelize = require('./config/db');
const auditMiddleware = require('./middleware/audit');

// Routes
const authRoutes = require('./routes/authRoutes');
const membreRoutes = require('./routes/membreRoutes');
const groupeRoutes = require('./routes/groupeRoutes');
const reseauRoutes = require('./routes/reseauRoutes');
const responsableRoutes = require('./routes/responsableRoutes');
const formationRoutes = require('./routes/formationRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const auditRoutes = require('./routes/auditRoutes');

const app = express();
const server = http.createServer(app);

// 1. Configure-o ny Socket.io miaraka amin'ny CORS marina
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173", // Ny port-n'ny frontend-nao
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true
    }
});

// 2. Apetraka ho global mba ho hitan'ny middleware rehetra
global.io = io;

// Middlewares
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}));
app.use(helmet({
    crossOriginResourcePolicy: false,
}));
app.use(express.json());

// 3. Apetraho ny auditMiddleware eto (aorian'ny express.json)
app.use(auditMiddleware);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/membres', membreRoutes);
app.use('/api/groupes', groupeRoutes);
app.use('/api/reseaux', reseauRoutes);
app.use('/api/responsables', responsableRoutes);
app.use('/api/formations', formationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/audit-logs', auditRoutes);

app.use((req, res, next) => {
    res.status(404).json({ message: "Route introuvable sur le serveur" });
});

// Database Sync sy Server Launch
const connectWithRetry = async () => {
    const MAX_RETRIES = 5;
    const DELAY = 3000;
    
    for (let i = 1; i <= MAX_RETRIES; i++) {
        try {
            await sequelize.sync();
            console.log("Connexion à PostgreSQL réussie.");
            
            const PORT = process.env.PORT || 5000;
            server.listen(PORT, () => {
                console.log(`Serveur démarré sur : http://localhost:${PORT}`);
            });
            return;
        } catch (err) {
            console.log(`Tentative ${i}/${MAX_RETRIES} échouée. Nouvel essai dans 3s...`);
            await new Promise(res => setTimeout(res, DELAY));
        }
    }
    console.error("Impossible de se connecter après plusieurs tentatives.");
    process.exit(1);
};

connectWithRetry();