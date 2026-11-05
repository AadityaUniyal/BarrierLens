"""
BarrierLens Reactive Event Bus
Broadcasts physical navigation steps and Tarjan SCC trap findings
in real time to update the Pulse Dashboard Apple Watch Activity Rings.
"""

import time
import json
from typing import Callable, List, Dict, Any

class ReactiveEventBus:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(ReactiveEventBus, cls).__new__(cls)
            cls._instance.subscribers: List[Callable[[Dict[str, Any]], None]] = []
        return cls._instance

    def subscribe(self, callback: Callable[[Dict[str, Any]], None]):
        """Subscribes an SSE or WebSocket stream listener."""
        if callback not in self.subscribers:
            self.subscribers.append(callback)

    def unsubscribe(self, callback: Callable[[Dict[str, Any]], None]):
        """Removes an active listener."""
        if callback in self.subscribers:
            self.subscribers.remove(callback)

    def publish(self, event_type: str, payload: Dict[str, Any]):
        """Emits an event to all subscribers."""
        event = {
            "type": event_type,
            "timestamp": time.time(),
            "data": payload
        }
        for sub in list(self.subscribers):
            try:
                sub(event)
            except Exception:
                # Remove stale listeners
                self.subscribers.remove(sub)

event_bus = ReactiveEventBus()
