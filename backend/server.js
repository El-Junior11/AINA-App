const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();
require('./models/associations');


// 1. Fifandraisana amin'ny Database
const sequelize = require('./config/db'); 

// 2. Import-nao ny Routes (Nampiana ny groupeRoutes)
const authRoutes = require('./routes/authRoutes');
const membreRoutes = require('./routes/membreRoutes');

const groupeRoutes = require('./routes/groupeRoutes'); 
const reseauRoutes = require('./routes/reseauRoutes'); 
const responsableRoutes = require('./routes/responsableRoutes'); 
const formationRoutes = require('./routes/formationRoutes');

const app = express();

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



app.use((req, res, next) => {
    res.status(404).json({ message: "Route introuvable sur le serveur" });
});

sequelize.sync()
    .then(() => {
        console.log("Connexion à PostgreSQL réussie (via Sequelize).");
        
        const PORT = process.env.PORT || 5000;
        app.listen(PORT, () => {
           
            console.log(` Serveur démarré sur : http://localhost:${PORT}`);
            
        });
    })
    .catch(err => {
        console.error("Erreur de synchronisation avec la base de données :", err);
    });