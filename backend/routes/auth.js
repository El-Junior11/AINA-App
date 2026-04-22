router.post('/register', async (req, res) => {
    // Ity console.log ity no hanoro antsika izay tena tonga ao amin'ny Backend
    console.log("Data voaray avy amin'ny Frontend:", req.body);

    try {
        // Raisina ny data (na 'name' na 'nom' no alefan'ny Frontend dia raisintsika)
        const name = req.body.name || req.body.nom; 
        const { email, password, role } = req.body;

        // Fanamarinana raha misy null
        if (!name || !email || !password) {
            return res.status(400).json({ 
                message: "Désolé, le nom, l'email et le mot de passe sont obligatoires." 
            });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // SQL Query: Ampiasaina ny 'name' mifanaraka amin'ny DB-nao
        const newUser = await db.query(
            "INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING *",
            [name, email, hashedPassword, role || 'user']
        );

        res.status(201).json({ 
            message: "Utilisateur créé avec succès", 
            user: { id: newUser.rows[0].id, name: newUser.rows[0].name, email: newUser.rows[0].email } 
        });

    } catch (err) {
        console.error("Erreur Backend Register:", err.message);
        res.status(500).json({ message: "Erreur interne: " + err.message });
    }
});