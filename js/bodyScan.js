// BodyScanController - Guided body scan meditation session controller
// Handles slide rendering, timer, transitions, and audio/vibration/TTS cues
// Factory function creates a controller with deferred AudioContext creation

export default function BodyScanControllerFactory() {
  // TTS configuration constants
  const TTS_RATE = 0.9;      // Slightly slower speech for meditation
  const TTS_PITCH = 1.0;     // Normal pitch
  const TTS_VOLUME = 0.8;    // Comfortable volume
  
  return class BodyScanController {
    constructor(steps, options = {}) {
      this.steps = steps;
      this.currentStepIndex = 0;
      this.isPaused = false;
      this.timer = null;
      this.secondsRemaining = 0;
      this.isStarted = false; // Track if session has been started by user
      
      // Callbacks
      this.onComplete = options.onComplete || (() => {});
      this.onStop = options.onStop || (() => {});
      
      // Audio context for chime - deferred until user gesture
      this.audioContext = null;
      this.audioContextReady = false;
      this.enableSound = true;
      this.enableVibrate = true;
      this.enableTTS = true;
      
      // DOM references
      this.elements = {};
      
      // Bind methods
      this.tick = this.tick.bind(this);
      this.start = this.start.bind(this);
    }
    
    init() {
      console.log('🌱 Initializing Body Scan Controller...');
      
      // Get DOM elements
      this.elements = {
        view: document.getElementById('body-scan-view'),
        stepTitle: document.getElementById('body-scan-step-title'),
        stepInstruction: document.getElementById('body-scan-step-instruction'),
        timerDisplay: document.getElementById('body-scan-timer-display'),
        progressFill: document.getElementById('body-scan-progress-fill'),
        prevBtn: document.getElementById('body-scan-prev'),
        pauseBtn: document.getElementById('body-scan-pause'),
        nextBtn: document.getElementById('body-scan-next'),
        stopBtn: document.getElementById('body-scan-stop'),
        exitBtn: document.getElementById('exit-body-scan'),
        soundCheckbox: document.getElementById('body-scan-sound'),
        vibrateCheckbox: document.getElementById('body-scan-vibrate'),
        ttsCheckbox: document.getElementById('body-scan-tts'),
        liveRegion: document.getElementById('body-scan-live')
      };
      
      // Validate elements
      const missingElements = Object.entries(this.elements)
        .filter(([key, el]) => !el)
        .map(([key]) => key);
      
      if (missingElements.length > 0) {
        console.error('❌ Missing elements:', missingElements);
        return false;
      }
      
      // Set up event listeners
      this.setupEventListeners();
      
      // Show view and render first step (but don't start timer yet)
      this.elements.view.style.display = 'flex';
      this.renderStep();
      
      // Don't initialize audio context or start timer yet - wait for user gesture
      console.log('✅ Body Scan Controller initialized (waiting for start gesture)');
      return true;
    }
    
    start() {
      // Called on user Start gesture - now we can initialize audio/TTS
      if (this.isStarted) return;
      
      console.log('▶️ Starting body scan session with user gesture...');
      this.isStarted = true;
      
      // Now initialize audio context with user gesture
      this.initAudioContext();
      
      // Start the timer
      this.startTimer();
      
      // Play initial cues now that we have user gesture
      const step = this.steps[this.currentStepIndex];
      if (step) {
        this.playTransitionCues(step);
      }
    }
    
    setupEventListeners() {
      this.elements.prevBtn.addEventListener('click', () => this.prevStep());
      this.elements.pauseBtn.addEventListener('click', () => this.togglePause());
      this.elements.nextBtn.addEventListener('click', () => this.nextStep());
      this.elements.stopBtn.addEventListener('click', () => this.stopSession());
      this.elements.exitBtn.addEventListener('click', () => this.stopSession());
      
      this.elements.soundCheckbox.addEventListener('change', (e) => {
        this.enableSound = e.target.checked;
      });
      
      this.elements.vibrateCheckbox.addEventListener('change', (e) => {
        this.enableVibrate = e.target.checked;
      });
      
      this.elements.ttsCheckbox.addEventListener('change', (e) => {
        this.enableTTS = e.target.checked;
      });
    }
    
    initAudioContext() {
      // Create/resume AudioContext only after user gesture
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
          if (!this.audioContext) {
            this.audioContext = new AudioContext();
            console.log('🔊 AudioContext created after user gesture');
          }
          
          // Resume if suspended
          if (this.audioContext.state === 'suspended') {
            this.audioContext.resume().then(() => {
              this.audioContextReady = true;
              console.log('🔊 AudioContext resumed successfully');
            }).catch(err => {
              console.warn('⚠️ Could not resume audio context:', err);
            });
          } else {
            this.audioContextReady = true;
          }
        }
      } catch (error) {
        console.warn('⚠️ Web Audio API not supported:', error);
      }
    }
  
    renderStep() {
      const step = this.steps[this.currentStepIndex];
      if (!step) return;
      
      // Update UI
      this.elements.stepTitle.textContent = step.title;
      this.elements.stepInstruction.textContent = step.instruction;
      this.secondsRemaining = step.seconds;
      this.updateTimerDisplay();
      this.updateProgressBar();
      
      // Update button states
      this.elements.prevBtn.disabled = this.currentStepIndex === 0;
      this.elements.nextBtn.disabled = this.currentStepIndex === this.steps.length - 1;
      
      // Announce to screen readers
      this.announce(`${step.title}. ${step.instruction}`);
      
      // Play transition cues only if session has started
      if (this.isStarted) {
        this.playTransitionCues(step);
      }
      
      console.log(`📍 Step ${this.currentStepIndex + 1}/${this.steps.length}: ${step.title}`);
    }
    
    playTransitionCues(step) {
      // Use stronger vibration patterns with try/catch
      if (this.enableVibrate && navigator.vibrate) {
        try {
          // Stronger pattern: pulse-pause-pulse for better feedback
          // [vibrate, pause, vibrate, pause, vibrate]
          navigator.vibrate([200, 50, 100, 50, 200]);
        } catch (error) {
          console.warn('⚠️ Vibration not supported or failed:', error);
        }
      }
      
      // Play chime sound (only if audio context is ready)
      if (this.enableSound && this.audioContext && this.audioContextReady) {
        this.playChime();
      }
      
      // Speak step title with TTS (only after user gesture)
      if (this.enableTTS && window.speechSynthesis && this.isStarted) {
        this.speak(step.title);
      }
    }
    
    playChime() {
      try {
        const ctx = this.audioContext;
        if (!ctx || ctx.state === 'closed') return;
        
        // Ensure context is running
        if (ctx.state === 'suspended') {
          ctx.resume().catch(err => {
            console.warn('⚠️ Could not resume audio context:', err);
          });
          return;
        }
        
        // Create oscillator for a pleasant chime sound
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        // Configure sound (528 Hz - "Love frequency" in Solfeggio scale, 
        // believed to promote healing and relaxation in meditation practices)
        oscillator.frequency.value = 528;
        oscillator.type = 'sine';
        
        // Envelope for natural sound
        const now = ctx.currentTime;
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.3, now + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.8);
        
        oscillator.start(now);
        oscillator.stop(now + 0.8);
        
      } catch (error) {
        console.warn('⚠️ Error playing chime:', error);
      }
    }
    
    speak(text) {
      // Proper TTS handling after user gesture
      try {
        if (!window.speechSynthesis) {
          console.warn('⚠️ Speech synthesis not supported');
          return;
        }
        
        // Cancel any ongoing speech
        window.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = TTS_RATE;
        utterance.pitch = TTS_PITCH;
        utterance.volume = TTS_VOLUME;
        
        utterance.onerror = (event) => {
          console.warn('⚠️ TTS error:', event.error);
        };
        
        window.speechSynthesis.speak(utterance);
      } catch (error) {
        console.warn('⚠️ Error with TTS:', error);
      }
    }
  
    announce(message) {
      // Update ARIA live region for screen readers
      if (this.elements.liveRegion) {
        this.elements.liveRegion.textContent = message;
      }
    }
    
    startTimer() {
      if (this.timer) {
        clearInterval(this.timer);
      }
      
      this.timer = setInterval(this.tick, 1000);
    }
    
    tick() {
      if (this.isPaused) return;
      
      this.secondsRemaining--;
      this.updateTimerDisplay();
      this.updateProgressBar();
      
      // Auto-advance when timer reaches zero
      if (this.secondsRemaining <= 0) {
        this.autoAdvance();
      }
    }
    
    updateTimerDisplay() {
      const minutes = Math.floor(this.secondsRemaining / 60);
      const seconds = this.secondsRemaining % 60;
      this.elements.timerDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    
    updateProgressBar() {
      const step = this.steps[this.currentStepIndex];
      if (!step) return;
      
      const progress = ((step.seconds - this.secondsRemaining) / step.seconds) * 100;
      this.elements.progressFill.style.width = `${Math.min(100, Math.max(0, progress))}%`;
    }
    
    autoAdvance() {
      if (this.currentStepIndex < this.steps.length - 1) {
        this.nextStep();
      } else {
        // Session complete
        this.completeSession();
      }
    }
    
    prevStep() {
      if (this.currentStepIndex > 0) {
        this.currentStepIndex--;
        this.renderStep();
      }
    }
    
    nextStep() {
      if (this.currentStepIndex < this.steps.length - 1) {
        this.currentStepIndex++;
        this.renderStep();
      }
    }
    
    togglePause() {
      this.isPaused = !this.isPaused;
      
      if (this.isPaused) {
        this.elements.pauseBtn.textContent = 'Resume';
        this.announce('Paused');
      } else {
        this.elements.pauseBtn.textContent = 'Pause';
        this.announce('Resumed');
      }
    }
    
    stopSession() {
      console.log('⏹️ Stopping body scan session...');
      
      // Clean up
      if (this.timer) {
        clearInterval(this.timer);
        this.timer = null;
      }
      
      // Cancel TTS
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      
      // Hide view
      if (this.elements.view) {
        this.elements.view.style.display = 'none';
      }
      
      // Call stop callback
      this.onStop();
    }
    
    completeSession() {
      console.log('✅ Body scan session completed!');
      
      // Clean up
      if (this.timer) {
        clearInterval(this.timer);
        this.timer = null;
      }
      
      // Cancel TTS
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      
      // Hide view
      if (this.elements.view) {
        this.elements.view.style.display = 'none';
      }
      
      // Call complete callback
      this.onComplete();
    }
    
    cleanup() {
      // Stop timer and clean up resources
      if (this.timer) {
        clearInterval(this.timer);
        this.timer = null;
      }
      
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      
      if (this.audioContext && this.audioContext.state !== 'closed') {
        this.audioContext.close();
      }
    }
  };
}
