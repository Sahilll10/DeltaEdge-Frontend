import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:8080/ws'

let client = null
const subscriptions = {}

export function connectWebSocket(onConnect) {
  if (client?.connected) return

  client = new Client({
    webSocketFactory: () => new SockJS(WS_URL),
    reconnectDelay: 5000,
    onConnect: () => {
      console.log('[WS] Connected to DeltaEdge broker')
      onConnect?.()
    },
    onDisconnect: () => console.log('[WS] Disconnected'),
    onStompError: (frame) => console.error('[WS] STOMP error', frame),
  })

  client.activate()
}

export function disconnectWebSocket() {
  client?.deactivate()
  client = null
}

export function subscribeTopic(topic, callback) {
  if (!client?.connected) {
    console.warn('[WS] Not connected, cannot subscribe to', topic)
    return null
  }
  if (subscriptions[topic]) {
    subscriptions[topic].unsubscribe()
  }
  const sub = client.subscribe(topic, (msg) => {
    try {
      const data = JSON.parse(msg.body)
      callback(data)
    } catch {
      callback(msg.body)
    }
  })
  subscriptions[topic] = sub
  return sub
}

export function unsubscribeTopic(topic) {
  subscriptions[topic]?.unsubscribe()
  delete subscriptions[topic]
}

export function isConnected() {
  return client?.connected ?? false
}
