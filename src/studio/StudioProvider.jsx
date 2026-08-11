import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react'
import * as H from './history'
import { buildBaseCanvas, exportBlob as renderExportBlob } from './renderer'
import { exportSizeFor, maxLongEdgeFor } from './cropMath'
import {
  initialState,
  selectBaseSize,
  selectIsEdited,
  selectRatio,
  studioReducer,
} from './studioReducer'

/**
 * Two contexts, deliberately.
 *
 * `StateContext` changes on every slider tick. `ActionsContext` never changes
 * identity at all, so a component that only dispatches — the toolbar, the top
 * bar, the rail — subscribes to nothing and never re-renders while you drag.
 * One combined context would re-render all of them a hundred times a second.
 */
const StateContext = createContext(null)
const ActionsContext = createContext(null)

const MAX_FILE_MB = 15

export function StudioProvider({ children }) {
  const [state, dispatch] = useReducer(studioReducer, initialState)

  // The base canvas lives in a ref (it is a big mutable object, not state) with
  // a counter beside it so consumers know when it has been rebuilt.
  const baseRef = useRef(null)
  const [baseVersion, setBaseVersion] = useState(0)

  const { source, edit } = state
  const { rotation, flipH } = edit

  useEffect(() => {
    baseRef.current = source ? buildBaseCanvas(source, rotation, flipH) : null
    setBaseVersion((v) => v + 1)
  }, [source, rotation, flipH])

  // Keep a live handle on state for callbacks that must not re-subscribe.
  const stateRef = useRef(state)
  stateRef.current = state

  /** Shared image ingestion for the picker, drops and the library. */
  const ingest = useCallback((src, info, revoke) => {
    dispatch({ type: 'IMAGE_LOADING' })
    const img = new Image()
    img.crossOrigin = 'anonymous' // guards against tainting if a remote URL is used
    img.onload = () => {
      dispatch({ type: 'IMAGE_LOADED', source: img, meta: info })
      revoke?.()
    }
    img.onerror = () => {
      dispatch({ type: 'IMAGE_ERROR', message: 'That image could not be opened.' })
      revoke?.()
    }
    img.src = src
  }, [])

  const actions = useMemo(() => {
    const loadFromSource = ({ url, name, alt, title }) => {
      if (!url) return
      ingest(url, { name: name ?? url.split('/').pop(), alt, title })
    }

    const loadFile = (file) => {
      if (!file) return
      if (!file.type.startsWith('image/')) {
        dispatch({ type: 'IMAGE_ERROR', message: 'That file is not an image.' })
        return
      }
      if (file.size > MAX_FILE_MB * 1024 * 1024) {
        dispatch({ type: 'IMAGE_ERROR', message: `Images must be under ${MAX_FILE_MB}MB.` })
        return
      }
      const url = URL.createObjectURL(file)
      ingest(url, { name: file.name, title: file.name }, () => URL.revokeObjectURL(url))
    }

    /** Renders at full resolution. Always uses final quality — sharpen included. */
    const exportImage = (longEdge, type, quality) => {
      const s = stateRef.current
      const size = exportSizeFor(s.edit.crop, longEdge)
      return renderExportBlob(baseRef.current, s.edit.crop, s.edit.adjustments, size, type, quality)
    }

    return {
      dispatch,
      loadFile,
      loadFromSource,
      exportImage,

      // Discrete
      clear: () => dispatch({ type: 'CLEAR' }),
      reset: () => dispatch({ type: 'RESET' }),
      undo: () => dispatch({ type: 'UNDO' }),
      redo: () => dispatch({ type: 'REDO' }),
      rotate: (turns = 1) => dispatch({ type: 'ROTATE', turns }),
      flip: () => dispatch({ type: 'FLIP' }),
      setAspect: (id) => dispatch({ type: 'SET_ASPECT', id }),
      setFilter: (id) => dispatch({ type: 'SET_FILTER', id }),
      dismissError: () => dispatch({ type: 'DISMISS_ERROR' }),

      // Continuous — bracket with begin/commit so a drag is one undo step
      begin: () => dispatch({ type: 'BEGIN' }),
      commit: () => dispatch({ type: 'COMMIT' }),
      setAdjustment: (key, value) => dispatch({ type: 'SET_ADJUSTMENT', key, value }),
      setCrop: (crop) => dispatch({ type: 'SET_CROP', crop }),

      // View
      setZoom: (zoom) => dispatch({ type: 'SET_ZOOM', zoom }),
      zoomStep: (dir) => dispatch({ type: 'ZOOM_STEP', dir }),
      zoomFit: () => dispatch({ type: 'ZOOM_FIT' }),
      zoomActual: () => dispatch({ type: 'ZOOM_ACTUAL' }),
      setPan: (x, y) => dispatch({ type: 'SET_PAN', x, y }),
      setComparing: (value) => dispatch({ type: 'SET_COMPARING', value }),
    }
  }, [ingest])

  const value = useMemo(() => {
    const baseSize = selectBaseSize(state)
    return {
      ...state,
      baseRef,
      baseVersion,
      baseSize,
      ratio: selectRatio(state),
      isEdited: selectIsEdited(state),
      hasImage: Boolean(state.source),
      canUndo: H.canUndo(state.history),
      canRedo: H.canRedo(state.history),
      maxLongEdge: maxLongEdgeFor(state.edit.crop),
    }
  }, [state, baseVersion])

  return (
    <ActionsContext.Provider value={actions}>
      <StateContext.Provider value={value}>{children}</StateContext.Provider>
    </ActionsContext.Provider>
  )
}

export function useStudio() {
  const ctx = useContext(StateContext)
  if (!ctx) throw new Error('useStudio must be used inside <StudioProvider>')
  return ctx
}

export function useStudioActions() {
  const ctx = useContext(ActionsContext)
  if (!ctx) throw new Error('useStudioActions must be used inside <StudioProvider>')
  return ctx
}
