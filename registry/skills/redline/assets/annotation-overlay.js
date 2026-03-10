/**
 * Redline — Annotation Overlay
 * Dev-only tool for annotating UI elements with feedback.
 * Press Cmd+Shift+A (Mac) or Ctrl+Shift+A (Win/Linux) to toggle annotation mode.
 * Self-contained — loads Fabric.js from CDN automatically.
 */
(function () {
  'use strict';

  // Prevent double-init
  if (window.__redline_initialized) return;
  window.__redline_initialized = true;

  const IS_MAC = navigator.platform.toUpperCase().indexOf('MAC') >= 0;

  let active = false;
  let fabricCanvas = null;
  let annotations = [];
  let sessionName = '';
  let overlayEl = null;
  let toolbarEl = null;
  let currentTool = 'select'; // 'select' | 'arrow' | 'shape' | 'freehand' | 'text'
  let shapeMode = 'circle'; // 'circle' | 'box' — toggled by clicking shape button
  let isSelectBusy = false; // guard against multiple popups
  let annotationObjects = []; // tracks {highlight, label} fabric objects per annotation for undo

  // --- Fabric.js loader ---
  function loadFabric() {
    return new Promise((resolve, reject) => {
      if (window.fabric) return resolve(window.fabric);
      const s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/fabric.js/5.3.1/fabric.min.js';
      s.onload = () => resolve(window.fabric);
      s.onerror = () => reject(new Error('Failed to load Fabric.js'));
      document.head.appendChild(s);
    });
  }

  // --- CSS selector generator ---
  function getCssSelector(el) {
    if (el.id) return '#' + CSS.escape(el.id);
    const parts = [];
    let current = el;
    while (current && current !== document.body && current !== document.documentElement) {
      let seg = current.tagName.toLowerCase();
      if (current.className && typeof current.className === 'string') {
        const classes = current.className.trim().split(/\s+/).filter(c => c.length > 0);
        if (classes.length > 0) {
          seg += '.' + classes.map(c => CSS.escape(c)).join('.');
        }
      }
      // Add :nth-child() when siblings share the same tag+class combo
      if (current.parentElement) {
        var siblings = Array.from(current.parentElement.children).filter(function (s) {
          return s.tagName === current.tagName && s.className === current.className;
        });
        if (siblings.length > 1) {
          var idx = siblings.indexOf(current) + 1;
          seg += ':nth-child(' + (Array.from(current.parentElement.children).indexOf(current) + 1) + ')';
        }
      }
      parts.unshift(seg);
      current = current.parentElement;
    }
    return parts.join(' > ');
  }

  // --- Toast notification ---
  function showToast(msg, duration) {
    duration = duration || 3000;
    const t = document.createElement('div');
    t.textContent = msg;
    Object.assign(t.style, {
      position: 'fixed', bottom: '24px', right: '24px', zIndex: '2147483647',
      background: '#1a1a2e', color: '#fff', padding: '12px 20px', borderRadius: '8px',
      fontSize: '14px', fontFamily: 'system-ui, sans-serif', boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      transition: 'opacity 0.3s', opacity: '1'
    });
    document.body.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 300); }, duration);
  }

  // --- Name dialog ---
  function showNameDialog() {
    return new Promise((resolve) => {
      const route = window.location.pathname.replace(/\//g, '-').replace(/^-/, '') || 'home';
      const ts = new Date().toISOString().slice(0, 16).replace(/[T:]/g, '-');
      const defaultName = route + '-' + ts;

      const backdrop = document.createElement('div');
      Object.assign(backdrop.style, {
        position: 'fixed', inset: '0', zIndex: '2147483646',
        background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center'
      });

      const dialog = document.createElement('div');
      Object.assign(dialog.style, {
        background: '#fff', borderRadius: '12px', padding: '24px', minWidth: '360px',
        fontFamily: 'system-ui, sans-serif', boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
      });
      dialog.innerHTML =
        '<h3 style="margin:0 0 12px;font-size:16px;color:#1a1a2e;">Redline — New Annotation Session</h3>' +
        '<label style="font-size:13px;color:#666;">Session name:</label>' +
        '<input type="text" style="width:100%;padding:8px;margin:8px 0 16px;border:1px solid #ddd;border-radius:6px;font-size:14px;box-sizing:border-box;" />' +
        '<div style="display:flex;gap:8px;justify-content:flex-end;">' +
        '<button data-action="cancel" style="padding:8px 16px;border:1px solid #ddd;border-radius:6px;background:#fff;cursor:pointer;font-size:13px;">Cancel</button>' +
        '<button data-action="start" style="padding:8px 16px;border:none;border-radius:6px;background:#e63946;color:#fff;cursor:pointer;font-size:13px;">Start</button>' +
        '</div>';

      backdrop.appendChild(dialog);
      document.body.appendChild(backdrop);

      const input = dialog.querySelector('input');
      input.value = defaultName;
      input.select();
      input.focus();

      function finish(val) { backdrop.remove(); resolve(val); }

      dialog.querySelector('[data-action="cancel"]').onclick = function () { finish(null); };
      dialog.querySelector('[data-action="start"]').onclick = function () { finish(input.value.trim() || defaultName); };
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') finish(input.value.trim() || defaultName);
        if (e.key === 'Escape') finish(null);
      });
    });
  }

  // --- Comment input popup ---
  function showCommentInput(x, y) {
    return new Promise((resolve) => {
      const popup = document.createElement('div');
      Object.assign(popup.style, {
        position: 'fixed', left: Math.min(x + 10, window.innerWidth - 280) + 'px',
        top: Math.min(y + 10, window.innerHeight - 60) + 'px', zIndex: '2147483647',
        background: '#fff', borderRadius: '8px', padding: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
        display: 'flex', gap: '6px'
      });
      popup.innerHTML =
        '<input type="text" placeholder="Describe the issue..." style="width:220px;padding:6px 8px;border:1px solid #ddd;border-radius:4px;font-size:13px;" />' +
        '<button style="padding:6px 12px;border:none;border-radius:4px;background:#e63946;color:#fff;cursor:pointer;font-size:13px;">Add</button>';

      document.body.appendChild(popup);
      const input = popup.querySelector('input');
      // Use setTimeout to ensure focus works after Fabric canvas events
      setTimeout(function () { input.focus(); }, 0);

      function finish(val) { popup.remove(); resolve(val); }

      popup.querySelector('button').onclick = function () { finish(input.value.trim()); };
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') finish(input.value.trim());
        if (e.key === 'Escape') finish(null);
      });
    });
  }

  // --- Element highlight ---
  function highlightElement(el) {
    const rect = el.getBoundingClientRect();
    const highlight = new fabric.Rect({
      left: rect.left, top: rect.top, width: rect.width, height: rect.height,
      fill: 'rgba(230, 57, 70, 0.15)', stroke: '#e63946', strokeWidth: 2,
      selectable: false, evented: false, hoverCursor: 'default'
    });
    fabricCanvas.add(highlight);
    return highlight;
  }

  // --- Create toolbar ---
  function createToolbar() {
    toolbarEl = document.createElement('div');
    Object.assign(toolbarEl.style, {
      position: 'fixed', top: '12px', left: '50%', transform: 'translateX(-50%)',
      zIndex: '2147483647', background: '#1a1a2e', borderRadius: '10px', padding: '6px 10px',
      display: 'flex', gap: '4px', alignItems: 'center', boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
      fontFamily: 'system-ui, sans-serif'
    });

    var tools = [
      { id: 'select', label: '⊙ Select', title: 'Click elements to annotate' },
      { id: 'arrow', label: '→ Arrow', title: 'Draw arrows with arrowheads' },
      { id: 'shape', label: '○ Circle', title: 'Click to toggle circle/box' },
      { id: 'text', label: 'T Text', title: 'Click to place text' },
      { id: 'freehand', label: '✎ Draw', title: 'Freehand drawing' }
    ];

    tools.forEach(function (tool) {
      var btn = document.createElement('button');
      btn.textContent = tool.label;
      btn.title = tool.title;
      btn.dataset.tool = tool.id;
      Object.assign(btn.style, {
        padding: '6px 12px', border: 'none', borderRadius: '6px', cursor: 'pointer',
        fontSize: '12px', fontWeight: '500', transition: 'background 0.15s',
        background: tool.id === currentTool ? '#e63946' : 'transparent',
        color: '#fff'
      });
      btn.onclick = function () {
        // Toggle circle/box when clicking the shape button while already in shape mode
        if (tool.id === 'shape' && currentTool === 'shape') {
          shapeMode = shapeMode === 'circle' ? 'box' : 'circle';
          btn.textContent = shapeMode === 'circle' ? '○ Circle' : '□ Box';
          return;
        }
        setTool(tool.id);
      };
      toolbarEl.appendChild(btn);
    });

    // Annotation count
    var counter = document.createElement('span');
    counter.id = '__redline_counter';
    Object.assign(counter.style, {
      color: '#aaa', fontSize: '12px', marginLeft: '8px', padding: '0 8px',
      borderLeft: '1px solid #444'
    });
    counter.textContent = '0 annotations';
    toolbarEl.appendChild(counter);

    // Undo button
    var undoBtn = document.createElement('button');
    undoBtn.textContent = '↩ Undo';
    Object.assign(undoBtn.style, {
      padding: '6px 12px', border: 'none', borderRadius: '6px',
      background: 'transparent', color: '#aaa', cursor: 'pointer',
      fontSize: '12px', fontWeight: '500', marginLeft: '4px'
    });
    undoBtn.onclick = function () { undoLastAnnotation(); };
    toolbarEl.appendChild(undoBtn);

    // Done button
    var doneBtn = document.createElement('button');
    doneBtn.textContent = '✓ Done';
    Object.assign(doneBtn.style, {
      padding: '6px 14px', border: '1px solid #e63946', borderRadius: '6px',
      background: 'transparent', color: '#e63946', cursor: 'pointer',
      fontSize: '12px', fontWeight: '600', marginLeft: '4px'
    });
    doneBtn.onclick = function () { deactivate(); };
    toolbarEl.appendChild(doneBtn);

    document.body.appendChild(toolbarEl);
  }

  function updateCounter() {
    var el = document.getElementById('__redline_counter');
    if (el) el.textContent = annotations.length + ' annotation' + (annotations.length !== 1 ? 's' : '');
  }

  function setTool(toolId) {
    currentTool = toolId;
    toolbarEl.querySelectorAll('button[data-tool]').forEach(function (btn) {
      btn.style.background = btn.dataset.tool === toolId ? '#e63946' : 'transparent';
    });

    if (fabricCanvas) {
      fabricCanvas.isDrawingMode = (toolId === 'freehand');
      if (toolId === 'freehand') {
        fabricCanvas.freeDrawingBrush.color = '#e63946';
        fabricCanvas.freeDrawingBrush.width = 3;
      }
    }
  }

  // --- Create an arrowhead as a triangle at the end of a line ---
  function createArrowhead(fromX, fromY, toX, toY) {
    var angle = Math.atan2(toY - fromY, toX - fromX);
    var headLen = 14;
    var triangle = new fabric.Triangle({
      left: toX,
      top: toY,
      width: headLen,
      height: headLen,
      fill: '#e63946',
      angle: (angle * 180 / Math.PI) + 90,
      originX: 'center',
      originY: 'center',
      selectable: false,
      evented: false
    });
    return triangle;
  }

  function setupCanvasDrawing() {
    var isDrawingShape = false;
    var shapeStart = null;
    var tempShapes = []; // may be multiple objects (line + arrowhead)

    function removeTempShapes() {
      tempShapes.forEach(function (s) { fabricCanvas.remove(s); });
      tempShapes = [];
    }

    fabricCanvas.on('mouse:down', function (opt) {
      if (currentTool === 'select') {
        handleElementClick(opt.e);
        return;
      }
      if (currentTool === 'freehand') return;
      if (currentTool === 'text') {
        handleTextPlace(opt.e);
        return;
      }
      isDrawingShape = true;
      var pointer = fabricCanvas.getPointer(opt.e);
      shapeStart = { x: pointer.x, y: pointer.y };
    });

    fabricCanvas.on('mouse:move', function (opt) {
      if (!isDrawingShape || !shapeStart) return;
      var pointer = fabricCanvas.getPointer(opt.e);
      removeTempShapes();

      if (currentTool === 'arrow') {
        var line = new fabric.Line(
          [shapeStart.x, shapeStart.y, pointer.x, pointer.y],
          { stroke: '#e63946', strokeWidth: 3, selectable: false, evented: false }
        );
        var head = createArrowhead(shapeStart.x, shapeStart.y, pointer.x, pointer.y);
        tempShapes = [line, head];
        fabricCanvas.add(line);
        fabricCanvas.add(head);
      } else if (currentTool === 'shape') {
        var shape;
        if (shapeMode === 'circle') {
          var rx = Math.abs(pointer.x - shapeStart.x) / 2;
          var ry = Math.abs(pointer.y - shapeStart.y) / 2;
          shape = new fabric.Ellipse({
            left: Math.min(shapeStart.x, pointer.x), top: Math.min(shapeStart.y, pointer.y),
            rx: rx, ry: ry, fill: 'rgba(230,57,70,0.1)', stroke: '#e63946', strokeWidth: 2,
            selectable: false, evented: false
          });
        } else {
          shape = new fabric.Rect({
            left: Math.min(shapeStart.x, pointer.x), top: Math.min(shapeStart.y, pointer.y),
            width: Math.abs(pointer.x - shapeStart.x), height: Math.abs(pointer.y - shapeStart.y),
            fill: 'rgba(230,57,70,0.1)', stroke: '#e63946', strokeWidth: 2,
            selectable: false, evented: false
          });
        }
        tempShapes = [shape];
        fabricCanvas.add(shape);
      }
    });

    fabricCanvas.on('mouse:up', async function (opt) {
      if (!isDrawingShape || !shapeStart) {
        isDrawingShape = false;
        shapeStart = null;
        tempShapes = [];
        return;
      }
      var pointer = fabricCanvas.getPointer(opt.e);
      var dx = Math.abs(pointer.x - shapeStart.x);
      var dy = Math.abs(pointer.y - shapeStart.y);

      isDrawingShape = false;
      var savedStart = { x: shapeStart.x, y: shapeStart.y };
      shapeStart = null;
      tempShapes = [];

      // Only record if the shape has some size (not just a click)
      if (dx > 5 || dy > 5) {
        // For arrows, the target is where the arrowhead points (to).
        // For shapes, use the center of the bounding box.
        var cx, cy;
        if (currentTool === 'arrow') {
          cx = pointer.x;
          cy = pointer.y;
        } else {
          cx = (savedStart.x + pointer.x) / 2;
          cy = (savedStart.y + pointer.y) / 2;
        }
        var nearElement = getElementUnderPoint(cx, cy);
        var nearSelector = nearElement ? getCssSelector(nearElement) : null;

        // Prompt for comment — place input near the shape end
        var screenX = opt.e.clientX;
        var screenY = opt.e.clientY;
        var comment = await showCommentInput(screenX, screenY);

        if (comment) {
          // Place text label on canvas near the shape
          var labelX = currentTool === 'arrow' ? pointer.x + 8 : Math.max(savedStart.x, pointer.x) + 8;
          var labelY = currentTool === 'arrow' ? pointer.y - 10 : Math.min(savedStart.y, pointer.y);
          var label = new fabric.Text(comment, {
            left: labelX, top: labelY,
            fontSize: 13, fill: '#e63946', fontFamily: 'system-ui, sans-serif',
            backgroundColor: 'rgba(255,255,255,0.9)', padding: 4,
            selectable: false, evented: false
          });
          fabricCanvas.add(label);
          fabricCanvas.renderAll();
        }

        annotations.push({
          type: currentTool === 'arrow' ? 'arrow' : (shapeMode === 'circle' ? 'circle' : 'box'),
          comment: comment || null,
          from: { x: Math.round(savedStart.x), y: Math.round(savedStart.y) },
          to: { x: Math.round(pointer.x), y: Math.round(pointer.y) },
          nearSelector: nearSelector,
          nearTagName: nearElement ? nearElement.tagName : null,
          nearClasses: nearElement ? (nearElement.className || '') : null
        });
        updateCounter();
      }
    });

    // Track freehand paths — prompt for comment like other drawing tools
    fabricCanvas.on('path:created', async function (opt) {
      var path = opt.path;
      var bounds = path.getBoundingRect();
      var cx = bounds.left + bounds.width / 2;
      var cy = bounds.top + bounds.height / 2;

      var nearElement = getElementUnderPoint(cx, cy);
      var nearSelector = nearElement ? getCssSelector(nearElement) : null;

      var screenX = bounds.left + bounds.width;
      var screenY = bounds.top;
      var comment = await showCommentInput(screenX, screenY);

      if (comment) {
        var label = new fabric.Text(comment, {
          left: bounds.left + bounds.width + 8, top: bounds.top,
          fontSize: 13, fill: '#e63946', fontFamily: 'system-ui, sans-serif',
          backgroundColor: 'rgba(255,255,255,0.9)', padding: 4,
          selectable: false, evented: false
        });
        fabricCanvas.add(label);
        fabricCanvas.renderAll();
      }

      annotations.push({
        type: 'freehand',
        comment: comment || null,
        nearSelector: nearSelector,
        nearTagName: nearElement ? nearElement.tagName : null,
        nearClasses: nearElement ? (nearElement.className || '') : null
      });
      updateCounter();
    });
  }

  // --- Handle text placement ---
  async function handleTextPlace(e) {
    if (isSelectBusy) return;
    isSelectBusy = true;

    var x = e.clientX;
    var y = e.clientY;
    var pointer = fabricCanvas.getPointer(e);

    var comment = await showCommentInput(x, y);
    if (!comment) {
      isSelectBusy = false;
      return;
    }

    var nearElement = getElementUnderPoint(x, y);
    var nearSelector = nearElement ? getCssSelector(nearElement) : null;

    var label = new fabric.Text(comment, {
      left: pointer.x, top: pointer.y,
      fontSize: 15, fill: '#e63946', fontFamily: 'system-ui, sans-serif',
      fontWeight: 'bold',
      backgroundColor: 'rgba(255,255,255,0.85)', padding: 4,
      selectable: false, evented: false
    });
    fabricCanvas.add(label);
    fabricCanvas.renderAll();

    annotations.push({
      type: 'text',
      comment: comment,
      position: { x: Math.round(pointer.x), y: Math.round(pointer.y) },
      nearSelector: nearSelector,
      nearTagName: nearElement ? nearElement.tagName : null,
      nearClasses: nearElement ? (nearElement.className || '') : null
    });
    updateCounter();
    isSelectBusy = false;
  }

  // --- Find element underneath the Fabric canvas ---
  function getElementUnderPoint(x, y) {
    // Hide ALL redline layers so elementFromPoint sees through to the app
    var canvasWrapper = fabricCanvas.wrapperEl;
    var prevWrapper = canvasWrapper.style.pointerEvents;
    var prevToolbar = toolbarEl ? toolbarEl.style.pointerEvents : null;
    canvasWrapper.style.pointerEvents = 'none';
    if (toolbarEl) toolbarEl.style.pointerEvents = 'none';

    var element = document.elementFromPoint(x, y);

    canvasWrapper.style.pointerEvents = prevWrapper;
    if (toolbarEl) toolbarEl.style.pointerEvents = prevToolbar;

    return element;
  }

  // --- Handle element selection ---
  async function handleElementClick(e) {
    if (currentTool !== 'select' || isSelectBusy) return;
    isSelectBusy = true;

    var x = e.clientX;
    var y = e.clientY;

    var element = getElementUnderPoint(x, y);

    if (!element || element === document.body || element === document.documentElement) {
      isSelectBusy = false;
      return;
    }

    var highlight = highlightElement(element);
    fabricCanvas.renderAll();

    var comment = await showCommentInput(x, y);
    if (!comment) {
      // Cancelled — remove the highlight
      fabricCanvas.remove(highlight);
      fabricCanvas.renderAll();
      isSelectBusy = false;
      return;
    }

    // Add text label on canvas
    var rect = element.getBoundingClientRect();
    var label = new fabric.Text(comment, {
      left: rect.right + 6, top: rect.top,
      fontSize: 13, fill: '#e63946', fontFamily: 'system-ui, sans-serif',
      backgroundColor: 'rgba(255,255,255,0.9)', padding: 4,
      selectable: false, evented: false
    });
    fabricCanvas.add(label);
    fabricCanvas.renderAll();

    annotations.push({
      type: 'select',
      selector: getCssSelector(element),
      comment: comment,
      tagName: element.tagName,
      classes: element.className || '',
      text: (element.textContent || '').trim().substring(0, 80),
      position: { x: Math.round(rect.left + rect.width / 2), y: Math.round(rect.top + rect.height / 2) }
    });
    annotationObjects.push({ highlight: highlight, label: label });
    updateCounter();
    isSelectBusy = false;
  }

  // --- Undo last annotation ---
  function undoLastAnnotation() {
    if (annotations.length === 0) return;
    annotations.pop();
    var objs = annotationObjects.pop();
    if (objs) {
      fabricCanvas.remove(objs.highlight);
      fabricCanvas.remove(objs.label);
      fabricCanvas.renderAll();
    }
    updateCounter();
    showToast('Undid last annotation');
  }

  // --- Activate ---
  async function activate() {
    var name = await showNameDialog();
    if (!name) return;
    sessionName = name;

    await loadFabric();

    // Create overlay canvas
    overlayEl = document.createElement('canvas');
    overlayEl.id = '__redline_canvas';
    Object.assign(overlayEl.style, {
      position: 'fixed', inset: '0', zIndex: '2147483645',
      width: '100vw', height: '100vh', cursor: 'crosshair'
    });
    document.body.appendChild(overlayEl);

    fabricCanvas = new fabric.Canvas('__redline_canvas', {
      width: window.innerWidth,
      height: window.innerHeight,
      selection: false
    });

    // Ensure Fabric's wrapper has the right z-index and positioning
    var wrapperEl = fabricCanvas.wrapperEl;
    Object.assign(wrapperEl.style, {
      position: 'fixed', inset: '0', zIndex: '2147483645'
    });

    // Make canvas transparent
    fabricCanvas.backgroundColor = 'rgba(0,0,0,0.05)';
    fabricCanvas.renderAll();

    createToolbar();
    setupCanvasDrawing();

    // Handle window resize
    window.__redline_resize = function () {
      fabricCanvas.setDimensions({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', window.__redline_resize);

    active = true;
    annotations = [];
    annotationObjects = [];
    showToast('Redline active — click elements to annotate, then press ' + (IS_MAC ? 'Cmd' : 'Ctrl') + '+Shift+A when done');
  }

  // --- Save annotations ---
  async function saveAnnotations() {
    var screenshot = getCanvasScreenshot();
    var data = {
      view: window.location.pathname,
      url: window.location.href,
      timestamp: new Date().toISOString(),
      annotations: annotations,
      screenshot: screenshot
    };

    var json = JSON.stringify(data, null, 2);
    var filename = sessionName + '.json';

    // Both Tauri and browser: download to ~/Downloads and copy filename
    var blob = new Blob([json], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);

    navigator.clipboard.writeText(filename).catch(function () {});
    showToast(filename + ' copied to clipboard — run /redline ' + filename, 6000);
  }

  // --- Export canvas as screenshot data URL ---
  function getCanvasScreenshot() {
    if (!fabricCanvas) return null;
    try {
      return fabricCanvas.toDataURL({ format: 'png' });
    } catch (e) {
      return null;
    }
  }

  // --- Deactivate ---
  async function deactivate() {
    if (annotations.length === 0) {
      showToast('No annotations — session discarded');
    } else {
      await saveAnnotations();
    }

    // Cleanup
    if (fabricCanvas) {
      var wrapperToRemove = fabricCanvas.wrapperEl;
      fabricCanvas.dispose();
      if (wrapperToRemove && wrapperToRemove.parentNode) wrapperToRemove.remove();
      fabricCanvas = null;
    }
    if (overlayEl && overlayEl.parentNode) { overlayEl.remove(); }
    overlayEl = null;

    if (toolbarEl) { toolbarEl.remove(); toolbarEl = null; }
    if (window.__redline_resize) {
      window.removeEventListener('resize', window.__redline_resize);
      delete window.__redline_resize;
    }
    active = false;
    currentTool = 'select';
  }

  // --- Hotkey listener ---
  document.addEventListener('keydown', function (e) {
    var mod = IS_MAC ? e.metaKey : e.ctrlKey;
    if (mod && e.shiftKey && (e.key === 'a' || e.key === 'A')) {
      e.preventDefault();
      if (active) {
        deactivate();
      } else {
        activate();
      }
    }
    // Cmd/Ctrl+Z to undo last annotation
    if (active && mod && !e.shiftKey && (e.key === 'z' || e.key === 'Z')) {
      e.preventDefault();
      undoLastAnnotation();
    }
  });

  console.log('[Redline] Annotation overlay loaded. Press ' + (IS_MAC ? 'Cmd' : 'Ctrl') + '+Shift+A to start annotating.');
})();
