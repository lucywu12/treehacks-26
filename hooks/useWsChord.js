import { useEffect, useState, useRef } from 'react'

export default function useWsChord(wsUrl = (typeof window !== 'undefined' && `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.hostname}:8000/ws`) ) {
  const [chord, setChord] = useState(null)
  const wsRef = useRef(null)

  useEffect(() => {
    const ws = new WebSocket(wsUrl)
    wsRef.current = ws
    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data)
        if (data.type === 'chord') setChord(data.chord)
      } catch (err) {
        // ignore
      }
    }
    ws.onclose = () => { wsRef.current = null }
    return () => { if (wsRef.current) wsRef.current.close() }
  }, [wsUrl])

  return chord
}
