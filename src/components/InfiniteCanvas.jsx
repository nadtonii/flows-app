import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import PillNavigation from './PillNavigation.jsx';

const COLOR_OPTIONS = [
  { id: 'white', label: 'White', color: '#FFFFFF', textColor: '#111827' },
  { id: 'sky', label: 'Sky', color: '#E0F2FE', textColor: '#0F172A' },
  { id: 'powder', label: 'Powder', color: '#E0E7FF', textColor: '#1E1B4B' },
  { id: 'mint', label: 'Mint', color: '#D1FAE5', textColor: '#064E3B' },
  { id: 'peach', label: 'Peach', color: '#FFE4E6', textColor: '#9F1239' },
  { id: 'sunrise', label: 'Sunrise', color: '#FEF3C7', textColor: '#92400E' },
  { id: 'lavender', label: 'Lavender', color: '#F5F3FF', textColor: '#4C1D95' },
];

const DEFAULT_CARD = {
  width: 300,
  height: 300,
  color: COLOR_OPTIONS[0].color,
  textColor: COLOR_OPTIONS[0].textColor,
};

const MIN_CARD_WIDTH = 120;
const MIN_CARD_HEIGHT = 80;
const MAX_CARD_HEIGHT = 580;
const CARD_TEXT_INSET = 24;
const CARD_TEXT_MAX_FONT_SIZE = 36;
const CARD_TEXT_MIN_FONT_SIZE = 14;
const CARD_TEXT_LINE_HEIGHT_MULTIPLIER = 1.35;
const CARD_TEXT_SHRINK_PER_LINE = 1.5;
const HANDLE_SIZE = 18;
const HANDLE_RADIUS = HANDLE_SIZE / 2;
const HANDLE_MARGIN = 6;
const MIN_SCALE = 0.4;
const MAX_SCALE = 2.5;
const CONNECTOR_CONTROL_OFFSET = 80;
const CONNECTOR_HANDLE_RADIUS = 6;
const CONNECTOR_ARROW_SIZE = 12;

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
    color: DEFAULT_CARD.color,
    textColor: DEFAULT_CARD.textColor,
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
  const [selectedCardIds, setSelectedCardIds] = useState([]);
  const [editingCardId, setEditingCardId] = useState(null);
  const [hoveredCardId, setHoveredCardId] = useState(null);
  const [connectors, setConnectors] = useState([]);
  const [selectedConnectorIds, setSelectedConnectorIds] = useState([]);
  const [activeConnectorId, setActiveConnectorId] = useState(null);
  const [hoveredConnectorId, setHoveredConnectorId] = useState(null);
  const [draftConnector, setDraftConnector] = useState(null);
  const [spaceHeld, setSpaceHeld] = useState(false);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [interactionType, setInteractionType] = useState('idle');
  const [editingPadding, setEditingPadding] = useState(0);
  const [handleAnimationVersion, setHandleAnimationVersion] = useState(0);

  const cardsRef = useRef(cards);
  const panRef = useRef(pan);
  const scaleRef = useRef(scale);
  const connectorsRef = useRef(connectors);
  const textareaRef = useRef(null);
  const handleVisibilityRef = useRef(new Map());
  const handleAnimationRef = useRef(null);
  const measurementContextRef = useRef(null);
  const clipboardRef = useRef(null);

  const getMeasurementContext = useCallback(() => {
    if (typeof document === 'undefined') {
      return null;
    }

    if (!measurementContextRef.current) {
      const canvas = document.createElement('canvas');
      measurementContextRef.current = canvas.getContext('2d');
    }

    return measurementContextRef.current;
  }, []);

  useEffect(() => {
    cardsRef.current = cards;
  }, [cards]);

  useEffect(() => {
    connectorsRef.current = connectors;
  }, [connectors]);

  useEffect(() => {
    panRef.current = pan;
  }, [pan]);

  useEffect(() => {
    scaleRef.current = scale;
  }, [scale]);

  const clearConnectorSelection = useCallback(() => {
    setSelectedConnectorIds([]);
    setActiveConnectorId(null);
  }, []);

  const enterConnectorMode = useCallback(() => {
    setDraftConnector(null);
    setHoveredConnectorId(null);
    setInteraction({ type: 'connector-create-pending' });
  }, [setInteraction]);

  const exitConnectorMode = useCallback(() => {
    setDraftConnector(null);
    setHoveredConnectorId(null);
    setInteraction({ type: 'idle' });
  }, [setInteraction]);

  const toggleConnectorMode = useCallback(() => {
    if (interactionRef.current?.type?.startsWith('connector-create')) {
      exitConnectorMode();
    } else {
      enterConnectorMode();
    }
  }, [enterConnectorMode, exitConnectorMode]);

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
    setSelectedCardIds([newCard.id]);
  }, []);

  const duplicateSelectedCards = useCallback(() => {
    if (selectedCardIds.length === 0) {
      return;
    }

    const selectedCards = cardsRef.current.filter((card) =>
      selectedCardIds.includes(card.id)
    );

    if (selectedCards.length === 0) {
      return;
    }

    const offset = 24;
    const duplicates = selectedCards.map((card) => ({
      ...card,
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      x: card.x + offset,
      y: card.y + offset,
      isPlaceholder: card.text.trim().length === 0,
    }));

    setCards((prev) => [...prev, ...duplicates]);

    const idMap = new Map(selectedCards.map((card, index) => [card.id, duplicates[index].id]));
    const connectorsToDuplicate = connectorsRef.current.filter(
      (connector) =>
        idMap.has(connector.sourceId) &&
        idMap.has(connector.targetId)
    );

    if (connectorsToDuplicate.length > 0) {
      const duplicatedConnectors = connectorsToDuplicate.map((connector) => ({
        ...connector,
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        sourceId: idMap.get(connector.sourceId),
        targetId: idMap.get(connector.targetId),
      }));

      setConnectors((prev) => [...prev, ...duplicatedConnectors]);
      setSelectedConnectorIds(duplicatedConnectors.map((item) => item.id));
      setActiveConnectorId(
        duplicatedConnectors[duplicatedConnectors.length - 1]?.id ?? null
      );
    }

    const newIds = duplicates.map((card) => card.id);
    setSelectedCardIds(newIds);
    setActiveCardId(newIds[newIds.length - 1] ?? null);
    setEditingCardId(null);
    setHoveredCardId(newIds[newIds.length - 1] ?? null);
  }, [selectedCardIds]);

  const copySelectedCards = useCallback(() => {
    if (selectedCardIds.length === 0) {
      return;
    }

    const selectedCards = cardsRef.current.filter((card) =>
      selectedCardIds.includes(card.id)
    );

    if (selectedCards.length === 0) {
      return;
    }

    const connectorsToCopy = connectorsRef.current.filter(
      (connector) =>
        selectedCardIds.includes(connector.sourceId) &&
        selectedCardIds.includes(connector.targetId)
    );

    clipboardRef.current = {
      cards: selectedCards.map((card) => {
        const { id, ...rest } = card;
        return { originalId: card.id, data: { ...rest } };
      }),
      connectors: connectorsToCopy.map(({ id, ...rest }) => ({ ...rest })),
    };
  }, [selectedCardIds]);

  const pasteCopiedCards = useCallback(() => {
    const clipboard = clipboardRef.current;
    if (!clipboard || !Array.isArray(clipboard.cards) || clipboard.cards.length === 0) {
      return;
    }

    const offset = 24;
    const idMap = new Map();
    const pastedCards = clipboard.cards.map(({ originalId, data }) => {
      const card = {
        ...data,
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        x: data.x + offset,
        y: data.y + offset,
        isPlaceholder: data.text.trim().length === 0,
      };
      idMap.set(originalId, card.id);
      return card;
    });

    setCards((prev) => [...prev, ...pastedCards]);

    const connectorCopies = Array.isArray(clipboard.connectors)
      ? clipboard.connectors
      : [];

    let pastedConnectors = [];

    if (connectorCopies.length > 0) {
      pastedConnectors = connectorCopies
        .filter(
          (connector) => idMap.has(connector.sourceId) && idMap.has(connector.targetId)
        )
        .map((connector) => ({
          ...connector,
          id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
          sourceId: idMap.get(connector.sourceId),
          targetId: idMap.get(connector.targetId),
        }));

      if (pastedConnectors.length > 0) {
        setConnectors((prev) => [...prev, ...pastedConnectors]);
        setSelectedConnectorIds(pastedConnectors.map((item) => item.id));
        setActiveConnectorId(
          pastedConnectors[pastedConnectors.length - 1]?.id ?? null
        );
      }
    }

    clipboardRef.current = {
      cards: pastedCards.map(({ id, ...rest }) => ({
        originalId: id,
        data: { ...rest },
      })),
      connectors: pastedConnectors.map(({ id, ...rest }) => ({ ...rest })),
    };

    const newIds = pastedCards.map((card) => card.id);
    setSelectedCardIds(newIds);
    setActiveCardId(newIds[newIds.length - 1] ?? null);
    setEditingCardId(null);
    setHoveredCardId(newIds[newIds.length - 1] ?? null);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.code === 'Space' && editingCardId === null) {
        event.preventDefault();
        setSpaceHeld(true);
      }

      if (editingCardId !== null) return;

      if (event.key === 'Escape') {
        if (interactionRef.current?.type?.startsWith('connector-create')) {
          event.preventDefault();
          exitConnectorMode();
          return;
        }

        if (selectedConnectorIds.length > 0) {
          event.preventDefault();
          clearConnectorSelection();
          return;
        }
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'd') {
        event.preventDefault();
        duplicateSelectedCards();
        return;
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'c') {
        event.preventDefault();
        copySelectedCards();
        return;
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'v') {
        event.preventDefault();
        pasteCopiedCards();
        return;
      }

      if (!event.metaKey && !event.ctrlKey && event.key.toLowerCase() === 'a') {
        event.preventDefault();
        toggleConnectorMode();
        return;
      }

      if (!event.metaKey && !event.ctrlKey && event.key.toLowerCase() === 'c') {
        event.preventDefault();
        addCard();
        return;
      }

      if (
        event.key &&
        (event.key === 'Backspace' || event.key === 'Delete') &&
        (selectedCardIds.length > 0 || selectedConnectorIds.length > 0)
      ) {
        event.preventDefault();
        const idsToRemove = new Set(selectedCardIds);
        const connectorsToRemove = new Set(selectedConnectorIds);
        setCards((prev) => prev.filter((card) => !idsToRemove.has(card.id)));
        setConnectors((prev) =>
          prev.filter(
            (connector) =>
              !connectorsToRemove.has(connector.id) &&
              !idsToRemove.has(connector.sourceId) &&
              !idsToRemove.has(connector.targetId)
          )
        );
        setSelectedCardIds([]);
        clearConnectorSelection();
        setActiveCardId(null);
        setEditingCardId((value) =>
          value && idsToRemove.has(value) ? null : value
        );
        setHoveredCardId((value) =>
          value && idsToRemove.has(value) ? null : value
        );
        setHoveredConnectorId((value) =>
          value && connectorsToRemove.has(value) ? null : value
        );
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
  }, [
    addCard,
    copySelectedCards,
    duplicateSelectedCards,
    editingCardId,
    enterConnectorMode,
    exitConnectorMode,
    pasteCopiedCards,
    clearConnectorSelection,
    selectedCardIds,
    toggleConnectorMode,
    selectedConnectorIds,
  ]);

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

      if (interactionRef.current?.type === 'connector-create-pending') {
        const card = findCardAtPoint(pointer);
        if (!card) {
          exitConnectorMode();
          return;
        }

        const anchor = getAnchorForPointer(card, pointer);
        setDraftConnector({
          sourceId: card.id,
          sourceAnchor: anchor,
          pointer,
          targetCardId: null,
          targetAnchor: null,
        });
        setInteraction({
          type: 'connector-create-active',
          pointerId: event.pointerId,
          sourceCardId: card.id,
          sourceAnchor: anchor,
        });
        return;
      }

      if (interactionRef.current?.type === 'connector-create-active') {
        return;
      }

      const handleHit = findConnectorHandleAtPoint(
        pointer,
        connectorsRef.current,
        cardsRef.current,
        12 / scaleRef.current
      );

      if (handleHit) {
        const connector = connectorsRef.current.find(
          (item) => item.id === handleHit.connectorId
        );

        if (connector) {
          setActiveConnectorId(connector.id);
          setSelectedConnectorIds((prev) => {
            if (prev.includes(connector.id)) {
              return prev;
            }
            if (event.shiftKey) {
              return [...prev, connector.id];
            }
            return [connector.id];
          });
          if (!event.shiftKey) {
            setSelectedCardIds([]);
            setActiveCardId(null);
          }

          setInteraction({
            type: 'connector-adjust',
            pointerId: event.pointerId,
            connectorId: connector.id,
            endpoint: handleHit.endpoint,
            original: {
              sourceId: connector.sourceId,
              sourceAnchor: { ...connector.sourceAnchor },
              targetId: connector.targetId,
              targetAnchor: { ...connector.targetAnchor },
            },
            lastValid:
              handleHit.endpoint === 'source'
                ? {
                    cardId: connector.sourceId,
                    anchor: { ...connector.sourceAnchor },
                  }
                : {
                    cardId: connector.targetId,
                    anchor: { ...connector.targetAnchor },
                  },
          });
          return;
        }
      }

      const connectorHit = findConnectorAtPoint(
        pointer,
        connectorsRef.current,
        cardsRef.current,
        10 / scaleRef.current
      );

      if (connectorHit) {
        if (!event.shiftKey) {
          setSelectedCardIds([]);
          setActiveCardId(null);
          setSelectedConnectorIds([connectorHit.id]);
        } else {
          setSelectedConnectorIds((prev) => {
            const already = prev.includes(connectorHit.id);
            if (already) {
              return prev;
            }
            return [...prev, connectorHit.id];
          });
        }
        setActiveConnectorId(connectorHit.id);
        setHoveredConnectorId(connectorHit.id);
        canvas.releasePointerCapture?.(event.pointerId);
        setInteraction({ type: 'idle' });
        return;
      }

      const card = findCardAtPoint(pointer);

      if (!card) {
        setActiveCardId(null);
        setSelectedCardIds([]);
        setHoveredCardId(null);
        clearConnectorSelection();
        setInteraction({ type: 'idle' });
        setEditingCardId(null);
        return;
      }

      setHoveredCardId(card.id);

      if (event.shiftKey) {
        setEditingCardId(null);
        setSelectedCardIds((prev) => {
          const alreadySelected = prev.includes(card.id);
          const next = alreadySelected
            ? prev.filter((id) => id !== card.id)
            : [...prev, card.id];

          setActiveCardId((prevActive) => {
            if (!alreadySelected) {
              return card.id;
            }

            if (prevActive === card.id) {
              return next.length ? next[next.length - 1] : null;
            }

            if (next.includes(prevActive)) {
              return prevActive;
            }

            return next.length ? next[next.length - 1] : null;
          });

          return next;
        });

        canvas.releasePointerCapture?.(event.pointerId);
        setInteraction({ type: 'idle' });
        return;
      }

      const handleCenter = getHandleCenter(card);
      const distanceToHandle = Math.hypot(
        pointer.x - handleCenter.x,
        pointer.y - handleCenter.y
      );

      setActiveCardId(card.id);
      setSelectedCardIds((prev) =>
        prev.length === 1 && prev[0] === card.id ? prev : [card.id]
      );
      clearConnectorSelection();
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
    [
      clearConnectorSelection,
      editingCardId,
      exitConnectorMode,
      findCardAtPoint,
      setInteraction,
      spaceHeld,
      toWorldSpace,
    ]
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

        const hoveredConnector = findConnectorAtPoint(
          pointer,
          connectorsRef.current,
          cardsRef.current,
          10 / scaleRef.current
        );
        setHoveredConnectorId((prev) => {
          const nextId = hoveredConnector ? hoveredConnector.id : null;
          return prev === nextId ? prev : nextId;
        });
      }

      if (!interaction || interaction.type === 'idle') {
        return;
      }

      if (interaction.type === 'connector-create-active') {
        const targetCard = findCardAtPoint(pointer);
        setDraftConnector({
          sourceId: interaction.sourceCardId,
          sourceAnchor: interaction.sourceAnchor,
          pointer,
          targetCardId: targetCard ? targetCard.id : null,
          targetAnchor: targetCard ? getAnchorForPointer(targetCard, pointer) : null,
        });
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

      if (interaction.type === 'connector-adjust') {
        const endpointId = interaction.endpoint === 'source' ? 'sourceId' : 'targetId';
        const endpointAnchor =
          interaction.endpoint === 'source' ? 'sourceAnchor' : 'targetAnchor';

        const targetCard = findCardAtPoint(pointer);
        let nextCardId = interaction.lastValid?.cardId ?? interaction.original[endpointId];
        let nextAnchor = interaction.lastValid?.anchor ?? interaction.original[endpointAnchor];

        if (targetCard) {
          nextCardId = targetCard.id;
          nextAnchor = getAnchorForPointer(targetCard, pointer);
          interactionRef.current = {
            ...interaction,
            lastValid: { cardId: nextCardId, anchor: nextAnchor },
          };
        } else {
          const fallbackCard = cardsRef.current.find(
            (card) => card.id === nextCardId
          );
          if (fallbackCard) {
            nextAnchor = getAnchorForPointer(fallbackCard, pointer);
          }
        }

        setConnectors((prev) =>
          prev.map((connector) =>
            connector.id === interaction.connectorId
              ? {
                  ...connector,
                  [endpointId]: nextCardId,
                  [endpointAnchor]: nextAnchor,
                }
              : connector
          )
        );
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
                  ...(event.shiftKey
                    ? (() => {
                        const deltaX = pointer.x - interaction.startPointer.x;
                        const deltaY = pointer.y - interaction.startPointer.y;
                        const dominantDelta =
                          Math.abs(deltaX) > Math.abs(deltaY) ? deltaX : deltaY;

                        return {
                          width: clamp(
                            interaction.startSize.width + dominantDelta,
                            MIN_CARD_WIDTH,
                            Number.POSITIVE_INFINITY
                          ),
                          height: clamp(
                            interaction.startSize.height + dominantDelta,
                            MIN_CARD_HEIGHT,
                            MAX_CARD_HEIGHT
                          ),
                        };
                      })()
                    : {
                        width: clamp(
                          interaction.startSize.width +
                            (pointer.x - interaction.startPointer.x),
                          MIN_CARD_WIDTH,
                          Number.POSITIVE_INFINITY
                        ),
                        height: clamp(
                          interaction.startSize.height +
                            (pointer.y - interaction.startPointer.y),
                          MIN_CARD_HEIGHT,
                          MAX_CARD_HEIGHT
                        ),
                      }),
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

      const interaction = interactionRef.current;

      if (interaction?.type === 'connector-create-active') {
        const pointer = toWorldSpace(event);
        const targetCard = findCardAtPoint(pointer);

        if (targetCard) {
          const targetAnchor = getAnchorForPointer(targetCard, pointer);
          const newConnector = {
            id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
            sourceId: interaction.sourceCardId,
            targetId: targetCard.id,
            sourceAnchor: interaction.sourceAnchor,
            targetAnchor,
          };
          setConnectors((prev) => [...prev, newConnector]);
          setSelectedConnectorIds([newConnector.id]);
          setActiveConnectorId(newConnector.id);
        }

        setDraftConnector(null);
        setInteraction({ type: 'connector-create-pending' });
        return;
      }

      if (interaction?.type === 'connector-adjust') {
        const pointer = toWorldSpace(event);
        const targetCard = findCardAtPoint(pointer);

        if (!targetCard) {
          setConnectors((prev) =>
            prev.map((connector) =>
              connector.id === interaction.connectorId
                ? {
                    ...connector,
                    sourceId: interaction.original.sourceId,
                    sourceAnchor: { ...interaction.original.sourceAnchor },
                    targetId: interaction.original.targetId,
                    targetAnchor: { ...interaction.original.targetAnchor },
                  }
                : connector
            )
          );
        }

        setInteraction({ type: 'idle' });
        return;
      }

      if (interaction?.type === 'connector-create-pending') {
        setDraftConnector(null);
        return;
      }

      clearInteraction();
    },
    [
      clearInteraction,
      findCardAtPoint,
      setInteraction,
      toWorldSpace,
    ]
  );

  const handlePointerLeave = useCallback(
    (event) => {
      handlePointerUp(event);
      setHoveredCardId(null);
      setHoveredConnectorId(null);
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
      setSelectedCardIds([card.id]);
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

  const activeCard = useMemo(
    () => cards.find((card) => card.id === activeCardId) ?? null,
    [cards, activeCardId]
  );

  const toolbarPosition = useMemo(() => {
    if (!activeCard) return null;
    return {
      left: activeCard.x * scale + pan.x + (activeCard.width * scale) / 2,
      top: activeCard.y * scale + pan.y,
    };
  }, [activeCard, pan, scale]);

  const editingTypography = useMemo(() => {
    if (!editingCard) return null;

    const ctx = getMeasurementContext();
    if (!ctx) {
      return {
        fontSize: CARD_TEXT_MAX_FONT_SIZE,
        lineHeight: CARD_TEXT_MAX_FONT_SIZE * CARD_TEXT_LINE_HEIGHT_MULTIPLIER,
        totalHeight: 0,
        fitsWithin: true,
      };
    }

    return calculateCardTypography(
      ctx,
      editingCard.text,
      editingCard.width,
      editingCard.height
    );
  }, [editingCard, getMeasurementContext]);

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

      drawConnectors(ctx, cards, connectors, {
        activeConnectorId,
        hoveredConnectorId,
        selectedConnectorIds,
        draftConnector,
      });

      for (const card of cards) {
        drawCard(ctx, card, {
          isActive: card.id === activeCardId,
          isEditing: card.id === editingCardId,
          isHovered: card.id === hoveredCardId,
          isSelected: selectedCardIds.includes(card.id),
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
    activeConnectorId,
    connectors,
    draftConnector,
    hoveredConnectorId,
    pan,
    scale,
    handleAnimationVersion,
    selectedCardIds,
    selectedConnectorIds,
  ]);

  const handleTextChange = useCallback(
    (event) => {
      const value = event.target.value;
      const ctx = getMeasurementContext();

      setCards((prev) =>
        prev.map((card) => {
          if (card.id !== editingCardId) {
            return card;
          }

          let nextHeight = card.height;

          if (ctx) {
            const layout = calculateCardTypography(
              ctx,
              value,
              card.width,
              card.height
            );

            if (!layout.fitsWithin) {
              const contentHeight = layout.totalHeight + CARD_TEXT_INSET * 2;
              const desiredHeight = clamp(
                contentHeight,
                MIN_CARD_HEIGHT,
                MAX_CARD_HEIGHT
              );
              nextHeight = Math.max(card.height, desiredHeight);
            }
          } else {
            const approxLines =
              value.split('\n').length + Math.floor(value.length / 28);
            const desiredHeight = clamp(
              approxLines * 22 + CARD_TEXT_INSET * 2,
              MIN_CARD_HEIGHT,
              MAX_CARD_HEIGHT
            );
            nextHeight = Math.max(card.height, desiredHeight);
          }

          return {
            ...card,
            text: value,
            isPlaceholder: value.trim().length === 0,
            height: nextHeight,
          };
        })
      );
    },
    [editingCardId, getMeasurementContext]
  );

  const handleCardColorChange = useCallback((cardId, option) => {
    setCards((prev) =>
      prev.map((card) =>
        card.id === cardId
          ? {
              ...card,
              color: option.color,
              textColor: option.textColor,
            }
          : card
      )
    );
  }, []);

  const textareaPosition = useMemo(() => {
    if (!editingCard) return null;
    return {
      top: editingCard.y * scale + pan.y + CARD_TEXT_INSET,
      left: editingCard.x * scale + pan.x + CARD_TEXT_INSET,
      width: editingCard.width * scale - CARD_TEXT_INSET * 2,
      height: Math.max(48, editingCard.height * scale - CARD_TEXT_INSET * 2),
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
    setSelectedCardIds([]);
    clearConnectorSelection();
    setEditingCardId(null);
  }, [clearConnectorSelection, hoveredCardId, interactionType]);

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
              : interactionType?.startsWith?.('connector-create')
              ? 'crosshair'
              : interactionType === 'connector-adjust'
              ? 'pointer'
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
            fontSize:
              (editingTypography
                ? editingTypography.fontSize
                : CARD_TEXT_MAX_FONT_SIZE) * scale,
            fontWeight: 600,
            fontFamily: 'Inter, sans-serif',
            textAlign: 'center',
            border: 'none',
            background: 'transparent',
            color: editingCard.text
              ? editingCard.textColor
              : editingCard.textColor === '#F9FAFB'
              ? 'rgba(249, 250, 251, 0.75)'
              : '#999',
            resize: 'none',
            overflowWrap: 'break-word',
            wordBreak: 'break-word',
            whiteSpace: 'pre-wrap',
            lineHeight: `${(
              editingTypography
                ? editingTypography.lineHeight
                : CARD_TEXT_MAX_FONT_SIZE * CARD_TEXT_LINE_HEIGHT_MULTIPLIER
            ) * scale}px`,
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

      {activeCard && toolbarPosition && (
        <div
          style={{
            position: 'absolute',
            left: toolbarPosition.left,
            top: toolbarPosition.top,
            transform: 'translate(-50%, -100%) translateY(-16px)',
            display: 'flex',
            gap: 8,
            padding: '10px 16px',
            borderRadius: 9999,
            background: 'rgba(255, 255, 255, 0.96)',
            boxShadow: 'none',
            alignItems: 'center',
            zIndex: 20,
            border: '1px solid rgba(15, 23, 42, 0.08)',
          }}
        >
          {COLOR_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => handleCardColorChange(activeCard.id, option)}
              aria-label={`Set card color to ${option.label}`}
              style={{
                width: 28,
                height: 28,
                borderRadius: '9999px',
                border:
                  option.id === 'white'
                    ? '1px solid rgba(15, 23, 42, 0.16)'
                    : '1px solid transparent',
                padding: 0,
                background: option.color,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow:
                  activeCard.color === option.color
                    ? '0 0 0 4px rgba(37, 99, 235, 0.18)'
                    : '0 1px 2px rgba(15, 23, 42, 0.12)',
                transition:
                  'transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease',
              }}
              onMouseEnter={(event) => {
                event.currentTarget.style.transform = 'scale(1.1)';
              }}
              onMouseLeave={(event) => {
                event.currentTarget.style.transform = 'scale(1)';
              }}
            >
            </button>
          ))}
        </div>
      )}

      <PillNavigation onAddCard={addCard} onAddArrow={toggleConnectorMode} />
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

function drawConnectors(
  ctx,
  cards,
  connectors,
  { activeConnectorId, hoveredConnectorId, selectedConnectorIds, draftConnector }
) {
  const selectedSet = new Set(selectedConnectorIds);

  for (const connector of connectors) {
    const geometry = computeConnectorGeometry(connector, cards);
    if (!geometry) continue;

    const isSelected = selectedSet.has(connector.id);
    const isActive = connector.id === activeConnectorId;
    const isHovered = connector.id === hoveredConnectorId;

    const stroke = isSelected || isActive
      ? '#2563eb'
      : isHovered
      ? '#0ea5e9'
      : '#1f2937';
    const lineWidth = isSelected || isActive ? 3.5 : isHovered ? 3 : 2.5;

    drawConnectorPath(ctx, geometry, {
      stroke,
      lineWidth,
      showHandles: isSelected || isActive,
    });
  }

  if (draftConnector) {
    const draftGeometry = computeDraftConnectorGeometry(draftConnector, cards);
    if (draftGeometry) {
      drawConnectorPath(ctx, draftGeometry, {
        stroke: 'rgba(37, 99, 235, 0.6)',
        lineWidth: 2.5,
        dashed: true,
        showHandles: false,
      });
    }
  }
}

function drawConnectorPath(ctx, geometry, { stroke, lineWidth, dashed = false, showHandles }) {
  const { source, control1, control2, target } = geometry;

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(source.x, source.y);
  ctx.bezierCurveTo(control1.x, control1.y, control2.x, control2.y, target.x, target.y);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = lineWidth;
  ctx.strokeStyle = stroke;
  if (dashed) {
    ctx.setLineDash([10, 8]);
  }
  ctx.stroke();
  if (dashed) {
    ctx.setLineDash([]);
  }

  drawArrowhead(ctx, control2, target, stroke);

  if (showHandles) {
    drawConnectorHandle(ctx, source);
    drawConnectorHandle(ctx, target);
  }

  ctx.restore();
}

function drawConnectorHandle(ctx, point) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(point.x, point.y, CONNECTOR_HANDLE_RADIUS, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#2563eb';
  ctx.stroke();
  ctx.restore();
}

function drawArrowhead(ctx, control, target, color) {
  const dx = target.x - control.x;
  const dy = target.y - control.y;
  const length = Math.hypot(dx, dy) || 1;
  const ux = dx / length;
  const uy = dy / length;

  const angle = Math.PI / 6;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  const leftX = ux * cos - uy * sin;
  const leftY = ux * sin + uy * cos;
  const rightX = ux * cos + uy * sin;
  const rightY = uy * cos - ux * sin;

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(target.x, target.y);
  ctx.lineTo(target.x - leftX * CONNECTOR_ARROW_SIZE, target.y - leftY * CONNECTOR_ARROW_SIZE);
  ctx.lineTo(target.x - rightX * CONNECTOR_ARROW_SIZE, target.y - rightY * CONNECTOR_ARROW_SIZE);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}

function computeConnectorGeometry(connector, cards) {
  const sourceCard = cards.find((card) => card.id === connector.sourceId);
  const targetCard = cards.find((card) => card.id === connector.targetId);

  if (!sourceCard || !targetCard) {
    return null;
  }

  const sourceAnchor = ensureAnchor(connector.sourceAnchor);
  const targetAnchor = ensureAnchor(connector.targetAnchor);

  const sourcePoint = getAnchorPoint(sourceCard, sourceAnchor);
  const targetPoint = getAnchorPoint(targetCard, targetAnchor);

  const distance = Math.hypot(targetPoint.x - sourcePoint.x, targetPoint.y - sourcePoint.y);
  const offset = Math.max(CONNECTOR_CONTROL_OFFSET, distance * 0.35);

  const sourceNormal = getAnchorNormal(sourceAnchor, sourcePoint, targetPoint);
  const targetNormal = getAnchorNormal(targetAnchor, targetPoint, sourcePoint);

  const control1 = {
    x: sourcePoint.x + sourceNormal.x * offset,
    y: sourcePoint.y + sourceNormal.y * offset,
  };

  const control2 = {
    x: targetPoint.x - targetNormal.x * offset,
    y: targetPoint.y - targetNormal.y * offset,
  };

  return { source: sourcePoint, control1, control2, target: targetPoint };
}

function computeDraftConnectorGeometry(draft, cards) {
  const sourceCard = cards.find((card) => card.id === (draft.sourceId ?? draft.sourceCardId));
  if (!sourceCard) {
    return null;
  }

  const sourceAnchor = ensureAnchor(draft.sourceAnchor);
  const sourcePoint = getAnchorPoint(sourceCard, sourceAnchor);

  let targetPoint = draft.pointer ?? sourcePoint;
  let targetAnchor = draft.targetAnchor ? ensureAnchor(draft.targetAnchor) : null;

  if (draft.targetCardId && draft.targetAnchor) {
    const targetCard = cards.find((card) => card.id === draft.targetCardId);
    if (targetCard) {
      targetPoint = getAnchorPoint(targetCard, targetAnchor);
    }
  }

  const distance = Math.hypot(targetPoint.x - sourcePoint.x, targetPoint.y - sourcePoint.y);
  const offset = Math.max(CONNECTOR_CONTROL_OFFSET, distance * 0.35);

  const sourceNormal = getAnchorNormal(sourceAnchor, sourcePoint, targetPoint);
  const targetNormal = targetAnchor
    ? getAnchorNormal(targetAnchor, targetPoint, sourcePoint)
    : {
        x: (targetPoint.x - sourcePoint.x) / (distance || 1),
        y: (targetPoint.y - sourcePoint.y) / (distance || 1),
      };

  const control1 = {
    x: sourcePoint.x + sourceNormal.x * offset,
    y: sourcePoint.y + sourceNormal.y * offset,
  };

  const control2 = {
    x: targetPoint.x - targetNormal.x * offset,
    y: targetPoint.y - targetNormal.y * offset,
  };

  return { source: sourcePoint, control1, control2, target: targetPoint };
}

function getAnchorPoint(card, anchor) {
  return {
    x: card.x + clamp(anchor.x, 0, 1) * card.width,
    y: card.y + clamp(anchor.y, 0, 1) * card.height,
  };
}

function ensureAnchor(anchor) {
  if (!anchor) {
    return { x: 1, y: 0.5, side: 'right' };
  }
  if (anchor.side) {
    return anchor;
  }
  const inferredSide = inferSideFromAnchor(anchor);
  return { ...anchor, side: inferredSide };
}

function inferSideFromAnchor(anchor) {
  const distances = [
    { side: 'left', value: anchor.x },
    { side: 'right', value: 1 - anchor.x },
    { side: 'top', value: anchor.y },
    { side: 'bottom', value: 1 - anchor.y },
  ];

  let best = distances[0];
  for (let index = 1; index < distances.length; index += 1) {
    if (distances[index].value < best.value) {
      best = distances[index];
    }
  }

  return best.side;
}

function getAnchorNormal(anchor, originPoint, targetPoint) {
  const normals = {
    top: { x: 0, y: -1 },
    bottom: { x: 0, y: 1 },
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 },
  };

  if (anchor?.side && normals[anchor.side]) {
    return normals[anchor.side];
  }

  if (originPoint && targetPoint) {
    const dx = targetPoint.x - originPoint.x;
    const dy = targetPoint.y - originPoint.y;
    const length = Math.hypot(dx, dy) || 1;
    return { x: dx / length, y: dy / length };
  }

  return { x: 1, y: 0 };
}

function getAnchorForPointer(card, pointer) {
  const relativeX = clamp((pointer.x - card.x) / card.width, 0, 1);
  const relativeY = clamp((pointer.y - card.y) / card.height, 0, 1);

  const distances = [
    { side: 'left', value: Math.abs(pointer.x - card.x) },
    { side: 'right', value: Math.abs(pointer.x - (card.x + card.width)) },
    { side: 'top', value: Math.abs(pointer.y - card.y) },
    { side: 'bottom', value: Math.abs(pointer.y - (card.y + card.height)) },
  ];

  let closest = distances[0];
  for (let index = 1; index < distances.length; index += 1) {
    if (distances[index].value < closest.value) {
      closest = distances[index];
    }
  }

  switch (closest.side) {
    case 'top':
      return { x: relativeX, y: 0, side: 'top' };
    case 'bottom':
      return { x: relativeX, y: 1, side: 'bottom' };
    case 'left':
      return { x: 0, y: relativeY, side: 'left' };
    default:
      return { x: 1, y: relativeY, side: 'right' };
  }
}

function getPointOnCubicBezier(p0, p1, p2, p3, t) {
  const mt = 1 - t;
  const mt2 = mt * mt;
  const t2 = t * t;

  const x =
    mt2 * mt * p0.x +
    3 * mt2 * t * p1.x +
    3 * mt * t2 * p2.x +
    t2 * t * p3.x;
  const y =
    mt2 * mt * p0.y +
    3 * mt2 * t * p1.y +
    3 * mt * t2 * p2.y +
    t2 * t * p3.y;

  return { x, y };
}

function distancePointToBezier(point, geometry) {
  const samples = 32;
  let minDistance = Number.POSITIVE_INFINITY;

  for (let index = 0; index <= samples; index += 1) {
    const t = index / samples;
    const sample = getPointOnCubicBezier(
      geometry.source,
      geometry.control1,
      geometry.control2,
      geometry.target,
      t
    );
    const distance = Math.hypot(point.x - sample.x, point.y - sample.y);
    if (distance < minDistance) {
      minDistance = distance;
    }
  }

  return minDistance;
}

function findConnectorAtPoint(pointer, connectors, cards, tolerance) {
  let closest = null;
  let closestDistance = tolerance;

  for (const connector of connectors) {
    const geometry = computeConnectorGeometry(connector, cards);
    if (!geometry) continue;
    const distance = distancePointToBezier(pointer, geometry);
    if (distance <= closestDistance) {
      closestDistance = distance;
      closest = connector;
    }
  }

  return closest;
}

function findConnectorHandleAtPoint(pointer, connectors, cards, tolerance) {
  for (const connector of connectors) {
    const geometry = computeConnectorGeometry(connector, cards);
    if (!geometry) continue;

    if (Math.hypot(pointer.x - geometry.source.x, pointer.y - geometry.source.y) <= tolerance) {
      return { connectorId: connector.id, endpoint: 'source' };
    }

    if (Math.hypot(pointer.x - geometry.target.x, pointer.y - geometry.target.y) <= tolerance) {
      return { connectorId: connector.id, endpoint: 'target' };
    }
  }

  return null;
}

function drawCard(
  ctx,
  card,
  { isActive, isEditing, isHovered, handleAlpha, isSelected = false }
) {
  const radius = 18;
  const { x, y, width, height } = card;

  ctx.save();
  ctx.fillStyle = card.color ?? '#ffffff';

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

  if (isActive) {
    ctx.save();
    ctx.shadowColor = 'rgba(15, 23, 42, 0.18)';
    ctx.shadowBlur = 32;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 16;
    ctx.fill();
    ctx.restore();
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(37, 99, 235, 0.55)';
    ctx.stroke();
  } else {
    ctx.fill();
    ctx.lineWidth = isSelected ? 2 : 1;
    ctx.strokeStyle = isSelected
      ? 'rgba(37, 99, 235, 0.4)'
      : 'rgba(17, 17, 17, 0.12)';
    ctx.stroke();
  }

  if (!isEditing) {
    ctx.save();
    const placeholderColor =
      card.textColor === '#F9FAFB' ? 'rgba(249, 250, 251, 0.7)' : '#9ca3af';
    ctx.fillStyle = card.isPlaceholder ? placeholderColor : card.textColor;
    const layout = calculateCardTypography(
      ctx,
      card.text,
      width,
      height
    );

    ctx.font = `600 ${layout.fontSize}px "Inter", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const totalHeight = layout.lines.length * layout.lineHeight;
    const startY =
      y + height / 2 - totalHeight / 2 + layout.lineHeight / 2;

    layout.lines.forEach((line, index) => {
      ctx.fillText(
        line,
        x + width / 2,
        startY + index * layout.lineHeight
      );
    });

    ctx.restore();
  }

  const visibility =
    handleAlpha != null ? handleAlpha : isActive || isHovered ? 1 : 0;

  if (visibility > 0.01) {
    ctx.save();
    ctx.globalAlpha = visibility;
    const handleCenter = getHandleCenter(card);
    ctx.beginPath();
    ctx.fillStyle = '#0F172A';
    ctx.arc(handleCenter.x, handleCenter.y, HANDLE_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.stroke();
    ctx.restore();
  }

  ctx.restore();
}

function calculateCardTypography(ctx, text, width, height) {
  const originalFont = ctx.font;
  const maxWidth = Math.max(1, width - CARD_TEXT_INSET * 2);
  const maxHeight = Math.max(1, height - CARD_TEXT_INSET * 2);
  const content = text && text.trim().length > 0 ? text : 'Card';

  ctx.font = `600 ${CARD_TEXT_MAX_FONT_SIZE}px "Inter", sans-serif`;
  const initialLines = wrapCardLines(ctx, content, maxWidth);
  const initialTarget = CARD_TEXT_MAX_FONT_SIZE -
    Math.max(0, initialLines.length - 1) * CARD_TEXT_SHRINK_PER_LINE;

  let fontSize = clamp(
    initialTarget,
    CARD_TEXT_MIN_FONT_SIZE,
    CARD_TEXT_MAX_FONT_SIZE
  );

  let lines = initialLines;
  let lineHeight = fontSize * CARD_TEXT_LINE_HEIGHT_MULTIPLIER;
  let totalHeight = lines.length * lineHeight;
  let fitsWithin = totalHeight <= maxHeight;

  for (let attempt = 0; attempt < 8; attempt += 1) {
    ctx.font = `600 ${fontSize}px "Inter", sans-serif`;
    lines = wrapCardLines(ctx, content, maxWidth);
    lineHeight = fontSize * CARD_TEXT_LINE_HEIGHT_MULTIPLIER;
    totalHeight = lines.length * lineHeight;
    fitsWithin = totalHeight <= maxHeight;

    if (fitsWithin || fontSize <= CARD_TEXT_MIN_FONT_SIZE) {
      break;
    }

    const overflowRatio = totalHeight / maxHeight;
    const shrinkBy = Math.max(1, Math.ceil((overflowRatio - 1) * 2));
    fontSize = Math.max(CARD_TEXT_MIN_FONT_SIZE, fontSize - shrinkBy);
  }

  ctx.font = originalFont;

  return {
    fontSize,
    lineHeight,
    lines: lines.length > 0 ? lines : ['Card'],
    totalHeight,
    fitsWithin,
  };
}

function wrapCardLines(ctx, text, maxWidth) {
  const sanitized = text && text.trim().length > 0 ? text : 'Card';
  const paragraphs = sanitized.split(/\r?\n/);
  const lines = [];

  for (const paragraph of paragraphs) {
    const words = paragraph.split(/\s+/).filter(Boolean);

    if (words.length === 0) {
      lines.push('');
      continue;
    }

    let current = words[0];

    for (let index = 1; index < words.length; index += 1) {
      const testLine = `${current} ${words[index]}`;
      if (ctx.measureText(testLine).width > maxWidth) {
        lines.push(current);
        current = words[index];
      } else {
        current = testLine;
      }
    }

    lines.push(current);
  }

  return lines;
}
