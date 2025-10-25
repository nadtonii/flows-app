import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import PillNavigation from './PillNavigation.jsx';

const DEFAULT_CARD = {
  width: 580,
  height: 580,
};

const MIN_CARD_WIDTH = 120;
const MIN_CARD_HEIGHT = 80;
const MAX_CARD_HEIGHT = 580;
const HANDLE_SIZE = 18;
const HANDLE_RADIUS = HANDLE_SIZE / 2;
const HANDLE_MARGIN = 6;
const MIN_SCALE = 0.4;
const MAX_SCALE = 2.5;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function createCard({ x, y }) {
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    x,
    y,
    width: DEFAULT_CARD.width,
    height: DEFAULT_CARD.height,
    text: '',
    isPlaceholder: true,
  };
}

function getHandleCenter(card) {
  return {
    x: card.x + card.width - HANDLE_MARGIN - HANDLE_RADIUS,
    y: card.y + card.height - HANDLE_MARGIN - HANDLE_RADIUS,
  };
}

export default function InfiniteCanvas() {
  const canvasRef = useRef(null);
  const interactionRef = useRef({ type: 'idle' });

  const [cards, setCards] = useState([]);
  const [activeCardId, setActiveCardId] = useState(null);
  const [editingCardId, setEditingCardId] = useState(null);
  const [hoveredCardId, setHoveredCardId] = useState(null);
  const [spaceHeld, setSpaceHeld] = useState(false);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [interactionType, setInteractionType] = useState('idle');
  const [editingPadding, setEditingPadding] = useState(0);
  const [handleAnimationVersion, setHandleAnimationVersion] = useState(0);

  const cardsRef = useRef(cards);
  const panRef = useRef(pan);
  const scaleRef = useRef(scale);
  const textareaRef = useRef(null);
  const handleVisibilityRef = useRef(new Map());
  const handleAnimationRef = useRef(null);

  useEffect(() => {
    cardsRef.current = cards;
  }, [cards]);

  useEffect(() => {
    panRef.current = pan;
  }, [pan]);

  useEffect(() => {
    scaleRef.current = scale;
  }, [scale]);

  useEffect(() => {
    if (spaceHeld) {
      setHoveredCardId(null);
    }
  }, [spaceHeld]);

  const addCard = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const viewportCenter = {
      x: (rect.width / 2 - panRef.current.x) / scaleRef.current,
      y: (rect.height / 2 - panRef.current.y) / scaleRef.current,
    };

    const newCard = createCard({
      x: viewportCenter.x - DEFAULT_CARD.width / 2,
      y: viewportCenter.y - DEFAULT_CARD.height / 2,
    });

    setCards((prev) => [...prev, newCard]);
    setActiveCardId(newCard.id);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.code === 'Space' && editingCardId === null) {
        event.preventDefault();
        setSpaceHeld(true);
      }

      if (editingCardId !== null) return;

      if (event.key.toLowerCase() === 'c') {
        event.preventDefault();
        addCard();
      }

      if (event.key === 'Backspace' && activeCardId) {
        setCards((prev) => prev.filter((card) => card.id !== activeCardId));
        setActiveCardId(null);
        setEditingCardId((value) => (value === activeCardId ? null : value));
        setHoveredCardId((value) => (value === activeCardId ? null : value));
      }
    };

    const handleKeyUp = (event) => {
      if (event.code === 'Space') {
        event.preventDefault();
        setSpaceHeld(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [activeCardId, addCard, editingCardId]);

  const toWorldSpace = useCallback((event) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left - panRef.current.x) / scaleRef.current,
      y: (event.clientY - rect.top - panRef.current.y) / scaleRef.current,
    };
  }, []);

  const setInteraction = useCallback((interaction) => {
    interactionRef.current = interaction;
    setInteractionType(interaction.type);
  }, []);

  const findCardAtPoint = useCallback((pointer) => {
    const reversed = [...cardsRef.current].reverse();
    for (const card of reversed) {
      const withinCard =
        pointer.x >= card.x &&
        pointer.x <= card.x + card.width &&
        pointer.y >= card.y &&
        pointer.y <= card.y + card.height;

      if (withinCard) {
        return card;
      }
    }

    return null;
  }, []);

  const handlePointerDown = useCallback(
    (event) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      canvas.setPointerCapture?.(event.pointerId);

      if (spaceHeld && editingCardId === null) {
        setInteraction({
          type: 'pan',
          pointerId: event.pointerId,
          origin: { x: event.clientX, y: event.clientY },
          start: { ...panRef.current },
        });
        return;
      }

      const pointer = toWorldSpace(event);
      const card = findCardAtPoint(pointer);

      if (!card) {
        setActiveCardId(null);
        setHoveredCardId(null);
        setInteraction({ type: 'idle' });
        return;
      }

      setHoveredCardId(card.id);
      const handleCenter = getHandleCenter(card);
      const distanceToHandle = Math.hypot(
        pointer.x - handleCenter.x,
        pointer.y - handleCenter.y
      );

      setActiveCardId(card.id);
      setEditingCardId((value) => (value === card.id ? value : null));

      setCards((prev) => {
        const index = prev.findIndex((item) => item.id === card.id);
        if (index === -1 || index === prev.length - 1) {
          return prev;
        }
        const next = [...prev];
        const [picked] = next.splice(index, 1);
        next.push(picked);
        return next;
      });

      if (distanceToHandle <= HANDLE_SIZE / scaleRef.current) {
        setInteraction({
          type: 'resize',
          pointerId: event.pointerId,
          cardId: card.id,
          startPointer: pointer,
          startSize: { width: card.width, height: card.height },
        });
        return;
      }

      setInteraction({
        type: 'drag',
        pointerId: event.pointerId,
        cardId: card.id,
        offset: { x: pointer.x - card.x, y: pointer.y - card.y },
      });
    },
    [editingCardId, findCardAtPoint, setInteraction, spaceHeld, toWorldSpace]
  );

  const handlePointerMove = useCallback(
    (event) => {
      const interaction = interactionRef.current;

      const pointer = toWorldSpace(event);

      if (!spaceHeld) {
        const hoveredCard = findCardAtPoint(pointer);
        setHoveredCardId((prev) => {
          const nextId = hoveredCard ? hoveredCard.id : null;
          return prev === nextId ? prev : nextId;
        });
      }

      if (!interaction || interaction.type === 'idle') {
        return;
      }

      if (interaction.type === 'pan') {
        const deltaX = event.clientX - interaction.origin.x;
        const deltaY = event.clientY - interaction.origin.y;
        setPan({
          x: interaction.start.x + deltaX,
          y: interaction.start.y + deltaY,
        });
        return;
      }

      if (interaction.type === 'drag') {
        setCards((prev) =>
          prev.map((card) =>
            card.id === interaction.cardId
              ? {
                  ...card,
                  x: pointer.x - interaction.offset.x,
                  y: pointer.y - interaction.offset.y,
                }
              : card
          )
        );
        return;
      }

      if (interaction.type === 'resize') {
        setCards((prev) =>
          prev.map((card) =>
            card.id === interaction.cardId
              ? {
                  ...card,
                  width: clamp(
                    interaction.startSize.width + (pointer.x - interaction.startPointer.x),
                    MIN_CARD_WIDTH,
                    Number.POSITIVE_INFINITY
                  ),
                  height: clamp(
                    interaction.startSize.height + (pointer.y - interaction.startPointer.y),
                    MIN_CARD_HEIGHT,
                    MAX_CARD_HEIGHT
                  ),
                }
              : card
          )
        );
      }
    },
    [findCardAtPoint, spaceHeld, toWorldSpace]
  );

  const clearInteraction = useCallback(() => {
    setInteraction({ type: 'idle' });
  }, [setInteraction]);

  const handlePointerUp = useCallback(
    (event) => {
      if (event?.pointerId != null) {
        canvasRef.current?.releasePointerCapture?.(event.pointerId);
      }
      clearInteraction();
    },
    [clearInteraction]
  );

  const handlePointerLeave = useCallback(
    (event) => {
      handlePointerUp(event);
      setHoveredCardId(null);
    },
    [handlePointerUp]
  );

  const handleDoubleClick = useCallback(
    (event) => {
      const pointer = toWorldSpace(event);
      const card = findCardAtPoint(pointer);
      if (!card) return;

      setActiveCardId(card.id);
      setHoveredCardId(card.id);
      setEditingCardId(card.id);
    },
    [findCardAtPoint, toWorldSpace]
  );

  const handleWheel = useCallback(
    (event) => {
      event.preventDefault();
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const pointerX = (event.clientX - rect.left - panRef.current.x) / scaleRef.current;
      const pointerY = (event.clientY - rect.top - panRef.current.y) / scaleRef.current;

      const scaleIntensity = Math.exp(-event.deltaY / 400);
      const nextScale = clamp(scaleRef.current * scaleIntensity, MIN_SCALE, MAX_SCALE);
      const newPan = {
        x: event.clientX - rect.left - pointerX * nextScale,
        y: event.clientY - rect.top - pointerY * nextScale,
      };

      setPan(newPan);
      setScale(nextScale);
    },
    []
  );

  const editingCard = useMemo(
    () => cards.find((card) => card.id === editingCardId) ?? null,
    [cards, editingCardId]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      draw(rect);
    };

    const draw = (rect) => {
      ctx.save();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, rect.width, rect.height);

      ctx.fillStyle = '#f7f7f7';
      ctx.fillRect(0, 0, rect.width, rect.height);

      drawGrid(ctx, rect, { pan, scale });

      ctx.translate(pan.x, pan.y);
      ctx.scale(scale, scale);

      for (const card of cards) {
        drawCard(ctx, card, {
          isActive: card.id === activeCardId,
          isEditing: card.id === editingCardId,
          isHovered: card.id === hoveredCardId,
          handleAlpha: handleVisibilityRef.current.get(card.id),
        });
      }

      ctx.restore();
    };

    resize();

    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(resize);
      observer.observe(canvas);

      return () => {
        observer.disconnect();
      };
    }

    window.addEventListener('resize', resize);
    return () => {
      window.removeEventListener('resize', resize);
    };
  }, [
    cards,
    activeCardId,
    editingCardId,
    hoveredCardId,
    pan,
    scale,
    handleAnimationVersion,
  ]);

  const handleTextChange = useCallback(
    (event) => {
      const value = event.target.value;
      const approxLines = value.split('\n').length + Math.floor(value.length / 28);
      const desiredHeight = clamp(
        approxLines * 22 + 48,
        MIN_CARD_HEIGHT,
        MAX_CARD_HEIGHT
      );

      setCards((prev) =>
        prev.map((card) =>
          card.id === editingCardId
            ? {
                ...card,
                text: value,
                isPlaceholder: value.trim().length === 0,
                height: Math.max(card.height, desiredHeight),
              }
            : card
        )
      );
    },
    [editingCardId]
  );

  const textareaPosition = useMemo(() => {
    if (!editingCard) return null;
    return {
      top: editingCard.y * scale + pan.y + 16,
      left: editingCard.x * scale + pan.x + 16,
      width: editingCard.width * scale - 32,
      height: Math.max(48, editingCard.height * scale - 32),
    };
  }, [editingCard, pan, scale]);

  useLayoutEffect(() => {
    if (!editingCard || !textareaPosition) return;
    const textarea = textareaRef.current;
    if (!textarea) return;

    const available = textareaPosition.height;
    if (available <= 0) return;

    const previousHeight = textarea.style.height;
    textarea.style.height = 'auto';

    const computed = window.getComputedStyle(textarea);
    const paddingTop = parseFloat(computed.paddingTop) || 0;
    const paddingBottom = parseFloat(computed.paddingBottom) || 0;
    const contentHeight = textarea.scrollHeight - paddingTop - paddingBottom;
    const offset = Math.max(0, (available - contentHeight) / 2);

    setEditingPadding((prev) => (Math.abs(prev - offset) < 0.5 ? prev : offset));

    textarea.style.height = `${available}px`;

    return () => {
      textarea.style.height = previousHeight;
    };
  }, [
    editingCard?.text,
    scale,
    textareaPosition?.height,
    editingCard,
    textareaPosition,
    editingPadding,
  ]);

  useEffect(() => {
    const visibilityMap = handleVisibilityRef.current;

    for (const card of cards) {
      if (!visibilityMap.has(card.id)) {
        const shouldShow = card.id === activeCardId || card.id === hoveredCardId;
        visibilityMap.set(card.id, shouldShow ? 1 : 0);
      }
    }

    for (const key of [...visibilityMap.keys()]) {
      if (!cardsRef.current.some((card) => card.id === key)) {
        visibilityMap.delete(key);
      }
    }

    const animate = () => {
      const currentMap = handleVisibilityRef.current;
      let hasChanges = false;

      for (const card of cardsRef.current) {
        const target =
          card.id === activeCardId || card.id === hoveredCardId ? 1 : 0;
        const current = currentMap.get(card.id) ?? target;
        const next = current + (target - current) * 0.2;
        const finalValue = Math.abs(next - target) < 0.01 ? target : next;

        if (Math.abs(finalValue - current) > 0.001) {
          currentMap.set(card.id, finalValue);
          hasChanges = true;
        }
      }

      if (hasChanges) {
        setHandleAnimationVersion((value) => value + 1);
        handleAnimationRef.current = requestAnimationFrame(animate);
      } else {
        handleAnimationRef.current = null;
      }
    };

    if (!handleAnimationRef.current) {
      handleAnimationRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (handleAnimationRef.current) {
        cancelAnimationFrame(handleAnimationRef.current);
        handleAnimationRef.current = null;
      }
    };
  }, [activeCardId, hoveredCardId, cards]);

  const handleCanvasClick = useCallback(() => {
    if (hoveredCardId || interactionType === 'drag' || interactionType === 'resize') {
      return;
    }

    setActiveCardId(null);
  }, [hoveredCardId, interactionType]);

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
        onDoubleClick={handleDoubleClick}
        onWheel={handleWheel}
        onClick={handleCanvasClick}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          background: '#ffffff',
          cursor:
            spaceHeld && editingCardId === null
              ? 'grab'
              : interactionType === 'pan'
              ? 'grabbing'
              : 'default',
          touchAction: 'none',
        }}
      />

      {editingCard && textareaPosition && (
        <textarea
          key={editingCard.id}
          ref={textareaRef}
          autoFocus
          value={editingCard.text}
          placeholder="Card"
          onChange={handleTextChange}
          onBlur={() => setEditingCardId(null)}
          aria-label="Edit card"
          style={{
            position: 'absolute',
            top: textareaPosition.top,
            left: textareaPosition.left,
            width: textareaPosition.width,
            height: textareaPosition.height,
            fontSize: 16,
            fontWeight: 600,
            fontFamily: 'Inter, sans-serif',
            textAlign: 'center',
            border: 'none',
            background: 'transparent',
            color: editingCard.text ? '#111' : '#999',
            resize: 'none',
            overflowWrap: 'break-word',
            wordBreak: 'break-word',
            whiteSpace: 'pre-wrap',
            lineHeight: '22px',
            outline: 'none',
            paddingTop: editingPadding,
            paddingBottom: editingPadding,
            paddingLeft: 0,
            paddingRight: 0,
            overflow: 'hidden',
            zIndex: 10,
          }}
        />
      )}

      <PillNavigation onAddCard={addCard} />
    </div>
  );
}

function drawGrid(ctx, rect, { pan, scale }) {
  const gridSpacing = 80;
  const scaledSpacing = gridSpacing * scale;

  if (scaledSpacing < 12) {
    return;
  }

  const offsetX = (pan.x % scaledSpacing) - scaledSpacing;
  const offsetY = (pan.y % scaledSpacing) - scaledSpacing;

  ctx.save();
  ctx.translate(offsetX, offsetY);

  const columns = Math.ceil(rect.width / scaledSpacing) + 3;
  const rows = Math.ceil(rect.height / scaledSpacing) + 3;
  const dotRadius = Math.max(1, 1.5 * scale);

  ctx.fillStyle = '#d1d5db';

  for (let i = 0; i < columns; i += 1) {
    const x = i * scaledSpacing;
    for (let j = 0; j < rows; j += 1) {
      const y = j * scaledSpacing;
      ctx.beginPath();
      ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}

function drawCard(ctx, card, { isActive, isEditing, isHovered, handleAlpha }) {
  const radius = 18;
  const { x, y, width, height } = card;

  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = isActive ? '#111' : 'rgba(17, 17, 17, 0.12)';
  ctx.lineWidth = isActive ? 2 : 1;

  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  if (!isEditing) {
    ctx.save();
    ctx.fillStyle = card.isPlaceholder ? '#9ca3af' : '#111';
    ctx.font = '600 16px "Inter", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const padding = 24;
    const maxWidth = width - padding * 2;
    const words = (card.text || 'Card').split(/\s+/);
    const lines = [];
    let current = '';

    words.forEach((word) => {
      const testLine = current ? `${current} ${word}` : word;
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && current) {
        lines.push(current);
        current = word;
      } else {
        current = testLine;
      }
    });

    if (current) {
      lines.push(current);
    }

    const lineHeight = 22;
    const totalHeight = lineHeight * lines.length;
    const startY = y + height / 2 - totalHeight / 2 + lineHeight / 2;

    lines.forEach((line, index) => {
      ctx.fillText(line, x + width / 2, startY + index * lineHeight);
    });

    ctx.restore();
  }

  const visibility =
    handleAlpha != null ? handleAlpha : isActive || isHovered ? 1 : 0;

  if (visibility > 0.01) {
    ctx.save();
    ctx.globalAlpha = visibility;
    ctx.fillStyle = '#111';
    ctx.beginPath();
    const handleCenter = getHandleCenter(card);
    ctx.arc(handleCenter.x, handleCenter.y, HANDLE_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  ctx.restore();
}
