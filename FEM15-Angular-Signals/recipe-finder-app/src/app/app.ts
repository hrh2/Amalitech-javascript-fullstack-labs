import { Component } from '@angular/core';
import { RecipeFinder } from './features/recipe-finder/recipe-finder';

@Component({
  selector: 'app-root',
  imports: [RecipeFinder],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {}
