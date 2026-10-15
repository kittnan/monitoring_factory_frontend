import { Component } from '@angular/core';

@Component({
  selector: 'app-factory-bot',
  templateUrl: './factory-bot.component.html',
  styleUrls: ['./factory-bot.component.scss'],
  standalone: false
})
export class FactoryBotComponent {
  // Negative delays (s) spread three boxes evenly along a 9s belt loop;
  // the robot stamps every 3s, exactly when a box passes underneath.
  boxes = [0, -3, -6]
  rollers = [20, 60, 100, 140, 180, 220, 260, 300, 340, 380]
}
