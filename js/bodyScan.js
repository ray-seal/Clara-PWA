// BodyScanController - Guided body scan meditation session controller
// Handles slide rendering, timer, transitions, and audio/vibration/TTS cues

export default class BodyScanController {
  // TTS configuration constants
  static TTS_RATE = 0.9;      // Slightly slower speech for meditation
  static TTS_PITCH = 1.0;     // Normal pitch
  static TTS_VOLUME = 0.8;    // Comfortable volume
  
  constructor(steps, options = {}) {
    this.steps = steps;
    this.currentStepIndex = 0;
    this.isPaused = false;
    this.timer = null;
    this.secondsRemaining = 0;
    
    // Callbacks
    this.onComplete = options.onComplete || (() => {});
    this.onStop = options.onStop || (() => {});
    
    // Audio context for chime
    this.audioContext = null;
    this.enableSound = true;
    this.enableVibrate = true;
    this.enableTTS = true;
    
    // DOM references
    this.elements = {};
    
    // Bind methods
    this.tick = this.tick.bind(this);
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
    
    // Initialize audio context (requires user interaction)
    this.initAudioContext();
    
    // Show view and render first step
    this.elements.view.style.display = 'flex';
    this.renderStep();
    this.startTimer();
    
    console.log('✅ Body Scan Controller initialized');
    return true;
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
    try {
      // Create Web Audio context for chime sound
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.audioContext = new AudioContext();
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
    
    // Play transition cues
    this.playTransitionCues(step);
    
    console.log(`📍 Step ${this.currentStepIndex + 1}/${this.steps.length}: ${step.title}`);
  }
  
  playTransitionCues(step) {
    // Vibrate on transition
    if (this.enableVibrate && navigator.vibrate) {
      navigator.vibrate(200); // 200ms vibration
    }
    
    // Play chime sound
    if (this.enableSound && this.audioContext) {
      this.playChime();
    }
    
    // Speak step title with TTS
    if (this.enableTTS && window.speechSynthesis) {
      this.speak(step.title);
    }
  }
  
  playChime() {
    try {
      const ctx = this.audioContext;
      if (!ctx) return;
      
      // Resume audio context if suspended (browser autoplay policy)
      if (ctx.state === 'suspended') {
        ctx.resume().catch(err => {
          console.warn('⚠️ Could not resume audio context:', err);
          return;
        });
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
    try {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = BodyScanController.TTS_RATE;
      utterance.pitch = BodyScanController.TTS_PITCH;
      utterance.volume = BodyScanController.TTS_VOLUME;
      
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
}
