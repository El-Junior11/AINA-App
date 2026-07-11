const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const http = require('http');           // 👈 AJOUT
const { Server } = require('socket.io'); // 👈 AJOUT
require('dotenv').config();
require('./models/associations');

// 1. Fifandraisana amin'ny Database
const sequelize = require('./config/db'); 

// 2. Import-nao ny Routes
const dashboardRoutes = require('./routes/dashboardRoutes');
const authRoutes = require('./routes/authRoutes');
const membreRoutes = require('./routes/membreRoutes');
const groupeRoutes = require('./routes/groupeRoutes'); 
const reseauRoutes = require('./routes/reseauRoutes'); 
const responsableRoutes = require('./routes/responsableRoutes'); 
const formationRoutes = require('./routes/formationRoutes');

const app = express();

// 👇 AJOUT : créer un serveur HTTP à partir d'Express
const server = http.createServer(app);

// 👇 AJOUT : attacher Socket.io à ce serveur HTTP
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5275",  // le port de ton frontend Vite
        methods: ["GET", "POST"]
    }
});

// 👇 AJOUT : rendre "io" accessible dans toutes les routes
app.set('io', io);

// 👇 AJOUT : gérer les connexions socket
io.on('connection', (socket) => {
    console.log('Client connecté au socket:', socket.id);

    socket.on('disconnect', () => {
        console.log('Client déconnecté:', socket.id);
    });
});

// Middlewares
app.use(cors());
app.use(helmet({
    crossOriginResourcePolicy: false, 
}));
app.use(express.json());

// 3. Fampiasana ny Routes
app.use('/api/auth', authRoutes);
app.use('/api/membres', membreRoutes);
app.use('/api/groupes', groupeRoutes);
app.use('/api/reseaux', reseauRoutes); 
app.use('/api/responsables', responsableRoutes); 
app.use('/api/formations', formationRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.use((req, res, next) => {
    res.status(404).json({ message: "Route introuvable sur le serveur" });
});

const connectWithRetry = async () => {
    const MAX_RETRIES = 10;
    const DELAY = 3000;
    for (let i = 1; i <= MAX_RETRIES; i++) {
        try {
            await sequelize.sync();
            console.log("Connexion à PostgreSQL réussie.");
            const PORT = process.env.PORT || 5000;
            
            // 👇 CHANGEMENT : server.listen au lieu de app.listen
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