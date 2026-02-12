fetch("/viaturas")
    .then(res => res.json())
    .then(viaturas => {
        const container = document.getElementById("lista-viaturas");

        viaturas.forEach(v => {
            const card = document.createElement("div");
            card.className = "card";

            card.innerHTML = `
                <h3>${v.prefixo}</h3>
                <p>
                    Km Atual: ${v.km_atual ?? "—"}<br>
                    Último condutor: ${v.ultimo_condutor ?? "—"}
                </p>
                <button onclick="window.location.href='viatura.html?prefixo=${v.prefixo}'">
                    Acessar
                </button>
            `;

            container.appendChild(card);
        });
    });
