// 游戏主类
class LianLianKanGame {
    constructor() {
        this.gridSize = 8;
        this.tiles = [];
        this.selectedTiles = [];
        this.score = 0;
        this.steps = 0;
        this.gameActive = true;
        this.history = [];
        this.theme = 'tracks';
        this.consecutiveMatches = 0; // 连续消除计数
        
        // 新增倒计时相关属性
        this.defaultTimeLimit = 180; // 默认值
        this.timeLimit = this.defaultTimeLimit; // 当前时间限制
        this.timeLeft = this.timeLimit;
        this.timerInterval = null;
        this.isSafetyCarActive = false;
        this.consecutiveMistakes = 0; // 连续失误计数
        this.safetyCarTimer = null; // 安全车计时器

        this.failureAudio = null;
        this.isFailurePlaying = false;

        this.bgmVolume = 0.5; // 默认音量
        this.isMusicMuted = false;
        this.isMusicPaused = false;
        this.volumeSliderVisible = false;

        this.victoryAudio = null;
        this.isVictoryPlaying = false;

        // ========== 新增：修复循环触发的核心标记 ==========
        this.triggeredCelebrations = new Set(); // 记录已触发的庆祝阈值
        this.safetyCarCooldown = false; // 安全车冷却标记
        this.isGameFrozen = false;

        
        this.themes = {
            cars: ['images/cars/alpine.jpeg', 'images/cars/aston_martin.jpeg', 'images/cars/ferrari.jpeg', 'images/cars/hass.jpeg', 'images/cars/maclaren.jpeg', 'images/cars/mercedes.jpeg', 'images/cars/redbull.jpeg', 'images/cars/redbull2.jpeg', 'images/cars/sauber.jpeg', 'images/cars/williams.jpeg'],
            tracks: ['images/tracks/Australia.png', 'images/tracks/Austria.png', 'images/tracks/Azerbaijan.png', 'images/tracks/Bahran.png', 'images/tracks/Brazil.png', 'images/tracks/China.png', 'images/tracks/Hungary.png', 'images/tracks/Italy.png', 'images/tracks/Mexico.png', 'images/tracks/Monaco.png' ,'images/tracks/Spain.png', 'images/tracks/UK.png'],
            drivers1: ['images/drivers/Albon.png', 'images/drivers/Alonso.png', 'images/drivers/Bearman.png', 'images/drivers/Gabi.png', 'images/drivers/Gasley.png', 'images/drivers/Hadjar.png', 'images/drivers/Hamilton.png', 'images/drivers/Hülkenberg.png', 'images/drivers/Kimi.png', 'images/drivers/Leclerc.png', 'images/drivers/Max.png'],
            drivers2: [ 'images/drivers/Hülkenberg.png', 'images/drivers/Kimi.png', 'images/drivers/Lando.png', 'images/drivers/Lawson.png', 'images/drivers/Leclerc.png', 'images/drivers/Max.png', 'images/drivers/Ocon.png', 'images/drivers/Piastri.png', 'images/drivers/Russell.png', 'images/drivers/Sainz.png', 'images/drivers/Stroll.png', 'images/drivers/Yuki.png', 'images/drivers/Colapinto.png']
        };
        
        // 庆祝消息
        this.celebrationMessages = {
            2: { text: 'Good!', color: '#ffcc00', shadow: '#ff0000' , image: 'images/icons/daniel.png', imageSize: 160},
            4: { text: 'Radio Check!', color: '#ffcc00', shadow: '#ff0000' , image: 'images/icons/max3.png', imageSize: 180},
            6: { text: 'Let’s Go Baby!', color: '#ffff00', shadow: '#b00808' ,image: 'images/icons/charles.png', imageSize: 180},
            8: { text: 'Come To Support!', color: '#ffcc00', shadow: '#ff0000', image: 'images/icons/support.png', imageSize: 160},
            10: { text: 'Safety Car Deployed!', color: '#ffffff', shadow: '#003665' },
            12: { text: 'BOX BOX!', color: '#ffff00', shadow: '#b00808' , image: 'images/icons/hamilton.png', imageSize: 200, imageRotate: -10},
            14: { text: 'We can be Champion!', color: '#ffcc00', shadow: '#ff0000', image: 'images/icons/charles_sf.png', imageSize: 180},
            16: { text: 'I CAN FLY!', color: '#ffffff', shadow: '#003665', image: 'images/icons/russell_fly.png', imageSize: 220, imageRotate: -15 },
            18: { text: 'DU DU DU DU!', color: '#ffffff', shadow: '#ffcc00', image: 'images/icons/max2.png', imageSize: 220, imageRotate: 15 }
        };
        this.celebrationSounds = {
            2: 'sounds/good.mp3',
            4: 'sounds/great.mp3',
            6: 'sounds/amazing.mp3',
            8: 'sounds/awesome.mp3',
            10: 'sounds/safety_car_deployed.mp3', // 安全车出动音效
            12: 'sounds/unbelievable.mp3',
            14: 'sounds/perfect.mp3'
        };

        this.initElements();
        this.attachEventListeners();
        this.setupMusicControls(); // 新增
        this.setupVictoryAudio(); // 新增
        this.setupFailureAudio();
        this.startNewGame();
    }

    initElements() {
    this.boardEl = document.getElementById('gameBoard');
    this.scoreEl = document.getElementById('score');
    this.remainingEl = document.getElementById('remaining');
    this.stepsEl = document.getElementById('steps');
    this.gameOverModal = document.getElementById('gameOverModal');
    this.settingsModal = document.getElementById('settingsModal');
    
    // 新增元素
    this.timerEl = document.getElementById('timer');
    this.safetyCarStatusEl = document.getElementById('safetyCarStatus');
    this.mistakesEl = document.getElementById('mistakes');
    this.safetyCarEffectEl = document.getElementById('safetyCarEffect');

    // ========== 修复：BGM元素初始化（添加兜底创建） ==========
    this.bgmAudio = document.getElementById('bgmAudio');
    if (!this.bgmAudio) {
        // 动态创建BGM元素
        this.bgmAudio = document.createElement('audio');
        this.bgmAudio.id = 'bgmAudio';
        this.bgmAudio.loop = true;
        this.bgmAudio.preload = 'auto';
        this.bgmAudio.src = 'sounds/bgm.mp3'; // 替换为你的BGM路径
        document.body.appendChild(this.bgmAudio);
        console.log('BGM元素已动态创建');
    }
    
    this.musicBtn = null;
    this.volumeSlider = null;

    // ========== 修复：提前获取游戏结束弹窗的子元素 ==========
    this.gameOverTitle = document.getElementById('gameOverTitle');
    this.gameOverMessage = document.getElementById('gameOverMessage');
    this.finalScoreEl = document.getElementById('finalScore');
    this.finalTimeEl = document.getElementById('finalTime');

    this.victoryAudio = document.getElementById('victoryAudio');
    if (!this.victoryAudio) {
        this.createVictoryAudioElement();
    }
    this.failureAudio = document.getElementById('failureAudio');
    if (!this.failureAudio) {
        this.createFailureAudioElement();
    }

    this.createSafetyCarSlideElement();
}


    // 新增：设置音乐控制界面
    setupMusicControls() {
    // 创建音乐控制按钮
    this.musicBtn = document.createElement('div');
    this.musicBtn.className = 'music-control';
    this.musicBtn.innerHTML = `
        <div class="music-icon">♪</div>
    `;
    document.body.appendChild(this.musicBtn);
    
    // 创建音量滑块
    this.volumeSlider = document.createElement('div');
    this.volumeSlider.className = 'volume-slider';
    this.volumeSlider.innerHTML = `
        <input type="range" min="0" max="1" step="0.1" value="${this.bgmVolume}">
    `;
    document.body.appendChild(this.volumeSlider);
    
    // 设置音量滑块事件
    const volumeInput = this.volumeSlider.querySelector('input');
    volumeInput.addEventListener('input', (e) => {
        this.bgmVolume = parseFloat(e.target.value);
        this.updateMusicVolume();
    });
    
    // 音乐按钮点击事件
    this.musicBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleMusic();
    });
    
    // 点击其他地方隐藏音量滑块
    document.addEventListener('click', (e) => {
        if (this.volumeSliderVisible && 
            !this.volumeSlider.contains(e.target) && 
            !this.musicBtn.contains(e.target)) {
            this.hideVolumeSlider();
        }
    });
    
    // 音量滑块显示/隐藏
    this.musicBtn.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        this.toggleVolumeSlider();
    });
    
    // 鼠标悬停在音乐按钮上时显示提示
    this.musicBtn.addEventListener('mouseenter', () => {
        this.showMusicTooltip();
    });
    
    this.musicBtn.addEventListener('mouseleave', () => {
        this.hideMusicTooltip();
    });
    
    // 初始化音量
    this.updateMusicVolume();
}

createFailureAudioElement() {
        this.failureAudio = document.createElement('audio');
        this.failureAudio.id = 'failureAudio';
        this.failureAudio.preload = 'auto';
        this.failureAudio.src = 'sounds/stupid.mp3';
        document.body.appendChild(this.failureAudio);
        console.log('失败音频元素已创建');
    }

    // 新增：设置失败音频
    setupFailureAudio() {
        if (!this.failureAudio) {
            console.error('失败音频元素未找到');
            return;
        }
        
        // 设置音频事件监听器
        this.failureAudio.addEventListener('ended', () => {
            this.isFailurePlaying = false;
            console.log('失败音乐播放结束');
            
            // 失败音乐结束后可以循环播放（可选）
            // this.playFailureMusic();
        });
        
        this.failureAudio.addEventListener('error', (e) => {
            console.error('失败音乐播放错误:', e);
            this.isFailurePlaying = false;
        });
    }

createVictoryAudioElement() {
        this.victoryAudio = document.createElement('audio');
        this.victoryAudio.id = 'victoryAudio';
        this.victoryAudio.preload = 'auto';
        this.victoryAudio.src = 'sounds/DU_DU_DU_DU.mp3';
        document.body.appendChild(this.victoryAudio);
        console.log('通关音频元素已创建');
    }

    setupVictoryAudio() {
        if (!this.victoryAudio) {
            console.error('通关音频元素未找到');
            return;
        }
        
        // 设置音频事件监听器
        this.victoryAudio.addEventListener('ended', () => {
            this.isVictoryPlaying = false;
            console.log('通关音乐播放结束');
        });
        
        this.victoryAudio.addEventListener('error', (e) => {
            console.error('通关音乐播放错误:', e);
            this.isVictoryPlaying = false;
        });
    }


showMusicTooltip() {
    // 创建提示文本
    const tooltip = document.createElement('div');
    tooltip.className = 'music-tooltip';
    tooltip.textContent = 'Click: Mute/Unmute | Double-click: Volume';
    tooltip.style.cssText = `
        position: absolute;
        bottom: 70px;
        right: 20px;
        background: rgba(0, 0, 0, 0.9);
        color: #ffcc00;
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 12px;
        white-space: nowrap;
        border: 1px solid #ffcc00;
        z-index: 1001;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
    `;
    tooltip.id = 'musicTooltip';
    document.body.appendChild(tooltip);
}

hideMusicTooltip() {
    const tooltip = document.getElementById('musicTooltip');
    if (tooltip) {
        tooltip.remove();
    }
}

    // 新增：切换背景音乐
    toggleMusic() {
    if (!this.bgmAudio) return;
    
    if (this.isMusicMuted) {
        // 取消静音
        this.isMusicMuted = false;
        this.bgmAudio.muted = false;
        this.musicBtn.classList.remove('muted');
        console.log('背景音乐取消静音');
        
        // 如果游戏活跃且音乐未暂停，播放音乐
        if (this.gameActive && !this.isMusicPaused) {
            this.playBGM();
        }
    } else {
        // 静音
        this.isMusicMuted = true;
        this.bgmAudio.muted = true;
        this.musicBtn.classList.add('muted');
        console.log('背景音乐静音');
    }
}


    // 新增：播放背景音乐
    playBGM() {
        if (!this.bgmAudio || this.isMusicMuted || this.isMusicPaused) return;
        
        const playPromise = this.bgmAudio.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.log('背景音乐播放失败，可能是浏览器限制:', error);
                // 用户交互后尝试重新播放
                this.bgmAudio.muted = true;
                const userPlayPromise = this.bgmAudio.play();
                userPlayPromise.then(() => {
                    this.bgmAudio.muted = this.isMusicMuted;
                }).catch(e => {
                    console.log('用户交互后播放仍然失败:', e);
                });
            });
        }
    }

    // 新增：暂停背景音乐
    pauseBGM() {
        if (!this.bgmAudio) return;
        this.isMusicPaused = true;
        this.bgmAudio.pause();
        console.log('背景音乐暂停');
    }

    // 新增：恢复背景音乐
    resumeBGM() {
        if (!this.bgmAudio || this.isMusicMuted) return;
        this.isMusicPaused = false;
        this.playBGM();
        console.log('背景音乐恢复');
    }

    // 新增：更新音乐音量
    updateMusicVolume() {
        if (!this.bgmAudio) return;
        this.bgmAudio.volume = this.bgmVolume;
        
        // 更新音量滑块的背景
        const volumeInput = this.volumeSlider.querySelector('input');
        if (volumeInput) {
            const percent = this.bgmVolume * 100;
            volumeInput.style.background = `linear-gradient(to right, #ff0000 0%, #ffcc00 ${percent}%, #333 ${percent}%)`;
        }
        
        console.log('背景音乐音量设置为:', this.bgmVolume);
    }

    // 新增：切换音量滑块显示
    toggleVolumeSlider() {
        if (this.volumeSliderVisible) {
            this.hideVolumeSlider();
        } else {
            this.showVolumeSlider();
        }
    }

    // 新增：显示音量滑块
    showVolumeSlider() {
        this.volumeSlider.classList.add('show');
        this.volumeSliderVisible = true;
    }

    // 新增：隐藏音量滑块
    hideVolumeSlider() {
        this.volumeSlider.classList.remove('show');
        this.volumeSliderVisible = false;
    }

     // 新增：销毁游戏时清理音乐相关
    destroy() {
        // 停止所有音频
        if (this.bgmAudio) {
            this.bgmAudio.pause();
            this.bgmAudio = null;
        }
        
        if (this.victoryAudio) {
            this.victoryAudio.pause();
            this.victoryAudio = null;
        }
        
        if (this.failureAudio) {
            this.failureAudio.pause();
            this.failureAudio = null;
        }
        
        // 清理提示
        this.hideMusicTooltip();
        
        if (this.musicBtn && this.musicBtn.parentNode) {
            this.musicBtn.parentNode.removeChild(this.musicBtn);
        }
        
        if (this.volumeSlider && this.volumeSlider.parentNode) {
            this.volumeSlider.parentNode.removeChild(this.volumeSlider);
        }
    }

    createVictoryParticles() {
    const particleCount = 30;
    const particlesContainer = document.createElement('div');
    particlesContainer.className = 'victory-particles';
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'victory-particle';
        
        // 随机位置
        const left = Math.random() * 100;
        const delay = Math.random() * 2;
        const duration = 2 + Math.random() * 2;
        
        particle.style.left = `${left}%`;
        particle.style.animationDelay = `${delay}s`;
        particle.style.animationDuration = `${duration}s`;
        
        // 随机大小和颜色
        const size = 10 + Math.random() * 15;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        
        // 随机颜色（金色系）
        const colors = ['#ffcc00', '#ffdd44', '#ffff00', '#ffaa00'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        particle.style.background = color;
        
        particlesContainer.appendChild(particle);
    }
    
    document.body.appendChild(particlesContainer);
    
    // 3秒后移除粒子
    setTimeout(() => {
        if (particlesContainer.parentNode) {
            particlesContainer.remove();
        }
    }, 3000);
}

createFailureEffects() {
    // 创建乌云遮罩
    const overlay = document.createElement('div');
    overlay.className = 'failure-overlay';
    document.body.appendChild(overlay);
    
    // 创建雨滴效果
    const rainContainer = document.createElement('div');
    rainContainer.className = 'failure-rain';
    
    const rainCount = 50;
    for (let i = 0; i < rainCount; i++) {
        const drop = document.createElement('div');
        drop.className = 'rain-drop';
        
        // 随机位置
        const left = Math.random() * 100;
        const delay = Math.random() * 2;
        const duration = 1 + Math.random();
        
        drop.style.left = `${left}%`;
        drop.style.animationDelay = `${delay}s`;
        drop.style.animationDuration = `${duration}s`;
        
        // 随机长度
        const length = 15 + Math.random() * 15;
        drop.style.height = `${length}px`;
        
        rainContainer.appendChild(drop);
    }
    
    document.body.appendChild(rainContainer);
    
    // 游戏重新开始时移除效果
    return { overlay, rainContainer };
}



    // 新增：创建安全车滑动DOM元素
    createSafetyCarSlideElement() {
        // 先检查是否已存在，避免重复创建
        let slideEl = document.getElementById('safetyCarSlide');
        if (slideEl) {
            this.safetyCarSlideEl = slideEl;
            return;
        }
        
        // 创建滑动容器
        slideEl = document.createElement('div');
        slideEl.id = 'safetyCarSlide';
        slideEl.className = 'safety-car-slide';
        
        // 创建安全车图片元素
        const imgEl = document.createElement('img');
        imgEl.className = 'safety-car-img';
        imgEl.src = 'images/safety_car.png'; // 替换成你的安全车图片路径
        imgEl.alt = 'Safety Car';
        
                
        slideEl.appendChild(imgEl);
        document.body.appendChild(slideEl);
        this.safetyCarSlideEl = slideEl;
    }

    attachEventListeners() {
    document.getElementById('newGameBtn').addEventListener('click', () => {
        // 冻结时也能点击新游戏
        this.startNewGame();
    });
    
    document.getElementById('undoBtn').addEventListener('click', () => {
        // 冻结/游戏结束时禁止撤销
        if (!this.gameActive || this.isGameFrozen) return;
        this.undo();
    });
    
    document.getElementById('hintBtn').addEventListener('click', () => {
        // 冻结/游戏结束时禁止提示
        if (!this.gameActive || this.isGameFrozen) return;
        this.showHint();
    });
    
    document.getElementById('settingsBtn').addEventListener('click', () => {
        // 冻结时也能打开设置
        this.showSettings();
    });
    
    document.getElementById('playAgainBtn').addEventListener('click', () => this.startNewGame());
    document.getElementById('confirmSettingsBtn').addEventListener('click', () => this.applySettings());
    document.getElementById('closeSettingsBtn').addEventListener('click', () => this.hideSettings());
}



    startNewGame() {
    console.log('开始新游戏，时间限制设置为:', this.timeLimit, '秒');
     if (this.failureEffects) {
        if (this.failureEffects.overlay && this.failureEffects.overlay.parentNode) {
            this.failureEffects.overlay.remove();
        }
        if (this.failureEffects.rainContainer && this.failureEffects.rainContainer.parentNode) {
            this.failureEffects.rainContainer.remove();
        }
        this.failureEffects = null;
    }
    
    // ========== 新增：停止所有游戏结束音乐 ==========
    
    this.stopVictoryMusic();
    this.stopFailureMusic();
    
    // ========== 修复：先隐藏游戏结束弹窗 ==========
    if (this.gameOverModal) {
        this.gameOverModal.classList.remove('show');
        // 等待隐藏动画完成后再重置其他状态
        setTimeout(() => {
            this.resetGameState();
        }, 300);
    } else {
        this.resetGameState();
    }
}

resetGameState() {
    // 清除之前的计时器
    this.stopTimer();
    if (this.safetyCarTimer) {
        clearTimeout(this.safetyCarTimer);
        this.safetyCarTimer = null;
    }

    if (this.bgmAudio) {
        this.bgmAudio.currentTime = 0; // 重新开始
        // 确保静音状态正确显示
        if (this.isMusicMuted) {
            this.musicBtn.classList.add('muted');
        } else {
            this.musicBtn.classList.remove('muted');
            this.playBGM();
        }
    }
    
    // 重置所有状态
    this.tiles = [];
    this.selectedTiles = [];
    this.score = 0;
    this.steps = 0;
    this.gameActive = true;
    this.history = [];
    this.consecutiveMatches = 0;
    this.consecutiveMistakes = 0;
    this.isSafetyCarActive = false;
    this.isGameFrozen = false;
    
    // 重置触发标记
    this.triggeredCelebrations.clear();
    this.safetyCarCooldown = false;
    
    this.timeLeft = this.timeLimit;
    console.log('剩余时间设置为:', this.timeLeft, '秒');
    
    // 确保弹窗样式完全重置
    if (this.gameOverModal) {
        this.gameOverModal.classList.remove('game-over-success', 'game-over-failed');
        // 强制重绘以确保样式生效
        void this.gameOverModal.offsetWidth;
    }
    
    this.hideSafetyCarEffect();
    this.updateSafetyCarStatus();
    this.updateMistakesDisplay();
    
    // 移除冻结样式
    this.boardEl.classList.remove('game-frozen');
    
    this.generateBoard();
    this.renderBoard();
    this.updateStats();
    this.startTimer();
}

    startTimer() {
        this.stopTimer(); // 确保没有重复的计时器
        
        // 先更新一次显示
        this.updateTimerDisplay();
        
        this.timerInterval = setInterval(() => {
            if (this.isSafetyCarActive) {
                // 安全车期间时间暂停
                return;
            }
            
            if (this.timeLeft > 0) {
                this.timeLeft--;
                this.updateTimerDisplay();
                
                // 时间警告效果
                if (this.timeLeft === 60) {
                    this.showTimeWarning('1 minute left!');
                } else if (this.timeLeft === 30) {
                    this.showTimeWarning('30 seconds left!');
                } else if (this.timeLeft <= 10) {
                    this.showTimeWarning(`${this.timeLeft} seconds left!`);
                }
            } else {
                // ========== 修复：强制设置timeLeft为0并立即触发游戏结束 ==========
                this.timeLeft = 0;
                this.updateTimerDisplay();
                this.gameOverByTime();
            }
        }, 1000);
        console.log('计时器启动，剩余时间:', this.timeLeft, '秒'); // 调试信息
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    updateTimerDisplay() {
        if (this.timerEl) {
            this.timerEl.textContent = this.formatTime(this.timeLeft);
            
            // 根据剩余时间改变颜色
            this.timerEl.classList.remove('time-warning', 'time-critical');
            if (this.timeLeft <= 60) {
                this.timerEl.classList.add('time-warning');
            }
            if (this.timeLeft <= 10) {
                this.timerEl.classList.add('time-critical');
            }
        }
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    showTimeWarning(message) {
        const warningEl = document.createElement('div');
        warningEl.className = 'warning-text';
        warningEl.textContent = message;
        document.body.appendChild(warningEl);
        
        setTimeout(() => {
            warningEl.remove();
        }, 2000);
    }

    gameOverByTime() {
    // 如果游戏已经结束，不要重复处理
    if (!this.gameActive) {
        console.log('游戏已结束，跳过超时处理');
        return;
    }
    
    console.log('游戏超时结束，当前时间:', this.timeLeft);
    
    // 立即设置游戏状态为结束，防止重复处理
    this.gameActive = false;

    this.pauseBGM();
    this.stopVictoryMusic();
    this.playFailureMusic();
    
    // 停止计时器
    this.stopTimer();
    
    // 停止安全车相关
    if (this.safetyCarTimer) {
        clearTimeout(this.safetyCarTimer);
        this.safetyCarTimer = null;
    }
    
    // 清除所有特效
    this.isSafetyCarActive = false;
    this.updateSafetyCarStatus();
    this.hideSafetyCarEffect();
    this.clearCanvas();
    
    // ========== 修复：使用简单的方式显示游戏结束界面 ==========
    setTimeout(() => {
        this.showGameOver('timeout');
    }, 50);
}


    checkMatch() {
    const [id1, id2] = this.selectedTiles;
    const tile1 = this.tiles[id1];
    const tile2 = this.tiles[id2];
    
    if (tile1.icon === tile2.icon) {
        // 检查是否能够连接
        const path = this.findPath(tile1, tile2);
        
        if (path) {
            // 检查两个tile是否直接相邻（距离为1）
            const rowDiff = Math.abs(tile1.row - tile2.row);
            const colDiff = Math.abs(tile1.col - tile2.col);
            const isDirectlyAdjacent = (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
            
            if (isDirectlyAdjacent) {
                // 直接相邻的方块直接消除
                this.handleSuccessfulMatch(tile1, tile2);
            } else {
                // 不直接相邻的方块显示连线
                this.drawConnectingLine(path);
                
                // 检查是否是最后一步
                const willGameEnd = this.willGameEndAfterMatch(tile1, tile2);
                
                // 延迟消除，让用户看到连线
                setTimeout(() => {
                    this.handleSuccessfulMatch(tile1, tile2);
                    
                    // ========== 关键修复：游戏结束时确保清空画布 ==========
                    if (!willGameEnd) {
                        this.clearCanvas();
                    } else {
                        // 如果是最后一步，在 showGameOver 中处理
                        // 连线会保持显示作为胜利动画的一部分
                    }
                }, 500);
            }
            
            // 成功消除，重置连续失误计数
            this.consecutiveMistakes = 0;
            this.updateMistakesDisplay();
        } else {
            // 图标相同但无法连接 → 判定为失误
            this.handleFailedMatch();
        }
    } else {
        // 图标不同 → 判定为失误
        this.handleFailedMatch();
    }
}

// ========== 新增：预测消除后游戏是否结束 ==========
willGameEndAfterMatch(tile1, tile2) {
    // 创建一个临时副本检查
    const tempTiles = JSON.parse(JSON.stringify(this.tiles));
    
    // 标记为已匹配
    const tile1Copy = tempTiles.find(t => t.id === tile1.id);
    const tile2Copy = tempTiles.find(t => t.id === tile2.id);
    
    if (tile1Copy && tile2Copy) {
        tile1Copy.matched = true;
        tile2Copy.matched = true;
        
        // 检查是否所有方块都已匹配
        return tempTiles.every(tile => tile.matched);
    }
    
    return false;
}

    handleSuccessfulMatch(tile1, tile2) {
    this.saveToHistory();
    tile1.matched = true;
    tile2.matched = true;
    this.score += 10;
    this.steps++;
    this.consecutiveMatches++;
    this.selectedTiles = [];
    this.renderBoard();
    
    // ========== 修改：安全车循环触发（每10连击） ==========
    if (this.consecutiveMatches % 10 === 0 && !this.safetyCarCooldown) {
        this.deploySafetyCar();
    }
    
    // 检查是否需要显示庆祝动画
    this.showCelebration();
    
    // ========== 关键修复：立即检查游戏是否结束 ==========
    if (this.checkGameOver()) {
        // 如果游戏结束，立即处理
        this.handleGameComplete();
    } else {
        if (!this.hasValidMoves()) {
            this.showNoValidMoves();
        }
    }
    
    this.updateStats();
}

handleGameComplete() {
    // 如果游戏已经结束，不要重复处理
    if (!this.gameActive) return;
    
    console.log('成功通关处理');

    this.pauseBGM();

    this.playVictoryMusic();
    
    // 停止所有计时器和动画
    this.stopTimer();
    
    // 清除安全车相关
    if (this.safetyCarTimer) {
        clearTimeout(this.safetyCarTimer);
        this.safetyCarTimer = null;
    }
    
    this.isSafetyCarActive = false;
    this.updateSafetyCarStatus();
    this.hideSafetyCarEffect();
    
    // 清空连线
    this.clearCanvas();
    
    // 设置游戏状态为结束
    this.gameActive = false;
    
    // 延迟显示游戏结束界面，确保所有动画完成
    setTimeout(() => {
        this.showGameOver();
    }, 100); // 短暂延迟确保渲染完成
}

 // 新增：播放通关音乐
    playVictoryMusic() {
        if (!this.victoryAudio || this.isVictoryPlaying) return;
        
        console.log('开始播放通关音乐');
        
        // 重置音频到开始位置
        this.victoryAudio.currentTime = 0;
        
        // 设置音量（可以适当调高）
        this.victoryAudio.volume = 0.8;
        
        // 尝试播放
        const playPromise = this.victoryAudio.play();
        
        if (playPromise !== undefined) {
            playPromise.then(() => {
                this.isVictoryPlaying = true;
                console.log('通关音乐开始播放');
            }).catch(error => {
                console.log('通关音乐自动播放失败，可能需要用户交互:', error);
                // 标记为需要用户交互，在用户下次点击时播放
                this.victoryAudio.muted = true;
                const userPlayPromise = this.victoryAudio.play();
                userPlayPromise.then(() => {
                    this.victoryAudio.muted = false;
                    this.isVictoryPlaying = true;
                    console.log('通关音乐在用户交互后开始播放');
                }).catch(e => {
                    console.log('用户交互后播放仍然失败:', e);
                    this.isVictoryPlaying = false;
                });
            });
        }
    }

    // 新增：停止通关音乐
    stopVictoryMusic() {
        if (!this.victoryAudio) return;
        
        this.victoryAudio.pause();
        this.victoryAudio.currentTime = 0;
        this.isVictoryPlaying = false;
        console.log('通关音乐已停止');
    }

    playFailureMusic() {
        if (!this.failureAudio || this.isFailurePlaying) return;
        
        console.log('开始播放失败音乐');
        
        // 重置音频到开始位置
        this.failureAudio.currentTime = 0;
        
        // 设置音量（可以适当调低，因为失败音乐可能比较讽刺）
        this.failureAudio.volume = 1;
        
        // 尝试播放
        const playPromise = this.failureAudio.play();
        
        if (playPromise !== undefined) {
            playPromise.then(() => {
                this.isFailurePlaying = true;
                console.log('失败音乐开始播放');
            }).catch(error => {
                console.log('失败音乐自动播放失败，可能需要用户交互:', error);
                // 标记为需要用户交互，在用户下次点击时播放
                this.failureAudio.muted = true;
                const userPlayPromise = this.failureAudio.play();
                userPlayPromise.then(() => {
                    this.failureAudio.muted = false;
                    this.isFailurePlaying = true;
                    console.log('失败音乐在用户交互后开始播放');
                }).catch(e => {
                    console.log('用户交互后播放仍然失败:', e);
                    this.isFailurePlaying = false;
                });
            });
        }
    }

    // 新增：停止失败音乐
    stopFailureMusic() {
        if (!this.failureAudio) return;
        
        this.failureAudio.pause();
        this.failureAudio.currentTime = 0;
        this.isFailurePlaying = false;
        console.log('失败音乐已停止');
    }


    handleFailedMatch() {
        this.selectedTiles = [];
        this.renderBoard();
        
        // 记录连续失误（核心：每失误1次计数+1）
        this.consecutiveMistakes++;
        console.log('连续失误次数:', this.consecutiveMistakes); // 调试用
        
        // 更新界面显示连续失误数
        this.updateMistakesDisplay();
        
        // 检查是否需要罚时（3次连续失误 → 减3秒）
        if (this.consecutiveMistakes >= 3) {
            this.applyPenalty();
        }
        
        // 匹配失败，重置连续消除计数
        this.consecutiveMatches = 0;
        
        // ========== 新增：重置庆祝标记和安全车冷却 ==========
        this.triggeredCelebrations.clear();
        this.safetyCarCooldown = false;
        
        // 清除未结束的安全车定时器（如果有）
        if (this.safetyCarTimer) {
            clearTimeout(this.safetyCarTimer);
            this.isSafetyCarActive = false;
            this.hideSafetyCarEffect();
        }
    }

    deploySafetyCar() {
        if (this.safetyCarCooldown) return; // 冷却中不触发
        
        this.isSafetyCarActive = true;
        this.safetyCarCooldown = true; // 开启冷却
        this.updateSafetyCarStatus();
        this.showSafetyCarEffect();
        this.playSafetyCarSound();
        
        // 显示安全车出动消息
        this.showSafetyCarMessage('SAFETY CAR DEPLOYED! Time paused for 5 seconds!');
        
        // 安全车持续5秒
        this.safetyCarTimer = setTimeout(() => {
            this.isSafetyCarActive = false;
            this.updateSafetyCarStatus();
            this.hideSafetyCarEffect();
            this.showSafetyCarMessage('SAFETY CAR IN - RACE RESUMES!');
            
            // ========== 新增：5秒冷却后可再次触发 ==========
            setTimeout(() => {
                this.safetyCarCooldown = false;
            }, 5000); // 5秒冷却，避免频繁触发
        }, 5000);
    }

    applyPenalty() {
    if (this.isSafetyCarActive || this.isGameFrozen) return; // 安全车/冻结期间不罚时
    
    // 1. 冻结游戏界面
    this.isGameFrozen = true;
    this.boardEl.classList.add('game-frozen'); // 添加冰块冻结样式

     // ========== 新增：罚时期间降低背景音乐音量 ==========
        if (this.bgmAudio && !this.isMusicMuted) {
            const originalVolume = this.bgmAudio.volume;
            this.bgmAudio.volume = originalVolume * 0.3; // 降低到30%音量
            
            setTimeout(() => {
                // 恢复原始音量
                this.bgmAudio.volume = originalVolume;
            }, 3000);
        }
    
    // 2. 显示冻结提示（冰蓝主题）
    this.showPenaltyMessage('❄️ PENALTY! FROZEN FOR 3 SECONDS! -3 seconds');
    
    // 3. 播放罚时音效
    this.playPenaltySound();
    
    // 4. 3秒后解冻并扣时间
    setTimeout(() => {
        // 扣3秒时间
        this.timeLeft = Math.max(0, this.timeLeft - 3);
        this.updateTimerDisplay();
        
        // 解冻界面
        this.isGameFrozen = false;
        this.boardEl.classList.remove('game-frozen');
        
        // 显示扣时提示（添加专属类名）
        this.showPenaltyMessage('⏱️ TIME DEDUCTED! -3 seconds', true);
        
        // 重置连续失误计数
        this.consecutiveMistakes = 0;
        this.updateMistakesDisplay();
        
    }, 3000); // 冻结3秒
}

// 修改showPenaltyMessage方法，支持添加专属类名
showPenaltyMessage(message, isTimeDeduct = false) {
    const messageEl = document.createElement('div');
    messageEl.className = 'warning-text';
    // 如果是扣时提示，添加专属类名
    if (isTimeDeduct) {
        messageEl.classList.add('time-deduct');
    }
    messageEl.textContent = message;
    document.body.appendChild(messageEl);
    
    setTimeout(() => {
        messageEl.remove();
    }, isTimeDeduct ? 2000 : 3000); // 冻结提示显示3秒，扣时提示显示2秒
}

    showSafetyCarEffect() {
        // 移除旧的特效逻辑
        if (this.safetyCarEffectEl) {
            this.safetyCarEffectEl.style.display = 'none';
        }
        this.boardEl.classList.remove('safety-car-active');
        
        // 重置动画状态
        this.safetyCarSlideEl.classList.remove('active');
        // 强制重绘，确保动画能重新触发
        void this.safetyCarSlideEl.offsetWidth;
        // 启动滑动动画
        this.safetyCarSlideEl.classList.add('active');
    }

    hideSafetyCarEffect() {
        // 移除动画类，重置位置
        this.safetyCarSlideEl.classList.remove('active');
        this.safetyCarSlideEl.style.left = '-200px'; // 回到初始位置
    }

    showSafetyCarMessage(message) {
        const messageEl = document.createElement('div');
        messageEl.className = 'warning-text';
        messageEl.textContent = message;
        messageEl.style.background = 'rgba(255, 255, 0, 0.8)';
        messageEl.style.color = '#000';
        messageEl.style.border = '2px solid #ff0000';
        document.body.appendChild(messageEl);
        
        setTimeout(() => {
            messageEl.remove();
        }, 3000);
    }

    showPenaltyMessage(message) {
        const messageEl = document.createElement('div');
        messageEl.className = 'warning-text';
        messageEl.textContent = message;
        messageEl.style.background = 'rgba(255, 0, 0, 0.8)';
        messageEl.style.color = '#fff';
        document.body.appendChild(messageEl);
        
        setTimeout(() => {
            messageEl.remove();
        }, 2000);
    }

    updateSafetyCarStatus() {
        if (this.safetyCarStatusEl) {
            this.safetyCarStatusEl.textContent = this.isSafetyCarActive ? 'ACTIVE' : 'OFF';
            this.safetyCarStatusEl.classList.toggle('active', this.isSafetyCarActive);
        }
    }

    updateMistakesDisplay() {
        if (this.mistakesEl) {
            this.mistakesEl.textContent = this.consecutiveMistakes;
            
            // 根据连续失误次数改变颜色
            this.mistakesEl.style.color = this.consecutiveMistakes >= 2 ? '#ff9900' : 
                                         this.consecutiveMistakes >= 1 ? '#ffff00' : '#ffffff';
            this.mistakesEl.style.fontWeight = this.consecutiveMistakes >= 2 ? 'bold' : 'normal';
        }
    }

    playSafetyCarSound() {
        const audio = document.getElementById('safetyCarAudio');
        if (audio) {
            audio.currentTime = 0;
            const playPromise = audio.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.log('安全车音效播放失败:', error);
                });
            }
        }
    }

    playPenaltySound() {
        const audio = document.getElementById('penaltyAudio');
        if (audio) {
            audio.currentTime = 0;
            const playPromise = audio.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.log('罚时音效播放失败:', error);
                });
            }
        }
    }

    // 修改保存历史记录的方法，保存更多状态
    saveToHistory() {
        const state = {
            tiles: JSON.parse(JSON.stringify(this.tiles)),
            score: this.score,
            steps: this.steps,
            consecutiveMatches: this.consecutiveMatches,
            consecutiveMistakes: this.consecutiveMistakes,
            timeLeft: this.timeLeft,
            isSafetyCarActive: this.isSafetyCarActive,
            selectedTiles: [...this.selectedTiles]
        };
        this.history.push(state);
        
        if (this.history.length > 20) {
            this.history.shift();
        }
    }
    

    undo() {
        if (this.history.length > 0) {
            const previousState = this.history.pop();
            
            // 恢复所有状态
            this.tiles = previousState.tiles;
            this.score = previousState.score;
            this.steps = previousState.steps;
            this.consecutiveMatches = previousState.consecutiveMatches;
            this.consecutiveMistakes = previousState.consecutiveMistakes;
            this.timeLeft = previousState.timeLeft;
            this.isSafetyCarActive = previousState.isSafetyCarActive;
            this.selectedTiles = previousState.selectedTiles;
            
            // 更新显示
            this.updateTimerDisplay();
            this.updateSafetyCarStatus();
            this.updateMistakesDisplay();
            
            // 重新渲染棋盘
            this.renderBoard();
            this.updateStats();
            this.clearCanvas();
            
            // 如果安全车状态改变，更新特效
            if (this.isSafetyCarActive) {
                this.showSafetyCarEffect();
            } else {
                this.hideSafetyCarEffect();
            }
        }
    }

    showHint() {
    const activeTiles = this.tiles.filter(t => !t.matched);
    
    for (let i = 0; i < activeTiles.length; i++) {
        for (let j = i + 1; j < activeTiles.length; j++) {
            if (activeTiles[i].icon === activeTiles[j].icon &&
                this.canConnect(activeTiles[i], activeTiles[j])) {
                this.selectedTiles = [activeTiles[i].id, activeTiles[j].id];
                this.renderBoard();
                
                setTimeout(() => {
                    this.selectedTiles = [];
                    this.renderBoard();
                }, 2000);
                
                return;
            }
        }
    }
}

    showSettings() {
        this.settingsModal.classList.add('show');
        document.getElementById('difficultySelect').value = 
            this.gridSize === 6 ? 'easy' : this.gridSize === 8 ? 'normal' : 'hard';
        document.getElementById('themeSelect').value = this.theme;
        
        // 修复：正确获取时间限制输入框并赋值
        const timeLimitInput = document.getElementById('timeLimitSelect');
        timeLimitInput.value = this.timeLimit;
        console.log('显示设置，时间输入框值为:', timeLimitInput.value);
    }

    showGameOver(type = 'success') {
    // 确保清空连线
    this.clearCanvas();
    
    // 确保游戏状态是结束的
    this.gameActive = false;
    
    const timeUsed = this.timeLimit - this.timeLeft;
    
    // ========== 修复：安全地获取DOM元素 ==========
    if (!this.gameOverModal || !this.gameOverTitle || !this.gameOverMessage || !this.finalScoreEl || !this.finalTimeEl) {
        console.error('游戏结束弹窗元素未找到！');
        // 如果DOM元素未找到，使用alert作为fallback
        if (type === 'timeout') {
            // ========== 新增：添加失败视觉效果 ==========
        const failureEffects = this.createFailureEffects();
        
        // 存储效果引用以便清理
        this.failureEffects = failureEffects;
            alert('⏰ Time\'s Up!\nYou ran out of time!\nFinal Score: ' + this.score + '\nTime Used: ' + timeUsed + ' seconds');
        } else {
            alert('🎉 Game Over!\nFinal Score: ' + this.score + '\nTime Used: ' + timeUsed + ' seconds');
        }
        return;
    }
    
    // 根据类型设置界面内容
    if (type === 'timeout') {
        // 超时失败界面
        // ========== 新增：添加失败视觉效果 ==========
    const failureEffects = this.createFailureEffects();
    
    // 存储效果引用以便清理
    this.failureEffects = failureEffects;
        this.gameOverTitle.textContent = '⏰ Time\'s Up!';
        this.gameOverTitle.style.color = '#ff3333';
        this.gameOverMessage.textContent = 'You ran out of time! Better luck next race!';
        this.gameOverModal.classList.add('game-over-failed');
        this.gameOverModal.classList.remove('game-over-success');
        if (!this.isFailurePlaying) {
                setTimeout(() => {
                    this.playFailureMusic();
                }, 300);
            }
        this.stopVictoryMusic();
    } else {
        // 成功通关界面
        const hasRemainingTiles = this.tiles.some(tile => !tile.matched);
        if (hasRemainingTiles) {
            // 无解失败
            this.gameOverTitle.textContent = '⏰ Game Over!';
            this.gameOverTitle.style.color = '#ff3333';
            this.gameOverMessage.textContent = 'Better luck next race!';
            this.gameOverModal.classList.add('game-over-failed');
            this.gameOverModal.classList.remove('game-over-success');
            if (!this.isFailurePlaying) {
                setTimeout(() => {
                    this.playFailureMusic();
                }, 300);
            }
            this.stopVictoryMusic();
        } else {
            // 成功通关
            this.gameOverTitle.textContent = '🎉 POLE TO WIN!!!';
            this.gameOverTitle.style.color = '#ffcc00';
            this.gameOverMessage.textContent = 'You finished the race in record time!';
            this.gameOverModal.classList.add('game-over-success');
            this.gameOverModal.classList.remove('game-over-failed');
            this.createVictoryParticles();
            this.stopFailureMusic();
            if (!this.isVictoryPlaying) {
                    setTimeout(() => {
                        this.playVictoryMusic();
                    }, 300); // 延迟一点，确保弹窗动画开始
                }
            
        }
    }
    
    // 设置分数和时间
    this.finalScoreEl.textContent = this.score;
    this.finalTimeEl.textContent = `${timeUsed} seconds`;
    
    // ========== 关键修复：只使用CSS类控制显示，不设置style属性 ==========
    this.gameOverModal.classList.add('show');
    
    console.log('游戏结束界面显示完成，类型:', type);
}

    showNoValidMoves() {
    // 如果游戏已经结束，不要重复处理
    if (!this.gameActive) return;
    
    console.log('无解检测，游戏结束');
    
    // 清除连线
    this.clearCanvas();
    
    // 延迟显示提示，确保界面更新
    setTimeout(() => {
        this.gameActive = false;
        this.stopTimer();
        
        this.pauseBGM();
        this.stopVictoryMusic();
        this.playFailureMusic();
        
        // 停止所有安全车相关
        if (this.safetyCarTimer) {
            clearTimeout(this.safetyCarTimer);
            this.safetyCarTimer = null;
        }
        
        this.isSafetyCarActive = false;
        this.updateSafetyCarStatus();
        this.hideSafetyCarEffect();
        
        // 显示无解提示
        alert('No Removable Tiles! Game Over!');
        
        // 再显示结束界面
        setTimeout(() => {
            this.showGameOver();
        }, 500);
    }, 100);
}

    updateStats() {
        this.scoreEl.textContent = this.score;
        this.stepsEl.textContent = this.steps;
        const remainingCount = this.tiles.filter(t => !t.matched).length;
        this.remainingEl.textContent = remainingCount;
        this.updateTimerDisplay();
        this.updateMistakesDisplay();
    }

    generateBoard() {
        const totalTiles = this.gridSize * this.gridSize;
        const pairCount = totalTiles / 2;
        const themeIcons = this.themes[this.theme];
        
        let tileList = [];
        let attempts = 0;
        const maxAttempts = 50;
        
        // 多次尝试生成一个足够复杂的棋盘
        while (attempts < maxAttempts) {
            tileList = [];
            
            // 创建配对列表
            for (let i = 0; i < pairCount; i++) {
                const icon = themeIcons[i % themeIcons.length];
                tileList.push(icon);
                tileList.push(icon);
            }
            
            // 洗牌
            for (let i = tileList.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [tileList[i], tileList[j]] = [tileList[j], tileList[i]];
            }
            
            // 检查棋盘复杂度，如果够复杂就使用
            if (this.isBoardComplex(tileList)) {
                break;
            }
            
            attempts++;
        }
        
        this.tiles = tileList.map((icon, index) => ({
            id: index,
            icon: icon,
            matched: false,
            row: Math.floor(index / this.gridSize),
            col: index % this.gridSize
        }));
    }

    isBoardComplex(tileList) {
        // 检查棋盘是否足够复杂
        // 1. 检查相邻相同符号的数量
        let adjacentCount = 0;
        
        for (let i = 0; i < tileList.length; i++) {
            const row = Math.floor(i / this.gridSize);
            const col = i % this.gridSize;
            const currentIcon = tileList[i];
            
            // 检查右边的方块
            if (col < this.gridSize - 1) {
                if (tileList[i + 1] === currentIcon) {
                    adjacentCount++;
                }
            }
            
            // 检查下面的方块
            if (row < this.gridSize - 1) {
                const belowIndex = i + this.gridSize;
                if (tileList[belowIndex] === currentIcon) {
                    adjacentCount++;
                }
            }
        }
        
        const maxAllowedAdjacent = Math.ceil(this.gridSize * 0.5);
        if (adjacentCount > maxAllowedAdjacent) {
            return false;
        }
        
        // 2. 检查区域分布是否均匀
        // 将棋盘分成4个区域，检查每个符号是否分散
        return this.isSymbolDistributed(tileList);
    }

    isSymbolDistributed(tileList) {
        // 将棋盘分成4个象限区域
        const quadrants = [
            { minRow: 0, maxRow: Math.floor(this.gridSize / 2) - 1, minCol: 0, maxCol: Math.floor(this.gridSize / 2) - 1 },
            { minRow: 0, maxRow: Math.floor(this.gridSize / 2) - 1, minCol: Math.floor(this.gridSize / 2), maxCol: this.gridSize - 1 },
            { minRow: Math.floor(this.gridSize / 2), maxRow: this.gridSize - 1, minCol: 0, maxCol: Math.floor(this.gridSize / 2) - 1 },
            { minRow: Math.floor(this.gridSize / 2), maxRow: this.gridSize - 1, minCol: Math.floor(this.gridSize / 2), maxCol: this.gridSize - 1 }
        ];
        
        // 统计每个符号在每个象限中出现的次数
        const symbolDistribution = {};
        
        for (let i = 0; i < tileList.length; i++) {
            const row = Math.floor(i / this.gridSize);
            const col = i % this.gridSize;
            const icon = tileList[i];
            
            if (!symbolDistribution[icon]) {
                symbolDistribution[icon] = [0, 0, 0, 0];
            }
            
            // 确定该方块属于哪个象限
            for (let q = 0; q < quadrants.length; q++) {
                const quad = quadrants[q];
                if (row >= quad.minRow && row <= quad.maxRow &&
                    col >= quad.minCol && col <= quad.maxCol) {
                    symbolDistribution[icon][q]++;
                    break;
                }
            }
        }
        
        // 检查每个符号是否分散在不同象限
        // 同一符号的两个实例不应该都在同一个象限
        for (const icon in symbolDistribution) {
            const distribution = symbolDistribution[icon];
            
            // 如果两个相同的符号都在同一个象限，认为分布不均匀
            for (let q = 0; q < distribution.length; q++) {
                if (distribution[q] === 2) {
                    return false; // 两个相同符号在同一象限
                }
            }
        }
        
        return true;
    }

    renderBoard() {
        this.boardEl.innerHTML = '';
        this.boardEl.style.gridTemplateColumns = `repeat(${this.gridSize}, 1fr)`;
        
        this.tiles.forEach(tile => {
            const tileEl = document.createElement('div');
            tileEl.className = 'tile';
            
            if (tile.matched) {
                tileEl.classList.add('empty');
                tileEl.textContent = '';
                tileEl.style.backgroundImage = 'none';
            } else {
                // 检查是否是图片URL（支持png, jpg, svg等）
                const isImageUrl = typeof tile.icon === 'string' && 
                    (tile.icon.includes('.png') || tile.icon.includes('.jpg') || 
                     tile.icon.includes('.jpeg') || tile.icon.includes('.svg') ||
                     tile.icon.includes('.webp') || tile.icon.includes('.gif'));
                
                if (isImageUrl) {
                    // 使用背景图片模式
                    tileEl.style.backgroundImage = `url('${tile.icon}')`;
                    tileEl.style.backgroundSize = 'contain';
                    tileEl.style.backgroundRepeat = 'no-repeat';
                    tileEl.style.backgroundPosition = 'center';
                    tileEl.textContent = '';
                } else {
                    // 使用emoji文本模式
                    tileEl.style.backgroundImage = 'none';
                    tileEl.textContent = tile.icon;
                }
                
                tileEl.dataset.id = tile.id;
                tileEl.addEventListener('click', () => this.selectTile(tile.id));
                
                if (this.selectedTiles.includes(tile.id)) {
                    tileEl.classList.add('selected');
                }
            }
            
            this.boardEl.appendChild(tileEl);
        });
    }

    selectTile(tileId) {
    // 新增：冻结/游戏结束时禁止点击
    if (!this.gameActive || this.isGameFrozen) return;
    
    const tile = this.tiles[tileId];
    if (tile.matched) return;
    
    if (this.selectedTiles.includes(tileId)) {
        this.selectedTiles = this.selectedTiles.filter(id => id !== tileId);
    } else {
        this.selectedTiles.push(tileId);
    }
    
    if (this.selectedTiles.length === 2) {
        this.checkMatch();
    }
    
    this.renderBoard();
}

    // ========== 重构：庆祝动画循环触发 ==========
    showCelebration() {
    // 检查是否达到了某个庆祝阈值
    const thresholds = [2, 4, 6, 8, 12, 14, 16, 18, 20]; // 移除10，避免重复
    
    // ========== 调整顺序：先判断安全车，再重置标记 ==========
    // 定义安全车阈值（10、20、30...）
    const isSafetyCarThreshold = this.consecutiveMatches % 10 === 0 && this.consecutiveMatches > 0;
    
    // 如果命中安全车阈值，优先处理安全车消息
    if (isSafetyCarThreshold && this.celebrationMessages[this.consecutiveMatches]) {
        const celebration = this.celebrationMessages[this.consecutiveMatches];
        const { text, color, shadow, image, imageSize = 80, imageRotate = 0 } = celebration;
        const sound = this.celebrationSounds[this.consecutiveMatches];
        
        // 创建容器
        const containerEl = document.createElement('div');
        containerEl.className = 'celebration-container';
        containerEl.style.position = 'fixed';
        containerEl.style.top = '50%';
        containerEl.style.left = '50%';
        containerEl.style.transform = 'translate(-50%, -50%)';
        containerEl.style.pointerEvents = 'none';
        containerEl.style.zIndex = '10000';
        containerEl.style.display = 'flex';
        containerEl.style.flexDirection = 'column';
        containerEl.style.alignItems = 'center';
        containerEl.style.gap = '20px';
        
        // 如果有图片，先显示图片
        if (image) {
            const imgEl = document.createElement('img');
            imgEl.src = image;
            const enlargedSize = imageSize * 1.2;
            imgEl.style.width = enlargedSize + 'px';
            imgEl.style.height = enlargedSize + 'px';
            imgEl.style.objectFit = 'contain';
            imgEl.style.filter = 'drop-shadow(0 0 20px rgba(255, 204, 0, 0.8))';
            imgEl.style.animation = 'celebrationImagePop 2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards';
            imgEl.style.transform = `rotate(${imageRotate}deg)`;
            imgEl.onerror = function() {
                console.warn('庆祝图片加载失败:', image);
            };
            containerEl.appendChild(imgEl);
        }
        
        // 显示安全车文字
        const celebrationEl = document.createElement('div');
        celebrationEl.className = 'celebration-text';
        celebrationEl.textContent = text;
        celebrationEl.style.color = color;
        celebrationEl.style.textShadow = `
            3px 3px 0 ${shadow},
            6px 6px 0 rgba(0, 0, 0, 0.3),
            -2px -2px 0 rgba(255, 255, 255, 0.3),
            0 0 10px ${shadow}
        `;
        celebrationEl.style.fontSize = '4em';
        celebrationEl.style.fontWeight = '900';
        celebrationEl.style.letterSpacing = '2px';
        celebrationEl.style.pointerEvents = 'none';
        celebrationEl.style.animation = 'celebrationTextFloat 2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards';
        celebrationEl.style.filter = 'drop-shadow(2px 2px 4px rgba(0, 0, 0, 0.5))';
        celebrationEl.style.textAlign = 'center';
        celebrationEl.style.whiteSpace = 'nowrap';
        celebrationEl.style.position = 'relative';
        celebrationEl.style.left = '0';
        celebrationEl.style.margin = '0';
        
        containerEl.appendChild(celebrationEl);
        document.body.appendChild(containerEl);
        
        // 播放安全车音效
        if (sound) {
            this.playSound(sound);
        }

        // ========== 关键修改：不加入triggeredCelebrations，而是直接清空 ==========
        this.triggeredCelebrations.clear();
        
        // 2秒后移除元素
        setTimeout(() => {
            containerEl.remove();
        }, 2000);
        
        // 优先级最高：直接返回
        return;
    }

    // ========== 重置标记逻辑移到这里：非安全车阈值时，处理普通庆祝 ==========
    // 核心：每10次连续消除重置触发标记（实现循环）
    if (this.consecutiveMatches % 10 === 0 && this.consecutiveMatches > 0) {
        this.triggeredCelebrations.clear();
    }

    // 非安全车阈值时，正常显示其他庆祝消息
    for (const threshold of thresholds) {
        if (this.consecutiveMatches >= threshold && !this.triggeredCelebrations.has(threshold)) {
            const celebration = this.celebrationMessages[threshold];
            if (!celebration) continue;
            
            const { text, color, shadow, image, imageSize = 80, imageRotate = 0 } = celebration;
            const sound = this.celebrationSounds[threshold];
            
            const containerEl = document.createElement('div');
            containerEl.className = 'celebration-container';
            containerEl.style.position = 'fixed';
            containerEl.style.top = '50%';
            containerEl.style.left = '50%';
            containerEl.style.transform = 'translate(-50%, -50%)';
            containerEl.style.pointerEvents = 'none';
            containerEl.style.zIndex = '10000';
            containerEl.style.display = 'flex';
            containerEl.style.flexDirection = 'column';
            containerEl.style.alignItems = 'center';
            containerEl.style.gap = '20px';
            
            if (image) {
                const imgEl = document.createElement('img');
                imgEl.src = image;
                const enlargedSize = imageSize * 1.2;
                imgEl.style.width = enlargedSize + 'px';
                imgEl.style.height = enlargedSize + 'px';
                imgEl.style.objectFit = 'contain';
                imgEl.style.filter = 'drop-shadow(0 0 20px rgba(255, 204, 0, 0.8))';
                imgEl.style.animation = 'celebrationImagePop 2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards';
                imgEl.style.transform = `rotate(${imageRotate}deg)`;
                imgEl.onerror = function() {
                    console.warn('庆祝图片加载失败:', image);
                };
                containerEl.appendChild(imgEl);
            }
            
            const celebrationEl = document.createElement('div');
            celebrationEl.className = 'celebration-text';
            celebrationEl.textContent = text;
            celebrationEl.style.color = color;
            celebrationEl.style.textShadow = `
                3px 3px 0 ${shadow},
                6px 6px 0 rgba(0, 0, 0, 0.3),
                -2px -2px 0 rgba(255, 255, 255, 0.3),
                0 0 10px ${shadow}
            `;
            celebrationEl.style.fontSize = '4em';
            celebrationEl.style.fontWeight = '900';
            celebrationEl.style.letterSpacing = '2px';
            celebrationEl.style.pointerEvents = 'none';
            celebrationEl.style.animation = 'celebrationTextFloat 2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards';
            celebrationEl.style.filter = 'drop-shadow(2px 2px 4px rgba(0, 0, 0, 0.5))';
            celebrationEl.style.textAlign = 'center';
            celebrationEl.style.whiteSpace = 'nowrap';
            celebrationEl.style.position = 'relative';
            celebrationEl.style.left = '0';
            celebrationEl.style.margin = '0';
            
            containerEl.appendChild(celebrationEl);
            document.body.appendChild(containerEl);
            
            if (sound) {
                this.playSound(sound);
            }
            
            this.triggeredCelebrations.add(threshold);
            
            setTimeout(() => {
                containerEl.remove();
            }, 2000);
            
            break;
        }
    }
}

    playSound(soundPath) {
        const audio = document.getElementById('celebrationAudio');
        if (audio) {
            audio.src = soundPath;
            audio.currentTime = 0;
            // 使用 play() 的 Promise 来处理自动播放限制
            const playPromise = audio.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.log('音频播放失败，可能是浏览器自动播放限制:', error);
                });
            }
        }
    }

    setSoundVolume(volume) {
        const audio = document.getElementById('celebrationAudio');
        if (audio) {
            audio.volume = Math.max(0, Math.min(1, volume));
        }
    }

    drawConnectingLine(path) {
        const canvas = document.getElementById('highlightCanvas');
        const ctx = canvas.getContext('2d');
        
        // 获取游戏棋盘元素
        const boardEl = this.boardEl;
        const boardRect = boardEl.getBoundingClientRect();
        
        // 设置canvas大小和位置（相对于gameBoard）
        canvas.width = boardRect.width;
        canvas.height = boardRect.height;
        canvas.style.display = 'block';
        canvas.style.position = 'absolute';
        canvas.style.top = boardEl.offsetTop + 'px';
        canvas.style.left = boardEl.offsetLeft + 'px';
        canvas.style.pointerEvents = 'none';
        canvas.style.zIndex = '999';
        
        // 获取tile元素和计算间距
        const tileElements = Array.from(boardEl.querySelectorAll('.tile'));
        const boardComputedStyle = window.getComputedStyle(boardEl);
        const padding = parseFloat(boardComputedStyle.padding) || 0;
        const gap = parseFloat(boardComputedStyle.gap) || 8;
        
        let tileWidth = 0;
        let tileHeight = 0;
        
        if (tileElements.length > 0) {
            const firstTileRect = tileElements[0].getBoundingClientRect();
            tileWidth = firstTileRect.width;
            tileHeight = firstTileRect.height;
        }
        
        // 清除canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // 绘制路径 - 赛车主题风格
        // 主线：黄色
        ctx.strokeStyle = '#ffcc00';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.shadowColor = 'rgba(255, 0, 0, 0.6)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        
        ctx.beginPath();
        
        for (let i = 0; i < path.length; i++) {
            const pos = path[i];
            // 计算实际的像素坐标（tile中心）相对于gameBoard
            const x = padding + pos.col * (tileWidth + gap) + tileWidth / 2;
            const y = padding + pos.row * (tileHeight + gap) + tileHeight / 2;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        
        ctx.stroke();
        
        // 在起点和终点绘制小圆点 - 红色
        ctx.fillStyle = '#ff0000';
        ctx.shadowColor = 'rgba(255, 204, 0, 0.8)';
        for (let i = 0; i < path.length; i += path.length - 1) {
            const pos = path[i];
            const x = padding + pos.col * (tileWidth + gap) + tileWidth / 2;
            const y = padding + pos.row * (tileHeight + gap) + tileHeight / 2;
            
            ctx.beginPath();
            ctx.arc(x, y, 6, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // 清除阴影设置，避免影响其他绘制
        ctx.shadowColor = 'transparent';
    }

    clearCanvas() {
        const canvas = document.getElementById('highlightCanvas');
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        canvas.style.display = 'none';
    }

    canConnect(tile1, tile2) {
        // 使用BFS算法寻找连接路径
        // 支持任意复杂的路径，只要能通过直线和转折点到达
        return this.findPath(tile1, tile2) !== null;
    }

    findPath(tile1, tile2) {
        // BFS算法寻找从tile1到tile2的有效路径
        const queue = [{
            pos: { row: tile1.row, col: tile1.col },
            path: [{ row: tile1.row, col: tile1.col }],
            turns: 0
        }];
        
        const visited = new Set();
        visited.add(`${tile1.row},${tile1.col}`);
        
        while (queue.length > 0) {
            const current = queue.shift();
            const { pos, path, turns } = current;
            
            // 到达目标
            if (pos.row === tile2.row && pos.col === tile2.col) {
                return path;
            }
            
            // 只允许最多3个转折点（2次方向改变），避免路径过于复杂
            if (turns > 3) continue;
            
            // 探索四个方向
            const directions = [
                { dr: 0, dc: 1, name: 'right' },   // 右
                { dr: 0, dc: -1, name: 'left' },   // 左
                { dr: 1, dc: 0, name: 'down' },    // 下
                { dr: -1, dc: 0, name: 'up' }      // 上
            ];
            
            for (const dir of directions) {
                // 计算新方向变化
                let newTurns = turns;
                if (path.length > 1) {
                    const lastPos = path[path.length - 1];
                    const prevPos = path[path.length - 2];
                    const lastDir = {
                        dr: lastPos.row - prevPos.row,
                        dc: lastPos.col - prevPos.col
                    };
                    
                    // 如果改变方向，增加转折计数
                    if (lastDir.dr !== dir.dr || lastDir.dc !== dir.dc) {
                        newTurns++;
                    }
                }
                
                let newRow = pos.row + dir.dr;
                let newCol = pos.col + dir.dc;
                
                // 继续沿着直线方向移动
                while (newRow >= 0 && newRow < this.gridSize && 
                       newCol >= 0 && newCol < this.gridSize) {
                    
                    const key = `${newRow},${newCol}`;
                    
                    // 检查这个位置上是否有未消除的方块
                    const blockingTile = this.tiles.find(t => 
                        t.row === newRow && t.col === newCol && !t.matched
                    );
                    
                    if (blockingTile) {
                        // 如果是目标方块，可以到达
                        if (blockingTile.id === tile2.id) {
                            return [...path, { row: newRow, col: newCol }];
                        }
                        // 如果是其他方块，停止继续沿这个方向移动
                        break;
                    }
                    
                    // 这个位置是空的，可以经过
                    if (!visited.has(key)) {
                        visited.add(key);
                        queue.push({
                            pos: { row: newRow, col: newCol },
                            path: [...path, { row: newRow, col: newCol }],
                            turns: newTurns
                        });
                    }
                    
                    newRow += dir.dr;
                    newCol += dir.dc;
                }
            }
        }
        
        return null; // 没有找到路径
    }

    hasValidMoves() {
        const activeTiles = this.tiles.filter(t => !t.matched);
        
        for (let i = 0; i < activeTiles.length; i++) {
            for (let j = i + 1; j < activeTiles.length; j++) {
                if (activeTiles[i].icon === activeTiles[j].icon &&
                    this.canConnect(activeTiles[i], activeTiles[j])) {
                    return true;
                }
            }
        }
        
        return false;
    }

    checkGameOver() {
    // 检查是否所有方块都已匹配
    const allMatched = this.tiles.every(tile => tile.matched);
    
    if (allMatched) {
        console.log('游戏结束检测：所有方块已匹配 - 成功通关');
        
        // ========== 关键修改：只在游戏仍然活跃时处理结束逻辑 ==========
        if (this.gameActive) {
            // 如果有安全车计时器，清除它
            if (this.safetyCarTimer) {
                clearTimeout(this.safetyCarTimer);
                this.safetyCarTimer = null;
            }
            
            // 清除安全车状态
            this.isSafetyCarActive = false;
            this.updateSafetyCarStatus();
            this.hideSafetyCarEffect();
            
            // 清空连线
            this.clearCanvas();
        }
        
        return true;
    }
    
    return false;
}

    hideSettings() {
        this.settingsModal.classList.remove('show');
    }

    applySettings() {
        console.log('应用设置...');
        const difficulty = document.getElementById('difficultySelect').value;
        this.theme = document.getElementById('themeSelect').value;
        
        // 修复：正确获取时间限制输入框
        const timeLimitInput = document.getElementById('timeLimitSelect');
        // 修复：移除未定义的 timeLimitStr 变量
        const timeLimit = parseInt(timeLimitInput.value);

        console.log('输入的时间限制:', timeLimitInput.value, '解析为:', timeLimit);
        
        // 验证并设置时间限制
        if (!isNaN(timeLimit) && timeLimit >= 60 && timeLimit <= 600) {
            this.timeLimit = timeLimit;
            console.log('时间限制已更新为:', this.timeLimit, '秒');
        } else {
            // 输入无效，重置为默认值并显示警告
            this.timeLimit = this.defaultTimeLimit;
            timeLimitInput.value = this.defaultTimeLimit;
            console.log('输入无效，使用默认时间限制:', this.timeLimit, '秒');
            
            alert(`Invalid time limit. Must be between 60 and 600 seconds. Using default ${this.defaultTimeLimit} seconds.`);
        }
        
        switch(difficulty) {
            case 'easy': this.gridSize = 6; break;
            case 'normal': this.gridSize = 8; break;
            case 'hard': this.gridSize = 10; break;
        }
        console.log('最终设置 - 难度:', difficulty, '主题:', this.theme, '时间限制:', this.timeLimit, '秒');
        
        this.hideSettings();
        this.startNewGame();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const game = new LianLianKanGame();
    
    // 页面卸载时清理
    window.addEventListener('beforeunload', () => {
        game.destroy();
    });
});