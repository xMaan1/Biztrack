import { useEffect, useRef, useCallback, useState } from 'react'

const STUN_SERVERS = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }] }

type PeerInfo = { user_id: number; role: string }

export function useWebRTC(role: 'teacher' | 'student', sessionCode: string, localStream: MediaStream | null) {
  const wsRef = useRef<WebSocket | null>(null)
  const peersRef = useRef<Map<number, RTCPeerConnection>>(new Map())
  const remoteStreamsRef = useRef<Map<number, MediaStream>>(new Map())
  const [remoteStreams, setRemoteStreams] = useState<Map<number, MediaStream>>(new Map())
  const [peers, setPeers] = useState<PeerInfo[]>([])
  const [whiteboardDataUrl, setWhiteboardDataUrl] = useState<string | null>(null)
  const reconnectTimer = useRef<ReturnType<typeof setTimeout>>()
  const connectedRef = useRef(false)
  const myUserIdRef = useRef<number>(0)

  const getToken = () => {
    try {
      const stored = localStorage.getItem('access_token') || localStorage.getItem('lms_token')
      if (stored) return stored.replace(/^"|"$/g, '')
    } catch {}
    return ''
  }

  const addStreamToPeer = useCallback((pc: RTCPeerConnection, stream: MediaStream) => {
    stream.getTracks().forEach(track => {
      if (track.kind === 'video' || track.kind === 'audio') {
        pc.addTrack(track, stream)
      }
    })
  }, [])

  const updateRemoteStreams = useCallback(() => {
    setRemoteStreams(new Map(remoteStreamsRef.current))
  }, [])

  const createPeerConnection = useCallback((targetId: number, stream: MediaStream) => {
    if (peersRef.current.has(targetId)) {
      peersRef.current.get(targetId)?.close()
      peersRef.current.delete(targetId)
    }

    const pc = new RTCPeerConnection(STUN_SERVERS)
    peersRef.current.set(targetId, pc)

    const remoteStream = new MediaStream()
    remoteStreamsRef.current.set(targetId, remoteStream)

    pc.ontrack = (event) => {
      event.streams[0].getTracks().forEach(track => {
        remoteStream.addTrack(track)
      })
      updateRemoteStreams()
    }

    pc.onicecandidate = (event) => {
      if (event.candidate && wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'ice-candidate',
          target_id: targetId,
          candidate: event.candidate.toJSON()
        }))
      }
    }

    pc.oniceconnectionstatechange = () => {
      if (['disconnected', 'failed', 'closed'].includes(pc.iceConnectionState)) {
        peersRef.current.delete(targetId)
        remoteStreamsRef.current.delete(targetId)
        updateRemoteStreams()
      }
    }

    if (stream && stream.getTracks().length > 0) {
      addStreamToPeer(pc, stream)
    }

    return pc
  }, [addStreamToPeer, updateRemoteStreams])

  const makeCall = useCallback(async (targetId: number) => {
    if (peersRef.current.has(targetId)) return
    if (!localStream || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return

    const pc = createPeerConnection(targetId, localStream)
    const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true })
    await pc.setLocalDescription(offer)
    wsRef.current.send(JSON.stringify({
      type: 'offer',
      target_id: targetId,
      sdp: pc.localDescription
    }))
  }, [localStream, createPeerConnection])

  const handleNewPeer = useCallback(async (peerId: number, peerRole: string) => {
    if (peerId === myUserIdRef.current) return
    const myId = myUserIdRef.current
    if (!myId) return

    if (peerId > myId) {
      setTimeout(async () => {
        if (!peersRef.current.has(peerId) && localStream) {
          await makeCall(peerId)
        }
      }, 600)
    }
  }, [localStream, makeCall])

  const connectToAllPeers = useCallback(async (peerList: PeerInfo[]) => {
    const myId = myUserIdRef.current
    if (!myId) return
    for (const p of peerList) {
      if (p.user_id > myId) {
        await new Promise(resolve => setTimeout(resolve, 300))
        if (!peersRef.current.has(p.user_id) && localStream) {
          await makeCall(p.user_id)
        }
      }
    }
  }, [localStream, makeCall])

  const connectWs = useCallback(() => {
    const token = getToken()
    if (!token) return

    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
    const host = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace(/^https?:\/\//, '')
    const url = `${protocol}://${host}/ws/live/${sessionCode}?token=${encodeURIComponent(token)}`

    if (wsRef.current) wsRef.current.close()
    const ws = new WebSocket(url)
    wsRef.current = ws

    ws.onopen = () => {
      connectedRef.current = true
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current)
    }

    ws.onmessage = async (event) => {
      const data = JSON.parse(event.data)

      if (data.type === 'room-info') {
        setPeers(data.peers || [])
        myUserIdRef.current = data.your_user_id || 0
        if (data.peers) {
          setTimeout(() => connectToAllPeers(data.peers as PeerInfo[]), 500)
        }
      }

      if (data.type === 'peer-joined') {
        setPeers(prev => {
          if (prev.find(p => p.user_id === data.user_id)) return prev
          return [...prev, { user_id: data.user_id, role: data.role }]
        })

        if (data.user_id !== myUserIdRef.current) {
          setTimeout(() => handleNewPeer(data.user_id, data.role), 1000)
        }
      }

      if (data.type === 'peer-left') {
        setPeers(prev => prev.filter(p => p.user_id !== data.user_id))
        const pc = peersRef.current.get(data.user_id)
        if (pc) { pc.close(); peersRef.current.delete(data.user_id) }
        remoteStreamsRef.current.delete(data.user_id)
        updateRemoteStreams()
      }

      if (data.type === 'offer') {
        const fromId = data.from
        if (!localStream) return

        if (peersRef.current.has(fromId)) {
          peersRef.current.get(fromId)?.close()
          peersRef.current.delete(fromId)
        }
        const pc = createPeerConnection(fromId, localStream)
        await pc.setRemoteDescription(new RTCSessionDescription(data.sdp))
        const answer = await pc.createAnswer()
        await pc.setLocalDescription(answer)
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'answer', target_id: fromId, sdp: pc.localDescription }))
        }
      }

      if (data.type === 'answer') {
        const pc = peersRef.current.get(data.from)
        if (pc && pc.signalingState === 'have-local-offer') {
          await pc.setRemoteDescription(new RTCSessionDescription(data.sdp))
        }
      }

      if (data.type === 'ice-candidate') {
        const pc = peersRef.current.get(data.from)
        if (pc && data.candidate) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(data.candidate))
          } catch {}
        }
      }

      if (data.type === 'whiteboard-data') {
        setWhiteboardDataUrl(data.data_url)
      }

      if (data.type === 'whiteboard-clear') {
        setWhiteboardDataUrl(null)
      }
    }

    ws.onclose = () => {
      connectedRef.current = false
      reconnectTimer.current = setTimeout(connectWs, 3000)
    }

    ws.onerror = () => {
      ws.close()
    }
  }, [sessionCode, localStream, createPeerConnection, handleNewPeer, updateRemoteStreams])

  useEffect(() => {
    if (!sessionCode || !localStream) return
    connectWs()
    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current)
      connectedRef.current = false
      peersRef.current.forEach(pc => pc.close())
      peersRef.current.clear()
      remoteStreamsRef.current.clear()
      setRemoteStreams(new Map())
      setPeers([])
      if (wsRef.current) { wsRef.current.close(); wsRef.current = null }
    }
  }, [sessionCode, localStream, connectWs])

  const cleanupAndReconnect = useCallback(() => {
    peersRef.current.forEach(pc => pc.close())
    peersRef.current.clear()
    remoteStreamsRef.current.clear()
    setRemoteStreams(new Map())
  }, [])

  const broadcastStream = useCallback((newStream: MediaStream) => {
    peersRef.current.forEach((pc) => {
      const senders = pc.getSenders()
      newStream.getTracks().forEach(track => {
        const existingSender = senders.find(s => s.track?.kind === track.kind)
        if (existingSender) {
          existingSender.replaceTrack(track)
        } else {
          pc.addTrack(track, newStream)
        }
      })
    })
  }, [])

  const sendWhiteboardData = useCallback((dataUrl: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'whiteboard-data', data_url: dataUrl }))
    }
  }, [])

  const sendWhiteboardClear = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'whiteboard-clear' }))
    }
  }, [])

  return { remoteStreams, peers, cleanupAndReconnect, broadcastStream, whiteboardDataUrl, sendWhiteboardData, sendWhiteboardClear }
}