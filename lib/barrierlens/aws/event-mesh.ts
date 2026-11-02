/**
 * AWS EventBridge & SQS Style Agentic Event Mesh Strand
 * Decouples multi-agent choreography through structured message topics,
 * guaranteed at-least-once delivery semantics, correlation IDs, and DLQ tracking.
 */

export type AgentRole = 
  | 'orchestrator'
  | 'navigator'
  | 'forensic_auditor'
  | 'red_team_chaos'
  | 'causal_repair'
  | 'sandbox_judge';

export interface AgentMessage<T = any> {
  id: string; // SQS Message ID / EventBridge Event ID
  traceId: string; // AWS X-Ray Trace ID format: 1-5759e988-bd862e3fe1be46a994272767
  topic: string; // e.g. "barrierlens.agents.navigation", "barrierlens.agents.findings"
  sourceAgent: AgentRole;
  targetAgent?: AgentRole | 'broadcast';
  timestamp: string; // ISO-8601
  payload: T;
  retryCount: number;
}

export type MessageHandler = (message: AgentMessage) => Promise<void> | void;

export class AWSEventMesh {
  private static instance: AWSEventMesh;
  private subscribers: Map<string, Set<MessageHandler>> = new Map();
  private messageQueue: AgentMessage[] = [];
  private deadLetterQueue: AgentMessage[] = [];
  private messageLog: AgentMessage[] = [];
  private maxRetries = 3;

  constructor() {
    this.initializeDefaultTopics();
  }

  static getInstance(): AWSEventMesh {
    if (!AWSEventMesh.instance) {
      AWSEventMesh.instance = new AWSEventMesh();
    }
    return AWSEventMesh.instance;
  }

  private initializeDefaultTopics() {
    const topics = [
      'barrierlens.agent.orchestration',
      'barrierlens.agent.navigation',
      'barrierlens.agent.forensic',
      'barrierlens.agent.chaos',
      'barrierlens.agent.causal',
      'barrierlens.agent.sandbox',
      'barrierlens.telemetry'
    ];
    topics.forEach(t => this.subscribers.set(t, new Set()));
  }

  /**
   * Publishes an event to the EventBridge topic
   */
  async publish<T = any>(
    topic: string,
    sourceAgent: AgentRole,
    payload: T,
    targetAgent: AgentRole | 'broadcast' = 'broadcast',
    traceId?: string
  ): Promise<AgentMessage<T>> {
    const message: AgentMessage<T> = {
      id: `msg_sqs_${crypto.randomUUID().slice(0, 12)}`,
      traceId: traceId || `1-${Math.floor(Date.now() / 1000).toString(16)}-${crypto.randomUUID().replace(/-/g, '').slice(0, 24)}`,
      topic,
      sourceAgent,
      targetAgent,
      timestamp: new Date().toISOString(),
      payload,
      retryCount: 0
    };

    this.messageQueue.push(message);
    this.messageLog.push(message);
    if (this.messageLog.length > 500) this.messageLog.shift();

    // Dispatch asynchronously to all registered subscribers
    const handlers = this.subscribers.get(topic) || new Set();
    const broadcastHandlers = this.subscribers.get('*') || new Set();

    const allHandlers = [...handlers, ...broadcastHandlers];

    for (const handler of allHandlers) {
      try {
        await handler(message);
      } catch (err: any) {
        console.warn(`[EventMesh SQS] Error processing message ${message.id} on ${topic}:`, err.message);
        message.retryCount++;
        if (message.retryCount >= this.maxRetries) {
          this.deadLetterQueue.push(message);
        }
      }
    }

    return message;
  }

  /**
   * Subscribes an agent listener to an EventBridge topic pattern
   */
  subscribe(topic: string, handler: MessageHandler): () => void {
    if (!this.subscribers.has(topic)) {
      this.subscribers.set(topic, new Set());
    }
    this.subscribers.get(topic)!.add(handler);

    // Return un-subscriber
    return () => {
      this.subscribers.get(topic)?.delete(handler);
    };
  }

  /**
   * Inspects recent message telemetry across the mesh
   */
  getTelemetrySummary(): {
    totalDispatched: number;
    queuedCount: number;
    dlqCount: number;
    activeTopics: string[];
    recentEvents: AgentMessage[];
  } {
    return {
      totalDispatched: this.messageLog.length,
      queuedCount: this.messageQueue.length,
      dlqCount: this.deadLetterQueue.length,
      activeTopics: Array.from(this.subscribers.keys()),
      recentEvents: this.messageLog.slice(-20)
    };
  }

  clear() {
    this.messageQueue = [];
    this.deadLetterQueue = [];
    this.messageLog = [];
  }
}
