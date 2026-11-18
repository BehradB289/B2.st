/**
 * VoiceProposal - استودیو B2.st
 * Groq Cloud Client Singleton
 */
import Groq from 'groq-sdk';

class GroqClientManager {
  private static instance: Groq | null = null;

  public static getInstance(): Groq {
    if (!this.instance) {
      const apiKey = process.env.GROQ_API_KEY || 'test-groq-key';
      this.instance = new Groq({
        apiKey,
      });
    }
    return this.instance;
  }

  public static resetInstance(): void {
    this.instance = null;
  }
}

export const groqClient = GroqClientManager.getInstance();
export { GroqClientManager };