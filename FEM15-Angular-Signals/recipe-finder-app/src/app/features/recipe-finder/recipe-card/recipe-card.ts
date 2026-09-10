import { Component, EventEmitter, Output, computed, input } from '@angular/core';
import { Recipe } from '../../../core/models/recipe.model';

@Component({
  selector: 'app-recipe-card',
  imports: [],
  templateUrl: './recipe-card.html',
  styleUrl: './recipe-card.css'
})
export class RecipeCard {
  recipe = input.required<Recipe>();
  isFavorited = input(false);

  @Output() toggleFavorite = new EventEmitter<number>();

  ingredientsPreview = computed(() => this.recipe().ingredients.slice(0, 3).join(', '));

  onToggleFavorite(): void {
    this.toggleFavorite.emit(this.recipe().id);
  }
}
