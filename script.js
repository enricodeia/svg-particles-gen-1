/**
 * SVG Partycle Generator - Improved Version
 * Enhanced particle animation from SVG files with improved performance
 * Based on original code by Enrico Deiana
 */

const ParticleApp = (function() {
  /**
   * Application state containing all core objects and settings
   */
  let state = {
    activeLayerId: null,     // Currently selected layer ID
    layers: [],              // Array of all SVG layers
    nextLayerId: 1,          // Counter for generating unique layer IDs
    isProcessing: false,     // Flag to prevent multiple simultaneous operations
    
    // Three.js core objects
    renderer: null,
    scene: null,
    camera: null,
    controls: null,
    composer: null,          // For post-processing effects
    bloomPass: null,         // For glow effects
    simplex: null,           // For noise-based movement
    
    // Interaction state
    mousePosition: new THREE.Vector3,
    mouseMoved: false,
    
    // Performance tracking
    lastFrameTime: 0,
    frameCounter: 0,
    fps: 0,
    fpsUpdateTime: 0,
    particleCount: 0
  };

  /**
   * DOM element references
   */
  let elements = {
    sceneContainer: document.getElementById("scene-container"),
    svgInput: document.getElementById("svg-input"),
    svgFileName: document.getElementById("svg-file-name"),
    generateBtn: document.getElementById("generate-btn"),
    resetBtn: document.getElementById("reset-btn"),
    resetCameraBtn: document.getElementById("reset-camera-btn"),
    exportCodeBtn: document.getElementById("export-code-btn"),
    exportGifBtn: document.getElementById("export-gif-btn"),
    copyCodeBtn: document.getElementById("copy-code-btn"),
    codeModal: document.getElementById("code-modal"),
    closeModalBtn: document.querySelector(".close-modal"),
    codeEl: document.getElementById("generated-code"),
    notification: document.getElementById("notification"),
    loadingEl: document.getElementById("loading"),
    useGradientCheckbox: document.getElementById("use-gradient"),
    preserveColorsCheckbox: document.getElementById("preserve-colors"),
    useInstancedRenderingCheckbox: document.getElementById("use-instanced-rendering"),
    solidColorControl: document.getElementById("solid-color-control"),
    gradientControls: document.getElementById("gradient-controls"),
    dropArea: document.getElementById("drop-area"),
    sandEffectCheckbox: document.getElementById("sand-effect"),
    enableOrbitCheckbox: document.getElementById("enable-orbit"),
    addSvgBtn: document.getElementById("add-svg-btn"),
    layersList: document.getElementById("layers-list"),
    emptyLayersMessage: document.querySelector(".empty-layers-message"),
    layerTemplate: document.getElementById("layer-template"),
    fpsCounter: document.getElementById("fps-counter"),
    particleCounter: document.getElementById("particle-counter"),
    screenshotBtn: document.getElementById("screenshot-btn"),
    layerPositionX: document.getElementById("layer-position-x"),
    layerPositionY: document.getElementById("layer-position-y"),
    layerPositionZ: document.getElementById("layer-position-z"),
    layerRotationX: document.getElementById("layer-rotation-x"),
    layerRotationY: document.getElementById("layer-rotation-y"),
    layerRotationZ: document.getElementById("layer-rotation-z"),
    gradientRotation: document.getElementById("gradient-rotation")
  };

  /**
   * Reusable resources and cache
   */
  let resources = {
    particleGeometry: null,
    materialCache: new Map(),
    disposables: []
  };

  /**
   * Update bloom effect settings from UI controls
   */
  function updateBloomEffect() {
    if (!state.bloomPass) return;
    
    let enabled = document.getElementById("glow-effect").checked;
    let strength = parseFloat(document.getElementById("bloom-strength").value) || 0.9;
    let radius = parseFloat(document.getElementById("bloom-radius").value) || 0.4;
    let threshold = parseFloat(document.getElementById("bloom-threshold").value) || 0.85;
    
    state.bloomPass.enabled = enabled;
    state.bloomPass.strength = strength;
    state.bloomPass.radius = radius;
    state.bloomPass.threshold = threshold;
  }

  /**
   * Prevent default behavior for drag events
   */
  function preventDefaultDragAction(event) {
    event.preventDefault();
    event.stopPropagation();
  }

  /**
   * Handle file drop events
   */
  function handleFileDrop(event) {
    let dataTransfer = event.dataTransfer;
    let files = dataTransfer.files;
    
    if (files.length) {
      let file = files[0];
      if (file.type === "image/svg+xml" || file.name.toLowerCase().endsWith(".svg")) {
        elements.svgFileName.textContent = file.name;
        processSVGFile(file);
      } else {
        showNotification("Please upload an SVG file.", "warning");
      }
    }
  }

  /**
   * Update layer position and rotation
   */
  function updateLayerTransform() {
    let activeLayer = getActiveLayer();
    if (!activeLayer || !activeLayer.group) return;
    
    let posX = parseFloat(elements.layerPositionX.value);
    let posY = parseFloat(elements.layerPositionY.value);
    let posZ = parseFloat(elements.layerPositionZ.value);
    let rotX = parseFloat(elements.layerRotationX.value) * (Math.PI/180);
    let rotY = parseFloat(elements.layerRotationY.value) * (Math.PI/180);
    let rotZ = parseFloat(elements.layerRotationZ.value) * (Math.PI/180);
    
    activeLayer.group.position.set(posX, posY, posZ);
    activeLayer.group.rotation.set(rotX, rotY, rotZ);
  }

  /**
   * Get currently active layer
   */
  function getActiveLayer() {
    return state.activeLayerId ? state.layers.find(layer => layer.id === state.activeLayerId) : null;
  }

  /**
   * Disable layer position controls when no layer is active
   */
  function disableLayerControls() {
    let controls = [
      elements.layerPositionX, 
      elements.layerPositionY, 
      elements.layerPositionZ,
      elements.layerRotationX, 
      elements.layerRotationY, 
      elements.layerRotationZ
    ];
    
    controls.forEach(control => {
      if (control) control.disabled = true;
    });
  }

  /**
   * Interpolate between two colors
   */
  function interpolateColor(color1, color2, factor) {
    let c1 = new THREE.Color(color1);
    let c2 = new THREE.Color(color2);
    return new THREE.Color().lerpColors(c1, c2, factor).getStyle();
  }

  /**
   * Apply a tint factor to a color
   */
  function tintColor(color, factor) {
    return new THREE.Color(color).multiplyScalar(factor).getStyle();
  }

  /**
   * Take a screenshot of the current state
   */
  function takeScreenshot() {
    try {
      // Hide UI elements
      let footer = document.querySelector(".footer");
      let canvasControls = document.querySelector(".canvas-controls");
      let performanceStats = document.querySelector(".performance-stats");
      
      if (footer) footer.style.display = "none";
      if (canvasControls) canvasControls.style.display = "none";
      if (performanceStats) performanceStats.style.display = "none";
      
      // Render scene
      if (document.getElementById("glow-effect") && document.getElementById("glow-effect").checked && state.composer) {
        state.composer.render();
      } else {
        state.renderer.render(state.scene, state.camera);
      }
      
      // Get image data
      let dataURL = state.renderer.domElement.toDataURL("image/png");
      
      // Create download link
      let link = document.createElement("a");
      link.href = dataURL;
      link.download = "particle-export.png";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Restore UI elements
      if (footer) footer.style.display = "";
      if (canvasControls) canvasControls.style.display = "";
      if (performanceStats) performanceStats.style.display = "";
      
      showNotification("Screenshot saved!", "success");
    } catch (error) {
      console.error("Error taking screenshot:", error);
      showNotification("Error taking screenshot", "error");
    }
  }

  /**
   * Export animation as GIF
   */
  function exportGif() {
    try {
      showNotification("Starting GIF capture... This may take a moment", "info");
      
      // Hide UI elements
      let footer = document.querySelector(".footer");
      let canvasControls = document.querySelector(".canvas-controls");
      let performanceStats = document.querySelector(".performance-stats");
      
      if (footer) footer.style.display = "none";
      if (canvasControls) canvasControls.style.display = "none";
      if (performanceStats) performanceStats.style.display = "none";
      
      // Load GIF.js library if not already loaded
      if (typeof GIF === "undefined") {
        let script = document.createElement("script");
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.js";
        script.onload = () => captureGif();
        document.head.appendChild(script);
      } else {
        captureGif();
      }
      
      function captureGif() {
        // Initialize GIF
        let gif = new GIF({
          workers: 4,
          quality: 10,
          width: 800,
          height: 600,
          workerScript: "https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.worker.js"
        });
        
        let frameCount = 0;
        
        // Capture frames
        function captureFrame() {
          // Render scene
          if (document.getElementById("glow-effect").checked) {
            state.composer.render();
          } else {
            state.renderer.render(state.scene, state.camera);
          }
          
          // Add frame to GIF
          gif.addFrame(state.renderer.domElement, {
            copy: true,
            delay: 33
          });
          
          // Continue capturing frames
          if (++frameCount < 60) {
            requestAnimationFrame(captureFrame);
          } else {
            // Finish capturing
            showNotification("Rendering GIF...", "info");
            
            gif.on("finished", function(blob) {
              // Create download link
              let url = URL.createObjectURL(blob);
              let link = document.createElement("a");
              link.href = url;
              link.download = "particle-animation.gif";
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              URL.revokeObjectURL(url);
              
              // Restore UI elements
              if (footer) footer.style.display = "";
              if (canvasControls) canvasControls.style.display = "";
              if (performanceStats) performanceStats.style.display = "";
              
              showNotification("GIF saved!", "success");
            });
            
            gif.render();
          }
        }
        
        // Start capturing
        captureFrame();
      }
    } catch (error) {
      console.error("Error exporting GIF:", error);
      showNotification("Error exporting GIF", "error");
      
      // Restore UI elements
      let footer = document.querySelector(".footer");
      let canvasControls = document.querySelector(".canvas-controls");
      let performanceStats = document.querySelector(".performance-stats");
      
      if (footer) footer.style.display = "";
      if (canvasControls) canvasControls.style.display = "";
      if (performanceStats) performanceStats.style.display = "";
    }
  }

  /**
   * Show notification message
   */
  function showNotification(message, type = "success") {
    if (!elements.notification) return;
    
    elements.notification.textContent = message;
    elements.notification.className = "notification";
    elements.notification.classList.add(`notification-${type}`);
    
    // Set color based on type
    switch (type) {
      case "success":
        elements.notification.style.borderLeftColor = "var(--success)";
        break;
      case "warning":
        elements.notification.style.borderLeftColor = "var(--warning)";
        break;
      case "error":
        elements.notification.style.borderLeftColor = "var(--danger)";
        break;
      default:
        elements.notification.style.borderLeftColor = "var(--primary)";
    }
    
    // Show notification
    elements.notification.classList.add("active");
    
    // Hide after 3 seconds
    setTimeout(() => {
      elements.notification.classList.remove("active");
    }, 3000);
  }

  /**
   * Apply settings to UI elements
   */
  function applySettings(settings) {
    try {
      // Map of element IDs to settings values
      let settingsMap = {
        "particle-count": { value: settings.particleCount, display: settings.particleCount.toString() },
        "particle-density": { value: settings.particleDensity, display: settings.particleDensity.toString() },
        "min-size": { value: settings.minSize, display: settings.minSize.toFixed(1) },
        "max-size": { value: settings.maxSize, display: settings.maxSize.toFixed(1) },
        "particle-color": { value: settings.color },
        "use-gradient": { checked: settings.useGradient },
        "preserve-colors": { checked: settings.preserveColors },
        "gradient-color1": { value: settings.gradientColor1 },
        "gradient-color2": { value: settings.gradientColor2 },
        "gradient-rotation": { value: settings.gradientRotation, display: settings.gradientRotation.toString() + "°" },
        "animation-speed": { value: settings.animationSpeed, display: settings.animationSpeed.toFixed(1) },
        "mouse-interaction": { checked: settings.mouseInteraction },
        "repel-effect": { checked: settings.repelEffect },
        "sand-effect": { checked: settings.sandEffect },
        "sand-strength": { value: settings.sandStrength, display: settings.sandStrength.toFixed(1) },
        "sand-return": { value: settings.sandReturn, display: settings.sandReturn.toFixed(1) },
        "interaction-radius": { value: settings.interactionRadius, display: settings.interactionRadius.toString() },
        "interaction-strength": { value: settings.interactionStrength, display: settings.interactionStrength.toFixed(1) },
        "interaction-sensitivity": { value: settings.interactionSensitivity, display: settings.interactionSensitivity.toString() },
        "glow-effect": { checked: settings.glowEffect },
        "bloom-strength": { value: settings.bloomStrength, display: settings.bloomStrength.toFixed(1) },
        "bloom-radius": { value: settings.bloomRadius, display: settings.bloomRadius.toFixed(2) },
        "bloom-threshold": { value: settings.bloomThreshold, display: settings.bloomThreshold.toFixed(2) },
        "noise-movement": { checked: settings.noiseMovement },
        "noise-scale": { value: settings.noiseScale, display: settings.noiseScale.toFixed(3) },
        "include-strokes": { checked: settings.includeStrokes },
        "stroke-width": { value: settings.strokeWidth, display: settings.strokeWidth.toString() },
        "stroke-detail": { value: settings.strokeDetail, display: settings.strokeDetail.toString() },
        "enable-orbit": { checked: settings.enableOrbit },
        "orbit-sensitivity": { value: settings.orbitSensitivity, display: settings.orbitSensitivity.toFixed(1) },
        "zoom-speed": { value: settings.zoomSpeed, display: settings.zoomSpeed.toFixed(1) },
        "pan-speed": { value: settings.panSpeed, display: settings.panSpeed.toFixed(1) },
        "svg-scale": { value: settings.svgScale, display: settings.svgScale.toFixed(1) },
        "svg-depth": { value: settings.svgDepth, display: settings.svgDepth.toString() },
        "use-instanced-rendering": { checked: settings.useInstanced }
      };
      
      // Apply settings to each element
      for (let [id, setting] of Object.entries(settingsMap)) {
        let element = document.getElementById(id);
        if (!element) continue;
        
        // Set value or checked property
        if ("checked" in setting) {
          element.checked = setting.checked;
        }
        
        if ("value" in setting) {
          element.value = setting.value;
        }
        
        // Update display value if applicable
        if ("display" in setting) {
          let displayElement = document.getElementById(`${id}-value`);
          if (displayElement) {
            displayElement.textContent = setting.display;
          }
        }
      }
      
      // Update conditional UI elements
      if (elements.solidColorControl && elements.gradientControls) {
        elements.solidColorControl.style.display = settings.useGradient ? "none" : "block";
        elements.gradientControls.style.display = settings.useGradient ? "block" : "none";
      }
      
      // Update other settings
      updateBloomEffect();
      updateOrbitControls();
      updateParticles();
      
    } catch (error) {
      console.error("Error applying settings:", error);
      showNotification("Error applying settings", "error");
    }
  }

  /**
   * Initialize the application
   */
  function init() {
    // Create Three.js scene
    state.scene = new THREE.Scene();
    state.scene.background = new THREE.Color("#0a0a18");
    
    // Create camera
    state.camera = new THREE.PerspectiveCamera(60, getAspectRatio(), 0.1, 1000);
    state.camera.position.z = 200;
    
    // Create renderer
    state.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
      precision: "highp"
    });
    state.renderer.setPixelRatio(window.devicePixelRatio);
    state.renderer.setSize(elements.sceneContainer.clientWidth, elements.sceneContainer.clientHeight);
    elements.sceneContainer.appendChild(state.renderer.domElement);
    
    // Setup post-processing for bloom effect
    initPostProcessing();
    
    // Add orbit controls
    state.controls = new THREE.OrbitControls(state.camera, state.renderer.domElement);
    state.controls.enableDamping = true;
    state.controls.dampingFactor = 0.1;
    state.controls.screenSpacePanning = true;
    state.controls.minDistance = 50;
    state.controls.maxDistance = 500;
    updateOrbitControls();
    
    // Initialize resources
    resources.particleGeometry = new THREE.SphereGeometry(1, 16, 16);
    resources.disposables.push(resources.particleGeometry);
    
    // Initialize event listeners
    initEventListeners();
    
    // Start animation loop
    requestAnimationFrame(animate);
    
    // Initialize SimplexNoise
    state.simplex = new SimplexNoise();
  }

  /**
   * Initialize post-processing
   */
  function initPostProcessing() {
    // Create EffectComposer
    state.composer = new THREE.EffectComposer(state.renderer);
    
    // Add render pass
    let renderPass = new THREE.RenderPass(state.scene, state.camera);
    state.composer.addPass(renderPass);
    
    // Add bloom pass
    state.bloomPass = new THREE.UnrealBloomPass(
      new THREE.Vector2(elements.sceneContainer.clientWidth, elements.sceneContainer.clientHeight),
      0.9, // strength
      0.4, // radius
      0.85 // threshold
    );
    state.composer.addPass(state.bloomPass);
    
    // Update bloom settings
    updateBloomEffect();
  }

  /**
   * Initialize all event listeners
   */
  function initEventListeners() {
    // Window resize
    window.addEventListener("resize", handleResize);
    
    // Drag and drop events
    ["dragenter", "dragover", "dragleave", "drop"].forEach(eventName => {
      elements.sceneContainer.addEventListener(eventName, preventDefaultDragAction, false);
      document.body.addEventListener(eventName, preventDefaultDragAction, false);
    });
    
    // Add dragover class
    ["dragenter", "dragover"].forEach(eventName => {
      elements.sceneContainer.addEventListener(eventName, () => {
        elements.sceneContainer.classList.add("drag-over");
      }, false);
    });
    
    // Remove dragover class
    ["dragleave", "drop"].forEach(eventName => {
      elements.sceneContainer.addEventListener(eventName, () => {
        elements.sceneContainer.classList.remove("drag-over");
      }, false);
    });
    
    // Handle file drop
    elements.sceneContainer.addEventListener("drop", handleFileDrop, false);
    
    // Click on drop area to open file dialog
    if (elements.dropArea) {
      elements.dropArea.addEventListener("click", () => {
        elements.svgInput.click();
      });
    }
    
    // Setup tabbed interface
    setupTabbedInterface();
    
    // Setup form controls
    setupFormControls();
    
    // Mouse/touch interaction
    if (state.renderer && state.renderer.domElement) {
      state.renderer.domElement.addEventListener("mousemove", handleMouseMove);
      state.renderer.domElement.addEventListener("touchmove", handleTouchMove);
      state.renderer.domElement.addEventListener("mouseleave", resetMousePosition);
    }
    
    // Screenshot button
    if (elements.screenshotBtn) {
      elements.screenshotBtn.addEventListener("click", takeScreenshot);
    }
    
    // Theme buttons
    document.querySelectorAll(".theme-btn").forEach(button => {
      button.addEventListener("click", () => {
        applyColorTheme(button.dataset.theme);
      });
    });
  }

  /**
   * Setup tabbed interface
   */
  function setupTabbedInterface() {
    let tabButtons = document.querySelectorAll(".tab-button");
    let tabContents = document.querySelectorAll(".tab-content");
    
    tabButtons.forEach(button => {
      button.addEventListener("click", () => {
        let tabId = button.getAttribute("data-tab");
        
        // Deactivate all tabs
        tabButtons.forEach(btn => btn.classList.remove("active"));
        tabContents.forEach(content => content.classList.remove("active"));
        
        // Activate selected tab
        button.classList.add("active");
        document.getElementById(`${tabId}-tab`).classList.add("active");
      });
    });
  }

  /**
   * Setup form control events
   */
  function setupFormControls() {
    // SVG Input change
    if (elements.svgInput) {
      elements.svgInput.addEventListener("change", () => {
        if (elements.svgInput.files.length > 0) {
          elements.svgFileName.textContent = elements.svgInput.files[0].name;
          processSVGFile(elements.svgInput.files[0]);
        } else {
          elements.svgFileName.textContent = "No file selected";
        }
      });
    }
    
    // Add SVG button
    if (elements.addSvgBtn) {
      elements.addSvgBtn.addEventListener("click", () => {
        elements.svgInput.click();
      });
    }
    
    // Generate button
    if (elements.generateBtn) {
      elements.generateBtn.addEventListener("click", generateParticles);
    }
    
    // Reset button
    if (elements.resetBtn) {
      elements.resetBtn.addEventListener("click", resetSettings);
    }
    
    // Reset camera button
    if (elements.resetCameraBtn) {
      elements.resetCameraBtn.addEventListener("click", resetCamera);
    }
    
    // Sand effect checkbox
    if (elements.sandEffectCheckbox) {
      elements.sandEffectCheckbox.addEventListener("change", updateParticles);
    }
    
    // Orbit controls checkbox
    if (elements.enableOrbitCheckbox) {
      elements.enableOrbitCheckbox.addEventListener("change", updateOrbitControls);
    }
    
    // Export code button
    if (elements.exportCodeBtn) {
      elements.exportCodeBtn.addEventListener("click", () => {
        exportCode();
        elements.codeModal.classList.add("active");
      });
    }
    
    // Close modal button
    if (elements.closeModalBtn) {
      elements.closeModalBtn.addEventListener("click", () => {
        elements.codeModal.classList.remove("active");
      });
    }
    
    // Copy code button
    if (elements.copyCodeBtn) {
      elements.copyCodeBtn.addEventListener("click", copyCodeToClipboard);
    }
    
    // Close modal when clicking outside
    if (elements.codeModal) {
      elements.codeModal.addEventListener("click", (e) => {
        if (e.target === elements.codeModal) {
          elements.codeModal.classList.remove("active");
        }
      });
    }
    
    // Gradient checkbox
    if (elements.useGradientCheckbox) {
      elements.useGradientCheckbox.addEventListener("change", () => {
        if (elements.useGradientCheckbox.checked) {
          elements.solidColorControl.style.display = "none";
          elements.gradientControls.style.display = "block";
        } else {
          elements.solidColorControl.style.display = "block";
          elements.gradientControls.style.display = "none";
        }
        updateParticles();
      });
    }
    
    // Layer position controls
    if (elements.layerPositionX) {
      elements.layerPositionX.addEventListener("input", updateLayerTransform);
      elements.layerPositionY.addEventListener("input", updateLayerTransform);
      elements.layerPositionZ.addEventListener("input", updateLayerTransform);
      elements.layerRotationX.addEventListener("input", updateLayerTransform);
      elements.layerRotationY.addEventListener("input", updateLayerTransform);
      elements.layerRotationZ.addEventListener("input", updateLayerTransform);
    }
    
    // Export GIF button
    if (elements.exportGifBtn) {
      elements.exportGifBtn.addEventListener("click", exportGif);
    }
    
    // Setup live update controls
    setupLiveUpdateControls();
  }

  /**
   * Setup controls that update in real-time
   */
  function setupLiveUpdateControls() {
    let liveControls = document.querySelectorAll('[data-live="true"]');
    
    liveControls.forEach(control => {
      if (control.type === "range") {
        // Range sliders with value display
        let valueDisplay = document.getElementById(`${control.id}-value`);
        
        if (valueDisplay) {
          let step = parseFloat(control.step) || 1;
          valueDisplay.textContent = formatNumberWithPrecision(
            control.value, 
            step, 
            control.id === "gradient-rotation" ? "°" : ""
          );
          
          control.addEventListener("input", () => {
            valueDisplay.textContent = formatNumberWithPrecision(
              control.value, 
              step, 
              control.id === "gradient-rotation" ? "°" : ""
            );
            
            // Special case handlers
            if (control.id === "svg-scale") {
              // Update scale of all layers
              let scale = parseFloat(control.value);
              state.layers.forEach(layer => {
                if (layer.group) {
                  let position = layer.group.position.clone();
                  let rotation = layer.group.rotation.clone();
                  layer.group.scale.set(scale, scale, scale);
                  layer.group.position.copy(position);
                  layer.group.rotation.copy(rotation);
                }
              });
              exportCode();
            } 
            else if (control.id === "svg-depth") {
              // Update depth of all layers
              let depth = parseInt(control.value);
              state.layers.forEach(layer => {
                updateLayerDepth(layer, depth);
              });
              exportCode();
            }
            else if (control.id === "bloom-strength" || 
                     control.id === "bloom-radius" || 
                     control.id === "bloom-threshold") {
              updateBloomEffect();
            }
            else if (control.id === "orbit-sensitivity" || 
                     control.id === "zoom-speed" || 
                     control.id === "pan-speed") {
              updateOrbitControls();
            }
            else {
              // Default behavior: update particles
              debounceSettingsUpdate();
            }
          });
        }
      } else {
        // Checkboxes and other inputs
        control.addEventListener("change", () => {
          if (control.id === "glow-effect") {
            updateBloomEffect();
          }
          else if (control.id === "enable-orbit" || control.id.startsWith("orbit-")) {
            updateOrbitControls();
          }
          else {
            debounceSettingsUpdate();
          }
        });
      }
    });
  }

  /**
   * Update depth values for a layer
   */
  function updateLayerDepth(layer, depth) {
    if (!layer.particles || layer.particles.length === 0) return;
    
    if (layer.useInstanced) {
      // Update instanced particles
      for (let i = 0; i < layer.particleCount; i++) {
        let depthFactor = layer.instanceData[i].depthFactor;
        let newZ = depth * (depthFactor - 0.5) * 2;
        
        let matrix = new THREE.Matrix4();
        layer.particles.setMatrixAt(i, matrix.makeTranslation(
          layer.instanceData[i].originalPosition.x,
          layer.instanceData[i].originalPosition.y,
          newZ
        ));
      }
      layer.particles.instanceMatrix.needsUpdate = true;
    } else {
      // Update individual particles
      layer.particles.forEach((particle, index) => {
        let depthFactor = particle.userData.depthFactor || Math.random();
        particle.userData.depthFactor = depthFactor;
        
        let newZ = depth * (depthFactor - 0.5) * 2;
        particle.position.z = newZ;
        
        if (particle.userData.originalPosition) {
          particle.userData.originalPosition.z = newZ;
        }
        
        if (layer.originalPositions && layer.originalPositions[index]) {
          layer.originalPositions[index].z = newZ;
        }
      });
    }
  }

  /**
   * Apply a color theme
   */
  function applyColorTheme(theme) {
    try {
      let colors;
      
      // Define themes
      switch (theme) {
        case "sunset":
          colors = { primary: "#ff7e5f", secondary: "#feb47b" };
          break;
        case "ocean":
          colors = { primary: "#2193b0", secondary: "#6dd5ed" };
          break;
        case "forest":
          colors = { primary: "#5adb94", secondary: "#2bde73" };
          break;
        case "purple":
          colors = { primary: "#8e44ad", secondary: "#9b59b6" };
          break;
        default: // Default theme
          colors = { primary: "#5756d5", secondary: "#d956aa" };
      }
      
      // Update color inputs
      let gradientColor1 = document.getElementById("gradient-color1");
      let gradientColor2 = document.getElementById("gradient-color2");
      let useGradient = document.getElementById("use-gradient");
      
      if (gradientColor1) gradientColor1.value = colors.primary;
      if (gradientColor2) gradientColor2.value = colors.secondary;
      if (useGradient) useGradient.checked = true;
      
      // Update display
      if (elements.solidColorControl) elements.solidColorControl.style.display = "none";
      if (elements.gradientControls) elements.gradientControls.style.display = "block";
      
      // Update particles
      updateParticles();
      
      showNotification(`Applied ${theme} theme`, "success");
    } catch (error) {
      console.error("Error applying color theme:", error);
      showNotification("Error applying theme", "error");
    }
  }
    
    let layerPanel = document.getElementById("layer-position-panel");
    if (layerPanel) layerPanel.style.opacity = "0.5";
  }

  /**
   * Update orbit controls settings from UI
   */
  function updateOrbitControls() {
    if (!state.controls) return;
    
    let enabled = document.getElementById("enable-orbit").checked;
    let sensitivity = parseFloat(document.getElementById("orbit-sensitivity").value) || 1;
    let zoomSpeed = parseFloat(document.getElementById("zoom-speed").value) || 1;
    let panSpeed = parseFloat(document.getElementById("pan-speed").value) || 1;
    
    state.controls.enabled = enabled;
    state.controls.rotateSpeed = sensitivity;
    state.controls.zoomSpeed = zoomSpeed;
    state.controls.panSpeed = panSpeed;
  }

  /**
   * Handle mouse movement for particle interaction
   */
  function handleMouseMove(event) {
    let interactionEnabled = document.getElementById("mouse-interaction");
    if (!interactionEnabled || !interactionEnabled.checked) return;
    
    // Don't update if orbit controls are in use
    if (state.controls && state.controls.enabled && event.buttons > 0) return;
    
    let rect = state.renderer.domElement.getBoundingClientRect();
    let x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    let y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    let raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(x, y), state.camera);
    
    let plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    let intersection = new THREE.Vector3();
    
    if (raycaster.ray.intersectPlane(plane, intersection)) {
      state.mousePosition.copy(intersection);
      state.mouseMoved = true;
    }
  }

  /**
   * Handle touch events for mobile interaction
   */
  function handleTouchMove(event) {
    let interactionEnabled = document.getElementById("mouse-interaction");
    if (!interactionEnabled || !interactionEnabled.checked) return;
    
    if (event.touches.length > 0) {
      let touch = event.touches[0];
      
      let rect = state.renderer.domElement.getBoundingClientRect();
      let x = ((touch.clientX - rect.left) / rect.width) * 2 - 1;
      let y = -((touch.clientY - rect.top) / rect.height) * 2 + 1;
      
      let raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(x, y), state.camera);
      
      let plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
      let intersection = new THREE.Vector3();
      
      if (raycaster.ray.intersectPlane(plane, intersection)) {
        state.mousePosition.copy(intersection);
        state.mouseMoved = true;
      }
    }
  }

  /**
   * Reset mouse position on mouse leave
   */
  function resetMousePosition() {
    state.mousePosition.set(0, 0, 0);
    state.mouseMoved = false;
  }

  /**
   * Format number with appropriate precision based on step
   */
  function formatNumberWithPrecision(value, step, suffix = "") {
    if (step < 1) {
      let decimalPlaces = step.toString().split(".")[1].length;
      return parseFloat(value).toFixed(decimalPlaces) + suffix;
    }
    return parseInt(value) + suffix;
  }

  /**
   * Get aspect ratio of the container
   */
  function getAspectRatio() {
    return elements.sceneContainer.clientWidth / elements.sceneContainer.clientHeight;
  }

  /**
   * Handle window resize
   */
  function handleResize() {
    state.camera.aspect = getAspectRatio();
    state.camera.updateProjectionMatrix();
    
    let width = elements.sceneContainer.clientWidth;
    let height = elements.sceneContainer.clientHeight;
    
    state.renderer.setSize(width, height);
    if (state.composer) {
      state.composer.setSize(width, height);
    }
  }

  /**
   * Reset camera position
   */
  function resetCamera() {
    state.camera.position.set(0, 0, 200);
    state.camera.lookAt(0, 0, 0);
    if (state.controls) {
      state.controls.reset();
    }
  }

  // Debounce flag and timer
  let isDebouncing = false;
  let debounceTimer;

  /**
   * Debounce settings updates to prevent too many particle updates
   */
  function debounceSettingsUpdate() {
    if (isDebouncing) {
      clearTimeout(debounceTimer);
    }
    
    isDebouncing = true;
    debounceTimer = setTimeout(() => {
      isDebouncing = false;
      updateParticles();
    }, 300);
  }

  /**
   * Update particles based on current settings
   */
  function updateParticles() {
    if (state.layers.length === 0) return;
    
    showLoading(true);
    
    setTimeout(() => {
      try {
        state.layers.forEach(layer => {
          recreateLayerParticles(layer);
        });
        updateParticleCount();
        exportCode();
      } catch (error) {
        console.error("Error updating layers:", error);
        showNotification("Error updating particles. Please try again.", "error");
      } finally {
        showLoading(false);
      }
    }, 100);
  }

  /**
   * Show/hide loading indicator
   */
  function showLoading(show) {
    if (elements.loadingEl) {
      show ? elements.loadingEl.classList.add("active") : elements.loadingEl.classList.remove("active");
    }
  }

  /**
   * Generate particles from all layers
   */
  function generateParticles() {
    if (state.layers.length === 0) {
      showNotification("Please upload an SVG file first.", "warning");
      return;
    }
    
    showLoading(true);
    
    setTimeout(() => {
      try {
        state.layers.forEach(layer => {
          recreateLayerParticles(layer);
        });
        updateParticleCount();
        exportCode();
      } catch (error) {
        console.error("Error generating particles:", error);
        showNotification("Error generating particles. Please try again.", "error");
      } finally {
        showLoading(false);
      }
    }, 100);
  }

  /**
   * Process uploaded SVG file
   */
  function processSVGFile(file) {
    showLoading(true);
    
    let reader = new FileReader();
    
    reader.onload = function(event) {
      let svgString = event.target.result;
      let fileName = file.name;
      
      try {
        // Create new layer from SVG
        createLayerFromSVG(svgString, fileName);
        
        // Hide drop area once we have at least one layer
        if (elements.dropArea) {
          elements.dropArea.classList.add("hidden");
        }
      } catch (error) {
        console.error("Error processing SVG:", error);
        showNotification("Error processing SVG. File may be incompatible.", "error");
      } finally {
        showLoading(false);
      }
    };
    
    reader.onerror = function() {
      showNotification("Error reading file", "error");
      showLoading(false);
    };
    
    reader.readAsText(file);
  }

  /**
   * Create a new layer from SVG content
   */
  function createLayerFromSVG(svgString, name) {
    let layerId = `layer-${state.nextLayerId++}`;
    
    let layer = {
      id: layerId,
      name: name || `Layer ${state.layers.length+1}`,
      svgString: svgString,
      visible: true,
      group: new THREE.Group(),
      particles: [],
      instanceData: [],
      originalPositions: [],
      particleCount: 0,
      useInstanced: elements.useInstancedRenderingCheckbox && elements.useInstancedRenderingCheckbox.checked
    };
    
    // Add group to scene
    state.scene.add(layer.group);
    
    // Add to layers array
    state.layers.push(layer);
    
    // Create layer UI element
    createLayerUIElement(layer);
    
    // Update layers list UI
    updateLayersEmptyState();
    
    // Make new layer active
    setActiveLayer(layerId);
    
    // Process SVG and create particles
    try {
      clearLayerParticles(layer);
      createParticlesFromSVG(layer, layer.svgString);
      updateParticleCount();
    } catch (error) {
      console.error("Error processing layer SVG:", error);
      showNotification(`Error processing layer "${layer.name}"`, "error");
    }
  }

  /**
   * Clear all particles from a layer
   */
  function clearLayerParticles(layer) {
    if (layer.group) {
      // Remove all children from group
      while (layer.group.children.length > 0) {
        let child = layer.group.children[0];
        layer.group.remove(child);
        
        // Dispose of geometries and materials
        if (child.geometry) {
          child.geometry.dispose();
        }
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(mat => mat.dispose());
          } else {
            child.material.dispose();
          }
        }
      }
    }
    
    // Clear arrays
    layer.particles = [];
    layer.instanceData = [];
    layer.originalPositions = [];
    layer.particleCount = 0;
  }

  /**
   * Recreate particles for a layer
   */
  function recreateLayerParticles(layer) {
    if (layer && layer.svgString) {
      clearLayerParticles(layer);
      
      // Update instanced rendering setting
      layer.useInstanced = elements.useInstancedRenderingCheckbox && elements.useInstancedRenderingCheckbox.checked;
      
      // Create new particles
      createParticlesFromSVG(layer, layer.svgString);
    }
  }

  /**
   * Delete a layer by ID
   */
  function deleteLayer(layerId) {
    let layerIndex = state.layers.findIndex(layer => layer.id === layerId);
    if (layerIndex === -1) return;
    
    let layer = state.layers[layerIndex];
    
    // Clean up Three.js objects
    if (layer.group) {
      clearLayerParticles(layer);
      state.scene.remove(layer.group);
      
      // Dispose of instanced meshes
      if (layer.useInstanced && layer.particles) {
        layer.particles.geometry && layer.particles.geometry.dispose();
        if (layer.particles.material) {
          if (Array.isArray(layer.particles.material)) {
            layer.particles.material.forEach(mat => mat.dispose());
          } else {
            layer.particles.material.dispose();
          }
        }
      } else if (Array.isArray(layer.particles)) {
        layer.particles.forEach(particle => {
          particle.geometry && particle.geometry.dispose();
          particle.material && particle.material.dispose();
        });
      }
    }
    
    // Remove from layers array
    state.layers.splice(layerIndex, 1);
    
    // Remove from UI
    let layerElement = elements.layersList.querySelector(`[data-layer-id="${layerId}"]`);
    if (layerElement) {
      layerElement.remove();
    }
    
    // If active layer was deleted, select another or clear selection
    if (state.activeLayerId === layerId) {
      if (state.layers.length > 0) {
        setActiveLayer(state.layers[0].id);
      } else {
        state.activeLayerId = null;
        disableLayerControls();
      }
    }
    
    // Update UI
    updateLayersEmptyState();
    
    // Show drop area if no layers left
    if (state.layers.length === 0 && elements.dropArea) {
      elements.dropArea.classList.remove("hidden");
    }
    
    // Update particle count
    updateParticleCount();
  }

  /**
   * Set active layer
   */
  function setActiveLayer(layerId) {
    state.activeLayerId = layerId;
    
    // Update UI
    document.querySelectorAll('.layer-item').forEach(item => {
      item.classList.remove('active');
    });
    
    let layerElement = document.querySelector(`.layer-item[data-layer-id="${layerId}"]`);
    if (layerElement) {
      layerElement.classList.add('active');
    }
    
    // Update position controls
    updateLayerPositionControls();
  }

  /**
   * Update position controls for active layer
   */
  function updateLayerPositionControls() {
    let activeLayer = getActiveLayer();
    
    if (!activeLayer || !activeLayer.group) {
      disableLayerControls();
      return;
    }
    
    // Enable controls
    let controls = [
      elements.layerPositionX, 
      elements.layerPositionY, 
      elements.layerPositionZ,
      elements.layerRotationX, 
      elements.layerRotationY, 
      elements.layerRotationZ
    ];
    
    controls.forEach(control => {
      if (control) control.disabled = false;
    });
    
    let layerPanel = document.getElementById("layer-position-panel");
    if (layerPanel) {
      layerPanel.style.opacity = "1";
    }
    
    // Set values
    elements.layerPositionX.value = activeLayer.group.position.x;
    elements.layerPositionY.value = activeLayer.group.position.y;
    elements.layerPositionZ.value = activeLayer.group.position.z;
    elements.layerRotationX.value = activeLayer.group.rotation.x * (180/Math.PI);
    elements.layerRotationY.value = activeLayer.group.rotation.y * (180/Math.PI);
    elements.layerRotationZ.value = activeLayer.group.rotation.z * (180/Math.PI);
    
    // Update value displays
    document.getElementById("layer-position-x-value").textContent = Math.round(activeLayer.group.position.x);
    document.getElementById("layer-position-y-value").textContent = Math.round(activeLayer.group.position.y);
    document.getElementById("layer-position-z-value").textContent = Math.round(activeLayer.group.position.z);
    document.getElementById("layer-rotation-x-value").textContent = Math.round(activeLayer.group.rotation.x * (180/Math.PI));
    document.getElementById("layer-rotation-y-value").textContent = Math.round(activeLayer.group.rotation.y * (180/Math.PI));
    document.getElementById("layer-rotation-z-value").textContent = Math.round(activeLayer.group.rotation.z * (180/Math.PI));
  }

  /**
   * Update empty state message for layers
   */
  function updateLayersEmptyState() {
    if (elements.emptyLayersMessage) {
      elements.emptyLayersMessage.style.display = state.layers.length === 0 ? "block" : "none";
    }
  }

  /**
   * Update particle count display
   */
  function updateParticleCount() {
    if (!elements.particleCounter) return;
    
    let count = 0;
    state.layers.forEach(layer => {
      if (layer.visible) {
        count += layer.particleCount;
      }
    });
    
    state.particleCount = count;
    elements.particleCounter.textContent = count.toLocaleString();
  }

  /**
   * Create or get cached material
   */
  function getMaterial(color, type = 'fill') {
    let key = `${color}_${type}`;
    
    if (resources.materialCache.has(key)) {
      return resources.materialCache.get(key);
    }
    
    let colorObj = new THREE.Color(color);
    
    // Make stroke colors slightly brighter
    if (type === 'stroke') {
      colorObj.multiplyScalar(1.2);
    }
    
    let material = new THREE.MeshBasicMaterial({
      color: colorObj,
      transparent: true,
      opacity: type === 'fill' ? 0.8 : 0.9
    });
    
    resources.materialCache.set(key, material);
    resources.disposables.push(material);
    
    return material;
  }

  /**
   * Create particles from SVG string
   */
  function createParticlesFromSVG(layer, svgString) {
    try {
      // Parse SVG
      let parser = new DOMParser();
      parser.parseFromString(svgString, 'image/svg+xml');
      
      // Create canvas to draw SVG
      let canvas = document.createElement('canvas');
      let ctx = canvas.getContext('2d');
      
      canvas.width = 2000;
      canvas.height = 2000;
      
      // Create Image from SVG
      let img = new Image();
      let svgBlob = new Blob([svgString], {type: 'image/svg+xml'});
      let url = URL.createObjectURL(svgBlob);
      
      img.onload = function() {
        // Calculate aspect ratio to fit SVG in canvas
        let aspectRatio = img.width / img.height;
        let drawWidth, drawHeight, offsetX, offsetY;
        
        if (aspectRatio > 1) {
          drawWidth = canvas.width * 0.8;
          drawHeight = drawWidth / aspectRatio;
          offsetX = canvas.width * 0.1;
          offsetY = (canvas.height - drawHeight) / 2;
        } else {
          drawHeight = canvas.height * 0.8;
          drawWidth = drawHeight * aspectRatio;
          offsetX = (canvas.width - drawWidth) / 2;
          offsetY = canvas.height * 0.1;
        }
        
        // Draw SVG to canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
        
        // Get image data
        let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        let pixels = imageData.data;
        
        // Get settings
        let settings = getParticleSettings();
        
        // Arrays to store points
        let allPoints = [];
        let pointColors = [];
        let strokePoints = [];
        let strokeColors = [];
        let fillPoints = [];
        let fillColors = [];
        
        // Sample points from image data
        let samplingStep = settings.particleDensity * 2;
        
        for (let y = 0; y < canvas.height; y += samplingStep) {
          for (let x = 0; x < canvas.width; x += samplingStep) {
            let index = (y * canvas.width + x) * 4;
            
            // Only consider pixels with alpha > 50
            if (pixels[index + 3] > 50) {
              // Create a point in 3D space
              let depthFactor = Math.random();
              let z = settings.svgDepth > 0 ? (depthFactor - 0.5) * 2 * settings.svgDepth : 0;
              
              let point = new THREE.Vector3(
                (x - canvas.width/2) * 0.1,
                -((y - canvas.height/2) * 0.1),
                z
              );
              
              // Get color if preserving colors
              let color;
              if (settings.preserveColors) {
                color = `rgb(${pixels[index]}, ${pixels[index+1]}, ${pixels[index+2]})`;
              }
              
              // Add to arrays
              allPoints.push(point);
              pointColors.push(color);
              fillPoints.push(point);
              fillColors.push(color);
            }
          }
        }
        
        // Process strokes if enabled
        if (settings.includeStrokes) {
          try {
            // Create a separate canvas for stroke detection
            let strokeCanvas = document.createElement('canvas');
            let strokeCtx = strokeCanvas.getContext('2d');
            
            strokeCanvas.width = canvas.width;
            strokeCanvas.height = canvas.height;
            
            strokeCtx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
            
            let strokeImageData = strokeCtx.getImageData(0, 0, canvas.width, canvas.height);
            let strokePixels = strokeImageData.data;
            
            // Use a smaller step for more detailed stroke sampling
            let strokeSamplingStep = Math.max(1, samplingStep / settings.strokeDetail);
            
            for (let y = strokeSamplingStep; y < canvas.height - strokeSamplingStep; y += strokeSamplingStep) {
              for (let x = strokeSamplingStep; x < canvas.width - strokeSamplingStep; x += strokeSamplingStep) {
                let index = (y * canvas.width + x) * 4;
                
                // Skip transparent pixels
                if (strokePixels[index + 3] < 50) continue;
                
                // Check if it's an edge pixel
                let isEdge = isEdgePixel(strokePixels, x, y, canvas.width);
                
                if (isEdge) {
                  let depthFactor = Math.random();
                  let z = settings.svgDepth > 0 ? (depthFactor - 0.5) * 2 * settings.svgDepth : 0;
                  
                  let point = new THREE.Vector3(
                    (x - canvas.width/2) * 0.1,
                    -((y - canvas.height/2) * 0.1),
                    z
                  );
                  
                  // Get color if preserving colors
                  let color;
                  if (settings.preserveColors) {
                    color = `rgb(${strokePixels[index]}, ${strokePixels[index+1]}, ${strokePixels[index+2]})`;
                  }
                  
                  // Add to arrays
                  allPoints.push(point);
                  pointColors.push(color);
                  strokePoints.push(point);
                  strokeColors.push(color);
                }
              }
            }
          } catch (strokeError) {
            console.warn('Error in stroke detection:', strokeError);
          }
        }
        
        // Create particles
        createParticles(
          layer,
          allPoints,
          strokePoints,
          fillPoints,
          settings,
          pointColors,
          strokeColors,
          fillColors
        );
        
        // Revoke URL to prevent memory leaks
        URL.revokeObjectURL(url);
      };
      
      img.onerror = function() {
        console.error('Error loading SVG');
        showLoading(false);
        showNotification('Error loading SVG. File may be corrupted.', 'error');
        
        if (elements.dropArea) {
          elements.dropArea.classList.remove('hidden');
        }
      };
      
      img.src = url;
      
    } catch (error) {
      console.error('Error creating particles from SVG:', error);
      showLoading(false);
      showNotification('Error processing SVG.', 'error');
    }
  }

  /**
   * Check if a pixel is an edge by looking at its neighbors
   */
  function isEdgePixel(pixels, x, y, width) {
    // If current pixel is transparent, it's not an edge
    if (pixels[(y * width + x) * 4 + 3] < 50) return false;
    
    // Check all 8 neighboring pixels
    for (let [dx, dy] of [
      [-1, -1], [0, -1], [1, -1],
      [-1,  0],          [1,  0],
      [-1,  1], [0,  1], [1,  1]
    ]) {
      let nx = x + dx;
      let ny = y + dy;
      let neighborIndex = (ny * width + nx) * 4;
      
      // If any neighbor is transparent, this is an edge
      if (pixels[neighborIndex + 3] < 50) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Animation loop
   */
  function animate(timestamp) {
    requestAnimationFrame(animate);
    
    try {
      // Update controls
      if (state.controls) {
        state.controls.update();
      }
      
      // Calculate delta time
      let delta = timestamp - state.lastFrameTime;
      state.lastFrameTime = timestamp;
      
      // Update FPS counter
      updateFPSCounter(delta);
      
      // Update particle animation
      updateParticlesAnimation(delta);
      
      // Render scene
      if (document.getElementById("glow-effect") && document.getElementById("glow-effect").checked && state.composer) {
        state.composer.render();
      } else {
        state.renderer.render(state.scene, state.camera);
      }
    } catch (error) {
      console.error('Error in animate loop:', error);
    }
  }

  /**
   * Update FPS counter
   */
  function updateFPSCounter(delta) {
    if (elements.fpsCounter) {
      state.frameCounter++;
      state.fpsUpdateTime += delta;
      
      if (state.fpsUpdateTime >= 500) {
        let fps = Math.round(state.frameCounter / (state.fpsUpdateTime / 1000));
        elements.fpsCounter.textContent = fps;
        
        // Color-code based on performance
        if (fps >= 55) {
          elements.fpsCounter.style.color = '#10b981'; // Green for good performance
        } else if (fps >= 30) {
          elements.fpsCounter.style.color = '#f59e0b'; // Yellow for medium performance
        } else {
          elements.fpsCounter.style.color = '#ef4444'; // Red for poor performance
        }
        
        state.frameCounter = 0;
        state.fpsUpdateTime = 0;
      }
    }
  }

  /**
   * Get current particle settings from UI controls
   */
  function getParticleSettings() {
    try {
      return {
        // Particle settings
        particleCount: parseInt(document.getElementById("particle-count")?.value || 1500),
        particleDensity: parseInt(document.getElementById("particle-density")?.value || 4),
        minSize: parseFloat(document.getElementById("min-size")?.value || 0.5),
        maxSize: parseFloat(document.getElementById("max-size")?.value || 1.5),
        
        // Color settings
        color: document.getElementById("particle-color")?.value || "#5756d5",
        useGradient: document.getElementById("use-gradient")?.checked || true,
        gradientColor1: document.getElementById("gradient-color1")?.value || "#5756d5",
        gradientColor2: document.getElementById("gradient-color2")?.value || "#d956aa",
        gradientRotation: parseInt(document.getElementById("gradient-rotation")?.value || 0),
        preserveColors: document.getElementById("preserve-colors")?.checked || false,
        
        // Animation settings
        animationSpeed: parseFloat(document.getElementById("animation-speed")?.value || 1),
        mouseInteraction: document.getElementById("mouse-interaction")?.checked || true,
        sandEffect: document.getElementById("sand-effect")?.checked || false,
        sandStrength: parseFloat(document.getElementById("sand-strength")?.value || 5),
        sandReturn: parseFloat(document.getElementById("sand-return")?.value || 1),
        repelEffect: document.getElementById("repel-effect")?.checked || false,
        interactionRadius: parseInt(document.getElementById("interaction-radius")?.value || 80),
        interactionStrength: parseFloat(document.getElementById("interaction-strength")?.value || 3),
        interactionSensitivity: parseInt(document.getElementById("interaction-sensitivity")?.value || 5),
        
        // Effect settings
        glowEffect: document.getElementById("glow-effect")?.checked || true,
        bloomStrength: parseFloat(document.getElementById("bloom-strength")?.value || 0.9),
        bloomRadius: parseFloat(document.getElementById("bloom-radius")?.value || 0.4),
        bloomThreshold: parseFloat(document.getElementById("bloom-threshold")?.value || 0.85),
        noiseMovement: document.getElementById("noise-movement")?.checked || true,
        noiseScale: parseFloat(document.getElementById("noise-scale")?.value || 0.02),
        
        // SVG settings
        includeStrokes: document.getElementById("include-strokes")?.checked || true,
        strokeWidth: parseInt(document.getElementById("stroke-width")?.value || 2),
        strokeDetail: parseInt(document.getElementById("stroke-detail")?.value || 5),
        enableOrbit: document.getElementById("enable-orbit")?.checked || true,
        orbitSensitivity: parseFloat(document.getElementById("orbit-sensitivity")?.value || 1),
        zoomSpeed: parseFloat(document.getElementById("zoom-speed")?.value || 1),
        panSpeed: parseFloat(document.getElementById("pan-speed")?.value || 1),
        svgScale: parseFloat(document.getElementById("svg-scale")?.value || 1),
        svgDepth: parseInt(document.getElementById("svg-depth")?.value || 20),
        useInstanced: document.getElementById("use-instanced-rendering")?.checked || true
      };
    } catch (error) {
      console.error('Error getting settings:', error);
      // Return defaults if there's an error
      return {
        particleCount: 1500,
        particleDensity: 4,
        minSize: 0.5,
        maxSize: 1.5,
        color: "#5756d5",
        useGradient: true,
        gradientColor1: "#5756d5",
        gradientColor2: "#d956aa",
        gradientRotation: 0,
        preserveColors: false,
        animationSpeed: 1,
        mouseInteraction: true,
        sandEffect: false,
        sandStrength: 5,
        sandReturn: 1,
        repelEffect: false,
        interactionRadius: 80,
        interactionStrength: 3,
        interactionSensitivity: 5,
        glowEffect: true,
        bloomStrength: 0.9,
        bloomRadius: 0.4,
        bloomThreshold: 0.85,
        noiseMovement: true,
        noiseScale: 0.02,
        includeStrokes: true,
        strokeWidth: 2,
        strokeDetail: 5,
        enableOrbit: true,
        orbitSensitivity: 1,
        zoomSpeed: 1,
        panSpeed: 1,
        svgScale: 1,
        svgDepth: 20,
        useInstanced: true
      };
    }
  }

  /**
   * Reset all settings to defaults
   */
  function resetSettings() {
    try {
      // Apply default settings
      applySettings({
        particleCount: 1500,
        particleDensity: 4,
        minSize: 0.5,
        maxSize: 1.5,
        color: "#5756d5",
        useGradient: true,
        gradientColor1: "#5756d5",
        gradientColor2: "#d956aa",
        gradientRotation: 0,
        preserveColors: false,
        animationSpeed: 1,
        mouseInteraction: true,
        sandEffect: false,
        sandStrength: 5,
        sandReturn: 1,
        repelEffect: false,
        interactionRadius: 80,
        interactionStrength: 3,
        interactionSensitivity: 5,
        glowEffect: true,
        bloomStrength: 0.9,
        bloomRadius: 0.4,
        bloomThreshold: 0.85,
        noiseMovement: true,
        noiseScale: 0.02,
        includeStrokes: true,
        strokeWidth: 2,
        strokeDetail: 5,
        enableOrbit: true,
        orbitSensitivity: 1,
        zoomSpeed: 1,
        panSpeed: 1,
        svgScale: 1,
        svgDepth: 20,
        useInstanced: true
      });
      
      // Reset camera
      resetCamera();
      
      // Clear all layers
      while (state.layers.length > 0) {
        deleteLayer(state.layers[0].id);
      }
      
      // Show drop area
      if (elements.dropArea) {
        elements.dropArea.classList.remove("hidden");
      }
      
      showNotification("Settings reset to defaults", "success");
    } catch (error) {
      console.error("Error in resetSettings:", error);
      showNotification("Error resetting settings", "error");
    }
  }

  /**
   * Copy generated code to clipboard
   */
  function copyCodeToClipboard() {
    try {
      let code = elements.codeEl.textContent;
      navigator.clipboard.writeText(code).then(() => {
        showNotification("Code copied to clipboard!", "success");
      });
    } catch (error) {
      console.error("Error copying code:", error);
      showNotification("Error copying code. Please try again.", "error");
    }
  }

  /**
   * Generate code for export
   */
  function exportCode() {
    try {
      let settings = getParticleSettings();
      let timestamp = new Date().toLocaleString();
      
      let code = `/**
 * SVG Partycle Generator (Enhanced Version)
 * Created by Enrico Deiana - https://www.enricodeiana.design/
 * Modified and optimized
 * Generated on ${timestamp}
 *
 * Enhanced with:
 * - Multi-layer SVG support with position control
 * - Gradient rotation
 * - High performance instanced rendering
 */

// Required imports:
// <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
// <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.min.js"></script>
// <script src="https://cdn.jsdelivr.net/npm/simplex-noise@2.4.0/simplex-noise.min.js"></script>
// <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/postprocessing/EffectComposer.js"></script>
// <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/postprocessing/RenderPass.js"></script>
// <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/postprocessing/ShaderPass.js"></script>
// <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/shaders/CopyShader.js"></script>
// <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/shaders/LuminosityHighPassShader.js"></script>
// <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/postprocessing/UnrealBloomPass.js"></script>

// Initialize the application
const ParticleSystem = (function() {
  // Private variables
  let camera, scene, renderer, controls;
  let composer, bloomPass;
  let simplex = new SimplexNoise();
  let layers = [];
  let mousePosition = new THREE.Vector3();
  let mouseMoved = false;
  
  // Initialize the application
  function init(containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error('Container element not found');
      return false;
    }
    
    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color('#0a0a18');
    
    // Create camera
    camera = new THREE.PerspectiveCamera(
      60, container.clientWidth / container.clientHeight, 0.1, 1000
    );
    camera.position.z = 200;
    
    // Create renderer
    renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      powerPreference: 'high-performance'
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);
    
    // Setup post-processing for bloom effect
    setupPostProcessing();
    
    // Add OrbitControls
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enabled = ${settings.enableOrbit};
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    controls.rotateSpeed = ${settings.orbitSensitivity};
    controls.zoomSpeed = ${settings.zoomSpeed};
    controls.panSpeed = ${settings.panSpeed};
    controls.screenSpacePanning = true;
    controls.minDistance = 50;
    controls.maxDistance = 500;
    
    // Setup mouse interaction
    setupMouseInteraction();
    
    // Handle window resize
    window.addEventListener('resize', () => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      
      renderer.setSize(width, height);
      composer.setSize(width, height);
    });
    
    // Start animation loop
    animate();
    
    return true;
  }
  
  // Setup post-processing
  function setupPostProcessing() {
    composer = new THREE.EffectComposer(renderer);
    
    const renderPass = new THREE.RenderPass(scene, camera);
    composer.addPass(renderPass);
    
    bloomPass = new THREE.UnrealBloomPass(
      new THREE.Vector2(renderer.domElement.width, renderer.domElement.height),
      ${settings.bloomStrength}, // Strength
      ${settings.bloomRadius}, // Radius
      ${settings.bloomThreshold} // Threshold
    );
    bloomPass.enabled = ${settings.glowEffect};
    composer.addPass(bloomPass);
  }
  
  // Setup mouse interaction
  function setupMouseInteraction() {
    renderer.domElement.addEventListener('mousemove', (event) => {
      if (!${settings.mouseInteraction}) return;
      
      // Don't update if orbit controls are being used with mouse button down
      if (controls.enabled && event.buttons > 0) return;
      
      const rect = renderer.domElement.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(x, y), camera);
      
      const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
      const intersection = new THREE.Vector3();
      
      if (raycaster.ray.intersectPlane(plane, intersection)) {
        mousePosition.copy(intersection);
        mouseMoved = true;
      }
    });
    
    renderer.domElement.addEventListener('mouseleave', () => {
      mousePosition.set(0, 0, 0);
      mouseMoved = false;
    });
    
    // Touch support
    renderer.domElement.addEventListener('touchmove', (event) => {
      if (!${settings.mouseInteraction}) return;
      
      event.preventDefault();
      
      if (event.touches.length > 0) {
        const touch = event.touches[0];
        
        const rect = renderer.domElement.getBoundingClientRect();
        const x = ((touch.clientX - rect.left) / rect.width) * 2 - 1;
        const y = -((touch.clientY - rect.top) / rect.height) * 2 + 1;
        
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(new THREE.Vector2(x, y), camera);
        
        const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
        const intersection = new THREE.Vector3();
        
        if (raycaster.ray.intersectPlane(plane, intersection)) {
          mousePosition.copy(intersection);
          mouseMoved = true;
        }
      }
    }, { passive: false });
  }

  // Animation loop
  function animate() {
    requestAnimationFrame(animate);
    
    // Update controls
    if (controls) controls.update();
    
    // Update particles animation
    updateParticlesAnimation();
    
    // Render with post-processing if enabled
    if (${settings.glowEffect} && composer) {
      composer.render();
    } else {
      renderer.render(scene, camera);
    }
  }
  
  // SVG layer management
  let nextLayerId = 1;
  
  // Create a new layer from SVG
  function addSVGLayer(svgString, name, position = { x: 0, y: 0, z: 0 }, rotation = { x: 0, y: 0, z: 0 }) {
    const layerId = nextLayerId++;
    const layerName = name || \`Layer \${layerId}\`;
    
    // Create layer object
    const layer = {
      id: layerId,
      name: layerName,
      visible: true,
      group: new THREE.Group(),
      useInstanced: ${settings.useInstanced}
    };
    
    // Set position and rotation
    layer.group.position.set(position.x, position.y, position.z);
    layer.group.rotation.set(rotation.x, rotation.y, rotation.z);
    
    // Add to scene
    scene.add(layer.group);
    
    // Add to layers array
    layers.push(layer);
    
    // Process SVG
    processSVG(layer, svgString);
    
    return layerId;
  }
  
  // Process SVG for a layer
  function processSVG(layer, svgString) {
    const settings = {
      particleCount: ${settings.particleCount},
      particleDensity: ${settings.particleDensity},
      minSize: ${settings.minSize},
      maxSize: ${settings.maxSize},
      color: '${settings.color}',
      useGradient: ${settings.useGradient},
      gradientColor1: '${settings.gradientColor1}',
      gradientColor2: '${settings.gradientColor2}',
      gradientRotation: ${settings.gradientRotation},
      preserveColors: ${settings.preserveColors},
      animationSpeed: ${settings.animationSpeed},
      mouseInteraction: ${settings.mouseInteraction},
      sandEffect: ${settings.sandEffect},
      sandStrength: ${settings.sandStrength},
      sandReturn: ${settings.sandReturn},
      repelEffect: ${settings.repelEffect},
      interactionRadius: ${settings.interactionRadius},
      interactionStrength: ${settings.interactionStrength},
      noiseMovement: ${settings.noiseMovement},
      noiseScale: ${settings.noiseScale},
      includeStrokes: ${settings.includeStrokes},
      strokeWidth: ${settings.strokeWidth},
      strokeDetail: ${settings.strokeDetail},
      svgScale: ${settings.svgScale},
      svgDepth: ${settings.svgDepth}
    };
    
    // Create a DOMParser to parse the SVG
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgString, 'image/svg+xml');
    
    // Create canvas to draw SVG
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Set canvas size
    canvas.width = 2000;
    canvas.height = 2000;
    
    // Create Image from SVG
    const img = new Image();
    const svgBlob = new Blob([svgString], {type: 'image/svg+xml'});
    const url = URL.createObjectURL(svgBlob);
    
    img.onload = function() {
      // Calculate aspect ratio to fit SVG in canvas
      const svgRatio = img.width / img.height;
      let drawWidth, drawHeight, offsetX, offsetY;
      
      if (svgRatio > 1) {
        drawWidth = canvas.width * 0.8;
        drawHeight = drawWidth / svgRatio;
        offsetX = canvas.width * 0.1;
        offsetY = (canvas.height - drawHeight) / 2;
      } else {
        drawHeight = canvas.height * 0.8;
        drawWidth = drawHeight * svgRatio;
        offsetX = (canvas.width - drawWidth) / 2;
        offsetY = canvas.height * 0.1;
      }
      
      // Draw SVG to canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
      
      // Get image data to sample pixels
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      // Prepare for separate stroke sampling
      let points = [];
      let colors = [];
      let strokePoints = [];
      let strokeColors = [];
      let fillPoints = [];
      let fillColors = [];
      
      // Sample points where pixels have alpha > 0
      const samplingStep = settings.particleDensity * 2;
      
      for (let y = 0; y < canvas.height; y += samplingStep) {
        for (let x = 0; x < canvas.width; x += samplingStep) {
          const index = (y * canvas.width + x) * 4;
          if (data[index + 3] > 50) {
            // Create point
            const depthFactor = Math.random();
            const z = settings.svgDepth > 0 ? (depthFactor - 0.5) * 2 * settings.svgDepth : 0;
            const point = new THREE.Vector3(
              (x - canvas.width / 2) * 0.1,
              -(y - canvas.height / 2) * 0.1,
              z
            );
            
            // Get color
            let color = null;
            if (settings.preserveColors) {
              color = \`rgb(\${data[index]}, \${data[index + 1]}, \${data[index + 2]})\`;
            }
            
            // Add to points
            points.push(point);
            colors.push(color);
            fillPoints.push(point);
            fillColors.push(color);
          }
        }
      }
      
      // If stroke detection is enabled
      if (settings.includeStrokes) {
        // Edge detection logic for strokes
        const edgeCanvas = document.createElement('canvas');
        const edgeCtx = edgeCanvas.getContext('2d');
        edgeCanvas.width = canvas.width;
        edgeCanvas.height = canvas.height;
        
        edgeCtx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
        const edgeData = edgeCtx.getImageData(0, 0, canvas.width, canvas.height);
        const edgePixels = edgeData.data;
        
        const edgeSamplingStep = Math.max(1, samplingStep / settings.strokeDetail);
        
        for (let y = edgeSamplingStep; y < canvas.height - edgeSamplingStep; y += edgeSamplingStep) {
          for (let x = edgeSamplingStep; x < canvas.width - edgeSamplingStep; x += edgeSamplingStep) {
            const index = (y * canvas.width + x) * 4;
            
            if (edgePixels[index + 3] < 50) continue;
            
            // Check if it's an edge
            const isEdge = checkIfEdge(edgePixels, x, y, canvas.width);
            
            if (isEdge) {
              const depthFactor = Math.random();
              const z = settings.svgDepth > 0 ? (depthFactor - 0.5) * 2 * settings.svgDepth : 0;
              const point = new THREE.Vector3(
                (x - canvas.width / 2) * 0.1,
                -(y - canvas.height / 2) * 0.1,
                z
              );
              
              let color = null;
              if (settings.preserveColors) {
                color = \`rgb(\${edgePixels[index]}, \${edgePixels[index + 1]}, \${edgePixels[index + 2]})\`;
              }
              
              points.push(point);
              colors.push(color);
              strokePoints.push(point);
              strokeColors.push(color);
            }
          }
        }
      }
      
      // Edge detection helper
      function checkIfEdge(data, x, y, width) {
        const center = (y * width + x) * 4;
        
        if (data[center + 3] < 50) return false;
        
        const offsets = [
          [-1, -1], [0, -1], [1, -1],
          [-1,  0],          [1,  0],
          [-1,  1], [0,  1], [1,  1]
        ];
        
        for (const [dx, dy] of offsets) {
          const nx = x + dx;
          const ny = y + dy;
          const neighborIndex = (ny * width + nx) * 4;
          
          if (data[neighborIndex + 3] < 50) {
            return true; // It's an edge pixel
          }
        }
        
        return false;
      }
      
      // Create particles
      createParticles(
        layer, 
        points, 
        strokePoints, 
        fillPoints, 
        settings, 
        colors, 
        strokeColors, 
        fillColors
      );
      
      // Clean up
      URL.revokeObjectURL(url);
    };
    
    img.src = url;
  }
  
  // Create particles for a layer
  function createParticles(layer, points, strokePoints, fillPoints, settings, colors, strokeColors, fillColors) {
    // Sample points
    let sampledPoints = samplePoints(points, strokePoints, fillPoints, settings.particleCount, colors, strokeColors, fillColors);
    
    // Create particles
    if (layer.useInstanced && points.length > 500) {
      createInstancedParticles(layer, sampledPoints, settings);
    } else {
      createTraditionalParticles(layer, sampledPoints, settings);
    }
    
    // Apply scale
    layer.group.scale.set(settings.svgScale, settings.svgScale, settings.svgScale);
  }
  
  // Sample points for particle creation
  function samplePoints(points, strokePoints, fillPoints, targetCount, colors, strokeColors, fillColors) {
    let result = [];
    
    if (points.length <= targetCount) {
      // Use all points
      points.forEach((point, index) => {
        result.push({
          point: point,
          isStroke: strokePoints.includes(point),
          color: colors ? colors[index] : null
        });
      });
    } else {
      // Calculate proportions
      const strokeRatio = strokePoints.length / points.length;
      const strokeCount = Math.floor(targetCount * strokeRatio);
      const fillCount = targetCount - strokeCount;
      
      // Sample stroke points
      if (strokePoints.length > 0) {
        const strokeIndices = new Set();
        while (strokeIndices.size < Math.min(strokeCount, strokePoints.length)) {
          strokeIndices.add(Math.floor(Math.random() * strokePoints.length));
        }
        
        for (const index of strokeIndices) {
          result.push({
            point: strokePoints[index],
            isStroke: true,
            color: strokeColors ? strokeColors[index] : null
          });
        }
      }
      
      // Sample fill points
      if (fillPoints.length > 0) {
        const fillIndices = new Set();
        while (fillIndices.size < Math.min(fillCount, fillPoints.length)) {
          fillIndices.add(Math.floor(Math.random() * fillPoints.length));
        }
        
        for (const index of fillIndices) {
          result.push({
            point: fillPoints[index],
            isStroke: false,
            color: fillColors ? fillColors[index] : null
          });
        }
      }
    }
    
    return result;
  }
  
  // Create instanced particles
  function createInstancedParticles(layer, sampledPoints, settings) {
    // Group by color and type
    const groups = new Map();
    
    // Process points
    sampledPoints.forEach(data => {
      const isStroke = data.isStroke;
      let color;
      
      if (settings.preserveColors && data.color) {
        color = data.color;
      } else if (settings.useGradient) {
        const rotationRad = settings.gradientRotation * (Math.PI / 180);
        const normalizedX = (data.point.x + 100) / 200;
        const normalizedY = (data.point.y + 100) / 200;
        
        // Rotate the normalized coordinates
        const rotatedX = normalizedX * Math.cos(rotationRad) - normalizedY * Math.sin(rotationRad);
        const rotatedY = normalizedX * Math.sin(rotationRad) + normalizedY * Math.cos(rotationRad);
        
        // Use the rotated X coordinate for gradient interpolation
        const gradientPos = Math.max(0, Math.min(1, rotatedX));
        color = interpolateColor(settings.gradientColor1, settings.gradientColor2, gradientPos);
      } else {
        color = isStroke ? tintColor(settings.color, 1.2) : settings.color;
      }
      
      // Get key for grouping
      const key = \`\${color}_\${isStroke ? 'stroke' : 'fill'}\`;
      
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key).push(data);
    });
    
    // Create instanced meshes for each group
    const sphereGeometry = new THREE.SphereGeometry(1, 16, 16);
    
    groups.forEach((particles, key) => {
      // Create material
      const [colorStr, type] = key.split('_');
      const material = new THREE.MeshBasicMaterial({
        color: new THREE.Color(colorStr),
        transparent: true,
        opacity: type === 'stroke' ? 0.9 : 0.8
      });
      
      // Create instanced mesh
      const instancedMesh = new THREE.InstancedMesh(sphereGeometry, material, particles.length);
      instancedMesh.frustumCulled = false;
      
      // Set matrices
      particles.forEach((data, i) => {
        const { point } = data;
        const sizeFactor = data.isStroke ? 0.8 : 1.0;
        const size = (settings.minSize + Math.random() * (settings.maxSize - settings.minSize)) * sizeFactor;
        
        const matrix = new THREE.Matrix4();
        matrix.makeTranslation(point.x, point.y, point.z);
        matrix.scale(new THREE.Vector3(size, size, size));
        instancedMesh.setMatrixAt(i, matrix);
        
        // Store animation data
        data.index = i;
        data.mesh = instancedMesh;
        data.size = size;
        data.originalPosition = point.clone();
        data.angle = Math.random() * Math.PI * 2;
        data.speed = 0.05 + Math.random() * 0.05;
        data.amplitude = Math.random() * 2;
        data.offset = new THREE.Vector3();
        data.velocity = new THREE.Vector3();
        data.noiseOffset = {
          x: Math.random() * 1000,
          y: Math.random() * 1000,
          z: Math.random() * 1000
        };
      });
      
      instancedMesh.instanceMatrix.needsUpdate = true;
      
      // Add to layer
      layer.group.add(instancedMesh);
    });
    
    // Store particles data
    layer.particles = Array.from(groups.values()).flat();
  }
  
  // Create traditional particles
  function createTraditionalParticles(layer, sampledPoints, settings) {
    // Geometry and materials
    const sphereGeometry = new THREE.SphereGeometry(1, 16, 16);
    const materials = new Map();
    
    // Process points
    layer.particles = sampledPoints.map(data => {
      const { point, isStroke } = data;
      
      // Size
      const sizeFactor = isStroke ? 0.8 : 1.0;
      const size = (settings.minSize + Math.random() * (settings.maxSize - settings.minSize)) * sizeFactor;
      
      // Color
      let color;
      if (settings.preserveColors && data.color) {
        color = data.color;
      } else if (settings.useGradient) {
        const rotationRad = settings.gradientRotation * (Math.PI / 180);
        const normalizedX = (point.x + 100) / 200;
        const normalizedY = (point.y + 100) / 200;
        
        // Rotate the normalized coordinates
        const rotatedX = normalizedX * Math.cos(rotationRad) - normalizedY * Math.sin(rotationRad);
        const rotatedY = normalizedX * Math.sin(rotationRad) + normalizedY * Math.cos(rotationRad);
        
        // Use the rotated X coordinate for gradient interpolation
        const gradientPos = Math.max(0, Math.min(1, rotatedX));
        color = interpolateColor(settings.gradientColor1, settings.gradientColor2, gradientPos);
      } else {
        color = isStroke ? tintColor(settings.color, 1.2) : settings.color;
      }
      
      // Get or create material
      const materialKey = \`\${color}_\${isStroke ? 'stroke' : 'fill'}\`;
      if (!materials.has(materialKey)) {
        materials.set(materialKey, new THREE.MeshBasicMaterial({
          color: new THREE.Color(color),
          transparent: true,
          opacity: isStroke ? 0.9 : 0.8
        }));
      }
      
      // Create mesh
      const mesh = new THREE.Mesh(sphereGeometry, materials.get(materialKey));
      mesh.position.copy(point);
      mesh.scale.set(size, size, size);
      
      // Store data for animation
      data.mesh = mesh;
      data.size = size;
      data.originalPosition = point.clone();
      data.angle = Math.random() * Math.PI * 2;
      data.speed = 0.05 + Math.random() * 0.05;
      data.amplitude = Math.random() * 2;
      data.offset = new THREE.Vector3();
      data.velocity = new THREE.Vector3();
      data.noiseOffset = {
        x: Math.random() * 1000,
        y: Math.random() * 1000,
        z: Math.random() * 1000
      };
      
      // Add to layer
      layer.group.add(mesh);
      
      return data;
    });
  }
  
  // Animation update
  function updateParticlesAnimation() {
    const time = performance.now() * 0.001 * ${settings.animationSpeed} * 0.5;
    
    // Animation settings
    const settings = {
      noiseMovement: ${settings.noiseMovement},
      noiseScale: ${settings.noiseScale},
      mouseInteraction: ${settings.mouseInteraction},
      repelEffect: ${settings.repelEffect},
      interactionRadius: ${settings.interactionRadius},
      interactionStrength: ${settings.interactionStrength},
      sandEffect: ${settings.sandEffect},
      sandStrength: ${settings.sandStrength},
      sandReturn: ${settings.sandReturn},
      svgDepth: ${settings.svgDepth},
      animationSpeed: ${settings.animationSpeed}
    };
    
    // Update all visible layers
    layers.forEach(layer => {
      if (!layer.visible) return;
      
      // Update particles in this layer
      layer.particles.forEach(particle => {
        updateParticle(particle, time, settings);
      });
    });
  }
  
  // Update a single particle
  function updateParticle(particle, time, settings) {
    const { mesh, originalPosition, isStroke, noiseOffset } = particle;
    
    // Skip if mesh doesn't exist
    if (!mesh) return;
    
    // For instanced meshes
    if (mesh instanceof THREE.InstancedMesh) {
      updateInstancedParticle(particle, time, settings);
      return;
    }
    
    // For regular meshes
    const currentPosition = mesh.position.clone();
    let newPosition = originalPosition.clone();
    
    // Apply animation
    if (settings.noiseMovement) {
      // Update noise offsets
      particle.noiseOffset.x += 0.002 * settings.animationSpeed;
      particle.noiseOffset.y += 0.002 * settings.animationSpeed;
      particle.noiseOffset.z += 0.002 * settings.animationSpeed;
      
      // Get 3D noise
      const noiseX = simplex.noise3D(
        particle.noiseOffset.x, 
        particle.noiseOffset.y, 
        0
      ) * settings.noiseScale * 100;
      
      const noiseY = simplex.noise3D(
        particle.noiseOffset.y, 
        particle.noiseOffset.z, 
        0
      ) * settings.noiseScale * 100;
      
      const noiseZ = simplex.noise3D(
        particle.noiseOffset.z, 
        particle.noiseOffset.x, 
        0
      ) * settings.noiseScale * 50;
      
      // Apply noise
      particle.offset.set(
        noiseX,
        noiseY,
        noiseZ * (settings.svgDepth > 0 ? 1 : 0)
      );
      
      newPosition.add(particle.offset);
    } else {
      // Sine wave animation
      particle.angle += particle.speed * settings.animationSpeed;
      
      particle.offset.x = Math.sin(particle.angle + time) * particle.amplitude;
      particle.offset.y = Math.cos(particle.angle + time * 1.5) * particle.amplitude;
      
      if (settings.svgDepth > 0) {
        particle.offset.z = Math.sin(particle.angle + time * 0.7) * particle.amplitude * 0.5;
      }
      
      newPosition.add(particle.offset);
    }
    
    // Strokes move more
    if (isStroke) {
      particle.offset.multiplyScalar(1.2);
    }
    
    // Mouse interaction
    if (settings.mouseInteraction && mouseMoved && mousePosition.length() > 0) {
      const distanceToMouse = mesh.position.distanceTo(mousePosition);
      const scale = mesh.parent ? mesh.parent.scale.x : 1;
      
      if (distanceToMouse < settings.interactionRadius * scale) {
        const forceFactor = (settings.interactionRadius * scale - distanceToMouse) / (settings.interactionRadius * scale);
        const force = settings.interactionStrength * forceFactor;
        
        const forceDirection = new THREE.Vector3()
          .subVectors(mesh.position, mousePosition)
          .normalize()
          .multiplyScalar(force);
        
        if (settings.repelEffect) {
          newPosition.add(forceDirection);
        } else {
          newPosition.sub(forceDirection);
        }
        
        // Sand effect
        if (settings.sandEffect) {
          if (settings.repelEffect) {
            particle.velocity.add(forceDirection.multiplyScalar(settings.sandStrength * 0.1));
          } else {
            particle.velocity.sub(forceDirection.multiplyScalar(settings.sandStrength * 0.1));
          }
        }
      }
    }
    
    // Sand physics
    if (settings.sandEffect) {
      const targetPosition = originalPosition.clone().add(particle.offset);
      const direction = targetPosition.clone().sub(currentPosition);
      
      const returnForce = direction.multiplyScalar(0.05 * settings.sandReturn);
      particle.velocity.add(returnForce);
      
      particle.velocity.multiplyScalar(0.95);
      
      newPosition = currentPosition.clone().add(particle.velocity);
    }
    
    // Update position
    mesh.position.copy(newPosition);
    
    // Add rotation
    mesh.rotation.x += 0.01 * settings.animationSpeed;
    mesh.rotation.y += 0.01 * settings.animationSpeed;
  }
  
  // Update an instanced particle
  function updateInstancedParticle(particle, time, settings) {
    const { mesh, originalPosition, index } = particle;
    
    // Get current matrix
    const matrix = new THREE.Matrix4();
    mesh.getMatrixAt(index, matrix);
    
    // Extract current position and scale
    const position = new THREE.Vector3();
    const rotation = new THREE.Quaternion();
    const scale = new THREE.Vector3();
    matrix.decompose(position, rotation, scale);
    
    // Calculate new position
    let newPosition = originalPosition.clone();
    
    // Apply animation
    if (settings.noiseMovement) {
      // Update noise offsets
      particle.noiseOffset.x += 0.002 * settings.animationSpeed;
      particle.noiseOffset.y += 0.002 * settings.animationSpeed;
      particle.noiseOffset.z += 0.002 * settings.animationSpeed;
      
      // Get 3D noise
      const noiseX = simplex.noise3D(
        particle.noiseOffset.x, 
        particle.noiseOffset.y, 
        0
      ) * settings.noiseScale * 100;
      
      const noiseY = simplex.noise3D(
        particle.noiseOffset.y, 
        particle.noiseOffset.z, 
        0
      ) * settings.noiseScale * 100;
      
      const noiseZ = simplex.noise3D(
        particle.noiseOffset.z, 
        particle.noiseOffset.x, 
        0
      ) * settings.noiseScale * 50;
      
      // Apply noise
      particle.offset.set(
        noiseX,
        noiseY,
        noiseZ * (settings.svgDepth > 0 ? 1 : 0)
      );
      
      newPosition.add(particle.offset);
    } else {
      // Sine wave animation
      particle.angle += particle.speed * settings.animationSpeed;
      
      particle.offset.x = Math.sin(particle.angle + time) * particle.amplitude;
      particle.offset.y = Math.cos(particle.angle + time * 1.5) * particle.amplitude;
      
      if (settings.svgDepth > 0) {
        particle.offset.z = Math.sin(particle.angle + time * 0.7) * particle.amplitude * 0.5;
      }
      
      newPosition.add(particle.offset);
    }
    
    // Strokes move more
    if (particle.isStroke) {
      particle.offset.multiplyScalar(1.2);
    }
    
    // Mouse interaction
    if (settings.mouseInteraction && mouseMoved && mousePosition.length() > 0) {
      const distanceToMouse = position.distanceTo(mousePosition);
      const parentScale = mesh.parent ? mesh.parent.scale.x : 1;
      
      if (distanceToMouse < settings.interactionRadius * parentScale) {
        const forceFactor = (settings.interactionRadius * parentScale - distanceToMouse) / (settings.interactionRadius * parentScale);
        const force = settings.interactionStrength * forceFactor;
        
        const forceDirection = new THREE.Vector3()
          .subVectors(position, mousePosition)
          .normalize()
          .multiplyScalar(force);
        
        if (settings.repelEffect) {
          newPosition.add(forceDirection);
        } else {
          newPosition.sub(forceDirection);
        }
        
        // Sand effect
        if (settings.sandEffect) {
          if (settings.repelEffect) {
            particle.velocity.add(forceDirection.multiplyScalar(settings.sandStrength * 0.1));
          } else {
            particle.velocity.sub(forceDirection.multiplyScalar(settings.sandStrength * 0.1));
          }
        }
      }
    }
    
    // Sand physics
    if (settings.sandEffect) {
      const targetPosition = originalPosition.clone().add(particle.offset);
      const direction = targetPosition.clone().sub(position);
      
      const returnForce = direction.multiplyScalar(0.05 * settings.sandReturn);
      particle.velocity.add(returnForce);
      
      particle.velocity.multiplyScalar(0.95);
      
      newPosition = position.clone().add(particle.velocity);
    }
    
    // Create new matrix
    const newMatrix = new THREE.Matrix4();
    newMatrix.makeTranslation(newPosition.x, newPosition.y, newPosition.z);
    
    // Add rotation
    const rotX = new THREE.Matrix4().makeRotationX(0.01 * settings.animationSpeed);
    const rotY = new THREE.Matrix4().makeRotationY(0.01 * settings.animationSpeed);
    newMatrix.multiply(rotX).multiply(rotY);
    
    // Apply scale
    newMatrix.scale(scale);
    
    // Update instance matrix
    mesh.setMatrixAt(index, newMatrix);
    mesh.instanceMatrix.needsUpdate = true;
  }
  
  // Helper for color interpolation
  function interpolateColor(color1, color2, factor) {
    const c1 = new THREE.Color(color1);
    const c2 = new THREE.Color(color2);
    return new THREE.Color().lerpColors(c1, c2, factor).getStyle();
  }
  
  // Helper to tint a color
  function tintColor(color, factor) {
    const c = new THREE.Color(color).multiplyScalar(factor);
    return c.getStyle();
  }
  
  // Return public API
  return {
    init: init,
    addSVGLayer: addSVGLayer
  };
})();

// Example usage:
// 1. Initialize the particle system
document.addEventListener('DOMContentLoaded', function() {
  ParticleSystem.init('your-container-id');
  
  // 2. Add SVG layers
  const svgData = \`${state.layers.length>0?state.layers[0].svgString?.replace(/\\/g,"\\\\").replace(/\`/g,"\\`").substring(0,500)+"...":'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="none" stroke="white" stroke-width="2"/></svg>'}\`;
  
  // Add your SVG with position and rotation
  ParticleSystem.addSVGLayer(
    svgData, 
    'Main Layer', 
    { x: 0, y: 0, z: 0 }, 
    { x: 0, y: 0, z: 0 }
  );
});`;

      if (elements.codeEl) {
        elements.codeEl.textContent = code;
      }
      
      return code;
    } catch (error) {
      console.error("Error generating code:", error);
      if (elements.codeEl) {
        elements.codeEl.textContent = "// Error generating code. Please try again.";
      }
      showNotification("Error generating code", "error");
      return "";
    }
  }

  /**
   * Create a new UI element for a layer
   */
  function createLayerUIElement(layer) {
    if (!elements.layerTemplate || !elements.layersList) return;
    
    // Clone template
    let template = elements.layerTemplate.content.cloneNode(true);
    let layerElement = template.querySelector("li");
    
    // Set layer ID
    layerElement.dataset.layerId = layer.id;
    
    // Set layer name
    let nameElement = layerElement.querySelector(".layer-name");
    if (nameElement) {
      nameElement.textContent = layer.name;
    }
    
    // Layer visibility toggle
    let visibilityElement = layerElement.querySelector(".layer-visibility");
    if (visibilityElement) {
      // Set initial visibility state
      if (!layer.visible) {
        visibilityElement.classList.add("hidden");
      }
      
      // Add click handler
      visibilityElement.addEventListener("click", (e) => {
        e.stopPropagation();
        toggleLayerVisibility(layer.id);
      });
    }
    
    // Delete button
    let deleteButton = layerElement.querySelector(".layer-delete");
    if (deleteButton) {
      deleteButton.addEventListener("click", (e) => {
        e.stopPropagation();
        deleteLayer(layer.id);
      });
    }
    
    // Edit button
    let editButton = layerElement.querySelector(".layer-edit");
    if (editButton) {
      editButton.addEventListener("click", (e) => {
        e.stopPropagation();
        setActiveLayer(layer.id);
      });
    }
    
    // Click on layer to select
    layerElement.addEventListener("click", () => {
      setActiveLayer(layer.id);
    });
    
    // Setup drag & drop reordering
    setupLayerDragAndDrop(layerElement);
    
    // Add to layers list
    elements.layersList.appendChild(layerElement);
  }

  /**
   * Toggle layer visibility
   */
  function toggleLayerVisibility(layerId) {
    let layer = state.layers.find(layer => layer.id === layerId);
    if (!layer) return;
    
    // Toggle visibility
    layer.visible = !layer.visible;
    
    // Update group visibility
    if (layer.group) {
      layer.group.visible = layer.visible;
    }
    
    // Update UI
    let layerElement = elements.layersList.querySelector(`[data-layer-id="${layerId}"]`);
    if (layerElement) {
      let visibilityElement = layerElement.querySelector(".layer-visibility");
      if (visibilityElement) {
        if (layer.visible) {
          visibilityElement.classList.remove("hidden");
        } else {
          visibilityElement.classList.add("hidden");
        }
      }
    }
    
    // Update particle count
    updateParticleCount();
  }

  /**
   * Setup drag and drop for layer reordering
   */
  function setupLayerDragAndDrop(layerElement) {
    // Make draggable
    layerElement.setAttribute("draggable", "true");
    
    // Get drag handle
    let dragHandle = layerElement.querySelector(".layer-drag-handle");
    if (dragHandle) {
      // Only start drag when handle is used
      dragHandle.addEventListener("mousedown", () => {
        layerElement.draggable = true;
      });
      
      dragHandle.addEventListener("mouseup", () => {
        layerElement.draggable = false;
      });
    }
    
    // Drag start
    layerElement.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("text/plain", layerElement.dataset.layerId);
      layerElement.classList.add("dragging");
      if (dragHandle) dragHandle.classList.add("dragging");
    });
    
    // Drag end
    layerElement.addEventListener("dragend", () => {
      layerElement.classList.remove("dragging");
      if (dragHandle) dragHandle.classList.remove("dragging");
      
      // Remove any indicators
      document.querySelectorAll(".layer-drop-indicator").forEach(el => el.remove());
    });
    
    // Drag over
    layerElement.addEventListener("dragover", (e) => {
      e.preventDefault();
      
      // Remove existing indicators
      document.querySelectorAll(".layer-drop-indicator").forEach(el => el.remove());
      
      // Get dragged layer ID
      let draggedId = e.dataTransfer.getData("text/plain");
      
      // Don't allow dropping on self
      if (!draggedId || draggedId === layerElement.dataset.layerId) return;
      
      // Determine drop position (before or after)
      let rect = layerElement.getBoundingClientRect();
      let mouseY = e.clientY - rect.top;
      let dropAfter = mouseY > rect.height / 2;
      
      // Create indicator
      let indicator = document.createElement("div");
      indicator.classList.add("layer-drop-indicator");
      
      // Position indicator
      if (dropAfter) {
        layerElement.after(indicator);
      } else {
        layerElement.before(indicator);
      }
    });
    
    // Drag leave
    layerElement.addEventListener("dragleave", () => {
      // Remove indicators when leaving
      let nextElement = layerElement.nextElementSibling;
      if (nextElement && nextElement.classList.contains("layer-drop-indicator")) {
        nextElement.remove();
      }
      
      let prevElement = layerElement.previousElementSibling;
      if (prevElement && prevElement.classList.contains("layer-drop-indicator")) {
        prevElement.remove();
      }
    });
    
    // Drop
    layerElement.addEventListener("drop", (e) => {
      e.preventDefault();
      
      // Get dragged layer ID
      let draggedId = e.dataTransfer.getData("text/plain");
      
      // Don't allow dropping on self
      if (!draggedId || draggedId === layerElement.dataset.layerId) return;
      
      // Determine drop position
      let rect = layerElement.getBoundingClientRect();
      let mouseY = e.clientY - rect.top;
      let dropAfter = mouseY > rect.height / 2;
      
      // Find indices
      let sourceIndex = state.layers.findIndex(layer => layer.id === draggedId);
      let targetIndex = state.layers.findIndex(layer => layer.id === layerElement.dataset.layerId);
      
      // Ensure valid indices
      if (sourceIndex === -1 || targetIndex === -1) return;
      
      // Adjust target index if dropping after
      if (dropAfter) {
        targetIndex++;
      }
      
      // Reorder layers
      reorderLayers(sourceIndex, targetIndex);
      
      // Remove indicators
      document.querySelectorAll(".layer-drop-indicator").forEach(el => el.remove());
    });
  }

  /**
   * Reorder layers in the state and DOM
   */
  function reorderLayers(fromIndex, toIndex) {
    if (fromIndex === toIndex) return;
    
    // Move layer in array
    let movedLayer = state.layers.splice(fromIndex, 1)[0];
    
    // Adjust toIndex if needed
    if (fromIndex < toIndex) {
      toIndex--;
    }
    
    // Insert at new position
    state.layers.splice(toIndex, 0, movedLayer);
    
    // Update DOM
    updateLayersDOM();
    
    // Update Three.js scene order
    updateSceneOrder();
  }

  /**
   * Update layers list in DOM
   */
  function updateLayersDOM() {
    if (!elements.layersList) return;
    
    // Create document fragment
    let fragment = document.createDocumentFragment();
    
    // Add layers in reverse (to match visual stacking)
    for (let i = state.layers.length - 1; i >= 0; i--) {
      let layer = state.layers[i];
      let layerElement = elements.layersList.querySelector(`[data-layer-id="${layer.id}"]`);
      if (layerElement) {
        fragment.appendChild(layerElement);
      }
    }
    
    // Clear and re-append
    elements.layersList.innerHTML = "";
    elements.layersList.appendChild(fragment);
  }

  /**
   * Update Three.js scene order
   */
  function updateSceneOrder() {
    // Remove all layer groups from scene
    state.layers.forEach(layer => {
      if (layer.group) {
        state.scene.remove(layer.group);
      }
    });
    
    // Add back in correct order
    state.layers.forEach(layer => {
      if (layer.group) {
        state.scene.add(layer.group);
      }
