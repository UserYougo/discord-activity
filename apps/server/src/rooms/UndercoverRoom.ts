import { JWT } from "@colyseus/auth";
import { Room, Client } from "colyseus";
import { Schema, MapSchema, type } from "@colyseus/schema";

const PLAYER_COLORS = [
  "#e74c3c", // red
  "#3498db", // blue
  "#2ecc71", // green
  "#f39c12", // orange
  "#9b59b6", // purple
  "#1abc9c", // teal
  "#e91e8c", // pink
  "#e2e22a", // yellow
  "#3b1c00", // brown
  "#00bcd4", // cyan
];

const WORD_PAIRS: [string, string][] = [
  ["Coffee", "Tea"],
  ["Cat", "Dog"],
  ["Ocean", "Lake"],
  ["Castle", "Palace"],
  ["Violin", "Guitar"],
  ["Batman", "Superman"],
  ["Pizza", "Burger"],
  ["Sun", "Moon"],
  ["Diamond", "Ruby"],
  ["Chocolate", "Vanilla"],
  ["Hospital", "Clinic"],
  ["Forest", "Jungle"],
  ["Shark", "Dolphin"],
  ["Laptop", "Tablet"],
  ["Sushi", "Ramen"],
  ["Football", "Basketball"],
  ["Doctor", "Nurse"],
  ["Sword", "Dagger"],
  ["Winter", "Summer"],
  ["River", "Stream"],
  ["Piano", "Harp"],
  ["Vampire", "Zombie"],
  ["Spaceship", "Rocket"],
  ["Library", "Bookstore"],
  ["Motorcycle", "Bicycle"],
  ["Penguin", "Seal"],
  ["Wine", "Beer"],
  ["Mountain", "Hill"],
  ["Crown", "Tiara"],
  ["Ghost", "Spirit"],
];

type Role = "civilian" | "undercover" | "mrwhite";

export class Player extends Schema {
  @type("string") id: string = "";
  @type("string") username: string = "";
  @type("boolean") isHost: boolean = false;
  @type("boolean") isEliminated: boolean = false;
  @type("number") votes: number = 0;
  @type("boolean") hasDescribed: boolean = false;
  @type("string") description: string = "";
  @type("string") role: string = ""; // revealed when eliminated or game over
  @type("string") color: string = "";
}

export class UndercoverState extends Schema {
  @type("string") phase: string = "lobby";
  @type({ map: Player }) players = new MapSchema<Player>();
  @type("string") currentPlayerId: string = "";
  @type("string") lastEliminatedId: string = "";
  @type("string") winner: string = "";
  @type("string") civilianWord: string = "";
  @type("string") undercoverWord: string = "";
  @type("number") round: number = 0;
}

export class UndercoverRoom extends Room<UndercoverState> {
  state = new UndercoverState();

  private playerRoles = new Map<string, { role: Role; word: string }>();
  private playerOrder: string[] = [];
  private votesMap = new Map<string, string>();
  private hostSessionId: string = "";
  private civilianWord: string = "";
  private undercoverWord: string = "";
  private mrWhiteSessionId: string | null = null;

  static onAuth(token: string) {
    return JWT.verify(token);
  }

  onCreate(_options: any) {
    this.maxClients = 10;

    this.onMessage("start_game", (client) => {
      if (client.sessionId !== this.hostSessionId) return;
      if (this.state.phase !== "lobby") return;
      this.startGame();
    });

    this.onMessage("describe", (client, message: { description: string }) => {
      if (this.state.phase !== "description") return;
      if (this.state.currentPlayerId !== client.sessionId) return;
      const player = this.state.players.get(client.sessionId);
      if (!player || player.isEliminated || player.hasDescribed) return;

      player.description = message.description.trim().slice(0, 80);
      player.hasDescribed = true;
      this.advanceDescriptionTurn();
    });

    this.onMessage("vote", (client, message: { targetId: string }) => {
      if (this.state.phase !== "voting") return;
      const voter = this.state.players.get(client.sessionId);
      if (!voter || voter.isEliminated) return;
      if (client.sessionId === message.targetId) return;
      const target = this.state.players.get(message.targetId);
      if (!target || target.isEliminated) return;

      this.votesMap.set(client.sessionId, message.targetId);

      const activePlayers = this.getActivePlayers();
      if (this.votesMap.size >= activePlayers.length) {
        this.resolveVotes();
      }
    });

    this.onMessage("mrwhite_guess", (client, message: { guess: string }) => {
      if (this.state.phase !== "mrwhite_guess") return;
      if (client.sessionId !== this.mrWhiteSessionId) return;

      const guess = message.guess.trim().toLowerCase();
      if (guess === this.civilianWord.toLowerCase()) {
        this.endGame("mrwhite");
      } else {
        this.mrWhiteSessionId = null;
        this.checkWinConditions();
      }
    });

    this.onMessage("play_again", (client) => {
      if (client.sessionId !== this.hostSessionId) return;
      if (this.state.phase !== "gameover") return;
      this.resetGame();
    });
  }

  onJoin(client: Client, _options: any) {
    console.log(client.sessionId, "joined!");
    const player = new Player();
    player.id = client.auth?.id || client.sessionId;
    player.username = client.auth?.username || "Guest";
    player.isHost = this.state.players.size === 0;
    player.color = PLAYER_COLORS[this.state.players.size % PLAYER_COLORS.length];

    if (player.isHost) {
      this.hostSessionId = client.sessionId;
    }

    this.state.players.set(client.sessionId, player);
  }

  onLeave(client: Client, _consented: boolean) {
    console.log(client.sessionId, "left!");
    this.state.players.delete(client.sessionId);
    this.playerRoles.delete(client.sessionId);
    this.votesMap.delete(client.sessionId);

    if (client.sessionId === this.hostSessionId && this.state.players.size > 0) {
      const newHostId = this.state.players.keys().next().value as string;
      this.hostSessionId = newHostId;
      this.state.players.get(newHostId)!.isHost = true;
    }

    // If voting, check if all remaining players voted
    if (this.state.phase === "voting") {
      const activePlayers = this.getActivePlayers();
      if (this.votesMap.size >= activePlayers.length && activePlayers.length > 0) {
        this.resolveVotes();
      }
    }
  }

  onDispose() {
    console.log("room", this.roomId, "disposing...");
  }

  private startGame() {
    const playerIds = Array.from(this.state.players.keys());
    const numPlayers = playerIds.length;

    // Shuffle player order
    for (let i = playerIds.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [playerIds[i], playerIds[j]] = [playerIds[j], playerIds[i]];
    }
    this.playerOrder = playerIds;

    // Pick random word pair
    const pair = WORD_PAIRS[Math.floor(Math.random() * WORD_PAIRS.length)];
    const [w1, w2] = Math.random() > 0.5 ? pair : ([pair[1], pair[0]] as [string, string]);
    this.civilianWord = w1;
    this.undercoverWord = w2;
    this.state.civilianWord = "";
    this.state.undercoverWord = "";

    // Build role list
    const hasMrWhite = numPlayers >= 5;
    const roles: Role[] = ["undercover"];
    if (hasMrWhite) roles.push("mrwhite");
    while (roles.length < numPlayers) roles.push("civilian");

    // Shuffle roles
    for (let i = roles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [roles[i], roles[j]] = [roles[j], roles[i]];
    }

    // Reset all player state
    this.playerRoles.clear();
    this.mrWhiteSessionId = null;
    this.state.players.forEach((player) => {
      player.isEliminated = false;
      player.votes = 0;
      player.hasDescribed = false;
      player.description = "";
      player.role = "";
    });

    // Assign roles and notify each player privately
    playerIds.forEach((sessionId, index) => {
      const role = roles[index];
      const word = role === "civilian" ? this.civilianWord
        : role === "undercover" ? this.undercoverWord
        : "";

      this.playerRoles.set(sessionId, { role, word });
      if (role === "mrwhite") this.mrWhiteSessionId = sessionId;

      const client = this.clients.find((c) => c.sessionId === sessionId);
      client?.send("your_role", { role, word });
    });

    this.state.round = 1;
    this.state.lastEliminatedId = "";
    this.state.winner = "";
    this.state.phase = "description";
    this.state.currentPlayerId = this.playerOrder[0];
  }

  private getActivePlayers(): string[] {
    return this.playerOrder.filter((id) => {
      const p = this.state.players.get(id);
      return p && !p.isEliminated;
    });
  }

  private advanceDescriptionTurn() {
    const active = this.getActivePlayers();
    const idx = active.indexOf(this.state.currentPlayerId);

    if (idx + 1 >= active.length) {
      // Everyone described — move to voting
      this.state.players.forEach((p) => (p.votes = 0));
      this.votesMap.clear();
      this.state.phase = "voting";
    } else {
      this.state.currentPlayerId = active[idx + 1];
    }
  }

  private resolveVotes() {
    // Tally votes
    this.state.players.forEach((p) => (p.votes = 0));
    this.votesMap.forEach((targetId) => {
      const target = this.state.players.get(targetId);
      if (target) target.votes++;
    });

    // Find highest vote count
    let maxVotes = 0;
    let tied: string[] = [];
    this.state.players.forEach((player, id) => {
      if (!player.isEliminated) {
        if (player.votes > maxVotes) { maxVotes = player.votes; tied = [id]; }
        else if (player.votes === maxVotes) tied.push(id);
      }
    });

    const eliminatedId = tied[Math.floor(Math.random() * tied.length)];
    const eliminated = this.state.players.get(eliminatedId)!;
    const roleData = this.playerRoles.get(eliminatedId)!;

    eliminated.isEliminated = true;
    eliminated.role = roleData.role;
    this.state.lastEliminatedId = eliminatedId;
    this.state.phase = "elimination";

    // Show elimination screen for 4 seconds then advance
    this.clock.setTimeout(() => {
      if (roleData.role === "mrwhite") {
        this.state.phase = "mrwhite_guess";
      } else {
        this.checkWinConditions();
      }
    }, 4000);
  }

  private checkWinConditions() {
    const active = this.getActivePlayers();
    const roles = active.map((id) => this.playerRoles.get(id)?.role);

    const civilians = roles.filter((r) => r === "civilian").length;
    const undercovers = roles.filter((r) => r === "undercover").length;
    const mrWhites = roles.filter((r) => r === "mrwhite").length;
    const infiltrators = undercovers + mrWhites;

    if (infiltrators === 0) {
      this.endGame("civilian");
    } else if (civilians <= infiltrators) {
      this.endGame(undercovers > 0 ? "undercover" : "mrwhite");
    } else {
      this.startNewRound();
    }
  }

  private startNewRound() {
    this.state.round++;
    this.votesMap.clear();
    this.state.players.forEach((p) => {
      p.hasDescribed = false;
      p.description = "";
      p.votes = 0;
    });
    const active = this.getActivePlayers();
    this.state.currentPlayerId = active[0];
    this.state.phase = "description";
  }

  private endGame(winner: "civilian" | "undercover" | "mrwhite") {
    this.state.winner = winner;
    this.state.civilianWord = this.civilianWord;
    this.state.undercoverWord = this.undercoverWord;
    this.state.players.forEach((player, id) => {
      const rd = this.playerRoles.get(id);
      if (rd) player.role = rd.role;
    });
    this.state.phase = "gameover";
  }

  private resetGame() {
    this.playerOrder = [];
    this.playerRoles.clear();
    this.votesMap.clear();
    this.mrWhiteSessionId = null;
    this.state.winner = "";
    this.state.civilianWord = "";
    this.state.undercoverWord = "";
    this.state.lastEliminatedId = "";
    this.state.round = 0;
    this.state.currentPlayerId = "";
    this.state.players.forEach((p) => {
      p.isEliminated = false;
      p.votes = 0;
      p.hasDescribed = false;
      p.description = "";
      p.role = "";
    });
    this.state.phase = "lobby";
  }
}
