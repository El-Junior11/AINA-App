const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const http = require('http');
const { Server } = require("socket.io");
require('dotenv').config();
require('./models/associations');
const auditMiddleware = require('./middleware/audit');

const sequelize = require('./config/db'); 

const authRoutes = require('./routes/authRoutes');
const membreRoutes = require('./routes/membreRoutes');
const groupeRoutes = require('./routes/groupeRoutes'); 
const reseauRoutes = require('./routes/reseauRoutes'); 
const responsableRoutes = require('./routes/responsableRoutes'); 
const formationRoutes = require('./routes/formationRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

const app = express();
const server = http.createServer(app);

// Configure-o ny Socket.io miaraka amin'ny CORS
const io = new Server(server, {
    cors: {
        origin: "*", 
        methods: ["GET", "POST", "PUT", "DELETE"]
    }
});

// Apetraka ho global mba ho hitan'ny middleware rehetra
global.io = io;

// Middlewares
app.use(cors()); 
app.use(helmet({
    crossOriginResourcePolicy: false, 
}));
app.use(express.json());

// Apetraho ny auditMiddleware eto, aorian'ny json parser
app.use(auditMiddleware);

// Routes
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

sequelize.sync()
    .then(() => {
        console.log("Connexion à PostgreSQL réussie.");
        
        const PORT = process.env.PORT || 5000;
        server.listen(PORT, () => {
            console.log(`Serveur démarré sur : http://localhost:${PORT}`);
        });
    })
    .catch(err => {
        console.error("Erreur de synchronisation avec la base de données :", err);
    });