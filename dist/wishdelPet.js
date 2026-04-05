const BUTTON_ID = "wishdel-pet-toggle";
const MODE_BUTTON_ID = "wishdel-pet-mode";
const STORAGE_KEY = "wishdel-web-pet-position-v1";
const VISIBILITY_KEY = "wishdel-web-pet-visible-v1";
const PET_SIZE = 252;
const VIEWPORT_MARGIN = 16;
const ROAM_SPEED = 220;
const CHASE_SPEED = 320;
const CHASE_TRIGGER_DISTANCE = 18;
function resolveAssetBase() {
    const customBase = window.__wishdelPetAssetBase?.trim();
    if (customBase) {
        return new URL(customBase.endsWith("/") ? customBase : `${customBase}/`, document.baseURI);
    }
    return new URL("../assets/", import.meta.url);
}
const ASSET_BASE = resolveAssetBase();
const animations = {
    idle: {
        file: "维什戴尔-绝对主角-正面-Idle-x1 (2).webm",
        loop: true,
        lines: ["待命中。", "我在这边看着。", "页面监看中。"],
    },
    interact: {
        file: "维什戴尔-绝对主角-基建-Interact-x1.webm",
        loop: false,
        followUp: "idle",
        lines: ["收到。", "已经注意到你了。", "还有别的安排吗？"],
    },
    relax: {
        file: "维什戴尔-绝对主角-基建-Relax-x1.webm",
        loop: false,
        followUp: "sit",
        lines: ["先放松一下。", "这会儿适合摸鱼。", "短暂休整中。"],
    },
    sit: {
        file: "维什戴尔-绝对主角-基建-Sit-x1.webm",
        loop: true,
        lines: ["坐下驻场。", "这个位置不错。", "继续看着页面。"],
    },
    sleep: {
        file: "维什戴尔-绝对主角-基建-Sleep-x1.webm",
        loop: true,
        lines: ["省电模式。", "先睡一小会儿。", "有事再叫醒我。"],
    },
    special: {
        file: "维什戴尔-绝对主角-基建-Special-x1.webm",
        loop: false,
        followUp: "idle",
        lines: ["特别演出开始。", "主角时间。", "认真看，这段很值。"],
    },
    attackA: {
        file: "维什戴尔-绝对主角-正面-Attack_A-x1 (2).webm",
        loop: false,
        followUp: "idle",
        lines: ["解决。", "动作很利落。", "处理完成。"],
    },
    attackB: {
        file: "维什戴尔-绝对主角-正面-Attack_B-x1 (2).webm",
        loop: false,
        followUp: "idle",
        lines: ["命中。", "这一击很干脆。", "节奏不错。"],
    },
    attackC: {
        file: "维什戴尔-绝对主角-正面-Attack_C-x1.webm",
        loop: false,
        followUp: "idle",
        lines: ["收尾完成。", "继续待命。", "保持状态。"],
    },
    start: {
        file: "维什戴尔-绝对主角-正面-Start-x1 (1).webm",
        loop: false,
        followUp: "idle",
        lines: ["桌宠已召唤。", "已部署到页面。", "巡逻模式启动。"],
    },
    skillLoop: {
        file: "维什戴尔-绝对主角-正面-Skill_Down_3_Loop-x1.webm",
        loop: false,
        followUp: "idle",
        lines: ["火力展示中。", "输出完成。", "压制结束。"],
    },
    move: {
        file: "维什戴尔-绝对主角-基建-Move-x1 (1).webm",
        loop: true,
        lines: ["页面巡逻中。", "换个位置看看。", "稍微活动一下。"],
    },
};
function pickRandom(items) {
    return items[Math.floor(Math.random() * items.length)];
}
function parseStoredPoint(key) {
    try {
        const raw = window.localStorage.getItem(key);
        if (!raw) {
            return null;
        }
        const parsed = JSON.parse(raw);
        if (typeof parsed.x !== "number" || typeof parsed.y !== "number") {
            return null;
        }
        return { x: parsed.x, y: parsed.y };
    }
    catch {
        return null;
    }
}
function setStoredValue(key, value) {
    try {
        window.localStorage.setItem(key, JSON.stringify(value));
    }
    catch {
        // Ignore persistence failures.
    }
}
function loadVisibility() {
    try {
        return window.localStorage.getItem(VISIBILITY_KEY) === "true";
    }
    catch {
        return false;
    }
}
function saveVisibility(visible) {
    try {
        if (visible) {
            window.localStorage.setItem(VISIBILITY_KEY, "true");
        }
        else {
            window.localStorage.removeItem(VISIBILITY_KEY);
        }
    }
    catch {
        // Ignore persistence failures.
    }
}
function createPetController() {
    const host = document.createElement("div");
    host.id = "wishdel-web-pet-root";
    const shadow = host.attachShadow({ mode: "open" });
    shadow.innerHTML = `
    <style>
      :host {
        all: initial;
      }

      *, *::before, *::after {
        box-sizing: border-box;
      }

      .overlay {
        position: fixed;
        inset: 0;
        z-index: 45;
        pointer-events: none;
      }

      .pet-shell {
        position: absolute;
        left: 0;
        top: 0;
        width: ${PET_SIZE}px;
        height: ${PET_SIZE}px;
        transform: translate3d(0, 0, 0);
        pointer-events: auto;
        user-select: none;
        -webkit-user-select: none;
      }

      .pet-shell[data-facing="left"] .pet-video {
        transform: scaleX(-1);
      }

      .pet-shell[data-dragging="true"] .pet-video {
        transform: translateY(-4px) scale(1.02);
      }

      .pet-shell[data-dragging="true"][data-facing="left"] .pet-video {
        transform: translateY(-4px) scaleX(-1) scale(1.02);
      }

      .pet-shell[data-moving="true"] .pet-stage {
        animation: wishdel-pet-float 0.72s ease-in-out infinite alternate;
      }

      .pet-stage {
        position: absolute;
        inset: 0;
        border: 0;
        padding: 0;
        background: transparent;
        cursor: grab;
        touch-action: none;
      }

      .pet-stage:active {
        cursor: grabbing;
      }

      .pet-glow {
        position: absolute;
        left: 50%;
        bottom: 24px;
        width: 52%;
        height: 12%;
        transform: translateX(-50%);
        border-radius: 999px;
        background:
          radial-gradient(
            circle,
            rgb(0 0 0 / 0.46),
            rgb(0 0 0 / 0.22) 48%,
            transparent 72%
          );
        filter: blur(10px);
        pointer-events: none;
      }

      .pet-video {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        object-fit: contain;
        transform-origin: 50% 72%;
        filter: drop-shadow(0 16px 32px rgb(0 0 0 / 0.34));
        transition: transform 180ms ease;
      }

      .pet-bubble {
        position: absolute;
        left: 52%;
        top: 18px;
        transform: translateX(-30%);
        min-height: 18px;
        max-width: 172px;
        padding: 7px 11px;
        border-radius: 14px 14px 14px 8px;
        border: 1px solid color-mix(in srgb, var(--accent, rgb(244 63 94)) 20%, transparent);
        background: rgb(10 16 29 / 0.86);
        background: color-mix(in srgb, var(--background, rgb(15 23 42)) 78%, rgb(10 16 29 / 0.86));
        color: var(--foreground, rgb(241 245 249));
        font-family: var(--font-google-sans-code, "Segoe UI"), "Microsoft YaHei UI", sans-serif;
        font-size: 12px;
        line-height: 1.4;
        box-shadow: 0 14px 30px rgb(0 0 0 / 0.18);
        backdrop-filter: blur(14px);
        pointer-events: none;
      }

      @keyframes wishdel-pet-float {
        from {
          transform: translateY(0);
        }

        to {
          transform: translateY(-3px);
        }
      }

      @media (max-width: 720px) {
        .pet-shell {
          width: min(${PET_SIZE}px, 68vw);
          height: min(${PET_SIZE}px, 68vw);
        }

        .pet-bubble {
          max-width: 148px;
          font-size: 11px;
        }
      }
    </style>
    <div class="overlay">
      <div class="pet-shell" data-facing="right" data-dragging="false" data-moving="false">
        <div class="pet-bubble" role="status" aria-live="polite">等待召唤。</div>
        <button class="pet-stage" type="button" aria-label="维什戴尔桌宠">
          <div class="pet-glow"></div>
          <video class="pet-video" autoplay muted playsinline preload="auto"></video>
        </button>
      </div>
    </div>
  `;
    const petShell = shadow.querySelector(".pet-shell");
    const petStage = shadow.querySelector(".pet-stage");
    const petVideo = shadow.querySelector(".pet-video");
    const petBubble = shadow.querySelector(".pet-bubble");
    if (!petShell || !petStage || !petVideo || !petBubble) {
        throw new Error("Failed to initialize web pet.");
    }
    const petShellNode = petShell;
    const petStageNode = petStage;
    const petVideoNode = petVideo;
    const petBubbleNode = petBubble;
    const randomActionPool = [
        "interact",
        "relax",
        "attackA",
        "attackB",
        "attackC",
        "skillLoop",
    ];
    const chaseLines = ["朝你那边去。", "追上你。", "马上到。"];
    const state = {
        current: "idle",
        busy: false,
        dragging: false,
        roaming: false,
        visible: false,
        mode: "roam",
        pointerId: null,
        pointerDown: null,
        clickTimer: null,
        idleTimer: null,
        messageTimer: null,
        suppressClickUntil: 0,
        lastFrameAt: 0,
        facing: "right",
        renderX: 0,
        renderY: 0,
        targetX: 0,
        targetY: 0,
        rafId: null,
        booted: false,
        introPlayed: false,
        lastCursor: null,
    };
    function clearTimer(timer) {
        if (timer !== null) {
            window.clearTimeout(timer);
        }
        return null;
    }
    function clearScheduledWork() {
        state.clickTimer = clearTimer(state.clickTimer);
        state.idleTimer = clearTimer(state.idleTimer);
        state.messageTimer = clearTimer(state.messageTimer);
    }
    function getBounds() {
        const width = petShellNode.offsetWidth || PET_SIZE;
        const height = petShellNode.offsetHeight || PET_SIZE;
        return {
            minX: VIEWPORT_MARGIN,
            minY: VIEWPORT_MARGIN,
            maxX: Math.max(VIEWPORT_MARGIN, window.innerWidth - width - VIEWPORT_MARGIN),
            maxY: Math.max(VIEWPORT_MARGIN, window.innerHeight - height - VIEWPORT_MARGIN),
        };
    }
    function clampPosition(x, y) {
        const bounds = getBounds();
        return {
            x: Math.min(Math.max(bounds.minX, x), bounds.maxX),
            y: Math.min(Math.max(bounds.minY, y), bounds.maxY),
        };
    }
    function renderPetPosition() {
        petShellNode.style.transform = `translate3d(${state.renderX}px, ${state.renderY}px, 0)`;
    }
    function updateAnimationState() {
        petShellNode.dataset.dragging = String(state.dragging);
        petShellNode.dataset.moving = String(state.roaming);
        petShellNode.dataset.facing = state.facing;
    }
    function setFacing(direction) {
        state.facing = direction;
        updateAnimationState();
    }
    function setBubble(text, sticky = false) {
        petBubbleNode.textContent = text;
        state.messageTimer = clearTimer(state.messageTimer);
        if (!sticky) {
            state.messageTimer = window.setTimeout(() => {
                if (!state.dragging && !state.busy && !state.roaming && state.visible) {
                    petBubbleNode.textContent = pickRandom(animations[state.current].lines);
                }
            }, 3200);
        }
    }
    function getAnimationSource(file) {
        return new URL(file, ASSET_BASE).toString();
    }
    function savePosition() {
        setStoredValue(STORAGE_KEY, {
            x: Math.round(state.targetX),
            y: Math.round(state.targetY),
        });
    }
    function queueIdleBehavior() {
        state.idleTimer = clearTimer(state.idleTimer);
        if (state.mode !== "roam") {
            return;
        }
        state.idleTimer = window.setTimeout(() => {
            if (!state.visible ||
                state.mode !== "roam" ||
                state.dragging ||
                state.busy ||
                state.roaming) {
                queueIdleBehavior();
                return;
            }
            if (Math.random() > 0.22) {
                startRoaming();
                return;
            }
            playOneShot(pickRandom(randomActionPool));
        }, 2600 + Math.random() * 2600);
    }
    function getPetTargetFromCursor(clientX, clientY) {
        const width = petShellNode.offsetWidth || PET_SIZE;
        const height = petShellNode.offsetHeight || PET_SIZE;
        return clampPosition(clientX - width * 0.5, clientY - height * 0.72);
    }
    function faceCursor(clientX) {
        const width = petShellNode.offsetWidth || PET_SIZE;
        const petCenterX = state.renderX + width * 0.5;
        const horizontalOffset = clientX - petCenterX;
        if (Math.abs(horizontalOffset) <= 6) {
            return;
        }
        setFacing(horizontalOffset > 0 ? "right" : "left");
    }
    function beginMovement(nextX, nextY, line) {
        const movingDirection = nextX >= state.renderX ? "right" : "left";
        const shouldRestartMove = !state.roaming || state.current !== "move";
        setFacing(movingDirection);
        setTargetPosition(nextX, nextY);
        state.roaming = true;
        updateAnimationState();
        if (shouldRestartMove) {
            playAnimation("move", {
                loop: true,
                line,
                skipQueue: true,
            });
        }
    }
    function followCursor(clientX, clientY) {
        state.lastCursor = { x: clientX, y: clientY };
        if (!state.visible || state.mode !== "chase" || state.dragging) {
            return;
        }
        faceCursor(clientX);
        const target = getPetTargetFromCursor(clientX, clientY);
        const distance = Math.hypot(target.x - state.renderX, target.y - state.renderY);
        if (distance <= CHASE_TRIGGER_DISTANCE) {
            if (state.roaming) {
                state.targetX = target.x;
                state.targetY = target.y;
            }
            return;
        }
        beginMovement(target.x, target.y, pickRandom(chaseLines));
    }
    function playAnimation(name, options = {}) {
        if (!state.visible) {
            return;
        }
        const animation = animations[name];
        const loop = options.loop ?? animation.loop;
        state.current = name;
        state.busy = !loop;
        if (name !== "move") {
            state.roaming = false;
        }
        updateAnimationState();
        petVideoNode.loop = loop;
        petVideoNode.src = getAnimationSource(animation.file);
        petVideoNode.currentTime = 0;
        petVideoNode.load();
        void petVideoNode.play().catch(() => { });
        setBubble(options.line ?? pickRandom(animation.lines), options.stickyMessage);
        if (loop) {
            state.busy = false;
            if (!options.skipQueue &&
                !state.dragging &&
                name !== "move" &&
                state.mode === "roam") {
                queueIdleBehavior();
            }
        }
    }
    function playOneShot(name) {
        if (state.dragging || !state.visible) {
            return;
        }
        state.idleTimer = clearTimer(state.idleTimer);
        playAnimation(name);
    }
    function finishCurrentAnimation() {
        if (!state.visible) {
            return;
        }
        const currentAnimation = animations[state.current];
        const followUp = "followUp" in currentAnimation ? currentAnimation.followUp : "idle";
        state.busy = false;
        playAnimation(followUp, { loop: animations[followUp].loop });
    }
    function setTargetPosition(x, y) {
        const next = clampPosition(x, y);
        state.targetX = next.x;
        state.targetY = next.y;
    }
    function keepInViewport() {
        if (!state.visible) {
            return;
        }
        const next = clampPosition(state.targetX, state.targetY);
        state.targetX = next.x;
        state.targetY = next.y;
        if (state.dragging || !state.roaming) {
            state.renderX = next.x;
            state.renderY = next.y;
            renderPetPosition();
            savePosition();
        }
    }
    function startRoaming() {
        if (!state.visible || state.dragging || state.mode !== "roam") {
            return;
        }
        const shift = 72 + Math.random() * 144;
        const direction = Math.random() > 0.5 ? 1 : -1;
        const nextX = state.renderX + shift * direction;
        const nextY = state.renderY + (Math.random() - 0.5) * 40;
        beginMovement(nextX, nextY, pickRandom(animations.move.lines));
    }
    function beginDrag(clientX, clientY) {
        state.dragging = true;
        state.roaming = false;
        state.busy = false;
        updateAnimationState();
        playAnimation("idle", {
            loop: true,
            line: "拖动中，帮我换个驻点。",
            skipQueue: true,
            stickyMessage: true,
        });
        if (state.pointerDown) {
            state.pointerDown = {
                ...state.pointerDown,
                x: clientX - state.renderX,
                y: clientY - state.renderY,
            };
        }
    }
    function updateDragPosition(clientX, clientY) {
        if (!state.pointerDown) {
            return;
        }
        const next = clampPosition(clientX - state.pointerDown.x, clientY - state.pointerDown.y);
        state.renderX = next.x;
        state.renderY = next.y;
        state.targetX = next.x;
        state.targetY = next.y;
        renderPetPosition();
    }
    function onPointerDown(event) {
        if (event.button !== 0 || !state.visible) {
            return;
        }
        event.preventDefault();
        state.pointerId = event.pointerId;
        state.pointerDown = {
            startX: event.clientX,
            startY: event.clientY,
            x: event.clientX - state.renderX,
            y: event.clientY - state.renderY,
        };
        state.idleTimer = clearTimer(state.idleTimer);
        state.clickTimer = clearTimer(state.clickTimer);
        petStageNode.setPointerCapture?.(event.pointerId);
    }
    function onPointerMove(event) {
        if (event.pointerId !== state.pointerId || !state.pointerDown) {
            return;
        }
        const deltaX = Math.abs(event.clientX - state.pointerDown.startX);
        const deltaY = Math.abs(event.clientY - state.pointerDown.startY);
        if (!state.dragging && (deltaX > 4 || deltaY > 4)) {
            beginDrag(event.clientX, event.clientY);
        }
        if (state.dragging) {
            updateDragPosition(event.clientX, event.clientY);
        }
    }
    function onPointerUp(event) {
        if (event.pointerId !== state.pointerId) {
            return;
        }
        petStageNode.releasePointerCapture?.(event.pointerId);
        if (state.dragging) {
            state.dragging = false;
            state.suppressClickUntil = Date.now() + 260;
            updateAnimationState();
            savePosition();
            playAnimation("idle", { loop: true, line: "新位置确认。" });
        }
        state.pointerId = null;
        state.pointerDown = null;
    }
    function onClick() {
        if (state.dragging || state.busy || Date.now() < state.suppressClickUntil) {
            return;
        }
        state.clickTimer = clearTimer(state.clickTimer);
        state.clickTimer = window.setTimeout(() => {
            const quickAction = Math.random() > 0.55
                ? "interact"
                : pickRandom(["relax", "attackA", "attackB", "attackC"]);
            playOneShot(quickAction);
        }, 220);
    }
    function onDoubleClick() {
        if (state.dragging || Date.now() < state.suppressClickUntil) {
            return;
        }
        state.clickTimer = clearTimer(state.clickTimer);
        playOneShot("special");
    }
    function onWindowPointerMove(event) {
        if (event.pointerType && event.pointerType === "touch") {
            return;
        }
        followCursor(event.clientX, event.clientY);
    }
    function syncButtons() {
        const button = document.getElementById(BUTTON_ID);
        const modeButton = document.getElementById(MODE_BUTTON_ID);
        if (button) {
            button.setAttribute("aria-pressed", String(state.visible));
            button.title = state.visible ? "收起桌宠" : "召唤桌宠";
            const label = button.querySelector("[data-pet-label]");
            if (label) {
                label.textContent = state.visible ? "收起桌宠" : "召唤桌宠";
            }
        }
        if (!modeButton) {
            return;
        }
        modeButton.style.display = state.visible ? "inline-flex" : "none";
        modeButton.setAttribute("aria-pressed", String(state.mode === "chase"));
        modeButton.title = state.mode === "chase" ? "恢复自由巡逻" : "启用追鼠模式";
        const modeLabel = modeButton.querySelector("[data-pet-mode-label]");
        if (modeLabel) {
            modeLabel.textContent =
                state.mode === "chase" ? "正在追鼠" : "追鼠模式";
        }
    }
    function setMode(mode) {
        if (state.mode === mode) {
            syncButtons();
            return;
        }
        state.mode = mode;
        state.idleTimer = clearTimer(state.idleTimer);
        if (!state.visible) {
            syncButtons();
            return;
        }
        if (mode === "chase") {
            state.roaming = false;
            updateAnimationState();
            playAnimation("idle", {
                loop: true,
                line: "进入追鼠模式。",
                skipQueue: true,
            });
            if (state.lastCursor) {
                followCursor(state.lastCursor.x, state.lastCursor.y);
            }
        }
        else {
            state.roaming = false;
            updateAnimationState();
            playAnimation("idle", {
                loop: true,
                line: "恢复自由巡逻。",
            });
        }
        syncButtons();
    }
    function toggleMode() {
        setMode(state.mode === "chase" ? "roam" : "chase");
    }
    function tick(timestamp) {
        if (!state.visible) {
            state.rafId = null;
            state.lastFrameAt = 0;
            return;
        }
        if (!state.lastFrameAt) {
            state.lastFrameAt = timestamp;
        }
        const deltaSeconds = Math.min(0.05, (timestamp - state.lastFrameAt) / 1000 || 0.016);
        state.lastFrameAt = timestamp;
        if (state.roaming && !state.dragging) {
            const dx = state.targetX - state.renderX;
            const dy = state.targetY - state.renderY;
            const distance = Math.hypot(dx, dy);
            const movementSpeed = state.mode === "chase" ? CHASE_SPEED : ROAM_SPEED;
            if (distance <= 1.5) {
                state.renderX = state.targetX;
                state.renderY = state.targetY;
                state.roaming = false;
                updateAnimationState();
                savePosition();
                renderPetPosition();
                if (state.mode === "chase") {
                    playAnimation("idle", {
                        loop: true,
                        line: pickRandom(["追上你了。", "就在这边。", "继续盯着你。"]),
                        skipQueue: true,
                    });
                }
                else {
                    playAnimation("idle", {
                        loop: true,
                        line: pickRandom(["巡逻结束。", "新位置已确认。", "继续待命。"]),
                    });
                }
            }
            else {
                const step = Math.min(distance, movementSpeed * deltaSeconds);
                state.renderX += (dx / distance) * step;
                state.renderY += (dy / distance) * step;
                renderPetPosition();
            }
        }
        state.rafId = window.requestAnimationFrame(tick);
    }
    function startTick() {
        if (state.rafId !== null) {
            return;
        }
        state.rafId = window.requestAnimationFrame(tick);
    }
    function ensureMounted() {
        if (!state.visible) {
            return;
        }
        if (!host.isConnected) {
            document.documentElement.append(host);
        }
    }
    function boot() {
        if (state.booted) {
            return;
        }
        petStageNode.addEventListener("pointerdown", onPointerDown);
        petStageNode.addEventListener("pointermove", onPointerMove);
        petStageNode.addEventListener("pointerup", onPointerUp);
        petStageNode.addEventListener("pointercancel", onPointerUp);
        petStageNode.addEventListener("click", onClick);
        petStageNode.addEventListener("dblclick", onDoubleClick);
        petStageNode.addEventListener("contextmenu", event => event.preventDefault());
        petVideoNode.addEventListener("ended", finishCurrentAnimation);
        petVideoNode.addEventListener("error", () => {
            setBubble("桌宠素材加载失败。", true);
        });
        window.addEventListener("resize", keepInViewport);
        window.addEventListener("pointermove", onWindowPointerMove, { passive: true });
        window.addEventListener("pageshow", ensureMounted);
        document.addEventListener("astro:after-swap", ensureMounted);
        document.addEventListener("astro:page-load", ensureMounted);
        const saved = parseStoredPoint(STORAGE_KEY);
        const height = petShellNode.offsetHeight || PET_SIZE;
        const defaultPosition = clampPosition(VIEWPORT_MARGIN + 12, window.innerHeight - height - 96);
        const initial = clampPosition(saved?.x ?? defaultPosition.x, saved?.y ?? defaultPosition.y);
        state.renderX = initial.x;
        state.renderY = initial.y;
        state.targetX = initial.x;
        state.targetY = initial.y;
        renderPetPosition();
        setFacing("right");
        updateAnimationState();
        state.booted = true;
    }
    function show() {
        boot();
        if (state.visible) {
            ensureMounted();
            syncButtons();
            return;
        }
        state.visible = true;
        saveVisibility(true);
        ensureMounted();
        syncButtons();
        playAnimation("start", {
            line: state.introPlayed ? "我回来了。" : undefined,
        });
        state.introPlayed = true;
        startTick();
    }
    function hide() {
        if (!state.visible) {
            syncButtons();
            return;
        }
        state.visible = false;
        state.dragging = false;
        state.roaming = false;
        state.busy = false;
        state.pointerId = null;
        state.pointerDown = null;
        state.mode = "roam";
        updateAnimationState();
        saveVisibility(false);
        savePosition();
        clearScheduledWork();
        if (state.rafId !== null) {
            window.cancelAnimationFrame(state.rafId);
            state.rafId = null;
        }
        petVideoNode.pause();
        host.remove();
        syncButtons();
    }
    function toggle() {
        if (state.visible) {
            hide();
        }
        else {
            show();
        }
    }
    if (loadVisibility()) {
        show();
    }
    else {
        syncButtons();
    }
    return {
        ensureMounted,
        toggle,
        toggleMode,
        syncButtons,
        isVisible: () => state.visible,
        isChasing: () => state.mode === "chase",
    };
}
function initButton() {
    const button = document.getElementById(BUTTON_ID);
    const modeButton = document.getElementById(MODE_BUTTON_ID);
    if (button && button.dataset.petBound !== "true") {
        button.dataset.petBound = "true";
        button.addEventListener("click", () => {
            window.__wishdelPetController?.toggle();
        });
    }
    if (modeButton && modeButton.dataset.petBound !== "true") {
        modeButton.dataset.petBound = "true";
        modeButton.addEventListener("click", () => {
            window.__wishdelPetController?.toggleMode();
        });
    }
    window.__wishdelPetController?.syncButtons();
}
window.__wishdelPetController ??= createPetController();
document.addEventListener("astro:page-load", initButton);
initButton();
export {};
