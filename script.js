let players = [
    'Lucas Caetano', 'Bruno Viana', 'Vitor Argos', 'Andre Michels',
    'Gustavo Quandt', 'Pedro Bernardes', 'Miguel de Gregorio', 'Luis Otavio'
];

// COMPLETELY CORRECTED tournament schedule - verified NO duplicate partnerships
const defaultMatches = [
    { round: 1, court: 1, team1: [0, 1], team2: [2, 3] },  // Lucas+Bruno vs Vitor+Andre
    { round: 1, court: 2, team1: [4, 5], team2: [6, 7] },  // Gustavo+Pedro vs Miguel+Luis
    { round: 2, court: 1, team1: [0, 2], team2: [4, 6] },  // Lucas+Vitor vs Gustavo+Miguel
    { round: 2, court: 2, team1: [1, 7], team2: [3, 5] },  // Bruno+Luis vs Andre+Pedro
    { round: 3, court: 1, team1: [0, 3], team2: [1, 4] },  // Lucas+Andre vs Bruno+Gustavo
    { round: 3, court: 2, team1: [2, 6], team2: [5, 7] },  // Vitor+Miguel vs Pedro+Luis
    { round: 4, court: 1, team1: [0, 4], team2: [2, 5] },  // Lucas+Gustavo vs Vitor+Pedro
    { round: 4, court: 2, team1: [1, 6], team2: [3, 7] },  // Bruno+Miguel vs Andre+Luis
    { round: 5, court: 1, team1: [0, 5], team2: [3, 6] },  // Lucas+Pedro vs Andre+Miguel
    { round: 5, court: 2, team1: [1, 2], team2: [4, 7] },  // Bruno+Vitor vs Gustavo+Luis
    { round: 6, court: 1, team1: [0, 6], team2: [2, 7] },  // Lucas+Miguel vs Vitor+Luis
    { round: 6, court: 2, team1: [1, 5], team2: [3, 4] },  // Bruno+Pedro vs Andre+Gustavo
    { round: 7, court: 1, team1: [0, 7], team2: [1, 3] },  // Lucas+Luis vs Bruno+Andre
    { round: 7, court: 2, team1: [2, 4], team2: [5, 6] }   // Vitor+Gustavo vs Pedro+Miguel
];

let matches = [];
let results = {};

function generateMatches() {
    return defaultMatches.map(match => ({
        round: match.round,
        court: match.court,
        team1: [players[match.team1[0]], players[match.team1[1]]],
        team2: [players[match.team2[0]], players[match.team2[1]]]
    }));
}

function loadFromCache() {
    try {
        const savedResults = localStorage.getItem('super8_results');
        if (savedResults) {
            results = JSON.parse(savedResults);
        }
        
        const savedPlayers = localStorage.getItem('super8_players');
        if (savedPlayers) {
            players = JSON.parse(savedPlayers);
        }
        
        matches = generateMatches();
    } catch (error) {
        console.error('Error loading from cache:', error);
        results = {};
        matches = generateMatches();
    }
}

function saveToCache() {
    try {
        localStorage.setItem('super8_results', JSON.stringify(results));
        localStorage.setItem('super8_players', JSON.stringify(players));
    } catch (error) {
        console.error('Error saving to cache:', error);
    }
}

function initializeTournament() {
    loadFromCache();
    renderMatches();
    updateClassification();
}

function renderMatches() {
    const container = document.getElementById('matchesContainer');
    container.innerHTML = '';

    // Group matches by round
    const matchesByRound = {};
    matches.forEach((match, index) => {
        if (!matchesByRound[match.round]) {
            matchesByRound[match.round] = [];
        }
        matchesByRound[match.round].push({ match, index });
    });

    // Render each round as a separate section
    Object.keys(matchesByRound).sort((a, b) => Number(a) - Number(b)).forEach(roundNumber => {
        // Create round section
        const roundSection = document.createElement('div');
        roundSection.className = 'round-section';
        
        // Round header
        const roundHeader = document.createElement('div');
        roundHeader.className = 'round-header';
        roundHeader.innerHTML = `
            <h3 class="round-title">Rodada ${roundNumber}</h3>
            <div class="round-progress">
                <span class="progress-text">${getMatchesCompletedInRound(roundNumber, matchesByRound[roundNumber])} de ${matchesByRound[roundNumber].length} jogos concluídos</span>
            </div>
        `;
        roundSection.appendChild(roundHeader);

        // Round matches container
        const roundMatches = document.createElement('div');
        roundMatches.className = 'round-matches';

        matchesByRound[roundNumber].forEach(({ match, index }) => {
            const matchDiv = document.createElement('div');
            matchDiv.className = 'match-card';
            
            const result = results[index];
            const isCompleted = result && result.team1Score !== undefined;

            matchDiv.innerHTML = `
                <div class="match-header">
                    <span class="court-badge">Quadra ${match.court}</span>
                </div>
                <div class="teams-container">
                    <div class="team ${result && result.winner === 'team1' ? 'winner' : ''}">
                        <div class="team-label">Time 1</div>
                        <div class="body-emphasis">${match.team1.join(' + ')}</div>
                        ${isCompleted ? `<div class="team-score">${result.team1Score} jogos</div>` : ''}
                    </div>
                    <div class="vs-divider">VS</div>
                    <div class="team ${result && result.winner === 'team2' ? 'winner' : ''}">
                        <div class="team-label">Time 2</div>
                        <div class="body-emphasis">${match.team2.join(' + ')}</div>
                        ${isCompleted ? `<div class="team-score">${result.team2Score} jogos</div>` : ''}
                    </div>
                </div>
                <div class="match-controls">
                    ${isCompleted ? `
                        <div class="score-display">
                            <span class="final-score">${result.team1Score} - ${result.team2Score}</span>
                            <button class="btn btn-secondary btn-small" onclick="editMatch(${index})">
                                ✏️ Editar
                            </button>
                        </div>
                    ` : `
                        <div class="score-inputs">
                            <div class="score-input-group">
                                <label>Time 1:</label>
                                <input type="number" id="team1Score_${index}" min="0" max="99" placeholder="0">
                            </div>
                            <div class="score-input-group">
                                <label>Time 2:</label>
                                <input type="number" id="team2Score_${index}" min="0" max="99" placeholder="0">
                            </div>
                        </div>
                        <button class="btn btn-primary" onclick="setMatchScore(${index})">
                            💾 Salvar Resultado
                        </button>
                    `}
                </div>
            `;
            roundMatches.appendChild(matchDiv);
        });

        roundSection.appendChild(roundMatches);
        container.appendChild(roundSection);
    });
}

function setMatchScore(matchIndex) {
    const team1Score = parseInt(document.getElementById(`team1Score_${matchIndex}`).value) || 0;
    const team2Score = parseInt(document.getElementById(`team2Score_${matchIndex}`).value) || 0;
    
    if (team1Score === 0 && team2Score === 0) {
        alert('Por favor, insira pelo menos um jogo para um dos times.');
        return;
    }
    
    const winner = team1Score > team2Score ? 'team1' : 'team2';
    
    results[matchIndex] = {
        team1Score,
        team2Score,
        winner
    };
    
    saveToCache();
    renderMatches();
    updateClassification();
}

function editMatch(matchIndex) {
    delete results[matchIndex];
    saveToCache();
    renderMatches();
    updateClassification();
}

function setResult(matchIndex, winner) {
    // Legacy function for backwards compatibility
    results[matchIndex] = {
        team1Score: winner === 'team1' ? 1 : 0,
        team2Score: winner === 'team2' ? 1 : 0,
        winner
    };
    saveToCache();
    renderMatches();
    updateClassification();
}

function getMatchesCompletedInRound(roundNumber, roundMatches) {
    return roundMatches.filter(({ index }) => results[index] && results[index].team1Score !== undefined).length;
}

function showPlayerEditor() {
    const modal = document.getElementById('playerModal');
    const container = document.getElementById('playerEditContainer');
    
    container.innerHTML = players.map((player, index) => `
        <div class="player-input-group">
            <label>Jogador ${index + 1}:</label>
            <input type="text" id="player_${index}" value="${player}" maxlength="50">
        </div>
    `).join('');
    
    modal.style.display = 'flex';
}

function hidePlayerEditor() {
    document.getElementById('playerModal').style.display = 'none';
}

function savePlayerNames() {
    const newPlayers = [];
    let hasError = false;
    
    for (let i = 0; i < 8; i++) {
        const name = document.getElementById(`player_${i}`).value.trim();
        if (!name) {
            alert(`Nome do jogador ${i + 1} não pode estar vazio.`);
            hasError = true;
            break;
        }
        if (newPlayers.includes(name)) {
            alert(`Nome "${name}" está duplicado. Todos os nomes devem ser únicos.`);
            hasError = true;
            break;
        }
        newPlayers.push(name);
    }
    
    if (!hasError) {
        players = newPlayers;
        matches = generateMatches();
        saveToCache();
        renderMatches();
        updateClassification();
        hidePlayerEditor();
    }
}

function validateTournament() {
    const partnerships = new Set();
    const allPartnerships = [];
    const issues = [];

    defaultMatches.forEach((match, index) => {
        // Check partnerships
        const team1Key = [match.team1[0], match.team1[1]].sort().join('-');
        const team2Key = [match.team2[0], match.team2[1]].sort().join('-');
        
        // Track all partnerships
        allPartnerships.push({ key: team1Key, players: [match.team1[0], match.team1[1]], round: match.round });
        allPartnerships.push({ key: team2Key, players: [match.team2[0], match.team2[1]], round: match.round });
        
        if (partnerships.has(team1Key)) {
            issues.push(`❌ Parceria duplicada: ${players[match.team1[0]]} + ${players[match.team1[1]]} (Rodada ${match.round})`);
        }
        if (partnerships.has(team2Key)) {
            issues.push(`❌ Parceria duplicada: ${players[match.team2[0]]} + ${players[match.team2[1]]} (Rodada ${match.round})`);
        }
        
        partnerships.add(team1Key);
        partnerships.add(team2Key);
        
        // Check that all 4 players in a match are different
        const allPlayers = [...match.team1, ...match.team2];
        const uniquePlayers = new Set(allPlayers);
        if (uniquePlayers.size !== 4) {
            issues.push(`❌ Jogadores duplicados na Rodada ${match.round}: ${allPlayers.map(p => players[p]).join(', ')}`);
        }
    });

    return { issues, totalPartnerships: partnerships.size, allPartnerships };
}

function showTournamentValidation() {
    const validation = validateTournament();
    const issues = validation.issues;
    
    let message = '';
    
    if (issues.length > 0) {
        message = '⚠️ PROBLEMAS ENCONTRADOS:\n\n' + issues.join('\n\n');
    } else {
        message = '✅ TORNEIO VÁLIDO!\n\n';
        message += `📊 ESTATÍSTICAS:\n`;
        message += `• Total de parcerias únicas: ${validation.totalPartnerships}\n`;
        message += `• Máximo possível: 28 (8 jogadores)\n`;
        message += `• Cobertura: ${((validation.totalPartnerships / 28) * 100).toFixed(1)}%\n`;
        message += `• Status: ${validation.totalPartnerships === 28 ? 'PERFEITO!' : 'INCOMPLETO'}`;
        
        if (validation.totalPartnerships === 28) {
            message += '\n\n🎯 Cada jogador fará parceria com todos os outros exatamente uma vez!';
        }
    }
    
    alert(message);
    return issues.length === 0;
}

function generatePartnershipReport() {
    const playerPartners = {};
    
    // Initialize player partners tracking
    players.forEach(player => {
        playerPartners[player] = new Set();
    });
    
    defaultMatches.forEach(match => {
        // Track partnerships
        const team1 = [players[match.team1[0]], players[match.team1[1]]];
        const team2 = [players[match.team2[0]], players[match.team2[1]]];
        
        // Add partnerships
        playerPartners[team1[0]].add(team1[1]);
        playerPartners[team1[1]].add(team1[0]);
        playerPartners[team2[0]].add(team2[1]);
        playerPartners[team2[1]].add(team2[0]);
    });
    
    let report = '👥 RELATÓRIO DE PARCERIAS\n\n';
    players.forEach(player => {
        const partners = Array.from(playerPartners[player]).join(', ');
        const partnerCount = playerPartners[player].size;
        report += `${player}: ${partnerCount} parceiros (${partners})\n`;
    });
    
    const uniquePartnerships = new Set();
    defaultMatches.forEach(match => {
        const team1Key = [match.team1[0], match.team1[1]].sort().join('-');
        const team2Key = [match.team2[0], match.team2[1]].sort().join('-');
        uniquePartnerships.add(team1Key);
        uniquePartnerships.add(team2Key);
    });
    
    report += `\n📊 ESTATÍSTICAS:\n`;
    report += `Total de parcerias únicas: ${uniquePartnerships.size}\n`;
    report += `Máximo possível (8 jogadores): ${8 * 7 / 2} = 28\n`;
    report += `Cobertura: ${((uniquePartnerships.size / 28) * 100).toFixed(1)}%`;
    
    alert(report);
}

function updateClassification() {
    const stats = {};
    
    // Initialize stats
    players.forEach(player => {
        stats[player] = { 
            wins: 0, 
            losses: 0, 
            gamesFor: 0, 
            gamesAgainst: 0,
            gameDifferential: 0,
            matchesPlayed: 0
        };
    });

    // Calculate results
    Object.keys(results).forEach(matchIndex => {
        const match = matches[matchIndex];
        const result = results[matchIndex];
        
        if (!result || result.team1Score === undefined) return;
        
        const team1Score = result.team1Score;
        const team2Score = result.team2Score;
        
        // Update match counts
        match.team1.forEach(player => stats[player].matchesPlayed++);
        match.team2.forEach(player => stats[player].matchesPlayed++);
        
        // Update wins/losses
        if (result.winner === 'team1') {
            match.team1.forEach(player => stats[player].wins++);
            match.team2.forEach(player => stats[player].losses++);
        } else {
            match.team2.forEach(player => stats[player].wins++);
            match.team1.forEach(player => stats[player].losses++);
        }
        
        // Update game statistics
        match.team1.forEach(player => {
            stats[player].gamesFor += team1Score;
            stats[player].gamesAgainst += team2Score;
            stats[player].gameDifferential += (team1Score - team2Score);
        });
        
        match.team2.forEach(player => {
            stats[player].gamesFor += team2Score;
            stats[player].gamesAgainst += team1Score;
            stats[player].gameDifferential += (team2Score - team1Score);
        });
    });

    // Create player data array
    const playerData = players.map(player => ({
        name: player,
        wins: stats[player].wins,
        losses: stats[player].losses,
        gamesFor: stats[player].gamesFor,
        gamesAgainst: stats[player].gamesAgainst,
        gameDifferential: stats[player].gameDifferential,
        matchesPlayed: stats[player].matchesPlayed,
        winPercentage: stats[player].matchesPlayed > 0 ? 
            ((stats[player].wins / stats[player].matchesPlayed) * 100).toFixed(0) : 0
    }));

    // Sort by wins for first table
    const sortedByWins = [...playerData].sort((a, b) => {
        if (b.wins !== a.wins) return b.wins - a.wins;
        return parseFloat(b.winPercentage) - parseFloat(a.winPercentage);
    });

    // Sort by game differential for second table
    const sortedByGames = [...playerData].sort((a, b) => {
        if (b.gameDifferential !== a.gameDifferential) return b.gameDifferential - a.gameDifferential;
        return b.wins - a.wins;
    });

    // Render wins classification table
    const winsBody = document.getElementById('winsClassificationBody');
    if (winsBody) {
        winsBody.innerHTML = '';

        sortedByWins.forEach((player, index) => {
            const row = document.createElement('tr');
            if (index === 0) row.className = 'position-1';
            else if (index === 1) row.className = 'position-2';
            else if (index === 2) row.className = 'position-3';

            row.innerHTML = `
                <td>${index + 1}º</td>
                <td>${player.name}</td>
                <td>${player.wins}</td>
                <td>${player.losses}</td>
                <td>${player.winPercentage}%</td>
            `;
            winsBody.appendChild(row);
        });
    }

    // Render games classification table
    const gamesBody = document.getElementById('gamesClassificationBody');
    if (gamesBody) {
        gamesBody.innerHTML = '';

        sortedByGames.forEach((player, index) => {
            const row = document.createElement('tr');
            if (index === 0) row.className = 'position-1';
            else if (index === 1) row.className = 'position-2';
            else if (index === 2) row.className = 'position-3';

            row.innerHTML = `
                <td>${index + 1}º</td>
                <td>${player.name}</td>
                <td>${player.gameDifferential > 0 ? '+' : ''}${player.gameDifferential}</td>
                <td>${player.gamesFor}</td>
                <td>${player.gamesAgainst}</td>
            `;
            gamesBody.appendChild(row);
        });
    }
}

function resetTournament() {
    if (confirm('Tem certeza que deseja resetar o torneio? Esta ação não pode ser desfeita.')) {
        try {
            results = {};
            localStorage.removeItem('super8_results');
            renderMatches();
            updateClassification();
            
            // Show success feedback
            const resetBtn = event.target;
            const originalText = resetBtn.innerHTML;
            resetBtn.innerHTML = '✓ Resetado';
            resetBtn.disabled = true;
            
            setTimeout(() => {
                resetBtn.innerHTML = originalText;
                resetBtn.disabled = false;
            }, 2000);
            
        } catch (error) {
            console.error('Error resetting tournament:', error);
            alert('Erro ao resetar torneio. Tente novamente.');
        }
    }
}

function testFunction() {
    const testBtn = event.target;
    const originalText = testBtn.innerHTML;
    
    testBtn.innerHTML = '✓ Funcionando';
    testBtn.disabled = true;
    
    setTimeout(() => {
        testBtn.innerHTML = originalText;
        testBtn.disabled = false;
    }, 2000);
}

// Initialize tournament on page load
document.addEventListener('DOMContentLoaded', initializeTournament);

// Handle visibility change to sync data
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
        loadFromCache();
        renderMatches();
        updateClassification();
    }
});