/**
 * AI Debate Arena Service
 *
 * Features:
 * - Multi-model debates
 * - Argument tracking
 * - Scoring system
 * - Audience voting
 */

import { v4 as uuidv4 } from 'uuid';

export interface Debate {
  id: string;
  topic: string;
  description: string;
  format: 'oxford' | 'lincoln-douglas' | 'parliamentary' | 'free-form';
  teams: DebateTeam[];
  rounds: DebateRound[];
  status: 'setup' | 'in-progress' | 'completed';
  winner?: string;
  startTime?: Date;
  endTime?: Date;
}

export interface DebateTeam {
  id: string;
  name: string;
  position: 'for' | 'against';
  models: string[];
  score: number;
  arguments: Argument[];
}

export interface DebateRound {
  id: string;
  number: number;
  type: 'opening' | 'rebuttal' | 'cross-examination' | 'closing';
  speeches: Speech[];
  duration: number;
}

export interface Speech {
  id: string;
  teamId: string;
  model: string;
  content: string;
  timestamp: Date;
  duration: number;
  score?: number;
}

export interface Argument {
  id: string;
  claim: string;
  evidence: string[];
  reasoning: string;
  counterarguments: string[];
  strength: number;
}

export interface Vote {
  userId: string;
  teamId: string;
  reason?: string;
  timestamp: Date;
}

class DebateService {
  private debates: Map<string, Debate> = new Map();
  private votes: Map<string, Vote[]> = new Map();

  // ========================
  // Debate Management
  // ========================

  createDebate(
    topic: string,
    description: string,
    format: Debate['format']
  ): Debate {
    const debate: Debate = {
      id: uuidv4(),
      topic,
      description,
      format,
      teams: [],
      rounds: [],
      status: 'setup',
    };

    this.debates.set(debate.id, debate);
    return debate;
  }

  addTeam(debateId: string, team: Omit<DebateTeam, 'id' | 'score' | 'arguments'>): void {
    const debate = this.debates.get(debateId);
    if (!debate) throw new Error('Debate not found');

    debate.teams.push({
      ...team,
      id: uuidv4(),
      score: 0,
      arguments: [],
    });
  }

  // ========================
  // Debate Execution
  // ========================

  async startDebate(debateId: string): Promise<void> {
    const debate = this.debates.get(debateId);
    if (!debate) throw new Error('Debate not found');

    debate.status = 'in-progress';
    debate.startTime = new Date();

    // Initialize rounds based on format
    this.initializeRounds(debate);

    // Execute rounds sequentially
    for (const round of debate.rounds) {
      await this.executeRound(debate, round);
    }

    debate.status = 'completed';
    debate.endTime = new Date();
    debate.winner = this.determineWinner(debate);
  }

  private initializeRounds(debate: Debate): void {
    const roundTypes: DebateRound['type'][] = [];

    switch (debate.format) {
      case 'oxford':
        roundTypes.push('opening', 'rebuttal', 'rebuttal', 'closing');
        break;
      case 'lincoln-douglas':
        roundTypes.push('opening', 'cross-examination', 'rebuttal', 'closing');
        break;
      case 'parliamentary':
        roundTypes.push('opening', 'rebuttal', 'closing');
        break;
      case 'free-form':
        roundTypes.push('opening', 'rebuttal', 'closing');
        break;
    }

    debate.rounds = roundTypes.map((type, index) => ({
      id: uuidv4(),
      number: index + 1,
      type,
      speeches: [],
      duration: this.getRoundDuration(type),
    }));
  }

  private async executeRound(debate: Debate, round: DebateRound): Promise<void> {
    // Each team takes turns making speeches
    for (const team of debate.teams) {
      for (const model of team.models) {
        const speech = await this.generateSpeech(debate, team, model, round.type);
        round.speeches.push(speech);

        // Extract arguments
        const arguments = this.extractArguments(speech.content);
        team.arguments.push(...arguments);
      }
    }

    // Score speeches
    round.speeches.forEach(speech => {
      speech.score = this.scoreSpeech(speech);
    });
  }

  private async generateSpeech(
    debate: Debate,
    team: DebateTeam,
    model: string,
    roundType: DebateRound['type']
  ): Promise<Speech> {
    // In production, call actual AI model
    const prompt = this.buildPrompt(debate, team, roundType);

    const content = `[${model} ${roundType} statement]\n\n` +
      `Regarding the topic "${debate.topic}", I ${team.position === 'for' ? 'support' : 'oppose'} this position.\n\n` +
      `[AI-generated arguments would go here]`;

    return {
      id: uuidv4(),
      teamId: team.id,
      model,
      content,
      timestamp: new Date(),
      duration: content.length / 20, // Rough estimate
    };
  }

  private buildPrompt(
    debate: Debate,
    team: DebateTeam,
    roundType: DebateRound['type']
  ): string {
    let prompt = `You are participating in a debate on the topic: "${debate.topic}".\n\n`;
    prompt += `Your position: ${team.position}\n\n`;

    switch (roundType) {
      case 'opening':
        prompt += 'Present your opening statement with strong arguments.\n';
        break;
      case 'rebuttal':
        prompt += 'Rebut the opposing arguments and strengthen your position.\n';
        break;
      case 'cross-examination':
        prompt += 'Question the opposing side and defend your arguments.\n';
        break;
      case 'closing':
        prompt += 'Summarize your key points and make a compelling closing statement.\n';
        break;
    }

    return prompt;
  }

  // ========================
  // Argument Analysis
  // ========================

  private extractArguments(content: string): Argument[] {
    // Simple argument extraction (in production, use NLP)
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);

    return sentences.map(sentence => ({
      id: uuidv4(),
      claim: sentence.trim(),
      evidence: [],
      reasoning: '',
      counterarguments: [],
      strength: Math.random() * 100, // Placeholder
    }));
  }

  // ========================
  // Scoring
  // ========================

  private scoreSpeech(speech: Speech): number {
    let score = 50; // Base score

    // Length factor
    const wordCount = speech.content.split(/\s+/).length;
    if (wordCount >= 100 && wordCount <= 500) {
      score += 20;
    }

    // Coherence (simplified)
    const sentences = speech.content.split(/[.!?]+/);
    if (sentences.length >= 3) {
      score += 15;
    }

    // Add randomness for demonstration
    score += Math.random() * 15;

    return Math.min(100, score);
  }

  private determineWinner(debate: Debate): string {
    // Calculate total scores
    debate.teams.forEach(team => {
      team.score = debate.rounds.reduce((total, round) => {
        const teamSpeeches = round.speeches.filter(s => s.teamId === team.id);
        const roundScore = teamSpeeches.reduce((sum, speech) => sum + (speech.score || 0), 0);
        return total + roundScore;
      }, 0);
    });

    // Add audience votes
    const voteScores = this.calculateVoteScores(debate.id);
    debate.teams.forEach(team => {
      team.score += voteScores.get(team.id) || 0;
    });

    // Determine winner
    const winner = debate.teams.reduce((best, team) =>
      team.score > best.score ? team : best
    );

    return winner.name;
  }

  // ========================
  // Voting
  // ========================

  vote(debateId: string, userId: string, teamId: string, reason?: string): void {
    const votes = this.votes.get(debateId) || [];

    // Remove previous vote by this user
    const filtered = votes.filter(v => v.userId !== userId);

    filtered.push({
      userId,
      teamId,
      reason,
      timestamp: new Date(),
    });

    this.votes.set(debateId, filtered);
  }

  private calculateVoteScores(debateId: string): Map<string, number> {
    const votes = this.votes.get(debateId) || [];
    const scores = new Map<string, number>();

    votes.forEach(vote => {
      scores.set(vote.teamId, (scores.get(vote.teamId) || 0) + 10);
    });

    return scores;
  }

  getVotes(debateId: string): Vote[] {
    return this.votes.get(debateId) || [];
  }

  // ========================
  // Debate Retrieval
  // ========================

  getDebate(id: string): Debate | undefined {
    return this.debates.get(id);
  }

  listDebates(): Debate[] {
    return Array.from(this.debates.values());
  }

  private getRoundDuration(type: DebateRound['type']): number {
    const durations = {
      opening: 300, // 5 minutes
      rebuttal: 240, // 4 minutes
      'cross-examination': 180, // 3 minutes
      closing: 240, // 4 minutes
    };

    return durations[type];
  }
}

const debateService = new DebateService();
export default debateService;
