// EconomySystem tracks money, passive income, kill rewards, and spending.
import { BALANCE } from '../config/balance.js';

export class EconomySystem {
  constructor(startMoneyBonus = 0, moneyMul = 1.0) {
    this.money = BALANCE.START_MONEY + startMoneyBonus;
    this.moneyMul = moneyMul;
    this.tick = 0;
    this.totalEarned = 0;
  }

  update(dt, chaosActive) {
    const rate = BALANCE.MONEY_RATE * (chaosActive ? BALANCE.CHAOS_MONEY_MUL : 1) * this.moneyMul;
    this.money = Math.min(BALANCE.MAX_MONEY, this.money + rate * dt);
    this.totalEarned += rate * dt;
  }

  canAfford(amount) {
    return this.money >= amount;
  }

  spend(amount) {
    if (this.money < amount) return 0;
    this.money -= amount;
    return amount;
  }

  grant(amount) {
    const gain = amount * BALANCE.MONEY_PER_KILL_MUL * this.moneyMul;
    this.money = Math.min(BALANCE.MAX_MONEY, this.money + gain);
    this.totalEarned += gain;
    return gain;
  }
}
