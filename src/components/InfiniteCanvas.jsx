import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import PillNavigation from './PillNavigation.jsx';
import UndoRedoPill from './UndoRedoPill.jsx';

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
const CONNECTOR_HANDLE_RADIUS = 12;
const CONNECTOR_LINE_WIDTH = 3;
const CONNECTOR_SELECTED_LINE_WIDTH = 4.5;
const CONNECTOR_HIT_DISTANCE = 16;
const CONNECTOR_CAP_RADIUS = 6;

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
  const [connectors, setConnectors] = useState([]);
  const [activeCardId, setActiveCardId] = useState(null);
  const [selectedCardIds, setSelectedCardIds] = useState([]);
  const [selectedConnectorIds, setSelectedConnectorIds] = useState([]);
  const [editingCardId, setEditingCardId] = useState(null);
  const [hoveredCardId, setHoveredCardId] = useState(null);
  const [spaceHeld, setSpaceHeld] = useState(false);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [interactionType, setInteractionType] = useState('idle');
  const [editingPadding, setEditingPadding] = useState(0);
  const [handleAnimationVersion, setHandleAnimationVersion] = useState(0);
  const [draftConnector, setDraftConnector] = useState(null);
  const [historyStatus, setHistoryStatus] = useState({
    canUndo: false,
    canRedo: false,
  });

  const cardsRef = useRef(cards);
  const connectorsRef = useRef(connectors);
  const panRef = useRef(pan);
  const scaleRef = useRef(scale);
  const textareaRef = useRef(null);
  const handleVisibilityRef = useRef(new Map());
  const handleAnimationRef = useRef(null);
  const measurementContextRef = useRef(null);
  const clipboardRef = useRef(null);
  const historyRef = useRef({ past: [], future: [] });
  const editingSnapshotRef = useRef(false);
  const activeCardIdRef = useRef(activeCardId);
  const selectedCardIdsRef = useRef(selectedCardIds);
  const selectedConnectorIdsRef = useRef(selectedConnectorIds);
  const editingCardIdRef = useRef(editingCardId);
  const hoveredCardIdRef = useRef(hoveredCardId);

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

  useEffect(() => {
    activeCardIdRef.current = activeCardId;
  }, [activeCardId]);

  useEffect(() => {
    selectedCardIdsRef.current = selectedCardIds;
  }, [selectedCardIds]);

  useEffect(() => {
    selectedConnectorIdsRef.current = selectedConnectorIds;
  }, [selectedConnectorIds]);

  useEffect(() => {
    editingCardIdRef.current = editingCardId;
    editingSnapshotRef.current = false;
  }, [editingCardId]);

  useEffect(() => {
    hoveredCardIdRef.current = hoveredCardId;
  }, [hoveredCardId]);

  useEffect(() => {
    if (spaceHeld) {
      setHoveredCardId(null);
    }
  }, [spaceHeld]);

  const syncHistoryStatus = useCallback(() => {
    const { past, future } = historyRef.current;
    setHistoryStatus((prev) => {
      const next = {
        canUndo: past.length > 0,
        canRedo: future.length > 0,
      };

      if (prev.canUndo === next.canUndo && prev.canRedo === next.canRedo) {
        return prev;
      }

      return next;
    });
  }, []);

  useEffect(() => {
    syncHistoryStatus();
  }, [syncHistoryStatus]);

  const getSnapshot = useCallback(() => ({
    cards: cardsRef.current.map((card) => ({ ...card })),
    connectors: connectorsRef.current.map((connector) => cloneConnector(connector)),
    pan: { ...panRef.current },
    scale: scaleRef.current,
    activeCardId: activeCardIdRef.current,
    selectedCardIds: [...(selectedCardIdsRef.current ?? [])],
    selectedConnectorIds: [...(selectedConnectorIdsRef.current ?? [])],
    editingCardId: editingCardIdRef.current,
    hoveredCardId: hoveredCardIdRef.current,
  }), []);

  const applySnapshot = useCallback(
    (snapshot) => {
      if (!snapshot) {
        return;
      }

      setCards(snapshot.cards ? snapshot.cards.map((card) => ({ ...card })) : []);
      setConnectors(
        snapshot.connectors
          ? snapshot.connectors.map((connector) => cloneConnector(connector))
          : []
      );
      setPan(snapshot.pan ? { ...snapshot.pan } : { x: 0, y: 0 });
      setScale(snapshot.scale ?? 1);
      setActiveCardId(snapshot.activeCardId ?? null);
      setSelectedCardIds(snapshot.selectedCardIds ? [...snapshot.selectedCardIds] : []);
      setSelectedConnectorIds(
        snapshot.selectedConnectorIds ? [...snapshot.selectedConnectorIds] : []
      );
      setEditingCardId(snapshot.editingCardId ?? null);
      setHoveredCardId(snapshot.hoveredCardId ?? null);
      interactionRef.current = { type: 'idle' };
      setInteractionType('idle');
    },
    []
  );

  const recordSnapshot = useCallback(() => {
    const snapshot = getSnapshot();
    const history = historyRef.current;
    history.past.push(snapshot);

    if (history.past.length > 200) {
      history.past.shift();
    }

    history.future = [];
    syncHistoryStatus();
  }, [getSnapshot, syncHistoryStatus]);

  const undo = useCallback(() => {
    const history = historyRef.current;
    if (history.past.length === 0) {
      return;
    }

    const snapshot = history.past.pop();
    history.future.push(getSnapshot());
    applySnapshot(snapshot);
    syncHistoryStatus();
  }, [applySnapshot, getSnapshot, syncHistoryStatus]);

  const redo = useCallback(() => {
    const history = historyRef.current;
    if (history.future.length === 0) {
      return;
    }

    const snapshot = history.future.pop();
    history.past.push(getSnapshot());
    applySnapshot(snapshot);
    syncHistoryStatus();
  }, [applySnapshot, getSnapshot, syncHistoryStatus]);

  const prepareHistoryForInteraction = useCallback(() => {
    const interaction = interactionRef.current;
    if (!interaction || interaction.type === 'idle') {
      return;
    }

    if (!interaction.hasSnapshot) {
      recordSnapshot();
      interactionRef.current = { ...interaction, hasSnapshot: true };
    }
  }, [recordSnapshot]);

  const setInteraction = useCallback((interaction) => {
    interactionRef.current = interaction;
    setInteractionType(interaction.type);
  }, []);

  const startConnectorCreation = useCallback(() => {
    if (editingCardIdRef.current !== null) {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const viewportCenter = {
      x: (rect.width / 2 - panRef.current.x) / scaleRef.current,
      y: (rect.height / 2 - panRef.current.y) / scaleRef.current,
    };

    const offset = 80;
    const connectorId = `connector-${Date.now()}-${Math.random()
      .toString(16)
      .slice(2)}`;
    const newConnector = {
      id: connectorId,
      source: {
        cardId: null,
        anchor: null,
        absolute: {
          x: viewportCenter.x - offset,
          y: viewportCenter.y,
        },
      },
      target: {
        cardId: null,
        anchor: null,
        absolute: {
          x: viewportCenter.x + offset,
          y: viewportCenter.y,
        },
      },
      bends: [],
    };

    recordSnapshot();
    setConnectors((prev) => [...prev, newConnector]);
    setSelectedConnectorIds([connectorId]);
    setSelectedCardIds([]);
    setActiveCardId(null);
    setDraftConnector(null);
    setInteraction({ type: 'idle' });
  }, [recordSnapshot, setInteraction]);

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

    recordSnapshot();
    setCards((prev) => [...prev, newCard]);
    setActiveCardId(newCard.id);
    setSelectedCardIds([newCard.id]);
  }, [recordSnapshot]);

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

    const cardIdMap = new Map();
    selectedCards.forEach((card, index) => {
      cardIdMap.set(card.id, duplicates[index].id);
    });

    const connectorDuplicates = connectorsRef.current
      .filter((connector) => {
        if (!connector?.source?.cardId || !connector?.target?.cardId) {
          return false;
        }

        return (
          cardIdMap.has(connector.source.cardId) &&
          cardIdMap.has(connector.target.cardId)
        );
      })
      .map((connector) => {
        const clone = cloneConnector(connector);
        const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
        return {
          ...clone,
          id,
          source: {
            ...clone.source,
            cardId: cardIdMap.get(clone.source.cardId),
          },
          target: {
            ...clone.target,
            cardId: cardIdMap.get(clone.target.cardId),
          },
        };
      });

    recordSnapshot();
    setCards((prev) => [...prev, ...duplicates]);
    if (connectorDuplicates.length > 0) {
      setConnectors((prev) => [...prev, ...connectorDuplicates]);
    }

    const newIds = duplicates.map((card) => card.id);
    setSelectedCardIds(newIds);
    setSelectedConnectorIds(connectorDuplicates.map((connector) => connector.id));
    setActiveCardId(newIds[newIds.length - 1] ?? null);
    setEditingCardId(null);
    setHoveredCardId(newIds[newIds.length - 1] ?? null);
  }, [recordSnapshot, selectedCardIds]);

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

    const selectedCardSet = new Set(selectedCardIds);

    const connectorsToCopy = connectorsRef.current.filter((connector) => {
      if (!connector?.source?.cardId || !connector?.target?.cardId) {
        return false;
      }

      return (
        selectedCardSet.has(connector.source.cardId) &&
        selectedCardSet.has(connector.target.cardId)
      );
    });

    clipboardRef.current = {
      cards: selectedCards.map((card) => {
        const { id, ...rest } = card;
        return { ...rest, originalId: id };
      }),
      connectors: connectorsToCopy.map((connector) => {
        const clone = cloneConnector(connector);
        const { id, ...rest } = clone;
        return rest;
      }),
    };
  }, [selectedCardIds]);

  const pasteCopiedCards = useCallback(() => {
    const clipboard = clipboardRef.current;
    if (!clipboard ||
      (Array.isArray(clipboard) && clipboard.length === 0) ||
      (!Array.isArray(clipboard) && (!clipboard.cards || clipboard.cards.length === 0))
    ) {
      return;
    }

    const offset = 24;
    const clipboardCards = Array.isArray(clipboard) ? clipboard : clipboard.cards;
    const clipboardConnectors = Array.isArray(clipboard)
      ? []
      : clipboard.connectors ?? [];

    const pastedCards = clipboardCards.map((card) => {
      const { originalId, ...cardData } = card;
      const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      const baseX = cardData.x ?? 0;
      const baseY = cardData.y ?? 0;
      const text = typeof cardData.text === 'string' ? cardData.text : '';

      return {
        ...cardData,
        id,
        x: baseX + offset,
        y: baseY + offset,
        isPlaceholder: text.trim().length === 0,
      };
    });

    const cardIdMap = new Map();
    clipboardCards.forEach((card, index) => {
      if (card.originalId) {
        cardIdMap.set(card.originalId, pastedCards[index].id);
      }
    });

    const connectorsToAdd = clipboardConnectors
      .filter((connector) => {
        if (!connector?.source?.cardId || !connector?.target?.cardId) {
          return false;
        }

        return (
          cardIdMap.has(connector.source.cardId) &&
          cardIdMap.has(connector.target.cardId)
        );
      })
      .map((connector) => {
        const clone = cloneConnector(connector);
        const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
        return {
          ...clone,
          id,
          source: {
            ...clone.source,
            cardId: cardIdMap.get(clone.source.cardId),
          },
          target: {
            ...clone.target,
            cardId: cardIdMap.get(clone.target.cardId),
          },
        };
      });

    recordSnapshot();
    setCards((prev) => [...prev, ...pastedCards]);

    if (connectorsToAdd.length > 0) {
      setConnectors((prev) => [...prev, ...connectorsToAdd]);
    }

    clipboardRef.current = {
      cards: pastedCards.map(({ id, ...rest }) => ({ ...rest, originalId: id })),
      connectors: connectorsToAdd.map((connector) => {
        const { id, ...rest } = cloneConnector(connector);
        return rest;
      }),
    };

    const newIds = pastedCards.map((card) => card.id);
    setSelectedCardIds(newIds);
    setSelectedConnectorIds(connectorsToAdd.map((connector) => connector.id));
    setActiveCardId(newIds[newIds.length - 1] ?? null);
    setEditingCardId(null);
    setHoveredCardId(newIds[newIds.length - 1] ?? null);
  }, [recordSnapshot]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.code === 'Space' && editingCardId === null) {
        event.preventDefault();
        setSpaceHeld(true);
      }

      if (editingCardId !== null) return;

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        if (event.shiftKey) {
          redo();
        } else {
          undo();
        }
        return;
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

      if (!event.metaKey && !event.ctrlKey && event.key.toLowerCase() === 'c') {
        event.preventDefault();
        addCard();
        return;
      }

      if (!event.metaKey && !event.ctrlKey && event.key.toLowerCase() === 'a') {
        event.preventDefault();
        startConnectorCreation();
        return;
      }

      if (
        (event.key === 'Backspace' || event.key === 'Delete') &&
        (selectedCardIds.length > 0 || selectedConnectorIds.length > 0)
      ) {
        event.preventDefault();
        recordSnapshot();
        const idsToRemove = new Set(selectedCardIds);
        const connectorsToRemove = new Set(selectedConnectorIds);
        if (idsToRemove.size > 0) {
          setCards((prev) => prev.filter((card) => !idsToRemove.has(card.id)));
        }
        if (idsToRemove.size > 0 || connectorsToRemove.size > 0) {
          setConnectors((prev) =>
            prev.filter((connector) => {
              if (!connector) return false;
              if (connectorsToRemove.has(connector.id)) {
                return false;
              }
              if (idsToRemove.size === 0) {
                return true;
              }
              if (connector.source?.cardId && idsToRemove.has(connector.source.cardId)) {
                return false;
              }
              if (connector.target?.cardId && idsToRemove.has(connector.target.cardId)) {
                return false;
              }
              return true;
            })
          );
        }
        setSelectedCardIds([]);
        setSelectedConnectorIds([]);
        setActiveCardId(null);
        setEditingCardId((value) =>
          value && idsToRemove.has(value) ? null : value
        );
        setHoveredCardId((value) =>
          value && idsToRemove.has(value) ? null : value
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
    pasteCopiedCards,
    recordSnapshot,
    redo,
    selectedCardIds,
    selectedConnectorIds,
    startConnectorCreation,
    undo,
  ]);

  const toWorldSpace = useCallback((event) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left - panRef.current.x) / scaleRef.current,
      y: (event.clientY - rect.top - panRef.current.y) / scaleRef.current,
    };
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

      const pointer = toWorldSpace(event);
      const interaction = interactionRef.current;

      if (spaceHeld && editingCardId === null) {
        setInteraction({
          type: 'pan',
          pointerId: event.pointerId,
          origin: { x: event.clientX, y: event.clientY },
          start: { ...panRef.current },
          hasSnapshot: false,
        });
        return;
      }

      if (
        interaction?.type === 'connector-create' &&
        interaction.stage === 'await-source'
      ) {
        const card = findCardAtPoint(pointer);
        if (!card) {
          setDraftConnector(null);
          return;
        }

        const anchor = calculateConnectorAnchor(card, pointer);
        const draftId = `draft-${Date.now()}-${Math.random().toString(16).slice(2)}`;
        setDraftConnector({
          id: draftId,
          originId: null,
          source: { cardId: card.id, anchor },
          target: { cardId: null, anchor: null, absolute: pointer },
          bends: [],
        });
        setSelectedCardIds([]);
        setSelectedConnectorIds([]);
        setActiveCardId(null);
        setInteraction({
          type: 'connector-create',
          stage: 'dragging-target',
          pointerId: event.pointerId,
          sourceCardId: card.id,
          sourceAnchor: anchor,
          draftId,
          hasSnapshot: false,
        });
        return;
      }

      const connectorHit = findConnectorHit(
        pointer,
        connectorsRef.current,
        cardsRef.current,
        scaleRef.current
      );

      if (connectorHit) {
        const connectorId = connectorHit.connector.id;
        const additive = event.shiftKey;
        setActiveCardId(null);
        setSelectedCardIds([]);
        setEditingCardId(null);
        setSelectedConnectorIds((prev) => {
          if (additive) {
            const already = prev.includes(connectorId);
            if (already) {
              return prev.filter((id) => id !== connectorId);
            }
            return [...prev, connectorId];
          }
          if (prev.length === 1 && prev[0] === connectorId) {
            return prev;
          }
          return [connectorId];
        });

        if (connectorHit.type === 'endpoint') {
          const clone = cloneConnector(connectorHit.connector);
          setDraftConnector({ ...clone, originId: connectorId });
          setInteraction({
            type: 'connector-endpoint',
            pointerId: event.pointerId,
            connectorId,
            endpoint: connectorHit.endpoint,
            hasSnapshot: false,
          });
        } else if (connectorHit.type === 'bend') {
          const clone = cloneConnector(connectorHit.connector);
          setDraftConnector({ ...clone, originId: connectorId });
          const bend = connectorHit.connector.bends?.[connectorHit.index];
          setInteraction({
            type: 'connector-bend',
            pointerId: event.pointerId,
            connectorId,
            bendIndex: connectorHit.index,
            offset: bend
              ? {
                  x: pointer.x - bend.x,
                  y: pointer.y - bend.y,
                }
              : { x: 0, y: 0 },
            hasSnapshot: false,
          });
        } else if (connectorHit.type === 'segment') {
          const initial = cloneConnector(connectorHit.connector);
          setDraftConnector(null);
          setInteraction({
            type: 'connector-move',
            pointerId: event.pointerId,
            connectorId,
            startPointer: pointer,
            initial,
            hasSnapshot: false,
          });
        } else {
          setDraftConnector(null);
          setInteraction({ type: 'idle' });
        }
        return;
      }

      const card = findCardAtPoint(pointer);

      if (!card) {
        setActiveCardId(null);
        setSelectedCardIds([]);
        setSelectedConnectorIds([]);
        setHoveredCardId(null);
        setInteraction({ type: 'idle' });
        setEditingCardId(null);
        return;
      }

      setSelectedConnectorIds([]);
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
          hasSnapshot: false,
        });
        return;
      }

      setInteraction({
        type: 'drag',
        pointerId: event.pointerId,
        cardId: card.id,
        offset: { x: pointer.x - card.x, y: pointer.y - card.y },
        hasSnapshot: false,
      });
    },
    [
      editingCardId,
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
      }

      if (!interaction || interaction.type === 'idle') {
        return;
      }

      if (interaction.type === 'pan') {
        const deltaX = event.clientX - interaction.origin.x;
        const deltaY = event.clientY - interaction.origin.y;
        prepareHistoryForInteraction();
        setPan({
          x: interaction.start.x + deltaX,
          y: interaction.start.y + deltaY,
        });
        return;
      }

      if (interaction.type === 'drag') {
        prepareHistoryForInteraction();
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
        prepareHistoryForInteraction();
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
        return;
      }

      if (
        interaction.type === 'connector-create' &&
        interaction.stage === 'dragging-target'
      ) {
        const targetCard = findCardAtPoint(pointer);
        const sourceCard = cardsRef.current.find(
          (card) => card.id === interaction.sourceCardId
        );
        if (!sourceCard) {
          setDraftConnector(null);
          return;
        }

        const anchor = targetCard
          ? calculateConnectorAnchor(targetCard, pointer)
          : null;

        setDraftConnector({
          id: interaction.draftId,
          originId: null,
          source: {
            cardId: sourceCard.id,
            anchor: interaction.sourceAnchor,
          },
          target: targetCard
            ? { cardId: targetCard.id, anchor }
            : { cardId: null, anchor: null, absolute: pointer },
          bends: [],
        });
        return;
      }

      if (interaction.type === 'connector-endpoint') {
        prepareHistoryForInteraction();
        const connector = connectorsRef.current.find(
          (item) => item.id === interaction.connectorId
        );
        if (!connector) {
          setDraftConnector(null);
          return;
        }

        const endpointKey = interaction.endpoint === 'source' ? 'source' : 'target';
        const targetCard = findCardAtPoint(pointer);
        const previewEndpoint = targetCard
          ? { cardId: targetCard.id, anchor: calculateConnectorAnchor(targetCard, pointer) }
          : { cardId: null, anchor: null, absolute: pointer };
        const clone = cloneConnector(connector);
        setDraftConnector({
          ...clone,
          originId: connector.id,
          [endpointKey]: previewEndpoint,
        });
        return;
      }

      if (interaction.type === 'connector-move') {
        prepareHistoryForInteraction();
        const reference =
          interaction.initial ??
          connectorsRef.current.find((item) => item.id === interaction.connectorId);
        if (!reference) {
          setDraftConnector(null);
          return;
        }

        const delta = {
          x: pointer.x - interaction.startPointer.x,
          y: pointer.y - interaction.startPointer.y,
        };

        const translated = translateConnector(reference, delta);
        if (translated) {
          setDraftConnector({ ...translated, originId: interaction.connectorId });
        } else {
          setDraftConnector(null);
        }
        return;
      }

      if (interaction.type === 'connector-bend') {
        prepareHistoryForInteraction();
        const connector = connectorsRef.current.find(
          (item) => item.id === interaction.connectorId
        );
        if (!connector) {
          setDraftConnector(null);
          return;
        }

        const bends = connector.bends ? [...connector.bends] : [];
        const offset = interaction.offset ?? { x: 0, y: 0 };
        const nextPoint = {
          x: pointer.x - offset.x,
          y: pointer.y - offset.y,
        };
        bends[interaction.bendIndex] = nextPoint;
        const clone = cloneConnector(connector);
        setDraftConnector({ ...clone, bends, originId: connector.id });
      }
    },
    [findCardAtPoint, prepareHistoryForInteraction, spaceHeld, toWorldSpace]
  );

  const clearInteraction = useCallback(() => {
    setDraftConnector(null);
    setInteraction({ type: 'idle' });
  }, [setInteraction]);

  const handlePointerUp = useCallback(
    (event) => {
      if (event?.pointerId != null) {
        canvasRef.current?.releasePointerCapture?.(event.pointerId);
      }
      const interaction = interactionRef.current;

      if (
        interaction?.type === 'connector-create' &&
        interaction.stage === 'dragging-target'
      ) {
        const pointer = toWorldSpace(event);
        const sourceCard = cardsRef.current.find(
          (card) => card.id === interaction.sourceCardId
        );
        const targetCard = findCardAtPoint(pointer);

        if (sourceCard && targetCard) {
          const anchor = calculateConnectorAnchor(targetCard, pointer);
          const newConnector = {
            id: `connector-${Date.now()}-${Math.random().toString(16).slice(2)}`,
            source: {
              cardId: sourceCard.id,
              anchor: interaction.sourceAnchor,
            },
            target: {
              cardId: targetCard.id,
              anchor,
            },
            bends: [],
          };
          recordSnapshot();
          setConnectors((prev) => [...prev, newConnector]);
          setSelectedConnectorIds([newConnector.id]);
          setSelectedCardIds([]);
          setActiveCardId(null);
        }

        setDraftConnector(null);
        setInteraction({
          type: 'connector-create',
          stage: 'await-source',
          hasSnapshot: false,
        });
        return;
      }

      if (interaction?.type === 'connector-endpoint') {
        const pointer = toWorldSpace(event);
        const connector = connectorsRef.current.find(
          (item) => item.id === interaction.connectorId
        );
        if (connector) {
          const endpointKey = interaction.endpoint === 'source' ? 'source' : 'target';
          const targetCard = findCardAtPoint(pointer);
          if (targetCard) {
            const anchor = calculateConnectorAnchor(targetCard, pointer);
            const previous = connector[endpointKey];
            const hasChanged =
              previous?.cardId !== targetCard.id ||
              !anchorsEqual(previous?.anchor, anchor);

            if (hasChanged) {
              recordSnapshot();
              setConnectors((prev) =>
                prev.map((item) =>
                  item.id === connector.id
                    ? {
                        ...item,
                        [endpointKey]: { cardId: targetCard.id, anchor },
                      }
                    : item
                )
              );
            }
          }
        }

        clearInteraction();
        return;
      }

      if (interaction?.type === 'connector-move') {
        const pointer = toWorldSpace(event);
        const reference =
          interaction.initial ??
          connectorsRef.current.find((item) => item.id === interaction.connectorId);

        if (reference) {
          const delta = {
            x: pointer.x - interaction.startPointer.x,
            y: pointer.y - interaction.startPointer.y,
          };

          const translated = translateConnector(reference, delta);
          if (translated && connectorTranslationChanged(reference, translated)) {
            prepareHistoryForInteraction();
            setConnectors((prev) =>
              prev.map((item) =>
                item.id === interaction.connectorId ? translated : item
              )
            );
          }
        }

        clearInteraction();
        return;
      }

      if (interaction?.type === 'connector-bend') {
        const pointer = toWorldSpace(event);
        const connector = connectorsRef.current.find(
          (item) => item.id === interaction.connectorId
        );
        if (connector) {
          const offset = interaction.offset ?? { x: 0, y: 0 };
          const nextPoint = {
            x: pointer.x - offset.x,
            y: pointer.y - offset.y,
          };
          const currentPoint = connector.bends?.[interaction.bendIndex];
          if (
            !currentPoint ||
            Math.abs(currentPoint.x - nextPoint.x) > 0.01 ||
            Math.abs(currentPoint.y - nextPoint.y) > 0.01
          ) {
            recordSnapshot();
            setConnectors((prev) =>
              prev.map((item) => {
                if (item.id !== connector.id) {
                  return item;
                }
                const existing = item.bends ? [...item.bends] : [];
                existing[interaction.bendIndex] = nextPoint;
                return {
                  ...item,
                  bends: existing,
                };
              })
            );
          }
        }

        clearInteraction();
        return;
      }

      clearInteraction();
    },
    [
      clearInteraction,
      findCardAtPoint,
      prepareHistoryForInteraction,
      recordSnapshot,
      toWorldSpace,
    ]
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

      recordSnapshot();
      setPan(newPan);
      setScale(nextScale);
    },
    [recordSnapshot]
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

      const cardMap = new Map();
      for (const card of cards) {
        cardMap.set(card.id, card);
      }

      const blockedConnectorId = draftConnector?.originId ?? null;

      for (const connector of connectors) {
        if (blockedConnectorId && connector.id === blockedConnectorId) {
          continue;
        }

        drawConnector(ctx, connector, {
          cardMap,
          selected: selectedConnectorIds.includes(connector.id),
          scale,
        });
      }

      if (draftConnector) {
        drawConnector(ctx, draftConnector, {
          cardMap,
          selected: true,
          scale,
          isDraft: true,
        });
      }

      const selectedCount = selectedCardIds.length;

      for (const card of cards) {
        drawCard(ctx, card, {
          isActive: card.id === activeCardId && selectedCount <= 1,
          isEditing: card.id === editingCardId,
          isHovered: card.id === hoveredCardId,
          isSelected: selectedCardIds.includes(card.id),
          selectedCount,
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
    connectors,
    activeCardId,
    editingCardId,
    hoveredCardId,
    pan,
    scale,
    handleAnimationVersion,
    selectedCardIds,
    selectedConnectorIds,
    draftConnector,
  ]);

  const handleTextChange = useCallback(
    (event) => {
      const value = event.target.value;
      const ctx = getMeasurementContext();

      if (!editingSnapshotRef.current) {
        recordSnapshot();
        editingSnapshotRef.current = true;
      }

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
    [editingCardId, getMeasurementContext, recordSnapshot]
  );

  const handleCardColorChange = useCallback(
    (cardId, option) => {
      recordSnapshot();
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
    },
    [recordSnapshot]
  );

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
    setSelectedConnectorIds([]);
    setEditingCardId(null);
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

      <UndoRedoPill
        canUndo={historyStatus.canUndo}
        canRedo={historyStatus.canRedo}
        onUndo={undo}
        onRedo={redo}
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

      {activeCard && toolbarPosition && selectedCardIds.length <= 1 && (
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

      <PillNavigation
        onAddCard={addCard}
        onStartConnector={startConnectorCreation}
      />
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

function cloneConnector(connector) {
  if (!connector) {
    return {
      id: '',
      source: { cardId: null, anchor: null },
      target: { cardId: null, anchor: null },
      bends: [],
    };
  }

  const cloneEnd = (end) => {
    if (!end) {
      return { cardId: null, anchor: null };
    }

    const next = {
      cardId: end.cardId ?? null,
      anchor: end.anchor ? { ...end.anchor } : null,
    };

    if (end.absolute) {
      next.absolute = { ...end.absolute };
    }

    return next;
  };

  return {
    id: connector.id,
    source: cloneEnd(connector.source),
    target: cloneEnd(connector.target),
    bends: Array.isArray(connector.bends)
      ? connector.bends.map((bend) => ({ ...bend }))
      : [],
  };
}

function calculateConnectorAnchor(card, point) {
  if (!card || !card.width || !card.height) {
    return { x: 0.5, y: 0.5 };
  }

  const localX = clamp((point.x - card.x) / card.width, 0, 1);
  const localY = clamp((point.y - card.y) / card.height, 0, 1);

  const candidates = [
    { distance: localX, anchor: { x: 0, y: localY } },
    { distance: 1 - localX, anchor: { x: 1, y: localY } },
    { distance: localY, anchor: { x: localX, y: 0 } },
    { distance: 1 - localY, anchor: { x: localX, y: 1 } },
  ];

  candidates.sort((a, b) => a.distance - b.distance);
  const chosen = candidates[0]?.anchor ?? { x: 0.5, y: 0.5 };

  return {
    x: clamp(chosen.x, 0, 1),
    y: clamp(chosen.y, 0, 1),
  };
}

function anchorsEqual(a, b) {
  if (!a && !b) return true;
  if (!a || !b) return false;
  return Math.abs(a.x - b.x) < 0.001 && Math.abs(a.y - b.y) < 0.001;
}

function translateConnector(connector, delta) {
  if (!connector || !delta) {
    return null;
  }

  const next = cloneConnector(connector);

  next.source = translateConnectorEnd(next.source, delta);
  next.target = translateConnectorEnd(next.target, delta);

  if (Array.isArray(next.bends) && next.bends.length > 0) {
    next.bends = next.bends.map((bend) => ({
      x: bend.x + delta.x,
      y: bend.y + delta.y,
    }));
  }

  return next;
}

function translateConnectorEnd(end, delta) {
  if (!end) {
    return { cardId: null, anchor: null };
  }

  if (end.cardId) {
    return {
      cardId: end.cardId,
      anchor: end.anchor ? { ...end.anchor } : null,
    };
  }

  const absolute = end.absolute ?? { x: 0, y: 0 };

  return {
    cardId: null,
    anchor: null,
    absolute: {
      x: absolute.x + delta.x,
      y: absolute.y + delta.y,
    },
  };
}

function connectorTranslationChanged(original, translated) {
  if (!original || !translated) {
    return false;
  }

  if (connectorEndsDiffer(original.source, translated.source)) {
    return true;
  }

  if (connectorEndsDiffer(original.target, translated.target)) {
    return true;
  }

  const originalBends = Array.isArray(original.bends) ? original.bends : [];
  const translatedBends = Array.isArray(translated.bends) ? translated.bends : [];

  if (originalBends.length !== translatedBends.length) {
    return true;
  }

  for (let index = 0; index < originalBends.length; index += 1) {
    const sourceBend = originalBends[index];
    const targetBend = translatedBends[index];
    if (
      !sourceBend ||
      !targetBend ||
      Math.abs(sourceBend.x - targetBend.x) > 0.01 ||
      Math.abs(sourceBend.y - targetBend.y) > 0.01
    ) {
      return true;
    }
  }

  return false;
}

function connectorEndsDiffer(a, b) {
  if (!a && !b) {
    return false;
  }

  if (!a || !b) {
    return true;
  }

  if (a.cardId || b.cardId) {
    return (a.cardId ?? null) !== (b.cardId ?? null) || !anchorsEqual(a.anchor, b.anchor);
  }

  const source = a.absolute ?? { x: 0, y: 0 };
  const target = b.absolute ?? { x: 0, y: 0 };

  return (
    Math.abs(source.x - target.x) > 0.01 || Math.abs(source.y - target.y) > 0.01
  );
}

function resolveConnectorEndPosition(end, cardMap) {
  if (!end) {
    return { point: null, attached: false };
  }

  if (end.cardId && end.anchor) {
    const card = cardMap.get(end.cardId);
    if (card) {
      return {
        point: {
          x: card.x + card.width * end.anchor.x,
          y: card.y + card.height * end.anchor.y,
        },
        attached: true,
      };
    }
  }

  if (end.absolute) {
    return { point: { ...end.absolute }, attached: false };
  }

  return { point: null, attached: false };
}

function getConnectorGeometry(connector, cardMap) {
  const start = resolveConnectorEndPosition(connector?.source, cardMap);
  const end = resolveConnectorEndPosition(connector?.target, cardMap);
  const points = [];

  if (start.point) {
    points.push(start.point);
  }

  if (Array.isArray(connector?.bends)) {
    for (const bend of connector.bends) {
      if (bend && typeof bend.x === 'number' && typeof bend.y === 'number') {
        points.push({ x: bend.x, y: bend.y });
      }
    }
  }

  if (end.point) {
    points.push(end.point);
  }

  return { points, start, end };
}

function findConnectorHit(pointer, connectors, cards, scale) {
  if (!Array.isArray(connectors) || connectors.length === 0) {
    return null;
  }

  const cardMap = new Map();
  if (Array.isArray(cards)) {
    for (const card of cards) {
      cardMap.set(card.id, card);
    }
  }

  const effectiveScale = Math.max(scale ?? 1, 0.01);
  const handleRadius = CONNECTOR_HANDLE_RADIUS / effectiveScale;
  const segmentThreshold = CONNECTOR_HIT_DISTANCE / effectiveScale;

  for (let index = connectors.length - 1; index >= 0; index -= 1) {
    const connector = connectors[index];
    if (!connector) continue;

    const { points } = getConnectorGeometry(connector, cardMap);
    if (points.length < 2) {
      continue;
    }

    const startPoint = points[0];
    const endPoint = points[points.length - 1];

    if (
      Math.hypot(pointer.x - startPoint.x, pointer.y - startPoint.y) <=
      handleRadius
    ) {
      return { type: 'endpoint', connector, endpoint: 'source' };
    }

    if (
      Math.hypot(pointer.x - endPoint.x, pointer.y - endPoint.y) <=
      handleRadius
    ) {
      return { type: 'endpoint', connector, endpoint: 'target' };
    }

    if (Array.isArray(connector.bends)) {
      for (let bendIndex = connector.bends.length - 1; bendIndex >= 0; bendIndex -= 1) {
        const bend = connector.bends[bendIndex];
        if (!bend) continue;
        if (Math.hypot(pointer.x - bend.x, pointer.y - bend.y) <= handleRadius) {
          return { type: 'bend', connector, index: bendIndex };
        }
      }
    }

    for (let i = 0; i < points.length - 1; i += 1) {
      const distance = distanceToSegment(pointer, points[i], points[i + 1]);
      if (distance <= segmentThreshold) {
        return { type: 'segment', connector };
      }
    }
  }

  return null;
}

function distanceToSegment(point, start, end) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;

  if (dx === 0 && dy === 0) {
    return Math.hypot(point.x - start.x, point.y - start.y);
  }

  const t = ((point.x - start.x) * dx + (point.y - start.y) * dy) / (dx * dx + dy * dy);
  const clamped = Math.max(0, Math.min(1, t));
  const closest = {
    x: start.x + clamped * dx,
    y: start.y + clamped * dy,
  };

  return Math.hypot(point.x - closest.x, point.y - closest.y);
}

function drawConnector(ctx, connector, { cardMap, selected, scale, isDraft = false }) {
  const { points } = getConnectorGeometry(connector, cardMap);
  if (points.length < 2) {
    return;
  }

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = selected ? '#2563EB' : '#1F2937';
  const effectiveScale = Math.max(scale ?? 1, 0.01);
  ctx.lineWidth =
    (selected ? CONNECTOR_SELECTED_LINE_WIDTH : CONNECTOR_LINE_WIDTH) /
    effectiveScale;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i += 1) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.stroke();

  const capColor = selected ? '#2563EB' : '#1F2937';
  drawConnectorCap(ctx, points[0], capColor, effectiveScale);
  drawConnectorCap(ctx, points[points.length - 1], capColor, effectiveScale);

  if (selected || isDraft) {
    ctx.fillStyle = selected ? '#2563EB' : '#1F2937';
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1.5 / effectiveScale;

    const handlePoints = [points[0]];
    if (Array.isArray(connector.bends)) {
      for (const bend of connector.bends) {
        if (bend && typeof bend.x === 'number' && typeof bend.y === 'number') {
          handlePoints.push(bend);
        }
      }
    }
    handlePoints.push(points[points.length - 1]);

    for (const point of handlePoints) {
      ctx.beginPath();
      ctx.arc(point.x, point.y, CONNECTOR_HANDLE_RADIUS / effectiveScale, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  }

  ctx.restore();
}

function drawConnectorCap(ctx, point, color, scale = 1) {
  if (!point) {
    return;
  }

  const effectiveScale = Math.max(scale, 0.01);
  const radius = CONNECTOR_CAP_RADIUS / effectiveScale;

  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawCard(
  ctx,
  card,
  {
    isActive,
    isEditing,
    isHovered,
    handleAlpha,
    isSelected = false,
    selectedCount = 0,
  }
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

  const shouldHighlightSelection = isSelected && selectedCount > 1;
  const strokeWidth = shouldHighlightSelection ? 2 : 1;
  const strokeColor = shouldHighlightSelection
    ? 'rgba(0, 0, 0, 0.4)'
    : 'rgba(17, 17, 17, 0.12)';

  if (isActive) {
    ctx.save();
    ctx.shadowColor = 'rgba(15, 23, 42, 0.18)';
    ctx.shadowBlur = 32;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 16;
    ctx.fill();
    ctx.restore();
  } else {
    ctx.fill();
  }

  ctx.lineWidth = strokeWidth;
  ctx.strokeStyle = strokeColor;
  ctx.stroke();

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
