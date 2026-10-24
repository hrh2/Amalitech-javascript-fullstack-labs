import { Component, computed, effect, signal } from '@angular/core';
import { Recipe } from '../../core/models/recipe.model';
import { FilterToolbar } from './filter-toolbar/filter-toolbar';
import { Header } from './header/header';
import { RecipeCard } from './recipe-card/recipe-card';

/**
 * Static recipe catalog. Per the lab's technical guidelines this stays a plain
 * array defined in the component file — no service/HTTP layer for this lab.
 */
const RECIPES: Recipe[] = [
  { id: 1, name: 'Avocado Keto Salad', ingredients: ['avocado', 'mixed greens', 'walnuts', 'olive oil'], cookTimeMinutes: 10, image: 'https://www.sugarfreemom.com/wp-content/uploads/2022/05/Easy-Arugula-and-Avocado-Side-Salad-portrait-5-720px-x-1080px.jpg' },
  { id: 2, name: 'Grilled Chicken Caesar Salad', ingredients: ['chicken breast', 'romaine', 'parmesan', 'croutons'], cookTimeMinutes: 20, image: 'https://reciperunner.com/wp-content/uploads/2017/07/Grilled-Chicken-Caesar-Salad-Photograph.jpg' },
  { id: 3, name: 'Creamy Tuna Salad', ingredients: ['tuna', 'mayonnaise', 'celery', 'lemon'], cookTimeMinutes: 15, image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR70m_gahb3-YVRFmCmdpFyglkbc5LF0EMMMqUw2bDPCZVMkizhQ6OUhFLX&s=10' },
  { id: 4, name: 'Pasta Primavera', ingredients: ['pasta', 'zucchini', 'cherry tomatoes', 'basil'], cookTimeMinutes: 25, image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSZJWZu2AugfyDml6bp5-2mSp6LOJ3ZcLr21-MYdiBdbtKyjpobr00Q7R4&s=10' },
  { id: 5, name: 'Spicy Beef Tacos', ingredients: ['ground beef', 'taco shells', 'salsa', 'cheddar'], cookTimeMinutes: 30, image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR_rjRqbuL2LoyZUep0J7SHtbAIiRfk40xlwBTdkvOKbHhVVpo93By_LXQ&s=10' },
  { id: 6, name: 'Pumpkin Cream Soup', ingredients: ['pumpkin', 'cream', 'garlic', 'nutmeg'], cookTimeMinutes: 40, image: 'https://www.twopeasandtheirpod.com/wp-content/uploads/2020/10/pumpkin-soup-4.jpg' },
  { id: 7, name: 'Mung Bean Salad', ingredients: ['mung beans', 'carrots', 'cucumber', 'lime'], cookTimeMinutes: 15, image: 'https://cloud.doctoryum.org/recipes/mung-bean-salad/mung-bean-salad-1182-primary.jpg' },
  { id: 8, name: 'Vegetable Stir Fry', ingredients: ['broccoli', 'bell pepper', 'soy sauce', 'ginger'], cookTimeMinutes: 20, image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRWGTAmsxh6LJkzFp4vKMZJ7Wu41AdnfOmZGDeNt9przwEIL4HmzsxOtco&s=10' },
  { id: 9, name: 'Margherita Pizza', ingredients: ['dough', 'mozzarella', 'tomato sauce', 'basil'], cookTimeMinutes: 35, image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRTY-ermhAGe8tvq_vc4r5MjoKs639UKirP7QjunTgI9zm31EAzZ1ujkLSU&s=10' },
  { id: 10, name: 'Shrimp Fried Rice', ingredients: ['shrimp', 'rice', 'peas', 'egg'], cookTimeMinutes: 25, image: 'https://twoplaidaprons.com/wp-content/uploads/2022/05/shrimp-fried-rice-on-plate-thumbnail.jpg' },
  { id: 11, name: 'Chicken Curry with Rice', ingredients: ['chicken thighs', 'coconut milk', 'curry powder', 'rice'], cookTimeMinutes: 45, image: 'https://www.jocooks.com/wp-content/uploads/2019/10/coconut-chicken-curry-1-10.jpg' },
  { id: 12, name: 'Overnight Oats Bowl', ingredients: ['oats', 'chia seeds', 'almond milk', 'berries'], cookTimeMinutes: 5, image: 'https://everydayelizabeth.com/wp-content/uploads/2023/01/Coconut-Chia-Pudding-4-scaled.jpg' },
  { id: 13, name: 'Homemade Beef Burger', ingredients: ['beef patty', 'bun', 'lettuce', 'cheese'], cookTimeMinutes: 20, image: 'https://www.recipetineats.com/tachyon/2016/02/Beef-Hamburgers_7-2.jpg' },
  { id: 14, name: 'Weekly Pick Squid Curry', ingredients: ['squid', 'jasmine rice', 'chili', 'bok choy'], cookTimeMinutes: 50, image: 'https://theyummydelights.com/wp-content/uploads/2025/10/squid-masala-recipe.jpg' },
];

const MAX_COOK_TIME = Math.max(...RECIPES.map((recipe) => recipe.cookTimeMinutes));
const FAVORITES_STORAGE_KEY = 'recipe-finder:favorite-ids';

@Component({
  selector: 'app-recipe-finder',
  imports: [Header, FilterToolbar, RecipeCard],
  templateUrl: './recipe-finder.html',
  styleUrl: './recipe-finder.css'
})
export class RecipeFinder {
  readonly maxCookTimeLimit = MAX_COOK_TIME;

  recipes = signal<Recipe[]>(RECIPES);
  searchTerm = signal('');
  maxCookTime = signal(MAX_COOK_TIME);
  favoritesOnly = signal(false);
  favoriteIds = signal<number[]>(this.loadFavoriteIds());

  searchedRecipes = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    if (!term) {
      return this.recipes();
    }
    return this.recipes().filter(
      (recipe) =>
        recipe.name.toLowerCase().includes(term) ||
        recipe.ingredients.some((ingredient) => ingredient.toLowerCase().includes(term))
    );
  });

  timeFilteredRecipes = computed(() =>
    this.searchedRecipes().filter((recipe) => recipe.cookTimeMinutes <= this.maxCookTime())
  );

  filteredRecipes = computed(() => {
    if (!this.favoritesOnly()) {
      return this.timeFilteredRecipes();
    }
    const favorites = this.favoriteIds();
    return this.timeFilteredRecipes().filter((recipe) => favorites.includes(recipe.id));
  });

  resultCount = computed(() => this.filteredRecipes().length);
  hasFavorites = computed(() => this.favoriteIds().length > 0);

  constructor() {
    // Required effect: log every search/filter change as a reactive side effect.
    effect(() => {
      console.log(
        `[Recipe Finder] search="${this.searchTerm()}" maxCookTime=${this.maxCookTime()}min favoritesOnly=${this.favoritesOnly()}`
      );
    });

    // Guarded effect reacting to a derived (computed) signal, not a writable one directly.
    effect(() => {
      if (this.resultCount() === 0) {
        console.log('[Recipe Finder] No recipes matched the current search/filters.');
      }
    });

    // Genuine side effect: persist favorites so they survive a page refresh.
    effect(() => {
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(this.favoriteIds()));
    });
  }

  onSearchTermChange(value: string): void {
    this.searchTerm.set(value);
  }

  onMaxCookTimeChange(value: number): void {
    this.maxCookTime.set(value);
  }

  onFavoritesOnlyToggle(): void {
    this.favoritesOnly.update((current) => !current);
  }

  onToggleFavorite(recipeId: number): void {
    this.favoriteIds.update((ids) =>
      ids.includes(recipeId) ? ids.filter((id) => id !== recipeId) : [...ids, recipeId]
    );
  }

  isFavorited(recipeId: number): boolean {
    return this.favoriteIds().includes(recipeId);
  }

  clearFilters(): void {
    this.searchTerm.set('');
    this.maxCookTime.set(MAX_COOK_TIME);
    this.favoritesOnly.set(false);
  }

  private loadFavoriteIds(): number[] {
    try {
      const raw = localStorage.getItem(FAVORITES_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as number[]) : [];
    } catch {
      return [];
    }
  }
}
