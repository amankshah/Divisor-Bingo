class BingoGame {
    constructor() {
        // Initialize game state
        this.systemNumber = 0;
        this.playerNumber = 0;
        this.gameActive = false;
        this.autoPlayInterval = null;
        this.soundEnabled = true;
        this.numberRange = { min: 2, max: 10 };
        this.autoPlayAttempts = 0;
        this.manualAttempts = 0;
        this.maxAttempts = 10;
        this.timer = null;
        this.timeLeft = 30; // Fixed 30 seconds timer
        
        // Power-ups
        this.powerUps = {
            hint: { available: true, cooldown: 0 },
            doublePoints: { available: true, cooldown: 0 },
            extraTime: { available: true, cooldown: 0 }
        };
        
        // Achievements
        this.achievements = {
            firstWin: { unlocked: false, name: 'First Victory' },
            winStreak3: { unlocked: false, name: '3 Win Streak' },
            winStreak5: { unlocked: false, name: '5 Win Streak' },
            perfectGame: { unlocked: false, name: 'Perfect Game' },
            speedRunner: { unlocked: false, name: 'Speed Runner' }
        };
        
        // Scores
        this.playerScore = 0;
        this.systemScore = 0;
        this.winStreak = 0;
        this.bestStreak = 0;
        
        // Initialize UI elements
        this.initializeElements();
        
        // Add event listeners
        this.addEventListeners();
        
        // Initialize game state
        this.updateGameStatus('Click "Start New Game" to begin!', 'info');

        // Ensure popup is hidden on initialization
        this.hidePopup();
    }

    initializeElements() {
        // UI Elements
        this.startGameBtn = document.getElementById('startGame');
        this.callNumberBtn = document.getElementById('callNumber');
        this.autoPlayBtn = document.getElementById('autoPlay');
        this.calledNumberDisplay = document.getElementById('calledNumber');
        this.numberHistory = document.getElementById('numberHistory');
        this.customNumberInput = document.getElementById('customNumber');
        this.submitCustomNumberBtn = document.getElementById('submitCustomNumber');
        this.toggleSoundBtn = document.getElementById('toggleSound');
        
        // Popup elements
        this.resultPopup = document.getElementById('resultPopup');
        this.popupTitle = document.getElementById('popupTitle');
        this.popupMessage = document.getElementById('popupMessage');
        this.closePopupBtn = document.getElementById('closePopup');
        
        // Score displays
        this.playerScoreDisplay = document.getElementById('playerScore');
        this.systemScoreDisplay = document.getElementById('systemScore');
        this.winStreakDisplay = document.getElementById('winStreak');
        this.bestStreakDisplay = document.getElementById('bestStreak');
        
        // Stats Elements
        this.numbersCalledDisplay = document.getElementById('numbersCalled');
        this.numbersLeftDisplay = document.getElementById('numbersLeft');
        this.markedNumbersDisplay = document.getElementById('markedNumbers');
        
        // Audio elements
        this.bingoSound = document.getElementById('bingoSound');
        this.loseSound = document.getElementById('loseSound');
        this.clickSound = document.getElementById('clickSound');
        this.popupSound = document.getElementById('popupSound');
        this.finalWinSound = document.getElementById('finalWinSound');

        // New UI Elements
        this.timerDisplay = document.getElementById('timerDisplay');
        this.powerUpContainer = document.getElementById('powerUpContainer');
        this.achievementsContainer = document.getElementById('achievementsContainer');
        this.hintDisplay = document.getElementById('hintDisplay');
        
        // Set input range
        this.customNumberInput.min = this.numberRange.min;
        this.customNumberInput.max = this.numberRange.max;
        this.customNumberInput.placeholder = `Enter a number (${this.numberRange.min}-${this.numberRange.max})`;

        // Initialize power-up buttons
        this.initializePowerUps();
    }

    initializePowerUps() {
        const powerUpButtons = {
            hint: { icon: '💡', name: 'Hint' },
            doublePoints: { icon: '2️⃣', name: 'Double Points' },
            extraTime: { icon: '⏰', name: 'Extra Time' }
        };

        Object.entries(powerUpButtons).forEach(([key, value]) => {
            const button = document.createElement('button');
            button.className = 'power-up-btn bg-gray-100 hover:bg-gray-200 p-2 rounded-lg transition-colors';
            button.innerHTML = `${value.icon} ${value.name}`;
            button.id = `${key}PowerUp`;
            button.addEventListener('click', () => this.usePowerUp(key));
            this.powerUpContainer.appendChild(button);
        });
    }

    usePowerUp(type) {
        if (!this.gameActive || !this.powerUps[type].available) return;

        switch(type) {
            case 'hint':
                this.showHint();
                break;
            case 'doublePoints':
                this.activateDoublePoints();
                break;
            case 'extraTime':
                this.addExtraTime();
                break;
        }

        this.powerUps[type].available = false;
        this.powerUps[type].cooldown = 3; // 3 rounds cooldown
        this.updatePowerUpDisplay();
    }

    showHint() {
        const possibleDivisors = this.findPossibleDivisors(this.systemNumber);
        this.hintDisplay.textContent = `Possible divisors: ${possibleDivisors.join(', ')}`;
        setTimeout(() => {
            this.hintDisplay.textContent = '';
        }, 5000);
    }

    findPossibleDivisors(number) {
        const divisors = [];
        for (let i = 2; i <= number; i++) {
            if (number % i === 0) divisors.push(i);
        }
        return divisors;
    }

    activateDoublePoints() {
        this.scoreMultiplier = 2;
        setTimeout(() => {
            this.scoreMultiplier = 1;
        }, 30000); // 30 seconds duration
    }

    addExtraTime() {
        this.timeLeft += 15; // Add 15 seconds
        this.updateTimerDisplay();
    }

    startTimer() {
        if (this.timer) clearInterval(this.timer);
        this.timeLeft = this.numberRange.max - this.numberRange.min + 1;
        this.updateTimerDisplay();
        
        this.timer = setInterval(() => {
            this.timeLeft--;
            this.updateTimerDisplay();
            
            if (this.timeLeft <= 0) {
                this.handleTimeUp();
            }
        }, 1000);
    }

    updateTimerDisplay() {
        this.timerDisplay.textContent = `Time: ${this.timeLeft}s`;
        if (this.timeLeft <= 5) {
            this.timerDisplay.classList.add('text-red-600');
        } else {
            this.timerDisplay.classList.remove('text-red-600');
        }
    }

    handleTimeUp() {
        clearInterval(this.timer);
        this.handleLoss();
        this.updateGameStatus('Time\'s up!', 'error');
    }

    checkAchievements() {
        if (!this.achievements.firstWin.unlocked && this.playerScore > 0) {
            this.unlockAchievement('firstWin');
        }
        if (!this.achievements.winStreak3.unlocked && this.winStreak >= 3) {
            this.unlockAchievement('winStreak3');
        }
        if (!this.achievements.winStreak5.unlocked && this.winStreak >= 5) {
            this.unlockAchievement('winStreak5');
        }
        if (!this.achievements.perfectGame.unlocked && this.playerScore === this.maxAttempts) {
            this.unlockAchievement('perfectGame');
        }
        if (!this.achievements.speedRunner.unlocked && this.timeLeft > 0) {
            this.unlockAchievement('speedRunner');
        }
    }

    unlockAchievement(achievement) {
        this.achievements[achievement].unlocked = true;
        this.showAchievementPopup(this.achievements[achievement].name);
        
        // Find and update the achievement element
        const achievementElements = document.querySelectorAll('.achievement');
        achievementElements.forEach(el => {
            const title = el.querySelector('.text-base').textContent;
            if (title === this.achievements[achievement].name) {
                el.classList.add('unlocked');
                // Add a subtle animation
                el.style.animation = 'achievementUnlock 0.5s ease-out';
            }
        });
    }

    showAchievementPopup(achievementName) {
        const popup = document.createElement('div');
        popup.className = 'achievement-popup fixed top-4 right-4 bg-yellow-400 text-white p-4 rounded-lg shadow-lg transform transition-all';
        popup.innerHTML = `
            <div class="flex items-center">
                <span class="text-2xl mr-2">🏆</span>
                <div>
                    <div class="font-bold">Achievement Unlocked!</div>
                    <div>${achievementName}</div>
                </div>
            </div>
        `;
        document.body.appendChild(popup);
        
        // Add entrance animation
        popup.style.animation = 'slideIn 0.5s ease-out';
        
        setTimeout(() => {
            popup.style.animation = 'slideOut 0.5s ease-in';
            setTimeout(() => {
                popup.remove();
            }, 500);
        }, 2500);
    }

    addEventListeners() {
        // Game control listeners
        this.startGameBtn.addEventListener('click', () => this.startNewGame());
        this.callNumberBtn.addEventListener('click', () => this.generatePlayerNumber());
        this.autoPlayBtn.addEventListener('click', () => this.toggleAutoPlay());
        this.submitCustomNumberBtn.addEventListener('click', () => this.handleCustomNumber());
        this.toggleSoundBtn.addEventListener('click', () => this.toggleSound());
        this.closePopupBtn.addEventListener('click', () => this.hidePopup());
        
        // Add enter key support for number input
        this.customNumberInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.handleCustomNumber();
            }
        });
    }

    startNewGame() {
        console.log('Starting new game...');
        this.gameActive = true;
        this.numberHistory.innerHTML = '';
        this.callNumberBtn.disabled = false;
        this.autoPlayBtn.disabled = false;
        this.submitCustomNumberBtn.disabled = false;
        this.customNumberInput.disabled = false;
        
        // Reset attempts
        this.autoPlayAttempts = 0;
        this.manualAttempts = 0;
        
        // Reset scores and streaks
        this.playerScore = 0;
        this.systemScore = 0;
        this.winStreak = 0;
        this.bestStreak = 0;
        
        // Reset displays
        this.numbersLeftDisplay.textContent = '-';
        this.markedNumbersDisplay.textContent = '0';
        this.updateAttemptsDisplay(this.maxAttempts);
        this.updateScores();
        
        // Generate initial system number
        this.generateSystemNumber();
        this.playSound(this.clickSound);
        
        // Update game status
        this.updateGameStatus('Game started! Generate a number or enter your own.', 'info');
    }

    generateSystemNumber() {
        const range = this.numberRange.max - this.numberRange.min + 1;
        this.systemNumber = Math.floor(Math.random() * range) + this.numberRange.min;
        this.calledNumberDisplay.textContent = this.systemNumber;
        this.numbersCalledDisplay.textContent = this.systemNumber;
        this.updateNumberHistory(this.systemNumber, 'system');
    }

    generatePlayerNumber() {
        if (!this.gameActive) {
            this.updateGameStatus('Please start a new game first!', 'error');
            return;
        }

        if (this.manualAttempts >= this.maxAttempts) {
            this.updateGameStatus('Maximum attempts reached! Start a new game.', 'error');
            this.callNumberBtn.disabled = true;
            this.submitCustomNumberBtn.disabled = true;
            return;
        }

        const range = this.numberRange.max - this.numberRange.min + 1;
        let generatedNumber;
        do {
            generatedNumber = Math.floor(Math.random() * range) + this.numberRange.min;
        } while (generatedNumber === this.systemNumber);
        
        this.playerNumber = generatedNumber;
        this.manualAttempts++;
        this.updateAttemptsDisplay(this.maxAttempts - this.manualAttempts);
        
        this.playSound(this.clickSound);
        this.checkResult();
    }

    handleCustomNumber() {
        if (!this.gameActive) {
            this.updateGameStatus('Please start a new game first!', 'error');
            return;
        }

        if (this.manualAttempts >= this.maxAttempts) {
            this.updateGameStatus('Maximum attempts reached! Start a new game.', 'error');
            this.callNumberBtn.disabled = true;
            this.submitCustomNumberBtn.disabled = true;
            return;
        }
        
        const number = parseInt(this.customNumberInput.value);
        if (isNaN(number) || number < this.numberRange.min || number > this.numberRange.max) {
            this.updateGameStatus(`Please enter a number between ${this.numberRange.min} and ${this.numberRange.max}`, 'error');
            return;
        }

        if (number === 1) {
            this.updateGameStatus('Number 1 is not allowed!', 'error');
            return;
        }

        // Check if number is same as system number
        if (number === this.systemNumber) {
            this.updateGameStatus('Cannot use the same number as the system!', 'error');
            this.playSound(this.loseSound);
            return;
        }
        
        this.playerNumber = number;
        this.manualAttempts++;
        this.updateAttemptsDisplay(this.maxAttempts - this.manualAttempts);
        
        this.playSound(this.clickSound);
        this.checkResult();
        this.customNumberInput.value = '';
    }

    checkResult() {
        // Check if system number is prime
        if (this.isPrime(this.systemNumber)) {
            this.handleWin(['Prime Number']);
            this.updateNumberHistory(this.playerNumber, 'player', ['Prime Number']);
            this.numbersLeftDisplay.textContent = this.playerNumber;
            this.markedNumbersDisplay.textContent = '1';
            this.updateGameStatus('System gave a prime number! You win! 🎉', 'success');
            this.generateSystemNumber();
            return;
        }

        // Check if player number is same as system number
        if (this.playerNumber === this.systemNumber) {
            this.updateGameStatus('Cannot use the same number as the system!', 'error');
            this.playSound(this.loseSound);
            this.manualAttempts--; // Don't count this attempt
            this.updateAttemptsDisplay(this.maxAttempts - this.manualAttempts);
            return;
        }

        const commonDivisors = this.findCommonDivisors(this.systemNumber, this.playerNumber);
        this.updateNumberHistory(this.playerNumber, 'player', commonDivisors);
        
        // Update stats display
        this.numbersLeftDisplay.textContent = this.playerNumber;
        this.markedNumbersDisplay.textContent = commonDivisors.length;
        
        if (commonDivisors.length > 0) {
            this.handleWin(commonDivisors);
        } else {
            this.handleLoss();
        }
        
        // Generate new system number after each submission
        this.generateSystemNumber();
    }

    handleWin(divisors) {
        const baseScore = 1;
        const multiplier = this.scoreMultiplier || 1;
        const finalScore = baseScore * multiplier;
        
        this.playerScore += finalScore;
        this.winStreak++;
        this.bestStreak = Math.max(this.bestStreak, this.winStreak);
        
        this.updateScores();
        this.checkAchievements();
        
        if (divisors[0] === 'Prime Number') {
            this.showPrimeWin();
        } else {
            this.showBingo(divisors);
        }
        
        this.playSound(this.bingoSound);

        // Check if all attempts are completed
        this.checkGameCompletion();
    }

    handleLoss() {
        this.systemScore++;
        this.winStreak = 0;
        
        this.updateScores();
        this.showSystemWins();
        this.playSound(this.loseSound);
        
        // Add lose animation
        this.calledNumberDisplay.classList.add('lose-animation');
        setTimeout(() => this.calledNumberDisplay.classList.remove('lose-animation'), 500);

        // Check if all attempts are completed
        this.checkGameCompletion();
    }

    checkGameCompletion() {
        console.log('Checking game completion:', {
            manualAttempts: this.manualAttempts,
            maxAttempts: this.maxAttempts,
            playerScore: this.playerScore,
            systemScore: this.systemScore
        });

        if (this.manualAttempts >= this.maxAttempts) {
            console.log('Game completed, showing final result');
            
            // Disable input and buttons
            this.callNumberBtn.disabled = true;
            this.submitCustomNumberBtn.disabled = true;
            this.customNumberInput.disabled = true;

            // Show final result
            let message = '';
            if (this.playerScore > this.systemScore) {
                message = `Congratulations! You won with ${this.playerScore} wins out of ${this.maxAttempts} attempts!`;
                this.showFinalResult(true, message);
            } else if (this.playerScore < this.systemScore) {
                message = `Game Over! System won with ${this.systemScore} wins out of ${this.maxAttempts} attempts.`;
                this.showFinalResult(false, message);
            } else {
                message = `It's a tie! Both you and the system won ${this.playerScore} times.`;
                this.showFinalResult(false, message);
            }
        }
    }

    showFinalResult(isWin, message) {
        console.log('Showing final result:', { isWin, message });
        
        // Make sure the popup is visible
        this.resultPopup.style.display = 'flex';
        this.resultPopup.classList.remove('hidden');
        
        // Update popup content
        this.popupTitle.textContent = isWin ? 'BINGO!' : 'Better Luck Next Time!';
        this.popupMessage.textContent = message;
        this.popupTitle.className = `font-bold mb-4 ${isWin ? 'win text-6xl' : 'lose text-4xl'}`;
        
        if (isWin) {
            this.popupTitle.style.fontFamily = "'Uncial Antiqua', cursive";
        } else {
            this.popupTitle.style.fontFamily = '';
        }
        
        // Play popup sound
        this.popupSound.volume = 0.7;
        this.playSound(this.popupSound);
        
        // Play appropriate sound
        if (isWin) {
            this.finalWinSound.volume = 1.0;
            this.playSound(this.finalWinSound);
        } else {
            this.loseSound.volume = 1.0;
            this.playSound(this.loseSound);
        }
    }

    showBingo(divisors) {
        const message = `Common divisors: ${divisors.join(', ')}`;
        this.updateGameStatus(message, 'success');
    }

    showPrimeWin() {
        const message = 'System gave a prime number!';
        this.updateGameStatus(message, 'success');
    }

    showSystemWins() {
        const message = 'No common divisors found.';
        this.updateGameStatus(message, 'error');
    }

    updateScores() {
        this.playerScoreDisplay.textContent = this.playerScore;
        this.systemScoreDisplay.textContent = this.systemScore;
        this.winStreakDisplay.textContent = this.winStreak;
        this.bestStreakDisplay.textContent = this.bestStreak;
        
        // Add score update animation
        [this.playerScoreDisplay, this.systemScoreDisplay, 
         this.winStreakDisplay, this.bestStreakDisplay].forEach(el => {
            el.classList.add('score-update');
            setTimeout(() => el.classList.remove('score-update'), 300);
        });
    }

    updateGameStatus(message, type) {
        const statusDiv = document.getElementById('gameStatus');
        statusDiv.textContent = message;
        statusDiv.className = `text-center p-4 rounded-lg mt-4 ${
            type === 'success' ? 'bg-green-100 text-green-700' : 
            type === 'error' ? 'bg-red-100 text-red-700' :
            type === 'info' ? 'bg-blue-100 text-blue-700' :
            ''
        }`;
    }

    findCommonDivisors(num1, num2) {
        const divisors = [];
        const min = Math.min(num1, num2);
        for (let i = 2; i <= min; i++) {
            if (num1 % i === 0 && num2 % i === 0) {
                divisors.push(i);
            }
        }
        return divisors;
    }

    isPrime(num) {
        if (num <= 1) return false;
        if (num <= 3) return true;
        if (num % 2 === 0 || num % 3 === 0) return false;
        
        for (let i = 5; i * i <= num; i += 6) {
            if (num % i === 0 || num % (i + 2) === 0) return false;
        }
        return true;
    }

    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        const icon = this.toggleSoundBtn.querySelector('.sound-icon');
        icon.textContent = this.soundEnabled ? '🔊' : '🔇';
    }

    playSound(sound) {
        if (this.soundEnabled) {
            // Reset the sound to start
            sound.currentTime = 0;
            // Play the sound and handle any errors
            sound.play().catch(error => {
                console.log('Error playing sound:', error);
                // Try playing again if it fails
                setTimeout(() => {
                    sound.play().catch(e => console.log('Second attempt failed:', e));
                }, 100);
            });
        }
    }

    updateNumberHistory(number, type, divisors = []) {
        if (type === 'system') {
            // Store the system number for the next player number
            this.lastSystemNumber = number;
            return;
        }

        // Calculate the round number based on the number of rows
        const roundNumber = Math.floor(this.numberHistory.children.length) + 1;
        
        // Create a new row for the complete round
        const row = document.createElement('tr');
        const hasDivisors = divisors.length > 0;
        row.className = hasDivisors ? 'history-row-win' : 'history-row-lose';
        
        row.innerHTML = `
            <td class="text-center">${roundNumber}</td>
            <td class="font-bold">${this.lastSystemNumber}</td>
            <td class="font-bold">${number}</td>
            <td>${divisors.length > 0 ? divisors.join(', ') : 'None'}</td>
            <td class="font-medium">${hasDivisors ? 'Win 🎉' : 'Lose ❌'}</td>
        `;
        
        // Insert at the beginning of the table body
        this.numberHistory.insertBefore(row, this.numberHistory.firstChild);
    }

    toggleAutoPlay() {
        if (this.autoPlayInterval) {
            clearInterval(this.autoPlayInterval);
            this.autoPlayInterval = null;
            this.autoPlayBtn.textContent = 'Auto Play';
            this.callNumberBtn.disabled = false;
            this.autoPlayAttempts = 0;
            this.updateGameStatus('', '');
            this.updateAttemptsDisplay(this.maxAttempts);
        } else {
            this.autoPlayBtn.textContent = 'Stop Auto Play';
            this.callNumberBtn.disabled = true;
            this.autoPlayAttempts = 0;
            this.autoPlayInterval = setInterval(() => {
                this.generatePlayerNumber();
                this.autoPlayAttempts++;
                
                // Update attempts display
                const remainingAttempts = this.maxAttempts - this.autoPlayAttempts;
                this.updateAttemptsDisplay(remainingAttempts);
                
                if (this.autoPlayAttempts >= this.maxAttempts) {
                    clearInterval(this.autoPlayInterval);
                    this.autoPlayInterval = null;
                    this.autoPlayBtn.textContent = 'Auto Play';
                    this.callNumberBtn.disabled = false;
                    
                    // Check final result
                    if (this.systemScore > this.playerScore) {
                        this.updateGameStatus('System wins the auto-play challenge!', 'error');
                    } else if (this.playerScore > this.systemScore) {
                        this.updateGameStatus('Player wins the auto-play challenge!', 'success');
                    } else {
                        this.updateGameStatus('It\'s a tie in the auto-play challenge!', 'info');
                    }
                }
            }, 2000);
        }
        this.playSound(this.clickSound);
    }

    updateAttemptsDisplay(remainingAttempts) {
        const attemptsNumber = document.getElementById('attemptsNumber');
        const attemptsTile = attemptsNumber.parentElement;
        
        attemptsNumber.textContent = remainingAttempts;
        
        // Update display style based on remaining attempts
        attemptsTile.classList.remove('bg-yellow-50', 'bg-red-50');
        attemptsNumber.classList.remove('text-yellow-600', 'text-red-600');
        
        if (remainingAttempts <= 3) {
            attemptsTile.classList.add('bg-red-50');
            attemptsNumber.classList.add('text-red-600');
        } else if (remainingAttempts <= 5) {
            attemptsTile.classList.add('bg-yellow-50');
            attemptsNumber.classList.add('text-yellow-600');
        }
    }

    showPopup(isWin, message) {
        this.popupTitle.textContent = isWin ? 'BINGO!' : 'Better Luck Next Time!';
        this.popupMessage.textContent = message;
        this.popupTitle.className = `text-4xl font-bold mb-4 ${isWin ? 'win' : 'lose'}`;
        this.resultPopup.classList.remove('hidden');
        this.resultPopup.classList.add('flex');
    }

    hidePopup() {
        this.resultPopup.style.display = 'none';
        this.resultPopup.classList.add('hidden');
        this.resultPopup.classList.remove('flex');
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.bingoGame = new BingoGame();
}); 