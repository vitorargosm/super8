class Super8Tournament {
    constructor() {
        this.tournamentData = {
            name: '',
            type: 'singles',
            players: [],
            duos: [],
            matches: [],
            currentRound: 0,
            results: new Map()
        };
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadTournamentData();
    }

    bindEvents() {
        // Setup screen events
        document.querySelectorAll('.toggle-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleToggle(e));
        });

        document.getElementById('start-tournament').addEventListener('click', () => this.startTournament());

        // Main app events
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => this.switchTab(e));
        });

        // Rounds navigation
        document.getElementById('prev-round').addEventListener('click', () => this.changeRound(-1));
        document.getElementById('next-round').addEventListener('click', () => this.changeRound(1));

        // Rankings toggle
        document.querySelectorAll('[data-ranking]').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchRanking(e));
        });

        // Players actions
        document.getElementById('scramble-players').addEventListener('click', () => this.scramblePlayers());
        document.getElementById('share-ranking').addEventListener('click', () => this.shareRanking());

        // Settings actions
        document.getElementById('check-matches').addEventListener('click', () => this.checkMatches());
        document.getElementById('reset-tournament').addEventListener('click', () => this.confirmReset());

        // Modal events
        document.getElementById('modal-cancel').addEventListener('click', () => this.hideModal());
        document.getElementById('modal-confirm').addEventListener('click', () => this.confirmAction());

        // Touch events for swipe navigation
        this.setupSwipeNavigation();
    }

    handleToggle(e) {
        const button = e.target;
        const group = button.parentElement;
        const type = button.dataset.type || button.dataset.ranking;

        // Update button states
        group.querySelectorAll('.toggle-btn').forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');

        // Handle tournament type toggle
        if (button.dataset.type) {
            this.tournamentData.type = type;
            this.toggleInputs(type);
        }

        // Handle ranking toggle
        if (button.dataset.ranking) {
            this.updateRankings(type);
        }
    }

    toggleInputs(type) {
        const playersInput = document.getElementById('players-input');
        const duosInput = document.getElementById('duos-input');

        if (type === 'singles') {
            playersInput.classList.remove('hidden');
            duosInput.classList.add('hidden');
        } else {
            playersInput.classList.add('hidden');
            duosInput.classList.remove('hidden');
        }
    }

    startTournament() {
        const name = document.getElementById('tournament-name').value.trim();
        
        if (!name) {
            this.showToast('Please enter a tournament name');
            return;
        }

        let isValid = false;

        if (this.tournamentData.type === 'singles') {
            isValid = this.validateAndStorePlayers();
        } else {
            isValid = this.validateAndStoreDuos();
        }

        if (!isValid) return;

        this.tournamentData.name = name;
        this.generateMatches();
        this.showMainScreen();
        this.saveTournamentData();
    }

    validateAndStorePlayers() {
        const playerInputs = document.querySelectorAll('.player-input');
        const players = [];

        playerInputs.forEach(input => {
            const name = input.value.trim();
            if (name) {
                players.push({ name, id: players.length });
            }
        });

        if (players.length !== 8) {
            this.showToast('Please enter exactly 8 player names');
            return false;
        }

        this.tournamentData.players = players;
        return true;
    }

    validateAndStoreDuos() {
        const duos = [];
        const duoInputs = document.querySelectorAll('.duo-input');

        duoInputs.forEach((duoDiv, index) => {
            const duoName = duoDiv.querySelector('.duo-name').value.trim();
            const player1 = duoDiv.querySelector('[data-player="0"]').value.trim();
            const player2 = duoDiv.querySelector('[data-player="1"]').value.trim();

            if (duoName && player1 && player2) {
                duos.push({
                    id: index,
                    name: duoName,
                    players: [player1, player2]
                });
            }
        });

        if (duos.length !== 4) {
            this.showToast('Please enter exactly 4 complete duos');
            return false;
        }

        this.tournamentData.duos = duos;
        return true;
    }

    generateMatches() {
        if (this.tournamentData.type === 'singles') {
            this.generateSinglesMatches();
        } else {
            this.generateDuosMatches();
        }
    }

    generateSinglesMatches() {
        const players = this.tournamentData.players;
        const matches = [];
        
        // Generate 7 rounds for 8 players (each player partners with every other player once)
        for (let round = 0; round < 7; round++) {
            const roundMatches = [];
            
            // For round robin with 8 players, we fix player 0 and rotate others
            for (let match = 0; match < 4; match++) {
                let team1, team2;
                
                if (match === 0) {
                    // First match of the round always includes player 0
                    const partner = (round + 1) % 8;
                    const opp1 = (round + 2 + match) % 8;
                    const opp2 = (8 - 1 - match - round % 2) % 8;
                    
                    team1 = [players[0], players[partner]];
                    team2 = [players[opp1], players[opp2]];
                } else {
                    // Calculate remaining players for other matches
                    const usedPlayers = new Set([0, (round + 1) % 8]);
                    const remainingPlayers = players.filter(p => !usedPlayers.has(p.id));
                    
                    // Create pairs from remaining players
                    const pairIndex = (match - 1) * 2;
                    if (pairIndex + 3 < remainingPlayers.length) {
                        team1 = [remainingPlayers[pairIndex], remainingPlayers[pairIndex + 1]];
                        team2 = [remainingPlayers[pairIndex + 2], remainingPlayers[pairIndex + 3]];
                    }
                }
                
                if (team1 && team2) {
                    roundMatches.push({
                        id: `${round}-${match}`,
                        round: round,
                        team1: team1,
                        team2: team2,
                        score1: 0,
                        score2: 0,
                        completed: false
                    });
                }
            }
            
            // Use a more systematic approach for 8-player round robin
            const roundPairs = this.generateRoundRobinPairs(round, players);
            matches.push(roundPairs);
        }
        
        this.tournamentData.matches = this.generateSinglesMatchesSystematic();
    }

    generateSinglesMatchesSystematic() {
        const players = this.tournamentData.players;
        const matches = [];
        
        // Systematic approach for 8 players - each player partners with every other player exactly once
        const rounds = [
            [[[0,1],[2,7]], [[3,6],[4,5]]],
            [[[0,2],[3,1]], [[4,7],[5,6]]],
            [[[0,3],[4,2]], [[5,1],[6,7]]],
            [[[0,4],[5,3]], [[6,2],[7,1]]],
            [[[0,5],[6,4]], [[7,3],[1,2]]],
            [[[0,6],[7,5]], [[1,4],[2,3]]],
            [[[0,7],[1,6]], [[2,5],[3,4]]]
        ];

        rounds.forEach((round, roundIndex) => {
            const roundMatches = round.map((matchPairs, matchIndex) => {
                const [pair1, pair2] = matchPairs;
                return {
                    id: `${roundIndex}-${matchIndex}`,
                    round: roundIndex,
                    team1: [players[pair1[0]], players[pair1[1]]],
                    team2: [players[pair2[0]], players[pair2[1]]],
                    score1: 0,
                    score2: 0,
                    completed: false
                };
            });
            matches.push(roundMatches);
        });

        return matches;
    }

    generateDuosMatches() {
        const duos = this.tournamentData.duos;
        const matches = [];
        
        // Generate round robin for 4 duos (6 matches total)
        for (let i = 0; i < duos.length; i++) {
            for (let j = i + 1; j < duos.length; j++) {
                matches.push({
                    id: `${matches.length}`,
                    round: 0, // All matches in one round for duos
                    team1: duos[i],
                    team2: duos[j],
                    score1: 0,
                    score2: 0,
                    completed: false
                });
            }
        }
        
        this.tournamentData.matches = [matches]; // Wrap in array for consistency
    }

    showMainScreen() {
        document.getElementById('setup-screen').classList.remove('active');
        document.getElementById('main-screen').classList.add('active');
        document.getElementById('app-title').textContent = this.tournamentData.name;
        
        this.renderRounds();
        this.renderPlayers();
        this.updateRankings('victories');
        this.updateNavigation();
    }

    renderRounds() {
        const container = document.getElementById('rounds-container');
        container.innerHTML = '';

        this.tournamentData.matches.forEach((roundMatches, roundIndex) => {
            const roundDiv = document.createElement('div');
            roundDiv.className = `round ${roundIndex === this.tournamentData.currentRound ? 'active' : ''}`;
            roundDiv.dataset.round = roundIndex;

            roundMatches.forEach(match => {
                const matchDiv = this.createMatchElement(match);
                roundDiv.appendChild(matchDiv);
            });

            container.appendChild(roundDiv);
        });
    }

    createMatchElement(match) {
        const matchDiv = document.createElement('div');
        matchDiv.className = 'match';
        matchDiv.dataset.matchId = match.id;

        const team1Name = this.tournamentData.type === 'singles' 
            ? `${match.team1[0].name} & ${match.team1[1].name}`
            : match.team1.name;
        
        const team2Name = this.tournamentData.type === 'singles'
            ? `${match.team2[0].name} & ${match.team2[1].name}`
            : match.team2.name;

        matchDiv.innerHTML = `
            <div class="match-teams">
                <span class="team">${team1Name}</span>
                <span class="vs">vs</span>
                <span class="team">${team2Name}</span>
            </div>
            <div class="match-score">
                <input type="number" class="score-input" min="0" max="50" value="${match.score1}" data-team="1">
                <span class="vs">-</span>
                <input type="number" class="score-input" min="0" max="50" value="${match.score2}" data-team="2">
            </div>
            <div class="match-actions">
                <button class="secondary-button save-match">Save</button>
                <button class="secondary-button edit-match" ${!match.completed ? 'style="display:none"' : ''}>Edit</button>
            </div>
        `;

        this.bindMatchEvents(matchDiv);
        return matchDiv;
    }

    bindMatchEvents(matchDiv) {
        const saveBtn = matchDiv.querySelector('.save-match');
        const editBtn = matchDiv.querySelector('.edit-match');
        const inputs = matchDiv.querySelectorAll('.score-input');

        saveBtn.addEventListener('click', () => this.saveMatch(matchDiv));
        editBtn.addEventListener('click', () => this.editMatch(matchDiv));
        
        inputs.forEach(input => {
            input.addEventListener('change', () => this.markMatchAsEdited(matchDiv));
        });
    }

    saveMatch(matchDiv) {
        const matchId = matchDiv.dataset.matchId;
        const score1 = parseInt(matchDiv.querySelector('[data-team="1"]').value) || 0;
        const score2 = parseInt(matchDiv.querySelector('[data-team="2"]').value) || 0;

        // Find and update the match
        this.tournamentData.matches.forEach(roundMatches => {
            const match = roundMatches.find(m => m.id === matchId);
            if (match) {
                match.score1 = score1;
                match.score2 = score2;
                match.completed = true;
            }
        });

        this.saveTournamentData();
        this.updateMatchDisplay(matchDiv, true);
        this.updateRankings();
        this.updateNavigation();
        this.showToast('Match saved successfully');
    }

    editMatch(matchDiv) {
        this.updateMatchDisplay(matchDiv, false);
    }

    updateMatchDisplay(matchDiv, completed) {
        const saveBtn = matchDiv.querySelector('.save-match');
        const editBtn = matchDiv.querySelector('.edit-match');
        const inputs = matchDiv.querySelectorAll('.score-input');

        if (completed) {
            saveBtn.style.display = 'none';
            editBtn.style.display = 'block';
            inputs.forEach(input => input.disabled = true);
            matchDiv.classList.add('completed');
        } else {
            saveBtn.style.display = 'block';
            editBtn.style.display = 'none';
            inputs.forEach(input => input.disabled = false);
            matchDiv.classList.remove('completed');
        }
    }

    markMatchAsEdited(matchDiv) {
        const saveBtn = matchDiv.querySelector('.save-match');
        const editBtn = matchDiv.querySelector('.edit-match');
        
        saveBtn.style.display = 'block';
        editBtn.style.display = 'none';
    }

    changeRound(direction) {
        const totalRounds = this.tournamentData.matches.length;
        const newRound = this.tournamentData.currentRound + direction;

        if (newRound >= 0 && newRound < totalRounds) {
            this.tournamentData.currentRound = newRound;
            this.updateRoundsDisplay();
            this.updateNavigation();
            this.saveTournamentData();
        }
    }

    updateRoundsDisplay() {
        const rounds = document.querySelectorAll('.round');
        rounds.forEach((round, index) => {
            round.classList.toggle('active', index === this.tournamentData.currentRound);
        });

        const roundTitle = document.getElementById('round-title');
        const currentRound = this.tournamentData.currentRound + 1;
        const isCompleted = this.isRoundCompleted(this.tournamentData.currentRound);
        
        roundTitle.textContent = `Round ${currentRound}`;
        roundTitle.className = isCompleted ? 'round-completed' : '';
    }

    updateNavigation() {
        const prevBtn = document.getElementById('prev-round');
        const nextBtn = document.getElementById('next-round');
        const totalRounds = this.tournamentData.matches.length;

        prevBtn.disabled = this.tournamentData.currentRound === 0;
        nextBtn.disabled = this.tournamentData.currentRound === totalRounds - 1;

        this.updateRoundsDisplay();
    }

    isRoundCompleted(roundIndex) {
        const roundMatches = this.tournamentData.matches[roundIndex];
        return roundMatches.every(match => match.completed);
    }

    switchTab(e) {
        e.preventDefault();
        const tabName = e.currentTarget.dataset.tab;

        // Update navigation
        document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
        e.currentTarget.classList.add('active');

        // Update content
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        document.getElementById(`${tabName}-tab`).classList.add('active');

        // Update content based on tab
        if (tabName === 'rankings') {
            this.updateRankings();
        } else if (tabName === 'players') {
            this.renderPlayers();
        }
    }

    updateRankings(type = 'victories') {
        const participants = this.tournamentData.type === 'singles' 
            ? this.tournamentData.players 
            : this.tournamentData.duos;

        const stats = this.calculateStats(participants);
        const tbody = document.querySelector('#rankings-table tbody');
        
        // Sort by ranking type
        const sorted = stats.sort((a, b) => {
            if (type === 'victories') {
                return b.victories - a.victories || b.gamesWon - a.gamesWon;
            } else {
                return b.gamesWon - a.gamesWon || b.victories - a.victories;
            }
        });

        // Update table
        tbody.innerHTML = '';
        sorted.forEach((stat, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${stat.name}</td>
                <td>${type === 'victories' ? stat.victories : stat.gamesWon}</td>
                <td>${stat.played}</td>
            `;
            tbody.appendChild(row);
        });

        // Update header
        document.getElementById('ranking-metric').textContent = 
            type === 'victories' ? 'Victories' : 'Games Won';
        document.getElementById('ranking-title').textContent = 
            `Rankings by ${type === 'victories' ? 'Victories' : 'Games Won'}`;
    }

    calculateStats(participants) {
        const stats = participants.map(p => ({
            id: p.id,
            name: this.tournamentData.type === 'singles' ? p.name : p.name,
            victories: 0,
            gamesWon: 0,
            played: 0
        }));

        this.tournamentData.matches.forEach(roundMatches => {
            roundMatches.forEach(match => {
                if (match.completed) {
                    const isTeam1Winner = match.score1 > match.score2;
                    
                    if (this.tournamentData.type === 'singles') {
                        // For singles, both players in a team get the same stats
                        match.team1.forEach(player => {
                            const stat = stats.find(s => s.id === player.id);
                            if (stat) {
                                stat.played++;
                                stat.gamesWon += match.score1;
                                if (isTeam1Winner) stat.victories++;
                            }
                        });
                        
                        match.team2.forEach(player => {
                            const stat = stats.find(s => s.id === player.id);
                            if (stat) {
                                stat.played++;
                                stat.gamesWon += match.score2;
                                if (!isTeam1Winner) stat.victories++;
                            }
                        });
                    } else {
                        // For duos
                        const stat1 = stats.find(s => s.id === match.team1.id);
                        const stat2 = stats.find(s => s.id === match.team2.id);
                        
                        if (stat1) {
                            stat1.played++;
                            stat1.gamesWon += match.score1;
                            if (isTeam1Winner) stat1.victories++;
                        }
                        
                        if (stat2) {
                            stat2.played++;
                            stat2.gamesWon += match.score2;
                            if (!isTeam1Winner) stat2.victories++;
                        }
                    }
                }
            });
        });

        return stats;
    }

    renderPlayers() {
        const container = document.getElementById('players-list');
        const participants = this.tournamentData.type === 'singles' 
            ? this.tournamentData.players 
            : this.tournamentData.duos;

        container.innerHTML = '';
        
        participants.forEach((participant, index) => {
            const div = document.createElement('div');
            div.className = 'player-item';
            div.innerHTML = `
                <div class="player-info">
                    <div class="player-name">${participant.name}</div>
                    <div class="player-stats">Position: ${index + 1}</div>
                </div>
                <button class="secondary-button player-edit" onclick="tournament.editPlayer(${participant.id})">
                    Edit
                </button>
            `;
            container.appendChild(div);
        });
    }

    editPlayer(playerId) {
        const participant = this.tournamentData.type === 'singles'
            ? this.tournamentData.players.find(p => p.id === playerId)
            : this.tournamentData.duos.find(d => d.id === playerId);

        if (participant) {
            const newName = prompt('Enter new name:', participant.name);
            if (newName && newName.trim()) {
                participant.name = newName.trim();
                this.renderPlayers();
                this.renderRounds();
                this.updateRankings();
                this.saveTournamentData();
                this.showToast('Player name updated');
            }
        }
    }

    scramblePlayers() {
        const participants = this.tournamentData.type === 'singles' 
            ? this.tournamentData.players 
            : this.tournamentData.duos;

        // Fisher-Yates shuffle
        for (let i = participants.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [participants[i], participants[j]] = [participants[j], participants[i]];
        }

        // Regenerate matches with new order
        this.generateMatches();
        this.renderRounds();
        this.renderPlayers();
        this.updateRankings();
        this.saveTournamentData();
        this.showToast('Players scrambled and matches regenerated');
    }

    checkMatches() {
        const violations = this.findRepeatedPairs();
        
        if (violations.length === 0) {
            this.showToast('✅ No repeated pairs found! All matches are valid.');
        } else {
            const message = `⚠️ Found ${violations.length} repeated pair(s):\n${violations.join('\n')}`;
            alert(message);
        }
    }

    findRepeatedPairs() {
        const seenPairs = new Set();
        const violations = [];

        this.tournamentData.matches.forEach((roundMatches, roundIndex) => {
            roundMatches.forEach((match, matchIndex) => {
                if (this.tournamentData.type === 'singles') {
                    // Check partnerships (same team)
                    const pair1 = [match.team1[0].id, match.team1[1].id].sort().join('-');
                    const pair2 = [match.team2[0].id, match.team2[1].id].sort().join('-');
                    
                    if (seenPairs.has(pair1)) {
                        violations.push(`Round ${roundIndex + 1}, Match ${matchIndex + 1}: Repeated partnership ${pair1}`);
                    }
                    if (seenPairs.has(pair2)) {
                        violations.push(`Round ${roundIndex + 1}, Match ${matchIndex + 1}: Repeated partnership ${pair2}`);
                    }
                    
                    seenPairs.add(pair1);
                    seenPairs.add(pair2);
                } else {
                    // Check duo matchups
                    const matchup = [match.team1.id, match.team2.id].sort().join('-');
                    if (seenPairs.has(matchup)) {
                        violations.push(`Match ${matchIndex + 1}: Repeated duo matchup`);
                    }
                    seenPairs.add(matchup);
                }
            });
        });

        return violations;
    }

    shareRanking() {
        const type = document.querySelector('[data-ranking].active').dataset.ranking;
        const participants = this.tournamentData.type === 'singles' 
            ? this.tournamentData.players 
            : this.tournamentData.duos;

        const stats = this.calculateStats(participants);
        const sorted = stats.sort((a, b) => {
            if (type === 'victories') {
                return b.victories - a.victories || b.gamesWon - a.gamesWon;
            } else {
                return b.gamesWon - a.gamesWon || b.victories - a.victories;
            }
        });

        const metric = type === 'victories' ? 'Victories' : 'Games Won';
        let message = `🎾 ${this.tournamentData.name}\n\n`;
        message += `🏆 Rankings by ${metric}:\n\n`;
        
        sorted.forEach((stat, index) => {
            const position = index + 1;
            const emoji = position === 1 ? '🥇' : position === 2 ? '🥈' : position === 3 ? '🥉' : `${position}.`;
            const value = type === 'victories' ? stat.victories : stat.gamesWon;
            message += `${emoji} ${stat.name}: ${value} ${metric.toLowerCase()}\n`;
        });

        message += `\n🎾 Super 8 Padel Tournament`;

        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    }

    confirmReset() {
        this.showModal(
            'Reset Tournament',
            'Are you sure you want to reset the tournament? All match results will be lost.',
            () => this.resetTournament()
        );
    }

    resetTournament() {
        // Clear all data except structure
        this.tournamentData.matches.forEach(roundMatches => {
            roundMatches.forEach(match => {
                match.score1 = 0;
                match.score2 = 0;
                match.completed = false;
            });
        });

        this.tournamentData.currentRound = 0;
        this.saveTournamentData();
        
        // Return to setup
        document.getElementById('main-screen').classList.remove('active');
        document.getElementById('setup-screen').classList.add('active');
        
        this.showToast('Tournament reset successfully');
    }

    setupSwipeNavigation() {
        const container = document.getElementById('rounds-container');
        let startX = 0;
        let isDragging = false;

        container.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            isDragging = true;
        });

        container.addEventListener('touchend', (e) => {
            if (!isDragging) return;
            
            const endX = e.changedTouches[0].clientX;
            const diffX = startX - endX;
            
            if (Math.abs(diffX) > 50) { // Minimum swipe distance
                if (diffX > 0) {
                    // Swipe left - next round
                    this.changeRound(1);
                } else {
                    // Swipe right - previous round
                    this.changeRound(-1);
                }
            }
            
            isDragging = false;
        });

        container.addEventListener('touchcancel', () => {
            isDragging = false;
        });
    }

    showModal(title, message, confirmCallback) {
        document.getElementById('modal-title').textContent = title;
        document.getElementById('modal-message').textContent = message;
        document.getElementById('confirmation-modal').classList.add('active');
        
        this.pendingConfirmAction = confirmCallback;
    }

    hideModal() {
        document.getElementById('confirmation-modal').classList.remove('active');
        this.pendingConfirmAction = null;
    }

    confirmAction() {
        if (this.pendingConfirmAction) {
            this.pendingConfirmAction();
        }
        this.hideModal();
    }

    showToast(message) {
        const toast = document.getElementById('toast');
        document.getElementById('toast-message').textContent = message;
        toast.classList.add('show');
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    saveTournamentData() {
        localStorage.setItem('super8Tournament', JSON.stringify(this.tournamentData));
    }

    loadTournamentData() {
        const saved = localStorage.getItem('super8Tournament');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                if (data.name && (data.players?.length > 0 || data.duos?.length > 0)) {
                    this.tournamentData = data;
                    this.showMainScreen();
                }
            } catch (e) {
                console.error('Error loading tournament data:', e);
            }
        }
    }

    switchRanking(e) {
        const type = e.target.dataset.ranking;
        this.updateRankings(type);
    }
}

// Initialize the tournament app
const tournament = new Super8Tournament();