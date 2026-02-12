console.log("SERVER CERTO INICIADO");

const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcryptjs");
const session = require("express-session");
const path = require("path");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: "segredo-super-seguro",
    resave: false,
    saveUninitialized: false
}));

app.use(express.static(path.join(__dirname, "public")));

// cria/abre banco
const db = new sqlite3.Database("./banco.db");

// ================== TABELAS ==================

db.run(`
CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT,
    login TEXT UNIQUE,
    senha TEXT
)
`);

db.run(`
CREATE TABLE IF NOT EXISTS viaturas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    prefixo TEXT UNIQUE,
    km_atual INTEGER,
    ultimo_condutor TEXT
)
`);

db.run(`
CREATE TABLE IF NOT EXISTS registros (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    prefixo TEXT,
    data TEXT,
    hora TEXT,
    destino TEXT,
    km_final INTEGER,
    condutor TEXT
)
`);



app.post("/registro", (req, res) => {
    const { prefixo, data, hora, destino, km_final, condutor } = req.body;

    // salva no histórico
    db.run(
        "INSERT INTO registros (prefixo, data, hora, destino, km_final, condutor) VALUES (?, ?, ?, ?, ?, ?)",
        [prefixo, data, hora, destino, km_final, condutor]
    );

    // atualiza km e condutor atual
    db.run(
        "UPDATE viaturas SET km_atual = ?, ultimo_condutor = ? WHERE prefixo = ?",
        [km_final, condutor, prefixo]
    );

    res.json({ sucesso: "Registro salvo e viatura atualizada" });
});

app.post("/cadastro", async (req, res) => {
    const { nome, login, senha } = req.body;

    if (!nome || !login || !senha) {
        return res.status(400).json({ erro: "Preencha todos os campos" });
    }

    const senhaHash = await bcrypt.hash(senha, 10);

    db.run(
        "INSERT INTO usuarios (nome, login, senha) VALUES (?, ?, ?)",
        [nome, login, senhaHash],
        function (err) {
            if (err) {
                return res.status(400).json({ erro: "Login já existe" });
            }
            res.json({ sucesso: "Usuário cadastrado com sucesso" });
        }
    );
});

function verificarLogin(req, res, next) {
    if (!req.session.user) {
        return res.redirect("/");
    }
    next();
}

app.post("/login", (req, res) => {
    const { login, senha } = req.body;

    db.get("SELECT * FROM usuarios WHERE login = ?", [login], async (err, user) => {
        if (!user) return res.json({ erro: "Usuário não encontrado" });

        const senhaCorreta = await bcrypt.compare(senha, user.senha);
        if (!senhaCorreta) return res.json({ erro: "Senha incorreta" });

        req.session.user = user.nome;
        res.json({ sucesso: true });
    });
});

// rota inicial → abre login
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "login.html"));
});


app.get("/dashboard", verificarLogin, (req, res) => {
    res.sendFile(path.join(__dirname, "public", "dashboard.html"));
});

app.get("/logout", (req, res) => {
    req.session.destroy(() => {
        res.redirect("/");
    });
});

app.get("/viaturas", (req, res) => {
    db.all("SELECT * FROM viaturas", (err, rows) => {
        if (err) {
            return res.status(500).json({ erro: "Erro ao buscar viaturas" });
        }
        res.json(rows);
    });
});


app.listen(3000, () => {
    console.log("🔥 Servidor rodando em http://localhost:3000");
});